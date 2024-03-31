import type { Match } from "../../core/Match.js";
import type { MatchedBet } from "./MatchedBet.js";
import { Runner } from "./Runner.js";

export class BetEvent {

    public id: string;
    public homeTeam: string;
    public awayTeam: string;
    public startTime: number;
    public markets: Markets = {};
    public matchedBets: MatchedBet[] = [];

    public constructor(match: Match) {
        this.id = match.id;
        this.homeTeam = match.homeTeam;
        this.awayTeam = match.awayTeam;
        this.startTime = match.startTime;
    }

    public addMarketsFrom(bookieId: string, match: Match): void {
        for (const marketName in match.offers) {
            if (!this.markets[marketName]) {
                this.markets[marketName] = {};
            }
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

interface Markets {
    [marketName: string]: {
        [runnerName: string]: Runner | undefined;
    } | undefined;
}
