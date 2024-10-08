import { type CompData, type MarketParser, Scraper } from "../Scraper.js";
import { Match, type Offers } from "../Match.js";
import { Mapper } from "../utils/Mapper.js";

export class Tabcorp extends Scraper {

    protected bookieEndpoints = {
        "Aussie Rules": {
            AFL: "https://api.beta.tab.com.au/v1/tab-info-service/sports/AFL%20Football/competitions/AFL?jurisdiction=NSW"
        },
        "Basketball": {
            NBA: "https://api.beta.tab.com.au/v1/tab-info-service/sports/Basketball/competitions/NBA?jurisdiction=NSW"
        },
        "Ice Hockey": {
            NHL: "https://api.beta.tab.com.au/v1/tab-info-service/sports/Ice%20Hockey/competitions/NHL?jurisdiction=NSW"
        },
        "Rugby League": {
            NRL: "https://api.beta.tab.com.au/v1/tab-info-service/sports/Rugby%20League/competitions/NRL?jurisdiction=NSW"
        }
    };

    protected marketParser: MarketParser = {
        HeadToHead: name => name === "Head To Head",
        Lines: name => name === "Pick Your Own Line",
        Totals: name => name.startsWith("Pick Your Own Total")
    };

    protected async scrapeComp(compId: string, url: string): Promise<CompData> {
        const data = await Scraper.getDataFromUrl(url) as MatchesResponse;
        const comp: CompData = {};
        await Promise.all(data.matches.map(async (event) => {
            const match = new Match(
                compId,
                event.competitors[0],
                event.competitors[1],
                event.startTime,
                await this.scrapeOffers(compId, event._links.self).catch((e: unknown) => {
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
        for (const market of data.markets) {
            const marketName = this.parseMarketName(market.betOption);
            if (marketName) {
                offers[marketName] ??= {};
                for (const runner of market.propositions) {
                    const runnerName = Mapper.mapRunner(compId, runner.name);
                    offers[marketName]![runnerName] = runner.returnWin;
                }
            }

        }
        return offers;
    }
}


interface MatchesResponse {
    matches: {
        id: string;
        competitors: string[];
        startTime: string;
        _links: {
            self: string;
        }
    }[]
}

interface MarketsResponse {
    markets: {
        betOption: string;
        propositions: {
            name: string;
            returnWin: number;
        }[];
    }[];
}
