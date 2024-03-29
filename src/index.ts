import type { BookieData } from "./utils/Scraper.js";
import { Pointsbet } from "./Scrapers/Pointsbet.js";

async function scrapeAll(): Promise<MarketData> {

    // Initialising market data.
    const marketData: MarketData = {
        meta: {
            scrapedAt: Date.now()
        },
        data: []
    };

    // Collecting scrapers.
    const scrapers = [
        new Pointsbet()
    ];

    // Scraping market data.
    const promises: Promise<void>[] = [];
    for (const scraper of scrapers) {
        promises.push(scraper.scrapeBookie().then((bookieData) => {
            marketData.data.push(bookieData);
        }).catch((e: unknown) => {
            console.log(e);
        }));
    }

    await Promise.all(promises);
    return marketData;

}

// Running webscraper.
scrapeAll().then((marketData) => {
    console.log(marketData);
}).catch((e: unknown) => {
    console.error(e);
});

interface MarketData {
    meta: {
        scrapedAt: number;
    };
    data: BookieData[];
}
