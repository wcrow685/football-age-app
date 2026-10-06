import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.loadEnvFile(path.join(__dirname, ".env"));
const APISPORTS_KEY = process.env.APISPORTS_KEY;
const APISPORTS_URL = "https://v3.football.api-sports.io";
const SEASON = 2024;
const LEAGUE_NAME = "Süper Lig";
const LEAGUE_LOGO = "https://media.api-sports.io/football/leagues/203.png";

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Missing or incomplete teams
const MISSING_TEAMS = [
  { id: 611,  name: "Fenerbahçe",     logo: "https://media.api-sports.io/football/teams/611.png" },
  { id: 998,  name: "Trabzonspor",    logo: "https://media.api-sports.io/football/teams/998.png" },
  { id: 1001, name: "Kayserispor",    logo: "https://media.api-sports.io/football/teams/1001.png" },
  { id: 1002, name: "Sivasspor",      logo: "https://media.api-sports.io/football/teams/1002.png" },
  { id: 1004, name: "Kasımpaşa",      logo: "https://media.api-sports.io/football/teams/1004.png" },
  { id: 1005, name: "Antalyaspor",    logo: "https://media.api-sports.io/football/teams/1005.png" },
  { id: 1007, name: "Rizespor",       logo: "https://media.api-sports.io/football/teams/1007.png" },
  { id: 3563, name: "Adana Demirspor",logo: "https://media.api-sports.io/football/teams/3563.png" },
  { id: 3573, name: "Gaziantep FK",   logo: "https://media.api-sports.io/football/teams/3573.png" },
  { id: 3575, name: "Hatayspor",      logo: "https://media.api-sports.io/football/teams/3575.png" },
  { id: 3583, name: "Bodrum FK",      logo: "https://media.api-sports.io/football/teams/3583.png" },
  { id: 3588, name: "Eyüpspor",       logo: "https://media.api-sports.io/football/teams/3588.png" },
  { id: 3603, name: "Samsunspor",     logo: "https://media.api-sports.io/football/teams/3603.png" },
];

async function main() {
  const playersJsonPath = path.join(__dirname, "../public/players.json");
  const existing = JSON.parse(fs.readFileSync(playersJsonPath, "utf8"));

  const seen = new Set(existing.players.filter(p => p.league === LEAGUE_NAME).map(p => p.name));
  const newPlayers = [];

  for (let t = 0; t < MISSING_TEAMS.length; t++) {
    const team = MISSING_TEAMS[t];
    console.log(`\n[${t + 1}/${MISSING_TEAMS.length}] ${team.name}`);
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages && page <= 3) {
      // Always wait 7s between requests to stay under 10 req/min
      if (page > 1 || t > 0) {
        console.log(`  Waiting 7s...`);
        await sleep(7000);
      }

      const url = `${APISPORTS_URL}/players?team=${team.id}&season=${SEASON}&page=${page}`;
      let data = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        const res = await fetch(url, { headers: { "x-apisports-key": APISPORTS_KEY } });
        if (res.status === 429) {
          console.log(`    Rate limited, waiting 30s...`);
          await sleep(30000);
          continue;
        }
        if (!res.ok) { console.log(`    HTTP ${res.status}`); break; }
        data = await res.json();
        break;
      }

      if (!data) break;
      if (data.errors && Object.keys(data.errors).length > 0) {
        console.log(`    Error:`, data.errors);
        // Wait a full minute and retry
        console.log(`    Waiting 65s before retry...`);
        await sleep(65000);
        const res2 = await fetch(url, { headers: { "x-apisports-key": APISPORTS_KEY } });
        if (!res2.ok) break;
        data = await res2.json();
        if (!data || (data.errors && Object.keys(data.errors).length > 0)) break;
      }

      totalPages = data.paging?.total ?? 1;
      const items = data.response || [];
      console.log(`  Page ${page}/${Math.min(totalPages, 3)}: ${items.length} players`);

      items.forEach(item => {
        const p = item.player;
        if (!p?.birth?.date || seen.has(p.name)) return;
        seen.add(p.name);
        newPlayers.push({
          name:        p.name,
          birth:       p.birth.date.slice(0, 10),
          league:      LEAGUE_NAME,
          leagueLogo:  LEAGUE_LOGO,
          nationality: p.nationality || "Unknown",
          club:        team.name,
          crest:       team.logo,
          position:    item.statistics?.[0]?.games?.position || "",
        });
      });

      page++;
    }
  }

  console.log(`\nNewly fetched: ${newPlayers.length} players`);

  const merged = [...existing.players, ...newPlayers];
  merged.sort((a, b) => a.birth.localeCompare(b.birth));
  const result = { players: merged, total: merged.length };
  fs.writeFileSync(playersJsonPath, JSON.stringify(result));

  // Summary
  const sl = merged.filter(p => p.league === LEAGUE_NAME);
  const byClub = {};
  sl.forEach(p => { byClub[p.club] = (byClub[p.club] || 0) + 1; });
  console.log(`\nSüper Lig total: ${sl.length}`);
  Object.entries(byClub).sort((a,b)=>b[1]-a[1]).forEach(([c,n]) => console.log(`  ${n} ${c}`));
  console.log(`\nGrand total: ${merged.length}`);
}

main().catch(console.error);
