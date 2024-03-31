// Imports.
import type { MarketData, Scraper } from "./WebScraper/Scraper.js";
import { AWSBucket } from "./core/AWSBucket.js";
import type { PutObjectCommandOutput } from "@aws-sdk/client-s3";
import { Webscraper } from "./WebScraper/Webscraper.js";
import { writeFileSync } from "fs";

// Scraper imports.
import { Bluebet } from "./WebScraper/Bookies/BlueBet.js";
import { Ladbrokes } from "./WebScraper/Bookies/Ladbrokes.js";
import { Palmerbet } from "./WebScraper/Bookies/Palmerbet.js";
import { Playup } from "./WebScraper/Bookies/Playup.js";
import { Pointsbet } from "./WebScraper/Bookies/Pointsbet.js";
import { Sportsbet } from "./WebScraper/Bookies/Sportsbet.js";
import { Tabcorp } from "./WebScraper/Bookies/Tabcorp.js";
import { Unibet } from "./WebScraper/Bookies/Unibet.js";

// Defining scrapers.
const Scrapers: Scraper[] = [
    new Bluebet(),
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
    const webscraper = new Webscraper(Scrapers);
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
    const Arber = await import("./Models/Arber.js");
    const arbot = new Arber.Arber();
    await arbot.loadLatest();
    arbot.filter({
        minEv: 0
    });
}
