// Imports.
import type { MarketData, Scraper } from "./core/Scraper.js";
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
export async function handler(event: unknown): Promise<MarketData> {
    console.log(event);
    const webscraper = new WebScraper(Scrapers);
    const marketData = await webscraper.getMarketData();
    return marketData;
}

if (process.argv[2] === "TEST") {
    const data = await handler({});
    writeFileSync("./marketData.json", JSON.stringify(data));
}
