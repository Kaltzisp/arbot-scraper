import type { BookieData } from "./utils/Scraper.js";
import { Pointsbet } from "./Scrapers/Pointsbet.js";

// Initialising arbot.
const marketData: MarketData = {
    meta: {
        scrapedAt: Date.now()
    },
    data: []
};

const scraper = new Pointsbet();
const data = await scraper.scrapeBookie();
console.log(data);
marketData.data.push(data);

interface MarketData {
    meta: {
        scrapedAt: number;
    };
    data: BookieData[];
}
