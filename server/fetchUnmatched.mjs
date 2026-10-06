// Fetches birth dates for squad members not found in season data (page 4+)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.loadEnvFile(path.join(__dirname, ".env"));
const KEY  = process.env.APISPORTS_KEY;
const BASE = "https://v3.football.api-sports.io";
const SEASON = 2024;
const LEAGUE_NAME = "Süper Lig";
const LEAGUE_LOGO = "https://media.api-sports.io/football/leagues/203.png";

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

async function apiFetch(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: { "x-apisports-key": KEY } });
    if (res.status === 429) { await sleep(65000); continue; }
    if (!res.ok) return null;
    const d = await res.json();
    if (d.errors && Object.keys(d.errors).length > 0) {
      const msg = JSON.stringify(d.errors);
      if (msg.includes("rate") || msg.includes("Rate")) { await sleep(65000); continue; }
      if (msg.includes("limit")) { console.log("  Daily limit hit!"); return null; }
      return null;
    }
    return d;
  }
  return null;
}

async function main() {
  const jsonPath = path.join(__dirname, "../public/players.json");
  const db = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  // Build set of names already in the JSON for Süper Lig
  const existingNames = new Set(
    db.players.filter(p => p.league === LEAGUE_NAME).map(p => p.name)
  );
  console.log(`Existing Süper Lig players: ${existingNames.size}`);

  const newPlayers = [];
  let requestsUsed = 0;

  for (let t = 0; t < TEAMS.length; t++) {
    const team = TEAMS[t];

    // Step 1: get current squad IDs + names
    if (t > 0) await sleep(7000);
    console.log(`\n[${t+1}/${TEAMS.length}] ${team.name}`);
    const squadData = await apiFetch(`${BASE}/players/squads?team=${team.id}`);
    requestsUsed++;
    const squadPlayers = squadData?.response?.[0]?.players || [];
    console.log(`  Squad size: ${squadPlayers.length}`);

    // Find unmatched (in squad but not in our JSON)
    const unmatched = squadPlayers.filter(p => !existingNames.has(p.name));
    console.log(`  Unmatched: ${unmatched.length}`);

    if (unmatched.length === 0) continue;

    // Step 2: fetch each unmatched player individually
    for (const sp of unmatched) {
      await sleep(7000);
      const data = await apiFetch(`${BASE}/players?id=${sp.id}&season=${SEASON}`);
      requestsUsed++;

      if (!data) { console.log(`  No data for ${sp.name}`); break; }

      const item = data.response?.[0];
      if (!item?.player?.birth?.date) {
        console.log(`  No birth date for ${sp.name}`);
        continue;
      }

      const p = item.player;
      newPlayers.push({
        name:        p.name,
        birth:       p.birth.date.slice(0, 10),
        league:      LEAGUE_NAME,
        leagueLogo:  LEAGUE_LOGO,
        nationality: p.nationality || "Unknown",
        club:        team.name,
        crest:       team.logo,
        position:    item.statistics?.[0]?.games?.position || sp.position || "",
      });
      existingNames.add(p.name);
      console.log(`  ✓ ${p.name} (${p.birth.date.slice(0,10)})`);

      // Check if we're running low on requests
      if (requestsUsed >= 95) {
        console.log("\n⚠️  Approaching daily limit, stopping.");
        break;
      }
    }

    if (requestsUsed >= 95) break;
  }

  console.log(`\nNew players added: ${newPlayers.length} (${requestsUsed} requests used)`);

  db.players = [...db.players, ...newPlayers].sort((a, b) => a.birth.localeCompare(b.birth));
  db.total = db.players.length;
  fs.writeFileSync(jsonPath, JSON.stringify(db));

  // Summary
  const sl = db.players.filter(p => p.league === LEAGUE_NAME);
  const byClub = {};
  sl.forEach(p => { byClub[p.club] = (byClub[p.club]||0)+1; });
  console.log(`\nSüper Lig total: ${sl.length}`);
  Object.entries(byClub).sort((a,b)=>b[1]-a[1]).forEach(([c,n]) => console.log(`  ${n}  ${c}`));
  console.log(`Grand total: ${db.total}`);
}

main().catch(console.error);
