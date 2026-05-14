const BASE_URL = "https://api.football-data.org/v4";

// Leagues available on football-data.org free tier
export const API_LEAGUES = [
  { code: "PL",  name: "Premier League" },
  { code: "PD",  name: "La Liga" },
  { code: "BL1", name: "Bundesliga" },
  { code: "SA",  name: "Serie A" },
  { code: "FL1", name: "Ligue 1" },
];

// Static players for leagues not in free tier (refreshed manually when needed)
export const STATIC_LEAGUES = {
  "Süper Lig": [
    { name: "Mauro Icardi",          birth: "1993-02-19", nationality: "Argentine",  club: "Galatasaray" },
    { name: "Hakim Ziyech",          birth: "1993-03-19", nationality: "Moroccan",   club: "Galatasaray" },
    { name: "Wilfried Zaha",         birth: "1992-11-10", nationality: "Ivorian",    club: "Galatasaray" },
    { name: "Victor Osimhen",        birth: "2001-12-29", nationality: "Nigerian",   club: "Galatasaray" },
    { name: "Nicolo Zaniolo",        birth: "1999-07-02", nationality: "Italian",    club: "Galatasaray" },
    { name: "Davinson Sanchez",      birth: "1996-06-12", nationality: "Colombian",  club: "Galatasaray" },
    { name: "Abdülkerim Bardakci",   birth: "1995-10-23", nationality: "Turkish",    club: "Galatasaray" },
    { name: "Baris Alper Yilmaz",    birth: "2000-07-27", nationality: "Turkish",    club: "Galatasaray" },
    { name: "Sergio Oliveira",       birth: "1992-06-02", nationality: "Portuguese", club: "Galatasaray" },
    { name: "Youssef En-Nesyri",     birth: "1997-04-01", nationality: "Moroccan",   club: "Fenerbahce" },
    { name: "Cengiz Under",          birth: "1997-07-26", nationality: "Turkish",    club: "Fenerbahce" },
    { name: "Sebastian Szymanski",   birth: "1999-05-10", nationality: "Polish",     club: "Fenerbahce" },
    { name: "Mert Muldur",           birth: "1999-04-03", nationality: "Turkish",    club: "Fenerbahce" },
    { name: "Ferdi Kadioglu",        birth: "1999-10-12", nationality: "Dutch",      club: "Fenerbahce" },
    { name: "Irfan Can Kahveci",     birth: "1996-07-15", nationality: "Turkish",    club: "Fenerbahce" },
    { name: "Bright Osayi-Samuel",   birth: "1997-12-05", nationality: "Nigerian",   club: "Fenerbahce" },
    { name: "Caglar Soyuncu",        birth: "1996-05-23", nationality: "Turkish",    club: "Fenerbahce" },
    { name: "Ismail Yuksek",         birth: "2000-11-20", nationality: "Turkish",    club: "Fenerbahce" },
    { name: "Yusuf Akcicek",         birth: "2002-01-04", nationality: "Turkish",    club: "Fenerbahce" },
    { name: "Gedson Fernandes",      birth: "1999-01-09", nationality: "Portuguese", club: "Besiktas" },
    { name: "Michy Batshuayi",       birth: "1993-10-02", nationality: "Belgian",    club: "Besiktas" },
    { name: "Ante Rebic",            birth: "1993-09-21", nationality: "Croatian",   club: "Besiktas" },
    { name: "Rafa Silva",            birth: "1993-05-17", nationality: "Portuguese", club: "Besiktas" },
  ],
  "Saudi Pro League": [
    { name: "Cristiano Ronaldo",       birth: "1985-02-05", nationality: "Portuguese", club: "Al-Nassr" },
    { name: "Sadio Mane",              birth: "1992-04-10", nationality: "Senegalese", club: "Al-Nassr" },
    { name: "Marcelo Brozovic",        birth: "1992-11-16", nationality: "Croatian",   club: "Al-Nassr" },
    { name: "Karim Benzema",           birth: "1987-12-19", nationality: "French",     club: "Al-Ittihad" },
    { name: "N'Golo Kante",            birth: "1991-03-29", nationality: "French",     club: "Al-Ittihad" },
    { name: "Fabinho",                 birth: "1993-10-23", nationality: "Brazilian",  club: "Al-Ittihad" },
    { name: "Neymar Jr",               birth: "1992-02-05", nationality: "Brazilian",  club: "Al-Hilal" },
    { name: "Ruben Neves",             birth: "1997-03-13", nationality: "Portuguese", club: "Al-Hilal" },
    { name: "Sergej Milinkovic-Savic", birth: "1995-02-27", nationality: "Serbian",    club: "Al-Hilal" },
    { name: "Aleksandar Mitrovic",     birth: "1994-09-16", nationality: "Serbian",    club: "Al-Hilal" },
    { name: "Kalidou Koulibaly",       birth: "1991-06-20", nationality: "Senegalese", club: "Al-Hilal" },
    { name: "Yassine Bounou",          birth: "1991-04-05", nationality: "Moroccan",   club: "Al-Hilal" },
    { name: "Riyad Mahrez",            birth: "1991-02-21", nationality: "Algerian",   club: "Al-Ahli" },
    { name: "Roberto Firmino",         birth: "1991-10-02", nationality: "Brazilian",  club: "Al-Ahli" },
    { name: "Edouard Mendy",           birth: "1992-03-01", nationality: "Senegalese", club: "Al-Ahli" },
    { name: "Allan Saint-Maximin",     birth: "1997-03-12", nationality: "French",     club: "Al-Ahli" },
  ],
};

// ── football-data.org fetcher ─────────────────────────────────────────────────
export async function fetchLeague(apiKey, leagueCode, leagueName) {
  const url = `${BASE_URL}/competitions/${leagueCode}/teams?season=2024`;
  const res = await fetch(url, { headers: { "X-Auth-Token": apiKey } });
  if (!res.ok) throw new Error(`football-data.org error ${res.status} for ${leagueCode}`);
  const data = await res.json();

  const players = [];
  (data.teams || []).forEach(team => {
    (team.squad || []).forEach(player => {
      if (!player.dateOfBirth) return;
      players.push({
        name:        player.name,
        birth:       player.dateOfBirth.slice(0, 10),
        league:      leagueName,
        nationality: player.nationality || "Unknown",
        club:        team.name,
        position:    player.position || "",
      });
    });
  });

  return players;
}

// ── api-sports.io fetcher (Süper Lig, Saudi Pro League, etc.) ─────────────────
// League IDs: 203 = Süper Lig, 307 = Saudi Pro League
export const APISPORTS_LEAGUES = [
  { id: 203, name: "Süper Lig",        season: 2024 },
  { id: 307, name: "Saudi Pro League", season: 2024 },
];

export async function fetchApiSportsLeague(apiKey, leagueId, leagueName, season) {
  const APISPORTS_URL = "https://v3.football.api-sports.io";
  const players = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= 15) {
    const url = `${APISPORTS_URL}/players?league=${leagueId}&season=${season}&page=${page}`;
    const res = await fetch(url, { headers: { "x-apisports-key": apiKey } });
    if (!res.ok) throw new Error(`api-sports.io error ${res.status} for league ${leagueId}`);
    const data = await res.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
      throw new Error(`api-sports.io: ${JSON.stringify(data.errors)}`);
    }

    totalPages = data.paging?.total ?? 1;

    (data.response || []).forEach(item => {
      const p    = item.player;
      const stat = item.statistics?.[0];
      if (!p?.birth?.date) return;
      players.push({
        name:        p.name,
        birth:       p.birth.date.slice(0, 10),
        league:      leagueName,
        nationality: p.nationality || "Unknown",
        club:        stat?.team?.name || "",
        position:    stat?.games?.position || "",
      });
    });

    page++;
    if (page <= totalPages) await new Promise(r => setTimeout(r, 300));
  }

  return players;
}
