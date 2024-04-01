import { findHeadToHeadArbs, findLineArbs, findTotalsArbs } from "./utils/findArbs.js";
import { AWSBucket } from "../core/AWSBucket.js";
import { BetEvent } from "./utils/BetEvent.js";
import type { MarketData } from "../WebScraper/Scraper.js";
import type { MatchedBet } from "./utils/MatchedBet.js";
import { readFileSync } from "fs";

export class Arber {

    public marketData: MarketData | undefined;
    private readonly matches: {
        [matchId: string]: BetEvent | undefined;
    } = {};
    private readonly matchedBets: MatchedBet[] = [];

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
            this.marketData = await (new AWSBucket()).getLatest();
        }
        // Reconstructing matches array.
        for (const bookieId in this.marketData.data) {
            for (const sportId in this.marketData.data[bookieId]) {
                for (const compId in this.marketData.data[bookieId][sportId]) {
                    for (const matchId in this.marketData.data[bookieId][sportId][compId]) {
                        if (!this.matches[matchId]) {
                            if (!this.matches[matchId.split(" vs ").reverse().join(" vs ")]) {
                                this.matches[matchId] = new BetEvent(this.marketData.data[bookieId][sportId][compId][matchId]);
                                this.matches[matchId]!.addMarketsFrom(bookieId, this.marketData.data[bookieId][sportId][compId][matchId]);
                            } else {
                                this.matches[matchId.split(" vs ").reverse().join(" vs ")]!.addMarketsFrom(bookieId, this.marketData.data[bookieId][sportId][compId][matchId]);
                            }
                        } else {
                            this.matches[matchId]!.addMarketsFrom(bookieId, this.marketData.data[bookieId][sportId][compId][matchId]);
                        }
                    }
                }
            }
        }
        // Generating matched bets.
        for (const matchId in this.matches) {
            const match = this.matches[matchId]!;
            findHeadToHeadArbs(match).forEach((bet => this.matchedBets.push(bet)));
            findLineArbs(match).forEach((bet => this.matchedBets.push(bet)));
            findTotalsArbs(match).forEach((bet => this.matchedBets.push(bet)));
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
            if (bet.ev < (filter.minEv ?? -Infinity)) {
                return false;
            }
            if (bet.yield < (filter.minYield ?? -Infinity)) {
                return false;
            }
            if (filter.bookie) {
                if (!bet.bestOffer.map(offer => offer.bookie).includes(filter.bookie)) {
                    return false;
                }
            }
            return true;
        }).splice(0, filter.maxResults ?? 5);
        return bets;
    }
}

interface MatchedBetFilter {
    match?: string;
    bookie?: string;
    minEv?: number;
    minYield?: number;
    sort?: "ev" | "yield";
    maxResults?: number;
}
