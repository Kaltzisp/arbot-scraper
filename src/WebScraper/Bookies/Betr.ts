import { type CompData, type MarketParser, Scraper } from "../Scraper.js";
import { Match, type Offers } from "../Match.js";
import { Mapper } from "../utils/Mapper.js";

export class Betr extends Scraper {

    protected bookieEndpoints = {
        "Aussie Rules": {
            AFL: "https://web20-api.bluebet.com.au/SportsCategory?CategoryId=43735"
        },
        "Basketball": {
            NBA: "https://web20-api.bluebet.com.au/SportsCategory?CategoryId=39251"
        },
        "Ice Hockey": {
            NHL: "https://web20-api.bluebet.com.au/SportsCategory?CategoryId=39252"
        },
        "Rugby League": {
            NRL: "https://web20-api.bluebet.com.au/SportsCategory?CategoryId=42626"
        }
    };

    protected marketParser: MarketParser = {
        HeadToHead: name => name === "Match Result" || name === "Money Line",
        Lines: name => name === "Pick Your Own Line" || name.startsWith("Point Spread "),
        Totals: name => name.startsWith("Total Points Over/Under")
    };

    private readonly headers = {
        "Content-Type": "application/json",
        "Origin": "https://www.betr.com.au"
    };

    protected async scrapeComp(compId: string, url: string): Promise<CompData> {
        const data = await Scraper.getDataFromUrl(url, this.headers) as MatchesResponse;
        const comp: CompData = {};
        if (data.MasterCategories) {
            await Promise.all(data.MasterCategories[0].Categories[0].MasterEvents.map(async (event) => {
                const teams = event.MasterEventName.split(/ [@v] /u);
                const match = new Match(
                    compId,
                    teams[0],
                    teams[1],
                    event.MaxAdvertisedStartTime,
                    await this.scrapeOffers(compId, `https://web20-api.bluebet.com.au/MasterEvent?MasterEventId=${event.MasterEventId}`).catch((e: unknown) => {
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
        const data = await Scraper.getDataFromUrl(url, this.headers) as MarketsResponse;
        const offers: Offers = {};
        const selectedMarkets = ["Handicap Markets", "Total Markets"];
        await Promise.all(data.GroupLinks.filter(group => selectedMarkets.includes(group.GroupName)).map(async (group) => {
            const groupData = await Scraper.getDataFromUrl(`${url}&GroupTypeCode=${group.GroupTypeCode}`, this.headers) as MarketsResponse;
            data.Events = data.Events.concat(groupData.Events);
        }));
        for (const event of data.Events) {
            for (const runner of event.Outcomes) {
                const marketName = this.parseMarketName(runner.GroupByHeader);
                if (marketName) {
                    offers[marketName] ??= {};
                    const runnerName = Mapper.mapRunner(compId, runner.Points === 0 ? runner.OutcomeName : `${runner.OutcomeName} ${runner.Points}`);
                    offers[marketName]![runnerName] = runner.Price;
                }
            }
        }
        return offers;
    }
}

interface MatchesResponse {
    MasterCategories: {
        Categories: {
            MasterEvents: {
                MasterEventName: string;
                MasterEventId: number;
                MaxAdvertisedStartTime: string;
            }[];
        }[];
    }[] | undefined;
}

interface MarketsResponse {
    Events: {
        EventClass: string;
        Outcomes: {
            GroupByHeader: string;
            EventName: string;
            OutcomeName: string;
            Price: number;
            Points: number;
        }[];
    }[];
    GroupLinks: {
        GroupName: string;
        GroupTypeCode: string;
    }[];
}
