import { type CompData, Scraper, } from "../Scraper.js";
import { Match, type Offers } from "../utils/Match.js";
import { Mapper } from "../utils/Mapper.js";

export class Bluebet extends Scraper {

    protected bookieEndpoints = {
        RugbyLeague: {
            NRL: "https://web20-api.bluebet.com.au/SportsCategory?CategoryId=42626"
        },
        AussieRules: {
            AFL: "https://web20-api.bluebet.com.au/SportsCategory?CategoryId=43735"
        },
        Baketball: {
            NBA: "https://web20-api.bluebet.com.au/SportsCategory?CategoryId=39251"
        }
    };

    protected async scrapeComp(sportId: string, compId: string, url: string): Promise<CompData> {
        const options: RequestInit = {
            headers: {
                "Content-Type": "application/json",
                "Origin": "https://www.bluebet.com.au"
            }
        };
        const data = await Scraper.getDataFromUrl(url, options) as MatchesResponse;
        const comp: CompData = {}
        const promises: Promise<void>[] = [];
        for (const event of data.MasterCategories[0].Categories[0].MasterEvents) {
            const match = new Match(
                compId,
                event.MasterEventName.split(/ [@v] /u)[0],
                event.MasterEventName.split(/ [@v] /u)[1],
                Date.parse(event.MaxAdvertisedStartTime)
            );
            promises.push(this.scrapeMarkets(compId, `https://web20-api.bluebet.com.au/MasterEvent?MasterEventId=${event.MasterEventId}`).then((matchOffers) => {
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
        const options: RequestInit = {
            headers: {
                "Content-Type": "application/json",
                "Origin": "https://www.bluebet.com.au"
            }
        };
        const data = await Scraper.getDataFromUrl(url, options) as MarketsResponse;
        const offers: Offers = {};
        for (const group of data.GroupLinks) {
            if (group.GroupName === "Handicap Markets" || group.GroupName === "Total Markets") {
                const groupData = await Scraper.getDataFromUrl(`${url}&GroupTypeCode=${group.GroupTypeCode}`, options) as MarketsResponse;
                data.Events = data.Events.concat(groupData.Events);
            }
        }
        for (const event of data.Events) {
            for (const outcome of event.Outcomes) {
                const marketName = this.parseMarketName(outcome.GroupByHeader);
                if (marketName) {
                    if (!offers[marketName]) {
                        offers[marketName] = {};
                    }
                    const runnerName = Mapper.mapRunner(compId, outcome.Points === 0 ? outcome.OutcomeName : `${outcome.OutcomeName} ${outcome.Points}`);
                    offers[marketName]![runnerName] = outcome.Price;
                }
            }
        }
        return offers;
    }

    protected parseMarketName(name: string): string | false {
        if (name === "Match Result" || name === "Money Line") {
            return "HeadToHead";
        } else if (name === "Pick Your Own Line" || name.startsWith("Point Spread ")) {
            return "Lines";
        } else if (name.startsWith("Total Points Over/Under")) {
            return "Totals";
        }
        return false;
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
    }[];
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
