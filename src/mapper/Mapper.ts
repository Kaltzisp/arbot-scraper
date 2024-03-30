import { MAPPINGS, type Mappings } from "./Mappings.js";

class RunnerMapper {

    private readonly runnerMap: RunnerMap = {};
    private readonly staticAliases = ["draw", "over", "under"];

    public constructor(mappings: Mappings) {
        for (const compId in mappings) {
            this.runnerMap[compId] = new Map();
            for (const runnerName in mappings[compId]) {
                for (const alias of mappings[compId][runnerName]) {
                    this.runnerMap[compId]?.set(this.stripAlias(alias), runnerName);
                }
            }
        }
    }

    /** Gets a mapped runner name from a bookie runner name. */
    public mapRunner(compId: string, alias: string): string {
        const id = this.stripAlias(alias);
        if (this.runnerMap[compId]) {
            const mappedName = this.runnerMap[compId]!.has(id) ? this.runnerMap[compId]!.get(id) : this.runnerMap[compId]!.get(Array.from(this.runnerMap[compId]!.keys()).find(strippedAlias => strippedAlias.includes(id))!)
            const line = (/[+-]?[\d.]+$/u).exec(alias.replace(/[()]/gu, ""));
            if (mappedName && line) {
                const modifier = parseFloat(line[0]);
                return modifier > 0 ? `${mappedName} +${modifier}` : `${mappedName} ${modifier}`;
            } else if (mappedName) {
                return mappedName;
            }
        }
        if (!this.staticAliases.includes(id)) {
            console.error(`Alias not mapped: ${id}`);
        }
        return alias.replace(/[()]/gu, "");
    }

    /** Strips an alias to a lowercase string. */
    private stripAlias(alias: string): string {
        return alias.toLowerCase().replace(/[^a-z]/gu, "");
    }

}

interface RunnerMap {
    [compId: string]: Map<string, string> | undefined;
}

export const Mapper = new RunnerMapper(MAPPINGS);
