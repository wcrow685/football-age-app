// Scrape Transfermarkt to get player profile IDs for all teams
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sleep = ms => new Promise(r => setTimeout(r, ms));

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept": "text/html,application/xhtml+xml",
};

// TM league URLs → scrape team IDs from each
const TM_LEAGUES = [
  { name: "Premier League",   url: "https://www.transfermarkt.com/premier-league/startseite/wettbewerb/GB1" },
  { name: "La Liga",          url: "https://www.transfermarkt.com/laliga/startseite/wettbewerb/ES1" },
  { name: "Bundesliga",       url: "https://www.transfermarkt.com/bundesliga/startseite/wettbewerb/L1" },
  { name: "Serie A",          url: "https://www.transfermarkt.com/serie-a/startseite/wettbewerb/IT1" },
  { name: "Ligue 1",          url: "https://www.transfermarkt.com/ligue-1/startseite/wettbewerb/FR1" },
  { name: "Süper Lig",        url: "https://www.transfermarkt.com/super-lig/startseite/wettbewerb/TR1" },
  { name: "Saudi Pro League", url: "https://www.transfermarkt.com/saudi-professional-league/startseite/wettbewerb/SA1" },
  { name: "MLS",              url: "https://www.transfermarkt.com/major-league-soccer/startseite/wettbewerb/MLS1" },
];

async function tmFetch(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (res.ok) return await res.text();
      await sleep(3000);
    } catch { await sleep(3000); }
  }
  return null;
}

// Extract team IDs from league page
// Links look like: /besiktas-jk/startseite/verein/114/saison_id/2024
function extractTeamIds(html) {
  const matches = [...html.matchAll(/href="\/([^"]+)\/startseite\/verein\/(\d+)/g)];
  const teams = new Map();
  matches.forEach(m => {
    if (!teams.has(m[2])) teams.set(m[2], m[1]);
  });
  return [...teams.entries()].map(([id, slug]) => ({ id, slug }));
}

// Extract player IDs from squad page
function extractPlayerIds(html) {
  const matches = [...html.matchAll(/href="\/([^"]+)\/profil\/spieler\/(\d+)"/g)];
  const players = new Map();
  matches.forEach(m => {
    if (!players.has(m[2])) players.set(m[2], m[1]);
  });
  return [...players.entries()].map(([id, slug]) => ({ id, slug }));
}

// Normalize name for matching: convert special chars to ASCII equivalents
function normalize(name) {
  return name.toLowerCase()
    // Nordic / special letters → ASCII equivalent (same as TM slugs)
    .replace(/ø/g, "o").replace(/ö/g, "o").replace(/ó/g, "o")
    .replace(/æ/g, "ae").replace(/œ/g, "oe")
    .replace(/å/g, "a").replace(/ä/g, "a")
    .replace(/ß/g, "ss")
    .replace(/đ/g, "d").replace(/ð/g, "d")
    .replace(/þ/g, "th")
    .replace(/ł/g, "l")
    .replace(/ı/g, "i")
    // Then strip remaining diacritics via NFD
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z\s]/g, "")
    .trim();
}

async function main() {
  const jsonPath = path.join(__dirname, "../public/players.json");
  const db = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  // Build name→player map from our DB
  const playersByNorm = new Map();
  db.players.forEach((p, idx) => {
    playersByNorm.set(normalize(p.name), idx);
  });

  let matched = 0, total = 0;

  for (const league of TM_LEAGUES) {
    console.log(`\n=== ${league.name} ===`);
    const leagueHtml = await tmFetch(league.url);
    if (!leagueHtml) { console.log("  Failed to fetch league page"); continue; }

    const teams = extractTeamIds(leagueHtml);
    console.log(`  ${teams.length} teams found`);
    await sleep(2000);

    for (let t = 0; t < teams.length; t++) {
      const team = teams[t];
      const squadUrl = `https://www.transfermarkt.com/${team.slug}/kader/verein/${team.id}`;
      const html = await tmFetch(squadUrl);
      if (!html) { process.stdout.write(`  [${t+1}/${teams.length}] failed\r`); continue; }

      const tmPlayers = extractPlayerIds(html);
      total += tmPlayers.length;

      // Match each TM player to our DB by normalized name
      tmPlayers.forEach(tp => {
        // TM slug: "ersin-destanoglu" → "ersin destanoglu"
        const normSlug = tp.slug.replace(/-/g, " ");
        const idx = playersByNorm.get(normSlug);
        if (idx !== undefined) {
          db.players[idx].tmUrl = `https://www.transfermarkt.com/${tp.slug}/profil/spieler/${tp.id}`;
          matched++;
        }
      });

      process.stdout.write(`  [${t+1}/${teams.length}] ${team.slug}: ${tmPlayers.length} players\r`);
      await sleep(2000);
    }
    console.log(`  Done`);
  }

  fs.writeFileSync(jsonPath, JSON.stringify(db));

  const withTm = db.players.filter(p => p.tmUrl).length;
  console.log(`\nMatched: ${withTm} / ${db.total} players with TM URLs`);
  console.log(`Saved to players.json`);
}

main().catch(console.error);
