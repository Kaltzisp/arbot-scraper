/* eslint-disable */
import { Match } from "../core/Match.js";
import type { MarketData } from "../core/Scraper.js";

export function findArbs(marketData: MarketData): void {
    const matches: { [matchId: string]: BetEvent } = {};
    const data = marketData.data;
    for (const bookie of data) {
        for (const sport in bookie.sports) {
            for (const comp of bookie.sports[sport]) {
                for (const match of comp.matches) {
                    if (!matches[match.matchId]) {
                        matches[match.matchId] = new BetEvent(match);
                    }
                    for (const market in match.offers) {
                        for (const runner of match.offers[market]!) {
                            if (!matches[match.matchId].markets[market]) {
                                matches[match.matchId].markets[market] = {};
                            }
                            if (!matches[match.matchId].markets[market][runner.runnerName]) {
                                matches[match.matchId].markets[market][runner.runnerName] = new Runner(runner.runnerName, bookie.bookieId, runner.runnerOdds);
                            } else {
                                matches[match.matchId].markets[market][runner.runnerName].addOdds(bookie.bookieId, runner.runnerOdds);
                            }
                        }
                    }
                }
            }
        }
    }

    // Calculating arbs.
    const bets: MatchedBet[] = [];
    for (const matchId in matches) {
        const match = matches[matchId];
        if (match.markets.HeadToHead) {
            bets.push(findHeadToHeadArbs(match));
        }
        findLineArbs(match).forEach(bet => bets.push(bet));
        findTotalsArbs(match).forEach(bet => bets.push(bet));
    }
    bets.sort((a, b) => b.ev - a.ev).filter(bet => bet.ev > 0).forEach(bet => console.log(bet.print()));
    console.log("\n\n\n");
    bets.sort((a, b) => b.yield - a.yield).filter(bet => bet.bookies.includes("Playup")).splice(0, 3).forEach(bet => console.log(bet.print()));
}


class BetEvent {

    public readonly id;
    public readonly homeTeam;
    public readonly awayTeam;
    public readonly startTime;
    public readonly offers;
    public readonly markets: {
        [marketName: string]: {
            [runnerName: string]: Runner;
        }
    } = {};

    public constructor(match: Match) {
        this.id = match.matchId;
        this.homeTeam = match.homeTeam;
        this.awayTeam = match.awayTeam;
        this.startTime = match.startTime;
        this.offers = match.offers;
    }

}


class Runner {
    public readonly odds: {
        [bookie: string]: number;
    } = {};

    public constructor(public name: string, bookie?: string, odd?: number) {
        if (bookie && odd) {
            this.addOdds(bookie, odd);
        }
    }

    public get bestOffer(): { bookie: string; odd: number; } {
        let bestOffer = {
            bookie: "",
            odd: 0
        };
        for (const bookie in this.odds) {
            const odd = this.odds[bookie];
            if (odd > bestOffer.odd) {
                bestOffer = { bookie, odd };
            }
        }
        return bestOffer;
    }

    public addOdds(bookie: string, odd: number): void {
        this.odds[bookie] = odd;
    }

}


class MatchedBet {
    public constructor(
        public matchId: string,
        public market: string,
        public runners: Runner[]
    ) { }

    public get bookies(): string[] {
        return this.runners.map(runner => runner.bestOffer.bookie);
    }

    public get odds(): number[] {
        return this.runners.map(runner => runner.bestOffer.odd);
    }

    public get ev(): number {
        return this.getEv();
    }

    public get yield(): number {
        return this.getYield();
    }

    public print(): string {
        let output = `${this.matchId}\n`;
        output += `EV = ${this.ev} @ ${this.market}\n`;
        output += `Yield = ${this.getYield()} @ ${this.market}\n`;
        for (let i = 0; i < this.bookies.length; i += 1) {
            output += `${this.runners[i].name} @ ${this.odds[i]} on ${this.bookies[i]}\n`
        }
        output += `Odds = ${this.runners.map(runner => Object.entries(runner.odds))}`;
        output += "\n";
        return output;
    }

    /**
     * Calculates the EV of a matched bet on n outcomes.
     * @param odds the set of odds offered by bookies.
     * @returns the expected value of a fully matched bet.
     */
    private getEv(): number {
        const odds = this.runners.map(runner => runner.bestOffer.odd);
        const numerator = odds.reduce((product, odd) => product * odd);
        const denominator = odds.reduce((divisor, odd, i) => {
            const product = odds.reduce((p, o, j) => {
                if (i === j) {
                    return p;
                }
                return p * o;
            }, 1);
            return divisor + product;
        }, 0);
        return numerator / denominator - 1;
    }

    /**
     * Calculates the yield of a matched bonus bet.
     * @param bonusOdd the odds for the bonus bet.
     * @param matchedOdd the odds for the matched bet.
     * @returns the expected return on the bonus bet.
     */
    private getYield(): number {
        const odds = this.runners.map(runner => runner.bestOffer.odd);
        return Math.max(
            (1 / odds[0]) * (odds[0] - 1) * (odds[1] - 1),
            (1 / odds[1]) * (odds[1] - 1) * (odds[0] - 1),
        );
    }
}

export function findHeadToHeadArbs(match: BetEvent): MatchedBet {
    return new MatchedBet(match.id, "Head to Head", Object.values(match.markets.HeadToHead!) as Runner[]);
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
