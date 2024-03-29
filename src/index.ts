// Imports.
import type { MarketData } from "./utils/Scraper.js";
import { writeFileSync } from "fs";

// Scrapers.
import { Ladbrokes } from "./Scrapers/Ladbrokes.js";
import { Playup } from "./Scrapers/Playup.js";
import { Pointsbet } from "./Scrapers/Pointsbet.js";
import { Tabcorp } from "./Scrapers/Tabcorp.js";
import { Unibet } from "./Scrapers/Unibet.js";


/** Gets the market data from the bookie APIs. */
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
        new Ladbrokes(),
        new Playup(),
        new Pointsbet(),
        new Tabcorp(),
        new Unibet()
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

// Running webscraper on AWS Lambda.
export async function handler(event: unknown): Promise<MarketData> {
    console.log(event);
    const marketData = await scrapeAll();
    return marketData;
}

// Running test instance.
const data = await scrapeAll();
writeFileSync("./marketData.json", JSON.stringify(data));
