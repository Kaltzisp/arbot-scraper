import { type CompData, type MarketParser, Scraper } from "../Scraper.js";
import { Match, type Offers } from "../../Interfaces/Match.js";
import { Mapper } from "../utils/Mapper.js";

export class Palmerbet extends Scraper {

    protected bookieEndpoints = {
        "Aussie Rules": {
            AFL: "https://fixture.palmerbet.online/fixtures/sports/2178a143-5780-4d12-a471-100daaa76852/matches"
        },
        "Basketball": {
            NBA: "https://fixture.palmerbet.online/fixtures/sports/1c2eeb3a-6bab-4ac2-b434-165cc350180f/matches"
        },
        "Rugby League": {
            NRL: "https://fixture.palmerbet.online/fixtures/sports/9587e5c4-8dd8-403d-b516-6dd69d2f42ef/matches"
        }
    };

    protected marketParser: MarketParser = {
        HeadToHead: name => name === "Match Result",
        Lines: name => name === "Pick Your Own Line" || name === "Pick Your Line",
        Totals: name => name === "Alternative Total Match Points" || name === "Pick Your Own Total"
    };

    protected async scrapeComp(compId: string, url: string): Promise<CompData> {
        const data = await Scraper.getDataFromUrl(url) as MatchesResponse;
        const comp: CompData = {};
        await Promise.all(data.matches.map(async (event) => {
            const match = new Match(
                compId,
                event.homeTeam.title,
                event.awayTeam.title,
                event.startTime,
                await this.scrapeOffers(compId, `https://fixture.palmerbet.online/fixtures/sports/matches/${event.eventId}/markets?pageSize=1000`).catch((e: unknown) => {
                    console.error(e);
                    return {};
                })
            );
            comp[match.id] = match;
        }));
        return comp;
    }

    protected async scrapeOffers(compId: string, url: string): Promise<Offers> {
        const data = await Scraper.getDataFromUrl(url) as MatchMarketsResponse;
        const offers: Offers = {};
        const selectedMarkets = ["Match Result", "Pick Your Line", "Pick Your Own Line", "Alternative Total Match Points", "Pick Your Own Total"];
        const marketPromises = [];
        for (const marketType of data.markets.filter(market => selectedMarkets.includes(market.title))) {
            await new Promise((resolve) => { setTimeout(resolve, 500); });
            marketPromises.push((Scraper.getDataFromUrl(`https://fixture.palmerbet.online${marketType._links[0].href}`) as Promise<MarketsResponse>));
        }
        const markets = await Promise.all(marketPromises);
        for (const market of markets) {
            const marketName = this.parseMarketName(market.market.title);
            if (marketName) {
                offers[marketName] ??= {};
                for (const runner of market.market.outcomes) {
                    if (runner.status === "Active") {
                        const runnerName = Mapper.mapRunner(compId, runner.title)
                        offers[marketName]![runnerName] = runner.prices[0].priceSnapshot.current;
                    }
                }
            }
        }
        return offers;
    }
}

interface MatchesResponse {
    matches: {
        eventId: string;
        homeTeam: {
            title: string;
        };
        awayTeam: {
            title: string;
        }
        startTime: string;
    }[];
}

interface MatchMarketsResponse {
    markets: {
        title: string;
        _links: {
            href: string;
        }[];
    }[];
}

interface MarketsResponse {
    market: {
        title: string;
        outcomes: {
            title: string;
            status: "Active" | "Inactive";
            prices: {
                priceSnapshot: {
                    current: number;
                };
            }[];
        }[];
    };
}
