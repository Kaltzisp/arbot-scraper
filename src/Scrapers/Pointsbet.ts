import { type CompData, Match, type Offers, Scraper, } from "../utils/Scraper.js";
import { mapRunner } from "../utils/Mapper.js";

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
        const comp: CompData = {
            compId,
            matches: []
        };
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
                comp.matches.push(match);
            }).catch((e: unknown) => {
                console.error(e);
                comp.matches.push(match);
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
                    offers[marketName] = [];
                }
                for (const runner of market.outcomes) {
                    offers[marketName]!.push({
                        runnerName: mapRunner(compId, runner.name),
                        runnerOdds: runner.price
                    });
                }
            }

        }
        return offers;
    }

    protected parseMarketName(name: string): string | false {
        if (name.startsWith("Match Result")) {
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
