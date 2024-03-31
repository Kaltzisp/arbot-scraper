import type { Match, Offers } from "./Match.js";

export abstract class Scraper {

    protected readonly data: BookieData = {};
    protected readonly promisedData: Promise<void>[] = [];

    protected abstract bookieEndpoints: {
        [sportId: string]: {
            [compId: string]: string;
        };
    };

    /** Retrieves data from a bookie url and returns the resulting object.
     * 
     * @param url the url to the bookie API.
     * @param options an optional property containing request headers or other data.
     * @returns a promise of the JSON parsed body recieved.
     */
    protected static async getDataFromUrl(url: string, options?: RequestInit): Promise<unknown> {
        const response = await fetch(url, options ?? {}).catch(() => {
            throw new Error(`Failed to fetch data from ${url}`);
        });
        const data = await response.json().catch(() => {
            throw new Error(`Malformed data recieved from ${url}`)
        }) as unknown;
        return data;
    }

    /** Scrapes a bookie and returns the resulting BookieData object. */
    public async scrapeBookie(): Promise<BookieData> {
        for (const sportId in this.bookieEndpoints) {
            this.data[sportId] = {};
            const comps = this.bookieEndpoints[sportId];
            for (const compId in comps) {
                this.promisedData.push(this.scrapeComp(sportId, compId, comps[compId]).then((comp) => {
                    this.data[sportId][compId] = comp;
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

export interface MarketData {
    meta: {
        scrapedAt: number;
    };
    data: {
        [bookieId: string]: BookieData;
    }
}

export interface BookieData {
    [sportId: string]: {
        [compId: string]: CompData
    }
}

export interface CompData {
    [matchId: string]: Match;
}
