// Uses /players/squads?team={id} — returns CURRENT registered squad, not season history
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.loadEnvFile(path.join(__dirname, ".env"));
const APISPORTS_KEY = process.env.APISPORTS_KEY;
const APISPORTS_URL = "https://v3.football.api-sports.io";

const sleep = ms => new Promise(r => setTimeout(r, ms));

const LEAGUES = [
  {
    name: "Süper Lig",
    logo: "https://media.api-sports.io/football/leagues/203.png",
    leagueId: 203,
    season: 2024,
  },
  // Add more leagues here if needed later
];

async function getTeams(leagueId, season) {
  const res = await fetch(`${APISPORTS_URL}/teams?league=${leagueId}&season=${season}`, {
    headers: { "x-apisports-key": APISPORTS_KEY },
  });
  const d = await res.json();
  return d.response || [];
}

async function getSquad(teamId) {
  const res = await fetch(`${APISPORTS_URL}/players/squads?team=${teamId}`, {
    headers: { "x-apisports-key": APISPORTS_KEY },
  });
  const d = await res.json();
  // response: [{ team: {...}, players: [...] }]
  return d.response?.[0]?.players || [];
}

async function main() {
  const playersJsonPath = path.join(__dirname, "../public/players.json");
  const existing = JSON.parse(fs.readFileSync(playersJsonPath, "utf8"));

  for (const league of LEAGUES) {
    console.log(`\n=== ${league.name} ===`);

    // Step 1: get teams (1 request)
    console.log("Fetching teams...");
    const teams = await getTeams(league.leagueId, league.season);
    console.log(`  ${teams.length} teams found`);
    await sleep(7000);

    const players = [];
    const seen = new Set();

    // Step 2: get squad for each team (1 request per team)
    for (let t = 0; t < teams.length; t++) {
      const team = teams[t].team;
      console.log(`[${t + 1}/${teams.length}] ${team.name}`);

      let squad = [];
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await fetch(`${APISPORTS_URL}/players/squads?team=${team.id}`, {
            headers: { "x-apisports-key": APISPORTS_KEY },
          });
          if (res.status === 429) {
            console.log(`  Rate limited, waiting 65s...`);
            await sleep(65000);
            continue;
          }
          const d = await res.json();
          if (d.errors && Object.keys(d.errors).length > 0) {
            console.log(`  Error: ${JSON.stringify(d.errors)}, waiting 65s...`);
            await sleep(65000);
            continue;
          }
          squad = d.response?.[0]?.players || [];
          break;
        } catch (e) {
          console.log(`  Exception: ${e.message}`);
          await sleep(10000);
        }
      }

      console.log(`  ${squad.length} players`);

      squad.forEach(p => {
        if (!p.age || seen.has(p.id)) return;
        seen.add(p.id);
        // Calculate approximate birth year from age (squad endpoint doesn't give exact birth date)
        // We need birth date — skip players without it
        if (!p.birth) return;
        players.push({
          name:        p.name,
          birth:       p.birth,
          league:      league.name,
          leagueLogo:  league.logo,
          nationality: p.nationality || "Unknown",
          club:        team.name,
          crest:       team.logo || "",
          position:    p.position || "",
        });
      });

      if (t < teams.length - 1) await sleep(7000);
    }

    console.log(`\n${league.name}: ${players.length} total players`);

    // Replace this league's players in the JSON
    const others = existing.players.filter(p => p.league !== league.name);
    existing.players = [...others, ...players];
  }

  existing.players.sort((a, b) => a.birth.localeCompare(b.birth));
  existing.total = existing.players.length;
  fs.writeFileSync(playersJsonPath, JSON.stringify(existing));
  console.log(`\nTotal players saved: ${existing.total}`);
}

main().catch(console.error);
