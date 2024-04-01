export class Runner {

    public readonly odds: Odds = {};
    public bestOffer: BestOdd = {
        bookie: "",
        odd: 0
    };

    public constructor(public name: string, bookie?: string, odd?: number) {
        if (bookie && odd) {
            this.addOdd(bookie, odd);
        }
    }

    public addOdd(bookie: string, odd: number): void {
        this.odds[bookie] = odd;
        if (odd > this.bestOffer.odd) {
            this.bestOffer = { bookie, odd };
        }
    }

}

interface Odds {
    [bookie: string]: number;
}

export interface BestOdd {
    bookie: string;
    odd: number;
}
