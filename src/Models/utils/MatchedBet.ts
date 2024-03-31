import type { Runner } from "./Runner.js";

export class MatchedBet {
    public constructor(
        public matchId: string,
        public market: string,
        public runners: Runner[]
    ) { }

    /** Returns the best offer for each side of the matched bet. */
    public get bestOffer(): { bookie: string; odd: number }[] {
        return this.runners.map(runner => ({
            bookie: runner.bestOffer.bookie,
            odd: runner.bestOffer.odd
        }));
    }

    /**
     * Calculates the EV of a matched bet on n outcomes.
     * @param odds the set of odds offered by bookies.
     * @returns the expected value of a fully matched bet.
     */
    public get ev(): number {
        const odds = this.bestOffer.map(offer => offer.odd);
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
    public get yield(): number {
        const odds = this.bestOffer.map(offer => offer.odd);
        return Math.max(
            (1 / odds[0]) * (odds[0] - 1) * (odds[1] - 1),
            (1 / odds[1]) * (odds[1] - 1) * (odds[0] - 1),
        );
    }

    /** Prints a matched bet to the console. */
    public print(): void {
        let output = `${this.matchId}\n`;
        output += `EV = ${this.ev} @ ${this.market}\n`;
        output += `Yield = ${this.yield} @ ${this.market}\n`;
        for (let i = 0; i < this.bestOffer.length; i += 1) {
            output += `${this.runners[i].name} @ ${this.bestOffer[i].odd} on ${this.bestOffer[i].bookie}\n`
        }
        output += `Odds = ${this.runners.map(runner => Object.entries(runner.odds))}`;
        output += "\n";
        console.log(output);
    }
}
