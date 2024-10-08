import { type CompData, type MarketParser, Scraper } from "../Scraper.js";
import { Match, type Offers } from "../Match.js";
import { Mapper } from "../utils/Mapper.js";

export class Unibet extends Scraper {

    protected bookieEndpoints = {
        "Aussie Rules": {
            AFL: "https://www.unibet.com.au/sportsbook-feeds/views/filter/australian_rules/afl/all/matches?ncid=1711711009"
        },
        "Basketball": {
            NBA: "https://www.unibet.com.au/sportsbook-feeds/views/filter/basketball/nba/all/matches?ncid=1711759504"
        },
        "Ice Hockey": {
            NHL: "https://www.unibet.com.au/sportsbook-feeds/views/filter/ice_hockey/nhl/all/matches?ncid=1728345975"
        },
        "Rugby League": {
            NRL: "https://www.unibet.com.au/sportsbook-feeds/views/filter/rugby_league/nrl/all/matches?ncid=1711595601"
        }
    };

    protected marketParser: MarketParser = {
        HeadToHead: name => name === "Regular Time" || name === "Including Overtime",
        Lines: name => name === "Handicap" || name === "Handicap - Including Overtime",
        Totals: name => name === "Total Points" || name === "Total Points - Including Overtime"
    };

    protected async scrapeComp(compId: string, url: string): Promise<CompData> {
        const data = await Scraper.getDataFromUrl(url) as MatchesResponse;
        const comp: CompData = {};
        await Promise.all(data.layout.sections[1].widgets[0].matches.events.map(async (event) => {
            const match = new Match(
                compId,
                event.event.homeName,
                event.event.awayName,
                event.event.start,
                await this.scrapeOffers(compId, `https://oc-offering-api.kambicdn.com/offering/v2018/ubau/betoffer/event/${event.event.id}.json`).catch((e: unknown) => {
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
        for (const offer of data.betOffers) {
            const marketName = this.parseMarketName(offer.criterion.label);
            if (marketName) {
                offers[marketName] ??= {};
                for (const runner of offer.outcomes) {
                    const runnerName = Mapper.mapRunner(compId, runner.line ? `${runner.label} ${runner.line / 1000}` : runner.participant!);
                    offers[marketName]![runnerName] = runner.odds / 1000;
                }
            }
        }
        return offers;
    }
}

interface MatchesResponse {
    layout: {
        sections: [undefined, {
            widgets: [{
                matches: {
                    events: {
                        event: {
                            id: number;
                            homeName: string;
                            awayName: string;
                            start: string;
                        }
                    }[];
                }
            }]
        }];
    }
}

interface MarketsResponse {
    betOffers: {
        criterion: {
            label: string;
        };
        outcomes: {
            participant: string | undefined;
            odds: number;
            label: string;
            line: number | undefined;
        }[];
    }[];
}
