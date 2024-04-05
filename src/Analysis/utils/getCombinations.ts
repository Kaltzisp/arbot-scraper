// // Generates the set of k-length combinations from a set.
// export function getCombinations<T>(set: T[], k: number): T[][] {
//     if (k > set.length || k <= 0) { return []; }
//     if (k === set.length) { return [set]; }
//     if (k === 1) { return set.map(x => [x]) }

//     return set.reduce((p: T[][], c, i) => {
//         getCombinations(set.slice(i + 1), k - 1).
//             forEach(tailArray => p.push([c].concat(tailArray)));

//         return p;
//     }, []);
// }


// // export function getMultiEv(set: number[], odds: number[]): number {
// //     const probProduct = 
// //     let sumEv = 0;
// //     for (let i = 0; i < set.length; i += 1) {
// //         sumEv += 0.7 * set.reduce((product, value, index) => index === i ? product * (1 - value) : product * value, 1);
// //     }
// //     sumEv += odds.reduce((product, value, idx) => product * value * set[idx], 1);
// //     return sumEv;
// // }


// /**
//  * 
//  * @param set a set of matches
//  * @returns 
//  */
// export function permuteH2H(set: string[][]): string[][] {
//     if (set.length === 1) { return [[set[0][0]], [set[0][1]]] }
//     const set2 = JSON.parse(JSON.stringify(set)) as typeof set;
//     const array1 = permuteH2H(set.splice(1)).map(outcome => [set[0][0]].concat(outcome))
//     const array2 = permuteH2H(set2.splice(1)).map(outcome => [set2[0][1]].concat(outcome))
//     return array1.concat(array2);
// }



// permute([["H","T"],["H","T"]]);
