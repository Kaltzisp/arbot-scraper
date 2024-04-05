import type { MatchedBet } from "../Analysis/MatchedBet.js";

export class DiscordEmbed {

    private readonly title: string;
    private readonly type = "rich";
    private readonly description: string;
    private readonly color: number;
    private readonly image = {
        // Transparent image to pad embed width.
        url: "https://i.stack.imgur.com/Fzh0w.png"
    }
    private readonly fields: Field[] = [];
    private readonly footer;

    public constructor(bet: MatchedBet) {
        this.title = bet.id;
        this.description = bet.market;
        this.color = DiscordEmbed.getColor(bet.ev);
        this.addField("EV (%)", (bet.ev * 100).toFixed(2), true);
        this.addField("Yield (%)", (bet.yield * 100).toFixed(2), true);
        bet.runners.forEach((runner) => {
            this.addField(runner.name, `$${runner.bestOffer.odd.toFixed(2)} on ${runner.bestOffer.bookie}`);
        });
        this.footer = {
            text: this.getFooter(bet)
        };
    }

    public static async post(discordEmbeds: DiscordEmbed[]): Promise<void> {
        await fetch(process.env.DISCORD_WEBHOOK_URL!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                embeds: discordEmbeds.reverse()
            })
        });
    }

    private static getColor(ev: number): number {
        if (ev < 0) { return 0xFF0000; }
        if (ev === 0) { return 0xDDDDDD; }
        const hex = Math.round(15- Math.max(Math.min(ev / 0.04, 1), 0) * 15);
        return parseInt(`ff${hex.toString(16).repeat(2)}ff`, 16);
    }

    private addField(name: string, value: string, inline?: boolean): void {
        this.fields.push({ name, value, inline });
    }

    private getFooter(bet: MatchedBet): string {
        return bet.runners.map(runner => Object.entries(runner.odds).map(([bookie, odd]) => `${bookie}: $${odd}`).join(", ")).join("\n");
    }

}

interface Field {
    name: string;
    value: string;
    inline?: boolean
}
