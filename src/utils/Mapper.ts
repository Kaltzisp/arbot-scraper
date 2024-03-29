// Defined mappings.
const MAPPINGS: Mappings = {
    AFL: {
        "Adelaide Crows": ["Adelaide Crows"],
        "Brisbane Lions": ["Brisbane Lions"],
        "Carlton Blues": ["Carlton Blues"],
        "Collingwood Magpies": ["Collingwood Magpies"],
        "Essendon Bombers": ["Essendon Bombers"],
        "Fremantle Dockers": ["Fremantle Dockers"],
        "Geelong Cats": ["Geelong Cats"],
        "Gold Coast Suns": ["Gold Coast Suns"],
        "GWS Giants": ["Greater Western Sydney Giants", "GWS Giants"],
        "Greater Western Sydney Giants": ["Greater Western Sydney Giants"],
        "Hawthorn Hawks": ["Hawthorn Hawks"],
        "Melbourne Demons": ["Melbourne Demons"],
        "North Melbourne Kangaroos": ["North Melbourne Kangaroos"],
        "Port Adelaide Power": ["Port Adelaide Power"],
        "Richmond Tigers": ["Richmond Tigers"],
        "St Kilda Saints": ["St Kilda Saints"],
        "Sydney Swans": ["Sydney Swans"],
        "West Coast Eagles": ["West Coast Eagles"],
        "Western Bulldogs": ["Western Bulldogs", "Wst Bulldogs"]
    },
    NRL: {
        "Brisbane Broncos": ["Brisbane Broncos"],
        "Canberra Raiders": ["Canberra Raiders"],
        "Canterbury Bankstown Bulldogs": ["Canterbury Bankstown Bulldogs", "Canterbury Bulldogs", "Bdgs"],
        "Cronulla Sharks": ["Cronulla-Sutherland Sharks", "Cronulla Sharks"],
        "Gold Coast Titans": ["Gold Coast Titans", "GCst"],
        "Manly Warringah Sea Eagles": ["Manly Warringah Sea Eagles", "Manly Sea Eagles"],
        "Melbourne Storm": ["Melbourne Storm"],
        "Newcastle Knights": ["Newcastle Knights"],
        "New Zealand Warriors": ["New Zealand Warriors"],
        "North Queensland Cowboys": ["North Queensland Cowboys", "Nth Queensland Cowboys", "Nth Qld", "NQld"],
        "Parramatta Eels": ["Parramatta Eels"],
        "Penrith Panthers": ["Penrith Panthers"],
        "Redcliffe Dolphins": ["Redcliffe Dolphins", "The Dolphins"],
        "South Sydney Rabbitohs": ["South Sydney Rabbitohs", "Souths", "Sths"],
        "St George Illawarra Dragons": ["St George Illawarra Dragons", "StGI"],
        "Sydney Roosters": ["Sydney Roosters", "Syd Roosters"],
        "Wests Tigers": ["Wests Tigers", "WTig"],
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
    const id = aliasToId(alias);
    if (runnerMap[compId]) {
        const mappedName = runnerMap[compId]!.get(Array.from(runnerMap[compId]!.keys()).find(name => name.includes(id))!);
        const runnerModifier = (/[+-]?[\d.]+$/u).exec(alias.replace(/[()]/gu, ""));
        if (mappedName) {
            return runnerModifier ? `${mappedName} ${runnerModifier}` : mappedName;
        }
    }
    if (id !== "over" && id !== "under") {
        console.error(`Alias not mapped: ${id}`);
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


// const MAPPINGS: Mappings = {
//     NRL: {
//         "Brisbane Broncos": ["Brisbane", "Broncos", "Brisbane Broncos", "Bris"],
//         "Canberra Raiders": ["Canberra", "Raiders", "Canberra Raiders", "Canb"],
//         "Canterbury Bankstown Bulldogs": ["Canterbury-Bankstown", "Bulldogs", "Canterbury Bankstown Bulldogs", "Canterbury Bulldogs", "Bdgs"],
//         "Cronulla Sharks": ["Cronulla-Sutherland", "Sharks", "Cronulla-Sutherland Sharks", "Cronulla Sharks", "Cronulla", "Cron"],
//         "Gold Coast Titans": ["Gold Coast", "Titans", "Gold Coast Titans", "GCst"],
//         "Manly Warringah Sea Eagles": ["Manly-Warringah", "Sea Eagles", "Manly Warringah Sea Eagles", "Manly Sea Eagles", "Manly", "Man"],
//         "Melbourne Storm": ["Melbourne", "Storm", "Melbourne Storm"],
//         "Newcastle Knights": ["Newcastle", "Knights", "Newcastle Knights", "Newc"],
//         "New Zealand Warriors": ["New Zealand", "Warriors", "New Zealand Warriors", "Warr"],
//         "North Queensland Cowboys": ["North Queensland", "Cowboys", "North Queensland Cowboys", "Nth Queensland Cowboys", "Nth Qld", "NQld"],
//         "Parramatta Eels": ["Parramatta", "Eels", "Parramatta Eels", "Parr"],
//         "Penrith Panthers": ["Penrith", "Panthers", "Penrith Panthers", "Penr"],
//         "Redcliffe Dolphins": ["Redcliffe", "Dolphins", "Redcliffe Dolphins", "Dolp", "The Dolphins"],
//         "South Sydney Rabbitohs": ["South Sydney", "Rabbitohs", "South Sydney Rabbitohs", "Souths", "Sths"],
//         "St George Illawarra Dragons": ["St George Illawarra", "Dragons", "St George Illawarra Dragons", "St George Ill", "StGI"],
//         "Sydney Roosters": ["Sydney", "Roosters", "Sydney Roosters", "Syd Roosters", "SydR"],
//         "Wests Tigers": ["Wests", "Tigers", "Wests Tigers", "WTig"],
//     }
// };
