// Imports.
import { type MarketData, Scraper } from "./WebScraper/Scraper.js";
import { AWSBucket } from "./Services/AWSBucket.js";
import { Analyzer } from "./Analysis/Analyzer.js";
import { DiscordEmbed } from "./Services/Webhooks.js";
import type { PutObjectCommandOutput } from "@aws-sdk/client-s3";
import { configDotenv } from "dotenv";
import { writeFileSync } from "fs";

// Scraper imports.
import { Betright } from "./WebScraper/Bookies/Betright.js";
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
    new Betright(),
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
export async function handler(): Promise<MarketData | PutObjectCommandOutput> {
    const marketData = await Scraper.getMarketData(scrapers);
    const response = await AWSBucket.push(marketData);
    const arbot = new Analyzer();
    await arbot.runModels();
    await DiscordEmbed.post(process.env.DISCORD_WEBHOOK_URL!, arbot.filter({
        minEv: 0
    }).map(bet => new DiscordEmbed(bet)));
    return response;
}

if (process.argv[2] === "TEST_SCRAPER") {
    // Running webscraper test instance.
    const marketData = await Scraper.getMarketData(scrapers);
    writeFileSync("./marketData.json", JSON.stringify(marketData));

} else if (process.argv[2] === "TEST_MODELS") {
    // Running models test instance.
    const arbot = new Analyzer();
    await arbot.runModels("./marketData.json");
    arbot.filter({
        minEv: 0
    }).forEach(bet => bet.print());
}
