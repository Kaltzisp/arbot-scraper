// Imports.
import { type MarketData, Scraper } from "./WebScraper/Scraper.js";
import { AWSBucket } from "./core/AWSBucket.js";
import { Arber } from "./Models/Arber.js";
import { DiscordEmbed } from "./core/Webhooks.js";
import type { PutObjectCommandOutput } from "@aws-sdk/client-s3";
import { configDotenv } from "dotenv";
import { writeFileSync } from "fs";

// Scraper imports.
import { Bluebet } from "./WebScraper/Bookies/Bluebet.js";
import { Ladbrokes } from "./WebScraper/Bookies/Ladbrokes.js";
import { Palmerbet } from "./WebScraper/Bookies/Palmerbet.js";
import { Playup } from "./WebScraper/Bookies/Playup.js";
import { Pointsbet } from "./WebScraper/Bookies/Pointsbet.js";
import { Sportsbet } from "./WebScraper/Bookies/Sportsbet.js";
import { Tabcorp } from "./WebScraper/Bookies/Tabcorp.js";
import { Unibet } from "./WebScraper/Bookies/Unibet.js";

// Configuring environment variables.
configDotenv();

// Defining scrapers.
const scrapers: Scraper[] = [
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
    const marketData = await Scraper.getMarketData(scrapers);
    if (event.test) {
        return marketData;
    }
    const bucket = new AWSBucket();
    const response = await bucket.push(marketData);
    const arbot = new Arber();
    await arbot.loadLatest(marketData);
    await DiscordEmbed.post(arbot.filter({
        minEv: 0
    }).map(bet => new DiscordEmbed(bet)));
    return response;
}

if (process.argv[2] === "TEST_SCRAPER") {
    // Running webscraper test instance.
    const data = await handler({ test: true }) as MarketData;
    writeFileSync("./marketData.json", JSON.stringify(data));

} else if (process.argv[2] === "TEST_MODELS") {
    // Running models test instance.
    const arbot = new Arber();
    await arbot.loadLatest();
    arbot.filter({
        minEv: 0
    }).forEach(bet => bet.print());
}
