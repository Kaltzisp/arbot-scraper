import { type CompData, Match, type Offers, Scraper, } from "../utils/Scraper.js";
import { mapRunner } from "../utils/Mapper.js";

export class Ladbrokes extends Scraper {

    protected bookieEndpoints = {
        RugbyLeague: {
            NRL: "https://api.ladbrokes.com.au/v2/sport/event-request?category_ids=%5B%22608a1803-45bc-465a-8471-c89dcb68a27d%22%5D&competition_id=3e85a456-59b5-4363-95e6-836854492fdf&include_any_team_vs_any_team_events=true"
        },
        AussieRules: {
            AFL: "https://api.ladbrokes.com.au/v2/sport/event-request?category_ids=%5B%2223d497e6-8aab-4309-905b-9421f42c9bc5%22%5D&competition_id=ccff2e9a-5347-41aa-902a-bb6b1886d817&include_any_team_vs_any_team_events=true"
        }
    };

    protected async scrapeComp(sportId: string, compId: string, url: string): Promise<CompData> {
        const data = await Scraper.getDataFromUrl(url) as MatchesResponse;
        const comp: CompData = {
            compId,
            matches: []
        };
        const promises: Promise<void>[] = [];
        for (const eventId in data.events) {
            const event = data.events[eventId];
            if (event.event_type.name === "Match") {
                const teams = event.name.split(" vs ");
                const match = new Match(
                    teams[0],
                    teams[1],
                    Date.parse(event.actual_start)
                );
                promises.push(this.scrapeMarkets(compId, `https://api.ladbrokes.com.au/v2/sport/event-card?id=${event.id}`).then((matchOffers) => {
                    match.offers = matchOffers;
                    comp.matches.push(match);
                }).catch((e: unknown) => {
                    console.error(e);
                    comp.matches.push(match);
                }));
            }
        }
        await Promise.all(promises);
        return comp;
    }

    protected async scrapeMarkets(compId: string, url: string): Promise<Offers> {
        const data = await Scraper.getDataFromUrl(url) as MarketsResponse;
        const offers: Offers = {};
        for (const runnerId in data.entrants) {
            const runner = data.entrants[runnerId];
            const marketName = this.parseMarketName(data.markets[runner.market_id].name);
            if (marketName) {
                if (!offers[marketName]) {
                    offers[marketName] = [];
                }
                const odds = data.prices[Object.keys(data.prices).find(id => id.startsWith(runnerId))!].odds;
                offers[marketName]!.push({
                    runnerName: mapRunner(compId, runner.name),
                    runnerOdds: 1 + odds.numerator / odds.denominator
                });
            }
        }
        return offers;
    }

    protected parseMarketName(name: string): string | false {
        if (name === "Match Betting") {
            return "HeadToHead";
        } else if (name.endsWith("Alternate Handicaps")) {
            return "Lines"
        } else if (name.startsWith("Alternate Total Points")) {
            return "Totals"
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
            }
        }
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
