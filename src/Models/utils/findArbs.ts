import type { BetEvent } from "./BetEvent.js";
import { MatchedBet } from "./MatchedBet.js";
import type { Runner } from "./Runner.js";

export function findHeadToHeadArbs(match: BetEvent): MatchedBet[] {
    if (match.markets.HeadToHead) {
        return [new MatchedBet(match.id, "Head to Head", (Object.values(match.markets.HeadToHead) as Runner[]))];
    }
    return [];
}

export function findLineArbs(match: BetEvent): MatchedBet[] {
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
            bets.push(new MatchedBet(match.id, "Alternate Lines", [runner!, awayRunner[1]!]));
        }
    });
    return bets;
}

export function findTotalsArbs(match: BetEvent): MatchedBet[] {
    const market = match.markets.Totals;
    if (!market) {
        return [];
    }
    const bets: MatchedBet[] = [];
    const underRunners = Object.entries(market).filter(([runnerName]) => runnerName.includes("<"));
    underRunners.forEach(([runnerName, runner]) => {
        const matchedName = runnerName.replace("<", ">");
        const overRunner = Object.entries(market).find(([name]) => name === matchedName);
        if (overRunner) {
            bets.push(new MatchedBet(match.id, "Alternate Totals", [runner!, overRunner[1]!]));
        }
    });
    return bets;
}
