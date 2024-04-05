import type { MatchedBet } from "../MatchedBet.js";

export const Multibet = {

    findMultis(bookie: string, matches: MatchedBet[], minOdds?: number, nLegs?: number): unknown {
        // Sorting matches by bookie margin.
        let legs = matches.sort((a, b) => a.margins[bookie] - b.margins[bookie]);
        // Filtering matches by minimum odds.
        legs = matches.filter(match => match.bestOffer.reduce((minOdd, offer) => Math.min(minOdd, offer.odd), Infinity) > (minOdds ?? 0));
        // Filtering matches that have identical odds, as they are functionally identical in a multi.
        legs = legs.filter((leg, idx) => leg.runners.map(runner => runner.odds[bookie]).sort((a, b) => a - b).join("-") !== legs[idx - 1]?.runners.map(runner => runner.odds[bookie]).sort((a, b) => a - b).join("-"));
        // Selecting the 50 matches with the lowest margins.
        legs = legs.splice(0, 50);
        legs.forEach((leg) => {
            leg.runners.forEach((runner) => {
                runner.name = `${leg.id} - ${leg.market}: ${runner.name}`;
            });
        });
        const multis = this.matchCombinations(legs, nLegs ?? 3);
        const outcomes = multis.map(multi => this.multiOutcomes(multi.map(runner => runner.runners))).flat();
        const multiBets = outcomes.map(multi => ({
            multi: multi.map(runner => `${runner.name} @ ${runner.odds[bookie]}`),
            ev: this.multiEv(multi.map(runner => runner.odds[bookie])),
            odds: multi.reduce((product, runner) => product * runner.odds[bookie], 1)
        })).sort((a, b) => b.ev - a.ev);
        return multiBets[0];
    },

    matchCombinations<T>(set: T[], k: number): T[][] {
        if (k > set.length || k <= 0) { return []; }
        if (k === set.length) { return [set]; }
        if (k === 1) { return set.map(x => [x]) }

        return set.reduce((p: T[][], c, i) => {
            this.matchCombinations(set.slice(i + 1), k - 1).
                forEach(tailArray => p.push([c].concat(tailArray)));

            return p;
        }, []);
    },

    multiOutcomes<T>(set: T[][]): T[][] {
        if (set.length === 1) { return [[set[0][0]], [set[0][1]]] }
        const set2 = JSON.parse(JSON.stringify(set)) as typeof set;
        const array1 = this.multiOutcomes(set.splice(1)).map(outcome => [set[0][0]].concat(outcome))
        const array2 = this.multiOutcomes(set2.splice(1)).map(outcome => [set2[0][1]].concat(outcome))
        return array1.concat(array2);
    },

    multiEv(odds: number[]): number {
        const winProbs = odds.map(odd => (1 / (odd * 1.05)));
        const winChance = winProbs.reduce((product, prob) => product * prob, 1);
        const winPayout = odds.reduce((product, odd) => product * odd, 1);
        const returnChance = winChance * (winProbs.reduce((sum, prob) => sum + 1 / prob, 0) - odds.length);
        return winChance * winPayout + returnChance * 0.7;
    }


};
