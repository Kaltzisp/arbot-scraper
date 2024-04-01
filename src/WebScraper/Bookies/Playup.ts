import { type CompData, type MarketParser, Scraper } from "../Scraper.js";
import { Match, type Offers } from "../utils/Match.js";
import { Mapper } from "../utils/Mapper.js";

export class Playup extends Scraper {

    protected bookieEndpoints = {
        "Aussie Rules": {
            AFL: "https://wagering-api.playup.io/v1/sport_events/?filter[competition_id]=136"
        },
        "Basketball": {
            NBA: "https://wagering-api.playup.io/v1/sport_events/?filter[competition_id]=124"
        },
        "Rugby League": {
            NRL: "https://wagering-api.playup.io/v1/sport_events/?filter[competition_id]=68"
        }
    };

    protected marketParser: MarketParser = {
        HeadToHead: name => name === "Head To Head",
        Lines: name => name === "Alternate Line",
        Totals: name => name.startsWith("Alternate Total Points")
    };

    protected async scrapeComp(compId: string, url: string): Promise<CompData> {
        const data = await Scraper.getDataFromUrl(url) as MatchesResponse;
        const comp: CompData = {};
        await Promise.all(data.data.map(async (event) => {
            const match = new Match(
                compId,
                event.attributes.participants[0].name,
                event.attributes.participants[1].name,
                event.attributes.start_time,
                await this.scrapeOffers(compId, `https://wagering-api.playup.io/v1/sport_events/${event.id}?include=event_market_groups`).catch((e: unknown) => {
                    console.error(e);
                    return {};
                })
            );
            comp[match.id] = match;
        }));
        return comp;
    }

    protected async scrapeOffers(compId: string, url: string): Promise<Offers> {
        const marketsData = await Scraper.getDataFromUrl(url) as MatchMarketsResponse;
        const offers: Offers = {};
        const selectedMarkets = ["Top Markets", "Handicap Markets", "Total Markets"];
        await Promise.all(marketsData.included.filter(market => selectedMarkets.includes(market.attributes.name)).map(async (marketType) => {
            const data = await Scraper.getDataFromUrl(`https://wagering-api.playup.io/v1/event_market_groups/${marketType.id}`) as MarketsResponse;
            for (const entry of data.included) {
                if (entry.type === "markets") {
                    const marketName = this.parseMarketName(entry.attributes.name);
                    if (marketName) {
                        offers[marketName] ??= {};
                        for (const runnerId of entry.relationships.selections.data) {
                            const runner = data.included.find(element => element.id === runnerId.id)!;
                            const runnerName = Mapper.mapRunner(
                                compId,
                                runner.attributes.line ? `${runner.attributes.name.replace("Total Score ", "")} ${runner.attributes.line}` : runner.attributes.name
                            );
                            offers[marketName]![runnerName] = runner.attributes.d_price;
                        }
                    }
                }
            }
        }));
        return offers;
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

interface MatchMarketsResponse {
    included: {
        id: string;
        attributes: {
            name: string;
        }
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
