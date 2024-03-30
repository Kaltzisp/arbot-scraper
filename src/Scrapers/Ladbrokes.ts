import { type CompData, Scraper, } from "../core/Scraper.js";
import { Match, type Offers } from "../core/Match.js";
import { Mapper } from "../mapper/Mapper.js";

export class Ladbrokes extends Scraper {

    protected bookieEndpoints = {
        RugbyLeague: {
            NRL: "https://api.ladbrokes.com.au/v2/sport/event-request?category_ids=%5B%22608a1803-45bc-465a-8471-c89dcb68a27d%22%5D&competition_id=3e85a456-59b5-4363-95e6-836854492fdf"
        },
        AussieRules: {
            AFL: "https://api.ladbrokes.com.au/v2/sport/event-request?category_ids=%5B%2223d497e6-8aab-4309-905b-9421f42c9bc5%22%5D&competition_id=ccff2e9a-5347-41aa-902a-bb6b1886d817"
        },
        Basketball: {
            NBA: "https://api.ladbrokes.com.au/v2/sport/event-request?category_ids=%5B%223c34d075-dc14-436d-bfc4-9272a49c2b39%22%5D"
        }
    }

    protected async scrapeComp(sportId: string, compId: string, url: string): Promise<CompData> {
        const data = await Scraper.getDataFromUrl(url) as MatchesResponse;
        const comp: CompData = {};
        const promises: Promise<void>[] = [];
        for (const eventId in data.events) {
            const event = data.events[eventId];
            if (event.event_type.name === "Match" && !event.name.includes("Specials") && event.competition.name === compId) {
                const teams = event.name.split(" vs ");
                const match = new Match(
                    compId,
                    teams[0],
                    teams[1],
                    Date.parse(event.actual_start)
                );
                promises.push(this.scrapeMarkets(compId, `https://api.ladbrokes.com.au/v2/sport/event-card?id=${event.id}`).then((matchOffers) => {
                    match.offers = matchOffers;
                    comp[match.id] = match;
                }).catch((e: unknown) => {
                    console.error(e);
                    comp[match.id] = match;
                }));
            }
        }
        await Promise.all(promises);
        return comp;
    }

    protected async scrapeMarkets(compId: string, url: string): Promise<Offers> {
        const options: RequestInit = {
            headers: {
                "Content-Type": "application/json",
                "Origin": "https://www.ladbrokes.com.au",
                "Referer": "https://www.ladbrokes.com.au/"
            }
        };
        const data = await Scraper.getDataFromUrl(url, options) as MarketsResponse;
        const offers: Offers = {};
        for (const runnerId in data.entrants) {
            const runner = data.entrants[runnerId];
            const marketName = this.parseMarketName(data.markets[runner.market_id].name);
            if (marketName) {
                if (!offers[marketName]) {
                    offers[marketName] = {};
                }
                const odds = data.prices[Object.keys(data.prices).find(id => id.startsWith(runnerId))!].odds;
                const runnerName = Mapper.mapRunner(compId, runner.name);
                offers[marketName]![runnerName] = 1 + odds.numerator / odds.denominator;
            }
        }
        return offers;
    }

    protected parseMarketName(name: string): string | false {
        if (name === "Match Betting" || name === "Head To Head") {
            return "HeadToHead";
        } else if (name.endsWith("Alternate Handicaps")) {
            return "Lines";
        } else if (name.startsWith("Alternate Total Points")) {
            return "Totals";
        }
        return false;
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
