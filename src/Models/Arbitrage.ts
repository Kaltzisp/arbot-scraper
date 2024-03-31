import { findHeadToHeadArbs, findLineArbs, findTotalsArbs } from "./findArbs.js";
import { AWSBucket } from "../core/AWSBucket.js";
import { BetEvent } from "./utils/BetEvent.js";
import type { MarketData } from "../core/Scraper.js";
import type { MatchedBet } from "./utils/MatchedBet.js";
import { readFileSync } from "fs";

export class Arber {

    public marketData: MarketData | undefined;
    private readonly matches: {
        [matchId: string]: BetEvent | undefined;
    } = {};
    private readonly matchedBets: MatchedBet[] = [];

    public async loadLatest(file?: string): Promise<void> {
        // Get from local file if specified.
        if (file) {
            this.marketData = JSON.parse(readFileSync(file, "utf8")) as MarketData;
        } else {
            this.marketData = await (new AWSBucket()).getLatest();
        }
        // Reconstructing matches array.
        for (const bookieId in this.marketData.data) {
            for (const sportId in this.marketData.data[bookieId]) {
                for (const compId in this.marketData.data[bookieId][sportId]) {
                    for (const matchId in this.marketData.data[bookieId][sportId][compId]) {
                        if (!this.matches[matchId]) {
                            this.matches[matchId] = new BetEvent(this.marketData.data[bookieId][sportId][compId][matchId]);
                        }
                        this.matches[matchId]!.addMarketsFrom(bookieId, this.marketData.data[bookieId][sportId][compId][matchId]);
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

    public filter(filter: MatchedBetFilter): MatchedBet[] {
        console.log("====== Matched Bets ======");
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
        bets.sort((a, b) => filter.sort === "ev" ? b.ev - a.ev : b.yield - a.yield);
        bets.forEach(bet => bet.print());
        console.log("\n\n");
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
