import "dotenv/config";
import express from "express";
import cors from "cors";
import {
  API_LEAGUES, STATIC_LEAGUES,
  fetchLeague,
  APISPORTS_LEAGUES, fetchApiSportsLeague,
} from "./footballApi.js";
import { loadCache, saveCache } from "./cache.js";

const app  = express();
const PORT = process.env.PORT || 3001;
const API_KEY        = process.env.FOOTBALL_API_KEY;   // football-data.org
const APISPORTS_KEY  = process.env.APISPORTS_KEY;      // api-sports.io (Süper Lig, Saudi)

app.use(cors());
app.use(express.json());

// In-memory cache: { "Premier League": { players, cachedAt }, ... }
let cache = {};

// Merge all league caches into a flat player array
function allPlayers() {
  return Object.values(cache).flatMap(l => l.players);
}

// Load from disk on startup
async function init() {
  cache = await loadCache();

  // Inject static leagues for any league that has no cached data yet
  // (will be replaced by live data once APISPORTS_KEY is set and refresh is run)
  for (const [leagueName, players] of Object.entries(STATIC_LEAGUES)) {
    if (!cache[leagueName]) {
      cache[leagueName] = {
        players: players.map(p => ({ ...p, league: leagueName })),
        cachedAt: null,
        source: "static",
      };
    }
  }

  const total = allPlayers().length;
  console.log(`⚽  Cache loaded — ${total} players across ${Object.keys(cache).length} leagues`);

  // Fetch any football-data.org leagues with no cached data yet
  const missing = API_LEAGUES.filter(l => !cache[l.name]);
  if (missing.length > 0) {
    console.log(`Fetching ${missing.length} uncached league(s) from football-data.org...`);
    await refreshLeagues(missing);
  }

  // If api-sports.io key is now available, fetch leagues that are still on static data
  if (APISPORTS_KEY) {
    const staticStill = APISPORTS_LEAGUES.filter(l => cache[l.name]?.source === "static");
    if (staticStill.length > 0) {
      console.log(`APISPORTS_KEY detected — fetching ${staticStill.map(l => l.name).join(", ")} from api-sports.io...`);
      await refreshApiSportsLeagues(staticStill);
    }
  }
}

async function refreshApiSportsLeagues(leagues) {
  if (!APISPORTS_KEY) throw new Error("APISPORTS_KEY not set in server/.env");
  for (let i = 0; i < leagues.length; i++) {
    const { id, name, season } = leagues[i];
    console.log(`  Refreshing ${name} via api-sports.io...`);
    const players = await fetchApiSportsLeague(APISPORTS_KEY, id, name, season);
    cache[name] = { players, cachedAt: new Date().toISOString(), source: "apisports" };
    console.log(`  → ${players.length} players`);
    if (i < leagues.length - 1) await new Promise(r => setTimeout(r, 2000));
  }
  await saveCache(cache);
  console.log(`Cache saved — ${allPlayers().length} total players`);
}

async function refreshLeagues(leagues) {
  if (!API_KEY) throw new Error("FOOTBALL_API_KEY not set in server/.env");

  for (let i = 0; i < leagues.length; i++) {
    const { code, name } = leagues[i];
    console.log(`  Refreshing ${name}...`);
    const players = await fetchLeague(API_KEY, code, name);
    cache[name] = { players, cachedAt: new Date().toISOString() };
    console.log(`  → ${players.length} players`);
    // Rate limit: 10 req/min — wait between calls
    if (i < leagues.length - 1) await new Promise(r => setTimeout(r, 7000));
  }

  await saveCache(cache);
  console.log(`Cache saved — ${allPlayers().length} total players`);
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.get("/api/players", (req, res) => {
  const players = allPlayers();
  if (!players.length) return res.status(503).json({ error: "Cache not ready yet" });
  res.json({ players, total: players.length });
});

app.get("/api/status", (req, res) => {
  const leagues = Object.entries(cache).map(([name, data]) => ({
    name,
    total: data.players?.length ?? 0,
    cachedAt: data.cachedAt ?? null,
    source: data.source ?? "api",
  }));
  res.json({ total: allPlayers().length, leagues, apiKeySet: !!API_KEY });
});

// Refresh a specific league by code
// football-data.org leagues: PL, PD, BL1, SA, FL1
// api-sports.io leagues:     superlig, saudi
app.post("/api/refresh/:code", async (req, res) => {
  const code = req.params.code.toUpperCase();

  // Check api-sports leagues first
  const apisportsMap = { SUPERLIG: "Süper Lig", SAUDI: "Saudi Pro League" };
  if (apisportsMap[code]) {
    const leagueName = apisportsMap[code];
    const league = APISPORTS_LEAGUES.find(l => l.name === leagueName);
    try {
      await refreshApiSportsLeagues([league]);
      res.json({ success: true, league: leagueName, total: cache[leagueName].players.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    return;
  }

  // football-data.org leagues
  const league = API_LEAGUES.find(l => l.code === code);
  if (!league) {
    const allCodes = [...API_LEAGUES.map(l => l.code), "superlig", "saudi"].join(", ");
    return res.status(404).json({ error: `Unknown code. Available: ${allCodes}` });
  }
  try {
    await refreshLeagues([league]);
    res.json({ success: true, league: league.name, total: cache[league.name].players.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Refresh all API leagues at once (e.g. after all windows close)
app.post("/api/refresh", async (req, res) => {
  try {
    await refreshLeagues(API_LEAGUES);
    res.json({ success: true, total: allPlayers().length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await init();
});
