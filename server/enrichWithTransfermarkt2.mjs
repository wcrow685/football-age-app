// Improved TM enrichment - handles Asian names, van/de prefixes, DOB verification
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sleep = ms => new Promise(r => setTimeout(r, ms));

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
};

const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

async function searchTM(query) {
  try {
    const url = `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(query)}&Suchselektion=`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return [];
    const html = await res.text();
    const rowRegex = /<td class="hauptlink"><a [^>]*href="\/([^"]+\/profil\/spieler\/(\d+))"[^>]*>([^<]+)<\/a>/g;
    const players = [];
    let m;
    while ((m = rowRegex.exec(html)) !== null) {
      players.push({ name: m[3].trim(), url: `https://www.transfermarkt.com/${m[1]}` });
    }
    return players;
  } catch { return []; }
}

async function fetchTMBirth(tmUrl) {
  try {
    await sleep(350);
    const res = await fetch(tmUrl, { headers: HEADERS });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (!m) return null;
    const [day, mo, yr] = m[1].split('/');
    return `${yr}-${mo}-${day}`;
  } catch { return null; }
}

function buildQueries(name) {
  const parts = name.trim().split(/\s+/);
  const queries = [name]; // full name first

  // Last name only (most reliable for European names)
  if (parts.length >= 2) queries.push(parts[parts.length - 1]);

  // First name only (for TM nicknames like "Silas", "Danilo")
  if (parts.length >= 2) queries.push(parts[0]);

  // Reverse name order (Asian players: "Kim Min-Jae" → "Min-Jae Kim")
  if (parts.length === 2) queries.push(`${parts[1]} ${parts[0]}`);
  if (parts.length === 3) {
    queries.push(`${parts[1]} ${parts[2]} ${parts[0]}`); // last first → move to end
    queries.push(`${parts[2]} ${parts[0]} ${parts[1]}`);
  }

  // Strip accents version
  const stripped = name.normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (stripped !== name) queries.push(stripped);

  return [...new Set(queries)];
}

async function findTMUrl(player) {
  const queries = buildQueries(player.name);

  for (const query of queries) {
    await sleep(500);
    const results = await searchTM(query);
    if (results.length === 0) continue;

    // Exact name match
    const exact = results.filter(r => norm(r.name) === norm(player.name));
    if (exact.length === 1) return exact[0].url;

    // Single result → verify by DOB
    if (results.length === 1) {
      const birth = await fetchTMBirth(results[0].url);
      if (birth === player.birth) return results[0].url;
      continue; // wrong player, try next query
    }

    // Multiple results → check DOB for each candidate (up to 6)
    const candidates = exact.length > 0 ? exact : results.slice(0, 6);
    for (const c of candidates) {
      const birth = await fetchTMBirth(c.url);
      if (birth === player.birth) return c.url;
    }
  }

  return null;
}

async function main() {
  const jsonPath = path.join(__dirname, "../public/players.json");
  const db = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  const missing = db.players.filter(p => !p.tmUrl);
  console.log(`Players missing tmUrl: ${missing.length}`);

  let matched = 0, notFound = 0;

  for (let i = 0; i < missing.length; i++) {
    const player = missing[i];
    const tmUrl = await findTMUrl(player);

    if (tmUrl) {
      const idx = db.players.findIndex(p => p.name === player.name && p.birth === player.birth && p.club === player.club);
      if (idx !== -1) { db.players[idx].tmUrl = tmUrl; matched++; }
    } else {
      notFound++;
    }

    if ((i + 1) % 50 === 0) {
      const pct = Math.round((i + 1) / missing.length * 100);
      console.log(`[${i+1}/${missing.length}] ${pct}% — matched: ${matched}, not found: ${notFound}`);
      fs.writeFileSync(jsonPath, JSON.stringify(db));
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(db));
  console.log(`\nDone! matched: ${matched}, not found: ${notFound}`);
  console.log(`Total with tmUrl: ${db.players.filter(p => p.tmUrl).length} / ${db.players.length}`);
}

main().catch(console.error);
