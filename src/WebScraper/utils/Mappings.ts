export const MAPPINGS: Mappings = {
    AFL: {
        "Adelaide Crows": ["Adelaide Crows"],
        "Brisbane Lions": ["Brisbane Lions"],
        "Carlton Blues": ["Carlton Blues"],
        "Collingwood Magpies": ["Collingwood Magpies"],
        "Essendon Bombers": ["Essendon Bombers"],
        "Fremantle Dockers": ["Fremantle Dockers"],
        "Geelong Cats": ["Geelong Cats"],
        "Gold Coast Suns": ["Gold Coast Suns"],
        "Greater Western Sydney Giants": ["Greater Western Sydney Giants", "GWS Giants"],
        "Hawthorn Hawks": ["Hawthorn Hawks"],
        "Melbourne Demons": ["Melbourne Demons"],
        "North Melbourne Kangaroos": ["North Melbourne Kangaroos", "Nth Melb"],
        "Port Adelaide Power": ["Port Adelaide Power"],
        "Richmond Tigers": ["Richmond Tigers"],
        "St Kilda Saints": ["St Kilda Saints"],
        "Sydney Swans": ["Sydney Swans", "Sydney", "Swans"],
        "West Coast Eagles": ["West Coast Eagles"],
        "Western Bulldogs": ["Western Bulldogs", "Wst Bulldogs"]
    },
    NBA: {
        "Atlanta Hawks": ["Atlanta Hawks"],
        "Boston Celtics": ["Boston Celtics"],
        "Brooklyn Nets": ["Brooklyn Nets"],
        "Charlotte Hornets": ["Charlotte Hornets"],
        "Chicago Bulls": ["Chicago Bulls"],
        "Cleveland Cavaliers": ["Cleveland Cavaliers"],
        "Dallas Mavericks": ["Dallas Mavericks"],
        "Denver Nuggets": ["Denver Nuggets"],
        "Detroit Pistons": ["Detroit Pistons"],
        "Golden State Warriors": ["Golden State Warriors"],
        "Houston Rockets": ["Houston Rockets"],
        "Indiana Pacers": ["Indiana Pacers"],
        "Los Angeles Clippers": ["Los Angeles Clippers", "LA Clippers"],
        "Los Angeles Lakers": ["Los Angeles Lakers", "LA Lakers"],
        "Memphis Grizzlies": ["Memphis Grizzlies"],
        "Miami Heat": ["Miami Heat"],
        "Milwaukee Bucks": ["Milwaukee Bucks"],
        "Minnesota Timberwolves": ["Minnesota Timberwolves"],
        "New Orleans Pelicans": ["New Orleans Pelicans"],
        "New York Knicks": ["New York Knicks"],
        "Oklahoma City Thunder": ["Oklahoma City Thunder"],
        "Orlando Magic": ["Orlando Magic"],
        "Philadelphia 76ers": ["Philadelphia 76ers"],
        "Phoenix Suns": ["Phoenix Suns"],
        "Portland Trail Blazers": ["Portland Trail Blazers"],
        "Sacramento Kings": ["Sacramento Kings"],
        "San Antonio Spurs": ["San Antonio Spurs"],
        "Toronto Raptors": ["Toronto Raptors"],
        "Utah Jazz": ["Utah Jazz"],
        "Washington Wizards": ["Washington Wizards"]
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

export interface Mappings {
    [compId: string]: {
        [runnerName: string]: string[];
    };
}
