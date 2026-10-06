// Re-fetch a league team-by-team using season endpoint (replaces old data)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.loadEnvFile(path.join(__dirname, ".env"));
const KEY  = process.env.APISPORTS_KEY;
const BASE = "https://v3.football.api-sports.io";

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function apiFetch(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: { "x-apisports-key": KEY } });
    if (res.status === 429) { console.log("  429 — waiting 65s"); await sleep(65000); continue; }
    if (!res.ok) return null;
    const d = await res.json();
    if (d.errors && Object.keys(d.errors).length > 0) {
      const msg = JSON.stringify(d.errors);
      if (msg.includes("rate") || msg.includes("Rate")) { console.log("  rate — waiting 65s"); await sleep(65000); continue; }
      if (msg.includes("limit")) { console.log("  ⚠️ Daily limit hit!"); return "LIMIT"; }
      return null;
    }
    return d;
  }
  return null;
}

async function fetchLeague({ leagueId, leagueName, leagueLogo, season }) {
  const jsonPath = path.join(__dirname, "../public/players.json");
  const db = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  console.log(`\n=== ${leagueName} ===`);

  // Step 1: get all teams
  const teamsData = await apiFetch(`${BASE}/teams?league=${leagueId}&season=${season}`);
  if (!teamsData || teamsData === "LIMIT") return false;
  const teams = teamsData.response || [];
  console.log(`${teams.length} teams found`);
  await sleep(7000);

  const seen = new Set();
  const players = [];

  for (let t = 0; t < teams.length; t++) {
    const team = teams[t].team;
    console.log(`[${t+1}/${teams.length}] ${team.name}`);

    let page = 1, totalPages = 1;

    while (page <= totalPages && page <= 3) {
      if (page > 1 || t > 0) await sleep(7000);

      const data = await apiFetch(`${BASE}/players?team=${team.id}&season=${season}&page=${page}`);
      if (data === "LIMIT") {
        console.log("Daily limit reached, saving progress...");
        // Save what we have so far (partial)
        savePartial(db, leagueName, players);
        fs.writeFileSync(jsonPath, JSON.stringify(db));
        return false;
      }
      if (!data) break;

      totalPages = data.paging?.total ?? 1;
      const items = data.response || [];
      console.log(`  page ${page}/${Math.min(totalPages,3)}: ${items.length}`);

      items.forEach(item => {
        const p = item.player;
        if (!p?.birth?.date || seen.has(p.id)) return;
        seen.add(p.id);
        players.push({
          name:        p.name,
          birth:       p.birth.date.slice(0, 10),
          league:      leagueName,
          leagueLogo,
          nationality: p.nationality || "Unknown",
          club:        team.name,
          crest:       team.logo || "",
          position:    item.statistics?.[0]?.games?.position || "",
        });
      });

      page++;
    }
  }

  console.log(`\n${leagueName}: ${players.length} players`);

  // Replace league data
  db.players = db.players.filter(p => p.league !== leagueName);
  db.players = [...db.players, ...players].sort((a,b) => a.birth.localeCompare(b.birth));
  db.total = db.players.length;
  fs.writeFileSync(jsonPath, JSON.stringify(db));

  const byClub = {};
  players.forEach(p => { byClub[p.club] = (byClub[p.club]||0)+1; });
  Object.entries(byClub).sort((a,b)=>b[1]-a[1]).forEach(([c,n]) => console.log(`  ${n}  ${c}`));
  console.log(`Grand total: ${db.total}`);
  return true;
}

function savePartial(db, leagueName, players) {
  // Keep existing + add what we fetched so far
  const others = db.players.filter(p => p.league !== leagueName);
  db.players = [...others, ...players].sort((a,b) => a.birth.localeCompare(b.birth));
  db.total = db.players.length;
}

// Run: node fetchLeagueByTeam.mjs saudi | mls
const target = process.argv[2];

const CONFIGS = {
  saudi: { leagueId: 307, leagueName: "Saudi Pro League", leagueLogo: "https://media.api-sports.io/football/leagues/307.png", season: 2024 },
  mls:   { leagueId: 253, leagueName: "MLS",              leagueLogo: "https://media.api-sports.io/football/leagues/253.png", season: 2024 },
};

if (!CONFIGS[target]) {
  console.log("Usage: node fetchLeagueByTeam.mjs saudi|mls");
  process.exit(1);
}

fetchLeague(CONFIGS[target]).catch(console.error);
