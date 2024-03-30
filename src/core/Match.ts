import { Mapper } from "../mapper/Mapper.js";

export class Match {
    public readonly matchId: string;
    public readonly homeTeam: string;
    public readonly awayTeam: string;
    public offers: Offers = {};

    public constructor(compId: string, homeTeam: string, awayTeam: string, public startTime: number) {
        this.homeTeam = Mapper.mapRunner(compId, homeTeam);
        this.awayTeam = Mapper.mapRunner(compId, awayTeam);
        this.matchId = `${this.homeTeam} vs ${this.awayTeam}`;
    }
}

export interface Offers {
    [marketName: string]: {
        runnerName: string;
        runnerOdds: number;
    }[] | undefined;
}
