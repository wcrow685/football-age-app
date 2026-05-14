import { readFile, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = join(__dirname, "players-cache.json");

// Cache structure:
// {
//   "Premier League": { players: [...], cachedAt: "2024-09-01T..." },
//   "La Liga":        { players: [...], cachedAt: "2024-09-02T..." },
//   ...
// }

export async function loadCache() {
  try {
    const raw = await readFile(CACHE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function saveCache(data) {
  await writeFile(CACHE_FILE, JSON.stringify(data, null, 2), "utf-8");
}
