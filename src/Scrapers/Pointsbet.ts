import { type CompData, Scraper, } from "../core/Scraper.js";
import { Match, type Offers } from "../core/Match.js";
import { Mapper } from "../mapper/Mapper.js";

export class Pointsbet extends Scraper {

    protected bookieEndpoints = {
        RugbyLeague: {
            NRL: "https://api.au.pointsbet.com/api/v2/competitions/7593/events/featured?includeLive=false"
        },
        AussieRules: {
            AFL: "https://api.au.pointsbet.com/api/v2/competitions/7523/events/featured?includeLive=false"
        },
        Baketball: {
            NBA: "https://api.au.pointsbet.com/api/v2/competitions/7176/events/featured?includeLive=false"
        }
    };

    protected async scrapeComp(sportId: string, compId: string, url: string): Promise<CompData> {
        const data = await Scraper.getDataFromUrl(url) as MatchesResponse;
        const comp: CompData = {}
        const promises: Promise<void>[] = [];
        for (const event of data.events) {
            const match = new Match(
                compId,
                event.homeTeam,
                event.awayTeam,
                Date.parse(event.startsAt)
            );
            promises.push(this.scrapeMarkets(compId, `https://api.au.pointsbet.com/api/mes/v3/events/${event.key}`).then((matchOffers) => {
                match.offers = matchOffers;
                comp[match.id] = match;
            }).catch((e: unknown) => {
                console.error(e);
                comp[match.id] = match;
            }));
        }
        await Promise.all(promises);
        return comp;
    }

    protected async scrapeMarkets(compId: string, url: string): Promise<Offers> {
        const data = await Scraper.getDataFromUrl(url) as MarketsResponse;
        const offers: Offers = {};
        for (const market of data.fixedOddsMarkets) {
            const marketName = this.parseMarketName(market.name);
            if (marketName) {
                if (!offers[marketName]) {
                    offers[marketName] = {};
                }
                for (const runner of market.outcomes) {
                    const runnerName = Mapper.mapRunner(compId, runner.name);
                    offers[marketName]![runnerName] = runner.price;
                }
            }

        }
        return offers;
    }

    protected parseMarketName(name: string): string | false {
        if ((name.startsWith("Match Result") && !name.includes("After")) || name.startsWith("Moneyline")) {
            return "HeadToHead";
        } else if (name.startsWith("Pick Your Own Line")) {
            return "Lines";
        } else if (name.startsWith("Alternate Total")) {
            return "Totals";
        }
        return false;
    }

}

interface MatchesResponse {
    events: {
        key: number;
        homeTeam: string;
        awayTeam: string;
        startsAt: string;
    }[];
}

interface MarketsResponse {
    fixedOddsMarkets: {
        name: string;
        outcomes: {
            name: string;
            price: number;
        }[];
    }[];
}
