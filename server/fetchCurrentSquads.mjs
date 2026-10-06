// Fetches current squad IDs, then season data, filters to only current squad members
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.loadEnvFile(path.join(__dirname, ".env"));
const KEY = process.env.APISPORTS_KEY;
const URL  = "https://v3.football.api-sports.io";
const SEASON = 2024;
const LEAGUE_NAME = "Süper Lig";
const LEAGUE_LOGO = "https://media.api-sports.io/football/leagues/203.png";

// Known team IDs from previous fetch — avoids 1 extra request
const TEAMS = [
  { id: 549,  name: "Beşiktaş",        logo: "https://media.api-sports.io/football/teams/549.png" },
  { id: 564,  name: "Başakşehir",      logo: "https://media.api-sports.io/football/teams/564.png" },
  { id: 607,  name: "Konyaspor",       logo: "https://media.api-sports.io/football/teams/607.png" },
  { id: 611,  name: "Fenerbahçe",      logo: "https://media.api-sports.io/football/teams/611.png" },
  { id: 645,  name: "Galatasaray",     logo: "https://media.api-sports.io/football/teams/645.png" },
  { id: 994,  name: "Göztepe",         logo: "https://media.api-sports.io/football/teams/994.png" },
  { id: 996,  name: "Alanyaspor",      logo: "https://media.api-sports.io/football/teams/996.png" },
  { id: 998,  name: "Trabzonspor",     logo: "https://media.api-sports.io/football/teams/998.png" },
  { id: 1001, name: "Kayserispor",     logo: "https://media.api-sports.io/football/teams/1001.png" },
  { id: 1002, name: "Sivasspor",       logo: "https://media.api-sports.io/football/teams/1002.png" },
  { id: 1004, name: "Kasımpaşa",       logo: "https://media.api-sports.io/football/teams/1004.png" },
  { id: 1005, name: "Antalyaspor",     logo: "https://media.api-sports.io/football/teams/1005.png" },
  { id: 1007, name: "Rizespor",        logo: "https://media.api-sports.io/football/teams/1007.png" },
  { id: 3563, name: "Adana Demirspor", logo: "https://media.api-sports.io/football/teams/3563.png" },
  { id: 3573, name: "Gaziantep FK",    logo: "https://media.api-sports.io/football/teams/3573.png" },
  { id: 3575, name: "Hatayspor",       logo: "https://media.api-sports.io/football/teams/3575.png" },
  { id: 3583, name: "Bodrum FK",       logo: "https://media.api-sports.io/football/teams/3583.png" },
  { id: 3588, name: "Eyüpspor",        logo: "https://media.api-sports.io/football/teams/3588.png" },
  { id: 3603, name: "Samsunspor",      logo: "https://media.api-sports.io/football/teams/3603.png" },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function apiFetch(endpoint) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`${URL}${endpoint}`, { headers: { "x-apisports-key": KEY } });
    if (res.status === 429) {
      console.log(`    429 rate limit — waiting 65s...`);
      await sleep(65000);
      continue;
    }
    if (!res.ok) return null;
    const data = await res.json();
    if (data.errors && Object.keys(data.errors).length > 0) {
      const msg = JSON.stringify(data.errors);
      if (msg.includes("rate") || msg.includes("Rate")) {
        console.log(`    Rate error — waiting 65s...`);
        await sleep(65000);
        continue;
      }
      console.log(`    API error: ${msg}`);
      return null;
    }
    return data;
  }
  return null;
}

async function main() {
  const playersJsonPath = path.join(__dirname, "../public/players.json");
  const existing = JSON.parse(fs.readFileSync(playersJsonPath, "utf8"));
  const allNewPlayers = [];

  for (let t = 0; t < TEAMS.length; t++) {
    const team = TEAMS[t];
    console.log(`\n[${t + 1}/${TEAMS.length}] ${team.name}`);

    // Step 1: Get current squad IDs
    if (t > 0) await sleep(7000);
    const squadData = await apiFetch(`/players/squads?team=${team.id}`);
    const currentIds = new Set(
      (squadData?.response?.[0]?.players || []).map(p => p.id)
    );
    console.log(`  Current squad: ${currentIds.size} players`);

    if (currentIds.size === 0) {
      console.log(`  Skipping — no squad data`);
      continue;
    }

    // Step 2: Fetch season players (up to 3 pages), filter by squad IDs
    let page = 1, totalPages = 1;
    const teamPlayers = [];

    while (page <= totalPages && page <= 3) {
      await sleep(7000);
      const data = await apiFetch(`/players?team=${team.id}&season=${SEASON}&page=${page}`);
      if (!data) break;

      totalPages = data.paging?.total ?? 1;
      const items = data.response || [];
      console.log(`  Season page ${page}/${Math.min(totalPages, 3)}: ${items.length} entries`);

      items.forEach(item => {
        const p = item.player;
        if (!p?.birth?.date) return;
        if (!currentIds.has(p.id)) return; // not in current squad
        currentIds.delete(p.id); // dedupe
        teamPlayers.push({
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

    console.log(`  → ${teamPlayers.length} current squad players with birth dates`);
    allNewPlayers.push(...teamPlayers);
  }

  console.log(`\n=== Done ===`);
  console.log(`Total Süper Lig: ${allNewPlayers.length}`);

  // Replace Süper Lig in JSON
  const others = existing.players.filter(p => p.league !== LEAGUE_NAME);
  const merged = [...others, ...allNewPlayers].sort((a, b) => a.birth.localeCompare(b.birth));
  fs.writeFileSync(playersJsonPath, JSON.stringify({ players: merged, total: merged.length }));

  const byClub = {};
  allNewPlayers.forEach(p => { byClub[p.club] = (byClub[p.club] || 0) + 1; });
  Object.entries(byClub).sort((a,b) => b[1]-a[1]).forEach(([c,n]) => console.log(`  ${n}  ${c}`));
  console.log(`Grand total: ${merged.length}`);
}

main().catch(console.error);
