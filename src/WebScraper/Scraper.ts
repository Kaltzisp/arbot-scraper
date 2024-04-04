import type { Match, Offers } from "./Match.js";

export abstract class Scraper {

    protected abstract bookieEndpoints: {
        [sportId: string]: {
            [compId: string]: string;
        };
    };

    protected abstract marketParser: MarketParser;

    public static async getMarketData(scrapers: Scraper[]): Promise<MarketData> {
        const marketData: MarketData = {
            meta: { scrapedAt: Date.now() },
            data: {}
        };
        await Promise.all(scrapers.map(async (scraper) => {
            marketData.data[scraper.constructor.name] = await scraper.scrapeBookie();
        }));
        return marketData;
    }

    /** Retrieves data from a bookie url and returns the resulting object.
     * 
     * @param url the url to the bookie API.
     * @param options an optional property containing request headers or other data.
     * @returns a promise of the JSON parsed body recieved.
     */
    protected static async getDataFromUrl(url: string, headers?: HeadersInit): Promise<unknown> {
        const response = await fetch(url, {
            headers: headers ?? {}
        }).catch(() => {
            throw new Error(`Failed to fetch data from ${url}`);
        });
        const data = await response.json().catch(() => {
            throw new Error(`Malformed data recieved from ${url}`)
        }) as unknown;
        return data;
    }

    /** Scrapes a bookie and returns the resulting BookieData object. */
    public async scrapeBookie(): Promise<BookieData> {
        const bookieData: BookieData = {};
        for (const sportId in this.bookieEndpoints) {
            bookieData[sportId] = {};
            const comps = this.bookieEndpoints[sportId];
            await Promise.all(Object.entries(comps).map(async ([compId, url]) => {
                const compData = await this.scrapeComp(compId, url);
                bookieData[sportId][compId] = compData;
            }));
        }
        return bookieData;
    }

    /** Parses market names using a marketParser function. */
    protected parseMarketName(name: string): string | false {
        for (const market in this.marketParser) {
            if (this.marketParser[market](name)) {
                return market;
            }
        }
        return false;
    }

    protected abstract scrapeComp(compId: string, url: string): Promise<CompData>;
    protected abstract scrapeOffers(compId: string, url: string): Promise<Offers>;

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

export interface MarketParser {
    [market: string]: (marketName: string) => boolean;
}
