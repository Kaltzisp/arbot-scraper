import type { MarketData, Scraper } from "./Scraper.js";

export class Webscraper {

    public scrapers: Scraper[];
    public marketData: MarketData;

    public constructor(scrapers: Scraper[]) {
        this.scrapers = scrapers;
        this.marketData = {
            meta: {
                scrapedAt: Date.now()
            },
            data: {}
        };
    }

    public async getMarketData(): Promise<MarketData> {
        const marketRequests: Promise<void>[] = [];
        for (const scraper of this.scrapers) {
            marketRequests.push(scraper.scrapeBookie().then((bookieData) => {
                this.marketData.data[scraper.constructor.name] = bookieData;
            }).catch((e: unknown) => {
                console.error(e);
            }));
        }
        await Promise.all(marketRequests);
        return this.marketData;
    }

}
