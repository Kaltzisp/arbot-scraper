import { Mapper } from "./Mapper.js";

export class Match {

    public readonly id: string;
    public readonly homeTeam: string;
    public readonly awayTeam: string;
    public readonly startTime: number;

    public constructor(compId: string, homeTeam: string, awayTeam: string, dateTime: number | string, public offers: Offers) {
        this.homeTeam = Mapper.mapRunner(compId, homeTeam);
        this.awayTeam = Mapper.mapRunner(compId, awayTeam);
        this.id = `${this.homeTeam} vs ${this.awayTeam}`;
        this.startTime = typeof dateTime === "string" ? Date.parse(dateTime) : dateTime;
    }

}

export interface Offers {
    [marketName: string]: {
        [runnerName: string]: number;
    } | undefined;
}
