import type { Matches } from "../../WebScraper/Match.js";

export const Multibet = {

    findMultis(bookie: string, comp: string, allMatches: Matches, nLegs?: number): unknown {
        const matches = Object.values(allMatches).filter((match) => {
            if (!match?.markets.HeadToHead || match.comp !== comp) {
                return false;
            }
            // eslint-disable-next-line @typescript-eslint/consistent-return
            Object.values(match.markets.HeadToHead).map(runner => Object.keys(runner!.odds)).forEach((bookieList) => {
                if (!bookieList.includes(bookie)) {
                    return false;
                }
            });
            return true;
        });
        const multis = this.matchCombinations(matches, nLegs ?? 3);
        const outcomes = multis.map(multi => this.multiOutcomes(multi.map(match => Object.values(match!.markets.HeadToHead!)))).flat();
        const multiBets = outcomes.map(multi => ({
            multi: multi.map(runner => `${runner!.name} @ ${runner!.odds[bookie]}`).join(", "),
            ev: this.multiEv(multi.map(runner => runner!.odds[bookie]))
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
