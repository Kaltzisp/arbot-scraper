import { type CompData, Scraper, } from "../core/Scraper.js";
import { Match, type Offers } from "../core/Match.js";
import { Mapper } from "../mapper/Mapper.js";

export class Sportsbet extends Scraper {

    protected bookieEndpoints = {
        RugbyLeague: {
            NRL: "https://www.sportsbet.com.au/apigw/sportsbook-sports/Sportsbook/Sports/Class/23/Events?displayType=coupon&detailsLevel=O"
        },
        AussieRules: {
            AFL: "https://www.sportsbet.com.au/apigw/sportsbook-sports/Sportsbook/Sports/Class/50/Events?displayType=coupon&detailsLevel=O"
        },
        Basketball: {
            NBA: "https://www.sportsbet.com.au/apigw/sportsbook-sports/Sportsbook/Sports/Class/16/Events?displayType=coupon&detailsLevel=O"
        }
    };

    protected async scrapeComp(sportId: string, compId: string, url: string): Promise<CompData> {
        const data = await Scraper.getDataFromUrl(url) as MatchesResponse[];
        const comp: CompData = {}
        const promises: Promise<void>[] = [];
        for (const event of data[0].events) {
            const match = new Match(
                compId,
                event.participant1,
                event.participant2,
                event.startTime * 1000
            );
            promises.push(this.scrapeMarkets(compId, `https://www.sportsbet.com.au/apigw/sportsbook-sports/Sportsbook/Sports/Events/${event.id}/SportCard`).then((matchOffers) => {
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
        const data = await Scraper.getDataFromUrl(url) as MatchMarketsResponse;
        const offers: Offers = {};
        const marketRequests = [];
        const selectedMarkets = ["Top Markets", "Handicap Markets", "Total Markets", "Total Points Markets"];
        const marketGroups = data.marketGrouping.filter(market => selectedMarkets.includes(market.name));
        for (const marketType of marketGroups) {
            await new Promise((resolve) => { setTimeout(resolve, 500); });
            marketRequests.push((Scraper.getDataFromUrl(`https://www.sportsbet.com.au/apigw/sportsbook-sports/${marketType.httpLink}`) as Promise<MarketsResponse[]>).then((matchMarkets) => {
                for (const market of matchMarkets) {
                    const marketName = this.parseMarketName(market.name);
                    if (marketName) {
                        if (!offers[marketName]) {
                            offers[marketName] = {};
                        }
                        for (const selection of market.selections) {
                            const runnerName = Mapper.mapRunner(compId, selection.name);
                            offers[marketName]![runnerName] = selection.price.winPrice;
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
        if (name === "Head to Head" || name === "Match Betting") {
            return "HeadToHead";
        } else if (name === "Pick Your Line" || name === "Pick Your Own Line") {
            return "Lines";
        } else if (name === "Pick Your Own Total" || name === "Alternative Total Match Points" || name === "Alternate Total Points") {
            return "Totals";
        }
        return false;
    }

}

interface MatchesResponse {
    events: {
        id: number;
        participant1: string;
        participant2: string;
        startTime: number;
    }[];
}


interface MatchMarketsResponse {
    marketGrouping: {
        id: number;
        name: string;
        httpLink: string;
        marketList: {
            id: number;
        }[];
    }[];
}

interface MarketsResponse {
    name: string;
    selections: {
        name: string;
        price: {
            winPrice: number;
        }
    }[];
}
