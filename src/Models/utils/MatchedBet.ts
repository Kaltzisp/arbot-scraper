import type { BestOdd, Runner } from "./Runner.js";

export class MatchedBet {

    public constructor(
        public matchId: string,
        public market: string,
        public runners: Runner[]
    ) { }

    /** Returns the best offer for each side of the matched bet. */
    public get bestOffer(): BestOdd[] {
        return this.runners.map(runner => ({
            bookie: runner.bestOffer.bookie,
            odd: runner.bestOffer.odd
        }));
    }

    /**
     * Calculates the EV of a matched bet on n outcomes.
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
     * Calculates the yield of a matched bet on n outcomes.
     * @returns the highest calculated yield on the matched bet.
     */
    public get yield(): number {
        const odds = this.bestOffer.map(offer => offer.odd);
        const yields = odds.map(bonusOdd => (bonusOdd - 1) * odds.reduce((sum, odd) => sum - 1 / odd, 1 + 1 / bonusOdd));
        return Math.max(...yields);
    }

    /** Prints a matched bet to the console. */
    public print(): void {
        let output = `${"=".repeat(65)}\n`;
        output += `${this.matchId} - ${this.market}\n`;
        output += `EV = ${(this.ev * 100).toFixed(2)}%    Yield = ${(this.yield * 100).toFixed(2)}%\n\n`;
        this.runners.forEach((runner) => {
            output += `${runner.name} @ $${runner.bestOffer.odd} on ${runner.bestOffer.bookie}\n`
        });
        output += this.runners.map(runner => Object.entries(runner.odds).map(([bookie, odd]) => `${bookie}: $${odd}`).join(", ")).join("\n");
        output += `\n${"=".repeat(65)}\n\n`;
        console.log(output);
    }

    public toString(): string {
        return this.matchId;
    }
}
