import { type CompData, type MarketParser, Scraper } from "../Scraper.js";
import { Match, type Offers } from "../Match.js";
import { Mapper } from "../utils/Mapper.js";

export class Betright extends Scraper {

    protected bookieEndpoints = {
        "Aussie Rules": {
            AFL: "https://next-api.betright.com.au/Sports/Category?categoryId=79"
        },
        "Basketball": {
            NBA: "https://next-api.betright.com.au/Sports/Category?categoryId=54"
        },
        "Ice Hockey": {
            NHL: "https://next-api.betright.com.au/Sports/Category?categoryId=75"
        },
        "Rugby League": {
            NRL: "https://next-api.betright.com.au/Sports/Category?categoryId=60"
        }
    };

    protected marketParser: MarketParser = {
        HeadToHead: name => name === "Match Result" || name === "Money Line",
        Lines: name => name === "Pick Your Own Line" || name.startsWith("Point Spread "),
        Totals: name => name.startsWith("Total Points Over/Under")
    };

    protected async scrapeComp(compId: string, url: string): Promise<CompData> {
        const data = await Scraper.getDataFromUrl(url) as MatchesResponse;
        const comp: CompData = {};
        if (data.masterCategories) {
            await Promise.all(data.masterCategories[0].categories[0].masterEvents.filter(event => event.masterEventClassName === "Matches").map(async (event) => {
                const teams = event.masterEventName.split(/ [@v] /u);
                const match = new Match(
                    compId,
                    teams[0],
                    teams[1],
                    event.maxAdvertisedStartTimeUtc,
                    await this.scrapeOffers(compId, `https://next-api.betright.com.au/Sports/MasterEvent?masterEventId=${event.masterEventId}`).catch((e: unknown) => {
                        console.error(e);
                        return {};
                    })
                );
                comp[match.id] = match;
            }));
        }
        return comp;
    }

    protected async scrapeOffers(compId: string, url: string): Promise<Offers> {
        const data = await Scraper.getDataFromUrl(url) as MarketsResponse;
        const offers: Offers = {};
        const selectedMarkets = ["Handicap Markets", "Total Markets"];
        await Promise.all(data.groupLinks.filter(group => selectedMarkets.includes(group.groupName)).map(async (group) => {
            const groupData = await Scraper.getDataFromUrl(`${url}&GroupTypeCode=${group.groupTypeCode}`) as MarketsResponse;
            data.events = data.events.concat(groupData.events);
        }));
        for (const event of data.events) {
            for (const runner of event.outcomes) {
                const marketName = this.parseMarketName(runner.groupByHeader);
                if (marketName) {
                    offers[marketName] ??= {};
                    const runnerName = Mapper.mapRunner(compId, runner.points === 0 ? runner.outcomeName : `${runner.outcomeName} ${runner.points}`);
                    offers[marketName]![runnerName] = runner.price;
                }
            }
        }
        return offers;
    }
}

interface MatchesResponse {
    masterCategories: {
        categories: {
            masterEvents: {
                masterEventClassName: string;
                masterEventName: string;
                masterEventId: number;
                maxAdvertisedStartTimeUtc: string;
            }[];
        }[];
    }[] | undefined;
}

interface MarketsResponse {
    events: {
        eventClass: string;
        outcomes: {
            groupByHeader: string;
            eventName: string;
            outcomeName: string;
            price: number;
            points: number;
        }[];
    }[];
    groupLinks: {
        groupName: string;
        groupTypeCode: string;
    }[];
}
