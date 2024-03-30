import { Mapper } from "../mapper/Mapper.js";

export class Match {
    public readonly id: string;
    public readonly homeTeam: string;
    public readonly awayTeam: string;
    public offers: Offers = {};

    public constructor(compId: string, homeTeam: string, awayTeam: string, public startTime: number) {
        this.homeTeam = Mapper.mapRunner(compId, homeTeam);
        this.awayTeam = Mapper.mapRunner(compId, awayTeam);
        this.id = `${this.homeTeam} vs ${this.awayTeam}`;
    }
}

export interface Offers {
    [marketName: string]: {
        [runnerName: string]: number;
    } | undefined;
}
