import { type CompData, type MarketParser, Scraper } from "../Scraper.js";
import { Match, type Offers } from "../../Interfaces/Match.js";
import { Mapper } from "../utils/Mapper.js";

export class Sportsbet extends Scraper {

    protected bookieEndpoints = {
        "Aussie Rules": {
            AFL: "https://www.sportsbet.com.au/apigw/sportsbook-sports/Sportsbook/Sports/Class/50/Events?displayType=coupon&detailsLevel=O"
        },
        "Basketball": {
            NBA: "https://www.sportsbet.com.au/apigw/sportsbook-sports/Sportsbook/Sports/Class/16/Events?displayType=coupon&detailsLevel=O"
        },
        "Rugby League": {
            NRL: "https://www.sportsbet.com.au/apigw/sportsbook-sports/Sportsbook/Sports/Class/23/Events?displayType=coupon&detailsLevel=O"
        }
    };

    protected marketParser: MarketParser = {
        HeadToHead: name => name === "Head to Head" || name === "Match Betting" || name === "Money Line",
        Lines: name => name === "Pick Your Line" || name === "Pick Your Own Line" || name === "Run Line" || name === "Alternate Run Lines",
        Totals: name => name === "Pick Your Own Total" || name === "Alternative Total Match Points" || name === "Alternate Total Points" || name === "Total Runs" || name === "Alternate Total Runs"
    };

    protected async scrapeComp(compId: string, url: string): Promise<CompData> {
        const data = await Scraper.getDataFromUrl(url) as MatchesResponse[];
        const comp: CompData = {};
        await Promise.all(data[0].events.map(async (event) => {
            const match = new Match(
                compId,
                event.participant1,
                event.participant2,
                event.startTime * 1000,
                await this.scrapeOffers(compId, `https://www.sportsbet.com.au/apigw/sportsbook-sports/Sportsbook/Sports/Events/${event.id}/SportCard`).catch((e: unknown) => {
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
        const selectedMarkets = ["Top Markets", "Handicap Markets", "Run Line Markets", "Margin Markets", "Total Markets", "Total Points Markets"];
        const marketPromises = [];
        for (const marketType of data.marketGrouping.filter(market => selectedMarkets.includes(market.name))) {
            await new Promise((resolve) => { setTimeout(resolve, 750); });
            marketPromises.push(Scraper.getDataFromUrl(`https://www.sportsbet.com.au/apigw/sportsbook-sports/${marketType.httpLink}`) as Promise<MarketsResponse[]>);
        }
        const matchMarkets = await Promise.all(marketPromises);
        for (const marketType of matchMarkets) {
            for (const market of marketType) {
                const marketName = this.parseMarketName(market.name);
                if (marketName) {
                    offers[marketName] ??= {};
                    for (const runner of market.selections) {
                        const runnerName = Mapper.mapRunner(compId, runner.name);
                        offers[marketName]![runnerName] = runner.price.winPrice;
                    }
                }
            }
        }
        return offers;
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
