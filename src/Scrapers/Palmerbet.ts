import { type CompData, Scraper, } from "../core/Scraper.js";
import { Match, type Offers } from "../core/Match.js";
import { Mapper } from "../mapper/Mapper.js";

export class Palmerbet extends Scraper {

    protected bookieEndpoints = {
        RugbyLeague: {
            NRL: "https://fixture.palmerbet.online/fixtures/sports/9587e5c4-8dd8-403d-b516-6dd69d2f42ef/matches"
        },
        AussieRules: {
            AFL: "https://fixture.palmerbet.online/fixtures/sports/2178a143-5780-4d12-a471-100daaa76852/matches"
        },
        Basketball: {
            NBA: "https://fixture.palmerbet.online/fixtures/sports/1c2eeb3a-6bab-4ac2-b434-165cc350180f/matches"
        }
    };

    protected async scrapeComp(sportId: string, compId: string, url: string): Promise<CompData> {
        const data = await Scraper.getDataFromUrl(url) as MatchesResponse;
        const comp: CompData = {
            compId,
            matches: []
        };
        const promises: Promise<void>[] = [];
        for (const event of data.matches) {
            const match = new Match(
                compId,
                event.homeTeam.title,
                event.awayTeam.title,
                Date.parse(event.startTime)
            );
            promises.push(this.scrapeMarkets(compId, `https://fixture.palmerbet.online/fixtures/sports/matches/${event.eventId}/markets?pageSize=1000`).then((matchOffers) => {
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
        const data = await Scraper.getDataFromUrl(url) as MatchMarketsResponse;
        const offers: Offers = {};
        const marketRequests = [];
        const selectedMarkets = ["Match Result", "Pick Your Line", "Pick Your Own Line", "Alternative Total Match Points", "Pick Your Own Total"];
        const marketGroups = data.markets.filter(marketType => selectedMarkets.includes(marketType.title));
        for (const marketType of marketGroups) {
            await new Promise((resolve) => { setTimeout(resolve, 500); });
            marketRequests.push((Scraper.getDataFromUrl(`https://fixture.palmerbet.online${marketType._links[0].href}`) as Promise<MarketsResponse>).then((market) => {
                const marketName = this.parseMarketName(market.market.title);
                if (marketName) {
                    if (!offers[marketName]) {
                        offers[marketName] = [];
                    }
                    for (const runner of market.market.outcomes) {
                        if (runner.status === "Active") {
                            offers[marketName]!.push({
                                runnerName: Mapper.mapRunner(compId, runner.title),
                                runnerOdds: runner.prices[0].priceSnapshot.current
                            });
                        }
                    }
                }
            }).catch((e: unknown) => {
                console.error(`Failed to fetch markets from ${url}`)
                console.error(e);
            }));
            await Promise.all(marketRequests);
        }
        return offers;
    }

    protected parseMarketName(name: string): string | false {
        if (name === "Match Result") {
            return "HeadToHead";
        } else if (name === "Pick Your Own Line" || name === "Pick Your Line") {
            return "Lines";
        } else if (name === "Alternative Total Match Points" || name === "Pick Your Own Total") {
            return "Totals";
        }
        return false;
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
