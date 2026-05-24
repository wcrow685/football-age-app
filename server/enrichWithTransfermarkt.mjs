// Enrich players.json with Transfermarkt profile URLs for players missing tmUrl
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

function norm(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
}

async function searchTM(name) {
  const queries = [name, name.normalize("NFD").replace(/[̀-ͯ]/g, "")];
  for (const q of [...new Set(queries)]) {
    try {
      const url = `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(q)}&Suchselektion=`;
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) continue;
      const html = await res.text();
      const results = parsePlayerResults(html);
      if (results.length > 0) return results;
    } catch {}
    await sleep(300);
  }
  return [];
}

function parsePlayerResults(html) {
  const rowRegex = /<td class="hauptlink"><a [^>]*href="\/([^"]+\/profil\/spieler\/(\d+))"[^>]*>([^<]+)<\/a>/g;
  const players = [];
  let m;
  while ((m = rowRegex.exec(html)) !== null) {
    players.push({ name: m[3].trim(), id: m[2], url: `https://www.transfermarkt.com/${m[1]}` });
  }
  return players;
}

async function fetchTMBirth(tmUrl) {
  try {
    await sleep(400);
    const res = await fetch(tmUrl, { headers: HEADERS });
    if (!res.ok) return null;
    const html = await res.text();
    // TM profile format: "22/09/1984" (DD/MM/YYYY)
    const m = html.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (!m) return null;
    const [day, mo, yr] = m[1].split('/');
    return `${yr}-${mo}-${day}`;
  } catch { return null; }
}

async function matchPlayer(results, targetName, targetBirth) {
  if (results.length === 0) return null;
  const target = norm(targetName);

  // Exact normalized name match → single result
  const exact = results.filter(r => norm(r.name) === target);
  if (exact.length === 1) return exact[0];

  // Single result total → unique name
  if (results.length === 1) return results[0];

  // Multiple exact matches → verify by DOB from profile page
  const candidates = exact.length > 1 ? exact : results.slice(0, 5);
  for (const candidate of candidates) {
    const birth = await fetchTMBirth(candidate.url);
    if (birth === targetBirth) return candidate;
  }

  return null;
}

async function main() {
  const jsonPath = path.join(__dirname, "../public/players.json");
  const db = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  const missing = db.players.filter(p => !p.tmUrl);
  console.log(`Players missing tmUrl: ${missing.length}`);

  let matched = 0;
  let notFound = 0;
  let errors = 0;

  for (let i = 0; i < missing.length; i++) {
    const player = missing[i];
    await sleep(600);

    try {
      const results = await searchTM(player.name);
      const match = await matchPlayer(results, player.name, player.birth);

      if (match) {
        // Update in the main db array
        const idx = db.players.findIndex(p => p.name === player.name && p.birth === player.birth && p.club === player.club);
        if (idx !== -1) {
          db.players[idx].tmUrl = match.url;
          matched++;
        }
      } else {
        notFound++;
      }
    } catch {
      errors++;
    }

    if ((i + 1) % 50 === 0) {
      const pct = Math.round((i + 1) / missing.length * 100);
      console.log(`[${i+1}/${missing.length}] ${pct}% — matched: ${matched}, not found: ${notFound}, errors: ${errors}`);
      // Save progress every 50 players
      fs.writeFileSync(jsonPath, JSON.stringify(db));
    }
  }

  // Final save
  fs.writeFileSync(jsonPath, JSON.stringify(db));
  console.log(`\nDone! matched: ${matched}, not found: ${notFound}, errors: ${errors}`);
  console.log(`Total with tmUrl: ${db.players.filter(p => p.tmUrl).length} / ${db.players.length}`);
}

main().catch(console.error);
