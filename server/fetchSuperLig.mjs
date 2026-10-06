import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.loadEnvFile(path.join(__dirname, ".env"));
const APISPORTS_KEY = process.env.APISPORTS_KEY;
const APISPORTS_URL = "https://v3.football.api-sports.io";
const LEAGUE_ID = 203; // Süper Lig
const SEASON = 2024;
const LEAGUE_NAME = "Süper Lig";
const LEAGUE_LOGO = "https://media.api-sports.io/football/leagues/203.png";

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  // Step 1: Get all teams
  console.log("Fetching Süper Lig teams...");
  const teamsRes = await fetch(`${APISPORTS_URL}/teams?league=${LEAGUE_ID}&season=${SEASON}`, {
    headers: { "x-apisports-key": APISPORTS_KEY },
  });
  const teamsData = await teamsRes.json();
  const teams = teamsData.response || [];
  console.log(`  Found ${teams.length} teams`);

  const seen = new Set();
  const players = [];

  // Step 2: Fetch players for each team
  for (let t = 0; t < teams.length; t++) {
    const team = teams[t].team;
    console.log(`\n[${t + 1}/${teams.length}] ${team.name} (id: ${team.id})`);
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages && page <= 3) {
      const url = `${APISPORTS_URL}/players?team=${team.id}&season=${SEASON}&page=${page}`;
      let data = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        const res = await fetch(url, { headers: { "x-apisports-key": APISPORTS_KEY } });
        if (res.status === 429) {
          console.log(`    Rate limited, waiting ${5 * (attempt + 1)}s...`);
          await sleep(5000 * (attempt + 1));
          continue;
        }
        if (!res.ok) { console.log(`    HTTP ${res.status}`); break; }
        data = await res.json();
        break;
      }

      if (!data) break;
      if (data.errors && Object.keys(data.errors).length > 0) {
        console.log(`    Error:`, data.errors);
        break;
      }

      totalPages = data.paging?.total ?? 1;
      const pageItems = data.response || [];
      console.log(`    Page ${page}/${Math.min(totalPages, 3)}: ${pageItems.length} players`);

      pageItems.forEach(item => {
        const p = item.player;
        if (!p?.birth?.date || seen.has(p.id)) return;
        seen.add(p.id);
        players.push({
          name:        p.name,
          birth:       p.birth.date.slice(0, 10),
          league:      LEAGUE_NAME,
          leagueLogo:  LEAGUE_LOGO,
          nationality: p.nationality || "Unknown",
          club:        team.name,
          crest:       team.logo || "",
          position:    item.statistics?.[0]?.games?.position || "",
        });
      });

      page++;
      if (page <= Math.min(totalPages, 3)) await sleep(1200);
    }

    if (t < teams.length - 1) await sleep(2500);
  }

  console.log(`\nTotal Süper Lig players fetched: ${players.length}`);

  // Step 3: Merge into players.json
  const playersJsonPath = path.join(__dirname, "../public/players.json");
  const existing = JSON.parse(fs.readFileSync(playersJsonPath, "utf8"));

  // Remove old Süper Lig entries
  const others = existing.players.filter(p => p.league !== LEAGUE_NAME);
  const merged = [...others, ...players];
  merged.sort((a, b) => a.birth.localeCompare(b.birth));

  const result = { players: merged, total: merged.length };
  fs.writeFileSync(playersJsonPath, JSON.stringify(result));

  console.log(`Updated players.json: ${others.length} others + ${players.length} Süper Lig = ${merged.length} total`);
}

main().catch(console.error);
