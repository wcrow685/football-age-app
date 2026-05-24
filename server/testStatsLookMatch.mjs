// Test StatsLook matching for a sample of players
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sleep = ms => new Promise(r => setTimeout(r, ms));

function stripAccents(str) {
  return str.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

async function searchStatsLook(name) {
  const tryNames = [name, stripAccents(name)];
  for (const n of [...new Set(tryNames)]) {
    try {
      const url = `https://statslook.com/api/search?q=${encodeURIComponent(n)}&limit=10`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const d = await res.json();
      const players = (d.results || []).filter(r => r.type === "player");
      if (players.length) return players;
    } catch {}
    await sleep(200);
  }
  return [];
}

function buildSlug(name) {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function matchByName(players, targetName) {
  const norm = s => stripAccents(s).toLowerCase().trim();
  const target = norm(targetName);
  // Exact match first
  const exact = players.find(p => norm(p.name) === target);
  if (exact) return exact;
  // High-score match (score >= 0.85)
  const highScore = players.filter(p => p.score >= 0.85);
  if (highScore.length === 1) return highScore[0];
  return null;
}

async function main() {
  const db = JSON.parse(fs.readFileSync(path.join(__dirname, "../public/players.json"), "utf8"));

  // Take 10 players spread across different leagues
  const sample = [];
  const leagues = [...new Set(db.players.map(p => p.league))];
  for (const league of leagues) {
    const leaguePlayers = db.players.filter(p => p.league === league);
    sample.push(leaguePlayers[0]);
    if (sample.length >= 10) break;
  }

  console.log(`Testing ${sample.length} players...\n`);

  let matched = 0;
  for (const player of sample) {
    await sleep(400);
    const results = await searchStatsLook(player.name);
    const match = matchByName(results, player.name);

    if (match) {
      matched++;
      const slug = buildSlug(match.name);
      const url = `https://statslook.com/tr/players/${slug}/${match.id}/overview`;
      console.log(`✅ ${player.name} → ${url}`);
    } else {
      console.log(`❌ ${player.name} — no match (got ${results.length}: ${results.slice(0,3).map(r => `${r.name}(${r.score?.toFixed(2)})`).join(", ")})`);
    }
  }

  console.log(`\nResult: ${matched}/${sample.length} matched`);
}

main().catch(console.error);
