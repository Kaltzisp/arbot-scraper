import type { Match } from "../../WebScraper/Match.js";
import { MatchedBet } from "../MatchedBet.js";
import type { Runner } from "../../WebScraper/Runner.js";

export const Arbitrage = {

    findHeadToHeadArbs(match: Match): MatchedBet[] {
        if (match.markets.HeadToHead) {
            return [new MatchedBet(match.id, match.comp, "Head to Head", match.startTime, (Object.values(match.markets.HeadToHead) as Runner[]))];
        }
        return [];
    },

    findLineArbs(match: Match): MatchedBet[] {
        const market = match.markets.Lines;
        if (!market) {
            return [];
        }
        const bets: MatchedBet[] = [];
        const homeRunners = Object.entries(market).filter(([runnerName]) => runnerName.includes(match.homeTeam));
        homeRunners.forEach(([runnerName, runner]) => {
            let matchedName = runnerName.replace(match.homeTeam, match.awayTeam);
            matchedName = matchedName.includes("+") ? matchedName.replace("+", "-") : matchedName.replace("-", "+");
            const awayRunner = Object.entries(market).find(([name]) => name === matchedName);
            if (awayRunner) {
                bets.push(new MatchedBet(match.id, match.comp, "Alternate Lines", match.startTime, [runner!, awayRunner[1]!]));
            }
        });
        return bets;
    },

    findTotalsArbs(match: Match): MatchedBet[] {
        const market = match.markets.Totals;
        if (!market) {
            return [];
        }
        const bets: MatchedBet[] = [];
        const underRunners = Object.entries(market).filter(([runnerName]) => runnerName.includes("Under"));
        underRunners.forEach(([runnerName, runner]) => {
            const matchedName = runnerName.replace("Under", "Over");
            const overRunner = Object.entries(market).find(([name]) => name === matchedName);
            if (overRunner) {
                bets.push(new MatchedBet(match.id, match.comp, "Alternate Totals", match.startTime, [runner!, overRunner[1]!]));
            }
        });
        return bets;
    }

}
