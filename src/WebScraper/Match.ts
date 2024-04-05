import { Mapper } from "./utils/Mapper.js";
import { Runner } from "./Runner.js";

export class Match {

    public id: string;
    public comp: string;
    public homeTeam: string;
    public awayTeam: string;
    public startTime: number;

    public offers: Offers;
    public markets: Markets;

    public constructor(comp: string, homeTeam: string, awayTeam: string, dateTime: number | string, offers: Offers) {
        this.homeTeam = Mapper.mapRunner(comp, homeTeam);
        this.awayTeam = Mapper.mapRunner(comp, awayTeam);
        this.id = `${this.homeTeam} vs ${this.awayTeam}`;
        this.comp = comp;
        this.startTime = typeof dateTime === "string" ? Date.parse(dateTime) : dateTime;
        this.offers = offers;
        this.markets = {};
    }

    public static create(match: Match): Match {
        return new Match(match.comp, match.homeTeam, match.awayTeam, match.startTime, {});
    }

    /**
     * Appends markets offered by a bookie on a match to a BetEvent.
     * @param bookieId the bookie to add markets from.
     * @param match the match to add markets from.
     */
    public addMarketsFrom(bookieId: string, match: Match): void {
        for (const marketName in match.offers) {
            this.markets[marketName] ??= {};
            for (const runnerName in match.offers[marketName]) {
                if (!this.markets[marketName]![runnerName]) {
                    this.markets[marketName]![runnerName] = new Runner(runnerName, bookieId, match.offers[marketName]![runnerName])
                } else {
                    this.markets[marketName]![runnerName]!.addOdd(bookieId, match.offers[marketName]![runnerName]);
                }
            }
        }
    }

}

export interface Matches {
    [matchId: string]: Match | undefined
}

export interface Offers {
    [marketName: string]: {
        [runnerName: string]: number;
    } | undefined;
}

interface Markets {
    [marketName: string]: {
        [runnerName: string]: Runner | undefined;
    } | undefined;
}
