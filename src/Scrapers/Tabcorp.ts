import { type CompData, Match, type Offers, Scraper, } from "../utils/Scraper.js";
import { mapRunner } from "../utils/Mapper.js";

export class Tabcorp extends Scraper {

    protected bookieEndpoints = {
        RugbyLeague: {
            NRL: "https://api.beta.tab.com.au/v1/tab-info-service/sports/Rugby%20League/competitions/NRL?jurisdiction=NSW"
        },
        AussieRules: {
            AFL: "https://api.beta.tab.com.au/v1/tab-info-service/sports/AFL%20Football/competitions/AFL?jurisdiction=NSW"
        },
        Basketball: {
            NBA: "https://api.beta.tab.com.au/v1/tab-info-service/sports/Basketball/competitions/NBA?jurisdiction=NSW"
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
                event.competitors[0],
                event.competitors[1],
                Date.parse(event.startTime)
            );
            promises.push(this.scrapeMarkets(compId, event._links.self).then((matchOffers) => {
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
        for (const market of data.markets) {
            const marketName = this.parseMarketName(market.betOption);
            if (marketName) {
                if (!offers[marketName]) {
                    offers[marketName] = [];
                }
                for (const runner of market.propositions) {
                    offers[marketName]!.push({
                        runnerName: mapRunner(compId, runner.name),
                        runnerOdds: runner.returnWin
                    });
                }
            }

        }
        return offers;
    }

    protected parseMarketName(name: string): string | false {
        if (name === "Head To Head") {
            return "HeadToHead";
        } else if (name === "Pick Your Own Line") {
            return "Lines";
        } else if (name.startsWith("Pick Your Own Total")) {
            return "Totals";
        }
        return false;
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
