// Defined mappings.
const MAPPINGS: Mappings = {
    NRL: {
        "Brisbane Broncos": ["Brisbane", "Broncos", "Brisbane Broncos", "Bris"],
        "Canberra Raiders": ["Canberra", "Raiders", "Canberra Raiders", "Canb"],
        "Canterbury Bankstown Bulldogs": ["Canterbury-Bankstown", "Bulldogs", "Canterbury Bankstown Bulldogs", "Canterbury Bulldogs", "Bdgs"],
        "Cronulla Sharks": ["Cronulla-Sutherland", "Sharks", "Cronulla-Sutherland Sharks", "Cronulla Sharks", "Cronulla", "Cron"],
        "Gold Coast Titans": ["Gold Coast", "Titans", "Gold Coast Titans", "GCst"],
        "Manly Warringah Sea Eagles": ["Manly-Warringah", "Sea Eagles", "Manly Warringah Sea Eagles", "Manly Sea Eagles", "Manly", "Man"],
        "Melbourne Storm": ["Melbourne", "Storm", "Melbourne Storm"],
        "Newcastle Knights": ["Newcastle", "Knights", "Newcastle Knights", "Newc"],
        "New Zealand Warriors": ["New Zealand", "Warriors", "New Zealand Warriors", "Warr"],
        "North Queensland Cowboys": ["North Queensland", "Cowboys", "North Queensland Cowboys", "Nth Queensland Cowboys", "Nth Qld", "NQld"],
        "Parramatta Eels": ["Parramatta", "Eels", "Parramatta Eels", "Parr"],
        "Penrith Panthers": ["Penrith", "Panthers", "Penrith Panthers", "Penr"],
        "Redcliffe Dolphins": ["Redcliffe", "Dolphins", "Redcliffe Dolphins", "Dolp", "The Dolphins"],
        "South Sydney Rabbitohs": ["South Sydney", "Rabbitohs", "South Sydney Rabbitohs", "Souths", "Sths"],
        "St George Illawarra Dragons": ["St George Illawarra", "Dragons", "St George Illawarra Dragons", "St George Ill", "StGI"],
        "Sydney Roosters": ["Sydney", "Roosters", "Sydney Roosters", "Syd Roosters", "SydR"],
        "Wests Tigers": ["Wests", "Tigers", "Wests Tigers", "WTig"],
    }
};

/** Reduces a team alias into a lowercase id containing only letters. */
function aliasToId(alias: string): string {
    return alias.toLowerCase().replace(/[^A-z]/gu, "");
}

// Creating team aliases map so that we don't need to regenerate at runtime.
// Maps alias => teamId.
const runnerMap: RunnerMap = {};
for (const compId in MAPPINGS) {
    runnerMap[compId] = new Map();
    for (const runnerName in MAPPINGS[compId]) {
        for (const alias of MAPPINGS[compId][runnerName]) {
            runnerMap[compId]!.set(aliasToId(alias), runnerName);
        }
    }
}

/** Gets the mapped team name from an alias. */
export function mapRunner(compId: string, alias: string): string {
    if (runnerMap[compId]) {
        const mappedName = runnerMap[compId]!.get(aliasToId(alias));
        if (mappedName) {
            const regex = new RegExp(alias, "gu");
            return alias.replace(regex, mappedName);
        }
    }
    return alias;
}

interface RunnerMap {
    [compId: string]: Map<string, string> | undefined;
}

interface Mappings {
    [compId: string]: {
        [runnerName: string]: string[];
    };
}
