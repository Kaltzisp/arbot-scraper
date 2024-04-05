import { Match, type Matches } from "../../WebScraper/Match.js";
import type { MarketData } from "../../WebScraper/Scraper.js";

export const Parser = {

    /**
     * Loads market data and transforms it into a set of matched bets.
     * @param initializer the source from which to load market data.
     */
    parseMarkets(marketData: MarketData): Matches {
        const matches: Matches = {};
        // Reconstructing matches array.
        for (const bookieId in marketData.data) {
            for (const sportId in marketData.data[bookieId]) {
                for (const compId in marketData.data[bookieId][sportId]) {
                    for (const matchId in marketData.data[bookieId][sportId][compId]) {
                        const match = Match.create(marketData.data[bookieId][sportId][compId][matchId]);
                        const reversedId = match.id.split(" vs ").reverse().join(" vs ");
                        if (matches[match.id]) {
                            matches[match.id]?.addMarketsFrom(bookieId, marketData.data[bookieId][sportId][compId][matchId]);
                        } else if (matches[reversedId]) {
                            matches[reversedId]?.addMarketsFrom(bookieId, marketData.data[bookieId][sportId][compId][matchId]);
                        } else {
                            matches[match.id] = match;
                            matches[match.id]?.addMarketsFrom(bookieId, marketData.data[bookieId][sportId][compId][matchId]);
                        }
                    }
                }
            }
        }
        return matches;
    }

}
