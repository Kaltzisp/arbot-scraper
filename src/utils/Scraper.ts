import { mapRunner } from "./Mapper.js";

export abstract class Scraper {

    protected readonly data: BookieData;
    protected readonly promisedData: Promise<void>[] = [];

    protected abstract bookieEndpoints: {
        [sportId: string]: {
            [compId: string]: string;
        };
    };

    public constructor() {
        this.data = {
            bookieId: this.constructor.name,
            sports: {}
        };
    }

    protected static async getDataFromUrl(url: string, options?: RequestInit): Promise<unknown> {
        const response = await fetch(url, options ?? {}).catch((e: unknown) => {
            console.error(e);
            throw new Error(`Failed to fetch data from ${url}`);
        });
        const data = await response.json().catch((e: unknown) => {
            console.error(e);
        }) as unknown;
        return data;
    }

    public async scrapeBookie(): Promise<BookieData> {
        for (const sportId in this.bookieEndpoints) {
            this.data.sports[sportId] = [];
            const comps = this.bookieEndpoints[sportId];
            for (const compId in comps) {
                this.promisedData.push(this.scrapeComp(sportId, compId, comps[compId]).then((comp) => {
                    this.data.sports[sportId].push(comp);
                }).catch((e: unknown) => {
                    console.error(e);
                }));
            }
        }
        await Promise.all(this.promisedData);
        return this.data;
    }

    protected abstract scrapeComp(sportId: string, compId: string, url: string): Promise<CompData>;
    protected abstract scrapeMarkets(compId: string, url: string): Promise<Offers>;
    protected abstract parseMarketName(name: string): string | false;

}

export class Match {

    public readonly matchId: string;
    public readonly homeTeam: string;
    public readonly awayTeam: string;
    public offers: Offers = {};

    public constructor(compId: string, homeTeam: string, awayTeam: string, public startTime: number) {
        this.homeTeam = mapRunner(compId, homeTeam);
        this.awayTeam = mapRunner(compId, awayTeam);
        this.matchId = `${this.homeTeam} vs ${this.awayTeam}`;
    }

}

export interface MarketData {
    meta: {
        scrapedAt: number;
    };
    data: BookieData[];
}

export interface BookieData {
    bookieId: string;
    sports: {
        [sportId: string]: CompData[];
    };
}

export interface CompData {
    compId: string;
    matches: Match[];
}

export interface Offers {
    [marketName: string]: {
        runnerName: string;
        runnerOdds: number;
    }[] | undefined;
}
