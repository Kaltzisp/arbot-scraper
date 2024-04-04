import { type CompData, type MarketParser, Scraper } from "../Scraper.js";
import { Match, type Offers } from "../../Interfaces/Match.js";
import { Mapper } from "../utils/Mapper.js";

export class Ladbrokes extends Scraper {

    protected bookieEndpoints = {
        "Aussie Rules": {
            AFL: "https://api.ladbrokes.com.au/v2/sport/event-request?category_ids=%5B%2223d497e6-8aab-4309-905b-9421f42c9bc5%22%5D&competition_id=ccff2e9a-5347-41aa-902a-bb6b1886d817"
        },
        "Basketball": {
            NBA: "https://api.ladbrokes.com.au/v2/sport/event-request?category_ids=%5B%223c34d075-dc14-436d-bfc4-9272a49c2b39%22%5D"
        },
        "Rugby League": {
            NRL: "https://api.ladbrokes.com.au/v2/sport/event-request?category_ids=%5B%22608a1803-45bc-465a-8471-c89dcb68a27d%22%5D&competition_id=3e85a456-59b5-4363-95e6-836854492fdf"
        }
    };

    protected marketParser: MarketParser = {
        HeadToHead: name => name === "Match Betting" || name === "Head To Head",
        Lines: name => name.endsWith("Alternate Handicaps"),
        Totals: name => name.startsWith("Alternate Total Points")
    };

    private readonly headers = {
        "Content-Type": "application/json",
        "Origin": "https://www.ladbrokes.com.au",
        "Referer": "https://www.ladbrokes.com.au/"
    };

    protected async scrapeComp(compId: string, url: string): Promise<CompData> {
        const data = await Scraper.getDataFromUrl(url) as MatchesResponse;
        const comp: CompData = {};
        await Promise.all(Object.values(data.events).map(async (event) => {
            if (event.event_type.name === "Match" && !event.name.includes("Specials") && event.competition.name === compId) {
                const teams = event.name.split(" vs ");
                const match = new Match(
                    compId,
                    teams[0],
                    teams[1],
                    event.actual_start,
                    await this.scrapeOffers(compId, `https://api.ladbrokes.com.au/v2/sport/event-card?id=${event.id}`).catch((e: unknown) => {
                        console.error(e);
                        return {};
                    })
                );
                comp[match.id] = match;
            }
        }));
        return comp;
    }

    protected async scrapeOffers(compId: string, url: string): Promise<Offers> {
        const data = await Scraper.getDataFromUrl(url, this.headers) as MarketsResponse;
        const offers: Offers = {};
        for (const runnerId in data.entrants) {
            const runner = data.entrants[runnerId];
            const marketName = this.parseMarketName(data.markets[runner.market_id].name);
            if (marketName) {
                offers[marketName] ??= {};
                const odds = data.prices[Object.keys(data.prices).find(id => id.startsWith(runnerId))!].odds;
                const runnerName = Mapper.mapRunner(compId, runner.name);
                offers[marketName]![runnerName] = 1 + odds.numerator / odds.denominator;
            }
        }
        return offers;
    }
}

interface MatchesResponse {
    events: {
        [id: string]: {
            id: string;
            name: string;
            actual_start: string;
            event_type: {
                name: string;
            };
            competition: {
                name: string;
            };
        };
    };
}

interface MarketsResponse {
    entrants: {
        [runnerId: string]: {
            id: string;
            name: string;
            market_id: string
        }
    };
    markets: {
        [marketId: string]: {
            name: string;
        }
    };
    prices: {
        [priceId: string]: {
            odds: {
                numerator: number;
                denominator: number;
            }
        }
    };
}
