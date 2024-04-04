import { type CompData, type MarketParser, Scraper } from "../Scraper.js";
import { Match, type Offers } from "../../Interfaces/Match.js";
import { Mapper } from "../utils/Mapper.js";

export class Pointsbet extends Scraper {

    protected bookieEndpoints = {
        "Aussie Rules": {
            AFL: "https://api.au.pointsbet.com/api/v2/competitions/7523/events/featured?includeLive=false"
        },
        "Basketball": {
            NBA: "https://api.au.pointsbet.com/api/v2/competitions/7176/events/featured?includeLive=false"
        },
        "Rugby League": {
            NRL: "https://api.au.pointsbet.com/api/v2/competitions/7593/events/featured?includeLive=false"
        },
    };

    protected marketParser: MarketParser = {
        HeadToHead: name =>
            (name.startsWith("Match Result") && !name.includes("After")) ||
            (name.startsWith("Moneyline (") && name.match(/\(/gu)?.length === 1),
        Lines: name => name.startsWith("Pick Your Own Line") || name.startsWith("Alternate Run Line ("),
        Totals: name => name.startsWith("Alternate Total") && !name.includes("3-Way"),
    };

    protected async scrapeComp(compId: string, url: string): Promise<CompData> {
        const data = await Scraper.getDataFromUrl(url) as MatchesResponse;
        const comp: CompData = {};
        await Promise.all(data.events.map(async (event) => {
            const match = new Match(
                compId,
                event.homeTeam,
                event.awayTeam,
                event.startsAt,
                await this.scrapeOffers(compId, `https://api.au.pointsbet.com/api/mes/v3/events/${event.key}`).catch((e: unknown) => {
                    console.error(e);
                    return {};
                })
            );
            comp[match.id] = match;
        }));
        return comp;
    }

    protected async scrapeOffers(compId: string, url: string): Promise<Offers> {
        const data = await Scraper.getDataFromUrl(url) as MarketsResponse;
        const offers: Offers = {};
        for (const market of data.fixedOddsMarkets) {
            const marketName = this.parseMarketName(market.name);
            if (marketName) {
                offers[marketName] ??= {};
                for (const runner of market.outcomes) {
                    const runnerName = Mapper.mapRunner(compId, runner.name);
                    offers[marketName]![runnerName] = runner.price;
                }
            }

        }
        return offers;
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
