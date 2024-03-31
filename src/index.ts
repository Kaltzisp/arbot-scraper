// Imports.
import type { MarketData, Scraper } from "./core/Scraper.js";
import { AWSBucket } from "./core/AWSBucket.js";
import { Arber } from "./Models/Arbitrage.js";
import type { PutObjectCommandOutput } from "@aws-sdk/client-s3";
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
export async function handler(event: { [key: string]: boolean | string }): Promise<MarketData | PutObjectCommandOutput> {
    const webscraper = new WebScraper(Scrapers);
    const marketData = await webscraper.getMarketData();
    if (event.test) {
        return marketData;
    }
    const bucket = new AWSBucket();
    const response = await bucket.push(marketData);
    return response;
}

// Running webscraper test instance.
if (process.argv[2] === "TEST_SCRAPER") {
    const data = await handler({ test: true });
    writeFileSync("./marketData.json", JSON.stringify(data));
} else if (process.argv[2] === "TEST_MODELS") {
    const arbot = new Arber();
    await arbot.loadLatest();
    arbot.filter({
        minEv: 0
    });
}
