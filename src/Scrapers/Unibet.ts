import { type CompData, Match, type Offers, Scraper, } from "../utils/Scraper.js";
import { mapRunner } from "../utils/Mapper.js";

export class Unibet extends Scraper {

    protected bookieEndpoints = {
        RugbyLeague: {
            NRL: "https://www.unibet.com.au/sportsbook-feeds/views/filter/rugby_league/nrl/all/matches?ncid=1711595601"
        },
        AussieRules: {
            AFL: "https://www.unibet.com.au/sportsbook-feeds/views/filter/australian_rules/afl/all/matches?ncid=1711711009"
        }
    };

    protected async scrapeComp(sportId: string, compId: string, url: string): Promise<CompData> {
        const data = await Scraper.getDataFromUrl(url) as MatchesResponse;
        const comp: CompData = {
            compId,
            matches: []
        };
        const promises: Promise<void>[] = [];
        for (const event of data.layout.sections[1].widgets[0].matches.events) {
            const match = new Match(
                compId,
                event.event.homeName,
                event.event.awayName,
                Date.parse(event.event.start)
            );
            promises.push(this.scrapeMarkets(compId, `https://oc-offering-api.kambicdn.com/offering/v2018/ubau/betoffer/event/${event.event.id}.json`).then((matchOffers) => {
                match.offers = matchOffers;
                comp.matches.push(match);
            }).catch((e: unknown) => {
                console.error(e);
                comp.matches.push(match);
            }));
        }

        return comp;
    }

    protected async scrapeMarkets(compId: string, url: string): Promise<Offers> {
        const data = await Scraper.getDataFromUrl(url) as MarketsResponse;
        const offers: Offers = {};
        for (const offer of data.betOffers) {
            const marketName = this.parseMarketName(offer.criterion.label);
            if (marketName) {
                if (!offers[marketName]) {
                    offers[marketName] = [];
                }
                for (const runner of offer.outcomes) {
                    const runnerName = runner.line ? `${runner.label} ${runner.line / 1000}` : runner.participant!;
                    offers[marketName]!.push({
                        runnerName: mapRunner(compId, runnerName),
                        runnerOdds: runner.odds / 1000
                    });
                }
            }
        }
        return offers;
    }

    protected parseMarketName(name: string): string | false {
        if (name === "Including Overtime") {
            return "HeadToHead";
        } else if (name === "Handicap - Including Overtime") {
            return "Lines";
        } else if (name === "Total Points - Including Overtime") {
            return "Totals";
        }
        return false;
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
