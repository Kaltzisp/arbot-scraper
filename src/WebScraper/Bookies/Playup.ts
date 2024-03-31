import { type CompData, Scraper, } from "../Scraper.js";
import { Match, type Offers } from "../utils/Match.js";
import { Mapper } from "../utils/Mapper.js";

export class Playup extends Scraper {

    protected bookieEndpoints = {
        RugbyLeague: {
            NRL: "https://wagering-api.playup.io/v1/sport_events/?filter[competition_id]=68"
        },
        AussieRules: {
            AFL: "https://wagering-api.playup.io/v1/sport_events/?filter[competition_id]=136"
        },
        Basketball: {
            NBA: "https://wagering-api.playup.io/v1/sport_events/?filter[competition_id]=124"
        }
    };

    protected async scrapeComp(sportId: string, compId: string, url: string): Promise<CompData> {
        const data = await Scraper.getDataFromUrl(url) as MatchesResponse;
        const comp: CompData = {}
        const promises: Promise<void>[] = [];
        for (const event of data.data) {
            const match = new Match(
                compId,
                event.attributes.participants[0].is_home ? event.attributes.participants[0].name : event.attributes.participants[1].name,
                event.attributes.participants[0].is_home ? event.attributes.participants[1].name : event.attributes.participants[0].name,
                Date.parse(event.attributes.start_time)
            );
            promises.push(this.scrapeMarkets(compId, `https://wagering-api.playup.io/v1/event_market_groups/${event.id}`).then((matchOffers) => {
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
        const marketEndpoints = {
            NRL: [133, 162, 168],
            AFL: [206, 222, 223],
            NBA: [202, 210, 211]
        };
        const promises: Promise<void>[] = [];
        const offers: Offers = {};
        for (const endpoint of marketEndpoints[compId as keyof typeof marketEndpoints]) {
            promises.push((Scraper.getDataFromUrl(`${url}-${endpoint}`)).then((response) => {
                const data = response as MarketsResponse;
                for (const entry of data.included) {
                    if (entry.type === "markets") {
                        const marketName = this.parseMarketName(entry.attributes.name);
                        if (marketName) {
                            if (!offers[marketName]) {
                                offers[marketName] = {};
                            }
                            for (const runnerId of entry.relationships.selections.data) {
                                const runner = data.included.find(element => element.id === runnerId.id)!;
                                let runnerName = "";
                                if (runner.attributes.line) {
                                    runnerName = Mapper.mapRunner(compId, `${runner.attributes.name.replace("Total Score ", "")} ${runner.attributes.line}`);
                                } else {
                                    runnerName = Mapper.mapRunner(compId, runner.attributes.name)
                                }
                                offers[marketName]![runnerName] = runner.attributes.d_price;
                            }
                        }
                    }
                }
            }).catch(() => {
                console.error(`Market not found for ${compId} at ${url}-${endpoint}`);
            }));
        }
        await Promise.all(promises);
        return offers;
    }

    protected parseMarketName(name: string): string | false {
        if (name === "Head To Head") {
            return "HeadToHead";
        } else if (name === "Alternate Line") {
            return "Lines";
        } else if (name.startsWith("Alternate Total Points")) {
            return "Totals";
        }
        return false;
    }

}

interface MatchesResponse {
    data: {
        id: string;
        attributes: {
            start_time: string;
            participants: {
                name: string;
                is_home: boolean;
            }[];
        };
        links: {
            self: string;
        };
    }[];
}

interface MarketsResponse {
    included: {
        id: string;
        type: string;
        attributes: {
            name: string;
            d_price: number;
            line: number | null;
        };
        relationships: {
            selections: {
                data: {
                    id: string;
                }[];
            };
        };
    }[];
}
