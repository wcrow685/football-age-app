// Fetch current squads from ESPN API - free, no key, no rate limit
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ESPN = "https://site.api.espn.com/apis/site/v2/sports/soccer";

const sleep = ms => new Promise(r => setTimeout(r, ms));

const LEAGUES = [
  {
    slug:        "ned.1",
    name:        "Eredivisie",
    logo:        "https://media.api-sports.io/football/leagues/88.png",
  },
  {
    slug:        "por.1",
    name:        "Liga Portugal",
    logo:        "https://media.api-sports.io/football/leagues/94.png",
  },
];

async function fetchTeams(slug) {
  const res = await fetch(`${ESPN}/${slug}/teams`);
  const d = await res.json();
  return (d.sports?.[0]?.leagues?.[0]?.teams || []).map(t => ({
    id:   t.team.id,
    name: t.team.displayName,
    logo: t.team.logos?.[0]?.href || "",
  }));
}

async function fetchRoster(slug, teamId) {
  try {
    const res = await fetch(`${ESPN}/${slug}/teams/${teamId}/roster`);
    if (!res.ok) return [];
    const d = await res.json();
    return d.athletes || [];
  } catch { return []; }
}

async function main() {
  const jsonPath = path.join(__dirname, "../public/players.json");
  const db = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  for (const league of LEAGUES) {
    console.log(`\n=== ${league.name} (${league.slug}) ===`);

    const teams = await fetchTeams(league.slug);
    console.log(`${teams.length} teams`);

    const players = [];
    const seen = new Set();

    for (let t = 0; t < teams.length; t++) {
      const team = teams[t];
      await sleep(300); // be polite
      const roster = await fetchRoster(league.slug, team.id);
      const valid = roster.filter(p => p.dateOfBirth && !seen.has(p.id));
      valid.forEach(p => {
        seen.add(p.id);
        players.push({
          name:        p.fullName || p.displayName,
          birth:       p.dateOfBirth.slice(0, 10),
          league:      league.name,
          leagueLogo:  league.logo,
          nationality: p.citizenship || p.nationality || "Unknown",
          club:        team.name,
          crest:       team.logo,
          position:    p.position?.name || "",
        });
      });
      console.log(`  [${t+1}/${teams.length}] ${team.name}: ${valid.length} players`);
    }

    console.log(`${league.name} total: ${players.length}`);

    // Replace this league's data
    db.players = db.players.filter(p => p.league !== league.name);
    db.players = [...db.players, ...players];
  }

  db.players.sort((a, b) => a.birth.localeCompare(b.birth));
  db.total = db.players.length;
  fs.writeFileSync(jsonPath, JSON.stringify(db));

  console.log(`\nGrand total: ${db.total}`);

  // Summary per league
  for (const l of LEAGUES) {
    const lp = db.players.filter(p => p.league === l.name);
    console.log(`${l.name}: ${lp.length}`);
  }
}

main().catch(console.error);
