import { AWSBucket } from "../Services/AWSBucket.js";
import { Arbitrage } from "./Models/Arbitrage.js";
import type { MarketData } from "../WebScraper/Scraper.js";
import type { MatchedBet } from "./MatchedBet.js";
import type { Matches } from "../WebScraper/Match.js";
import { Parser } from "./utils/Parser.js";
import { readFileSync } from "fs";

export class Analyzer {

    public marketData: MarketData | undefined;
    public matches: Matches = {};
    public matchedBets: MatchedBet[] = [];

    /** Loads data from source and runs models. */
    public async runModels(initializer?: MarketData | string): Promise<void> {
        await this.loadLatest(initializer);
        this.findArbs();
    }

    /**
     * Loads market data and transforms it into a set of matched bets.
     * @param initializer the source from which to load market data.
     */
    public async loadLatest(initializer?: MarketData | string): Promise<void> {
        // Loading market data from specified source.
        if (typeof initializer === "string") {
            this.marketData = JSON.parse(readFileSync(initializer, "utf8")) as MarketData;
        } else if (initializer) {
            this.marketData = initializer;
        } else {
            this.marketData = await AWSBucket.getLatest();
        }
        this.matches = Parser.parseMarkets(this.marketData);
    }

    /** Procedurally generates a list of matched bets for each market type. */
    public findArbs(): void {
        for (const matchId in this.matches) {
            const match = this.matches[matchId]!;
            Arbitrage.findHeadToHeadArbs(match).forEach((bet => this.matchedBets.push(bet)));
            Arbitrage.findLineArbs(match).forEach((bet => this.matchedBets.push(bet)));
            Arbitrage.findTotalsArbs(match).forEach((bet => this.matchedBets.push(bet)));
        }
    }

    /**
     * Filters a set of matched bets according to specified parameters.
     * @param filter an object of type MatchedBetFilter to pass matched bets through.
     * @returns the list of matched bets that pass the filter.
     */
    public filter(filter: MatchedBetFilter): MatchedBet[] {
        this.matchedBets.sort((a, b) => filter.sort === "yield" ? b.yield - a.yield : b.ev - a.ev);
        const bets = this.matchedBets.filter((bet) => {
            if (
                (bet.ev < (filter.minEv ?? -Infinity)) ||
                (bet.yield < (filter.minYield ?? -Infinity)) ||
                (!filter.inPlay && Date.now() > bet.startTime) ||
                (filter.match && !bet.id.includes(filter.match)) ||
                ((filter.startsWithin ?? Infinity) * 3600000 + Date.now() < bet.startTime) ||
                (filter.comp && bet.comp !== filter.comp) ||
                (filter.market && bet.market !== filter.market) ||
                (filter.bookie && !bet.bestOffer.map(offer => offer.bookie).includes(filter.bookie)) ||
                (filter.hasBookie && !bet.runners.flat().map(runner => Object.keys(runner.odds)).flat().includes(filter.hasBookie))
            ) { return false; }
            return true;
        }).splice(0, filter.maxResults ?? 10);
        return bets;
    }

}

interface MatchedBetFilter {
    match?: string;
    comp?: string;
    market?: string;
    bookie?: string;
    hasBookie?: string;
    minEv?: number;
    minYield?: number;
    sort?: "ev" | "yield";
    maxResults?: number;
    inPlay?: boolean;
    startsWithin?: number;
}
