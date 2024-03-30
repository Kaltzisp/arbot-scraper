// Imports.
import type { MarketData, Scraper } from "./core/Scraper.js";
import { AWSBucket } from "./core/AWSBucket.js";
import { WebScraper } from "./core/WebScraper.js";
import { writeFileSync } from "fs";

// Scraper imports.
import { Ladbrokes } from "./Scrapers/Ladbrokes.js";
import { Palmerbet } from "./Scrapers/Palmerbet.js";
import { Playup } from "./Scrapers/Playup.js";
import { Pointsbet } from "./Scrapers/Pointsbet.js";
import { Sportsbet } from "./Scrapers/Sportsbet.js";
import { Tabcorp } from "./Scrapers/Tabcorp.js";
import { Unibet } from "./Scrapers/Unibet.js";

// Defining scrapers.
const Scrapers: Scraper[] = [
    new Ladbrokes(),
    new Palmerbet(),
    new Playup(),
    new Pointsbet(),
    new Sportsbet(),
    new Tabcorp(),
    new Unibet()
];

// Running webscraper on AWS Lambda.
export async function handler(event: { [key: string]: boolean | string }): Promise<MarketData> {
    const webscraper = new WebScraper(Scrapers);
    const marketData = await webscraper.getMarketData();
    const bucket = new AWSBucket();
    if (event.test) {
        await bucket.push("arbot-webscraper-bucket", `test-${bucket.dateTime(marketData.meta.scrapedAt)}.json`, marketData).catch((e: unknown) => console.log(e));
        return marketData;
    }
    await bucket.push("arbot-webscraper-bucket", "latest.json", marketData).catch((e: unknown) => console.log(e));
    await bucket.push("arbot-webscraper-bucket", `marketData-${bucket.dateTime(marketData.meta.scrapedAt)}.json`, marketData).catch((e: unknown) => console.log(e));
    return marketData;
}

// Running webscraper test instance.
if (process.argv[2] === "TEST") {
    const data = await handler({ test: true }).catch((e: unknown) => {
        console.error(e);
    });
    writeFileSync("./marketData.json", JSON.stringify(data));
}
