// Shared by the app, the link-preview middleware and the /api/og image.

// "Kenan Yıldız" and "Kenan Yildiz" (as the data spells it) should match.
export const normalize = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i").toLowerCase();
export const slugify   = s => normalize(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

export function isValidBirth(d) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const [y, m, day] = d.split("-").map(Number);
  return y >= 1940 && m >= 1 && m <= 12 && day >= 1 && day <= daysInMonth(m, y) && new Date(d) <= new Date();
}

export const FAMOUS_PLAYERS = [
  { name: "Lionel Messi",      birth: "1987-06-24", trFrom: "Lionel Messi'den" },
  { name: "Cristiano Ronaldo", birth: "1985-02-05", trFrom: "Cristiano Ronaldo'dan" },
  { name: "Kylian Mbappé",     birth: "1998-12-20", trFrom: "Kylian Mbappé'den" },
  { name: "Erling Haaland",    birth: "2000-07-21", trFrom: "Erling Haaland'dan" },
  { name: "Vinicius Junior",   birth: "2000-07-12", trFrom: "Vinicius Junior'dan" },
  { name: "Jude Bellingham",   birth: "2003-06-29", trFrom: "Jude Bellingham'dan" },
  { name: "Mohamed Salah",     birth: "1992-06-15", trFrom: "Mohamed Salah'tan" },
  { name: "Lamine Yamal",      birth: "2007-07-13", trFrom: "Lamine Yamal'dan" },
  { name: "Harry Kane",        birth: "1993-07-28", trFrom: "Harry Kane'den" },
  { name: "Pedri",             birth: "2002-11-25", trFrom: "Pedri'den" },
  { name: "Rodri",             birth: "1996-06-22", trFrom: "Rodri'den" },
  { name: "Arda Güler",        birth: "2005-02-25", trFrom: "Arda Güler'den", turkish: true },
];

// Page slug for every player (/player/<slug>). Shared names (two Luis Suárez)
// all get the club appended so no one owns the bare slug. Mutates and returns.
export function assignSlugs(players) {
  const count = {};
  players.forEach(p => { const s = slugify(p.name); count[s] = (count[s] || 0) + 1; });
  players.forEach(p => { const s = slugify(p.name); p.slug = count[s] > 1 ? `${s}-${slugify(p.club)}` : s; });
  return players;
}

export const findFamous = slug => FAMOUS_PLAYERS.find(p => slugify(p.name) === slug);

// Is data row `p` the famous player being compared?
export const isSamePlayer = (p, famous) =>
  !!famous && p.birth === famous.birth && normalize(p.name) === normalize(famous.name);

const DAY_MS = 24 * 3600 * 1000;

// Closest birth date in either direction; `days` > 0 means the twin was born later.
export function closestTwin(players, birthDate, famous) {
  const userDate = new Date(birthDate);
  let twin = null;
  for (const p of players) {
    if (isSamePlayer(p, famous)) continue;
    const days = Math.round((new Date(p.birth) - userDate) / DAY_MS);
    if (!twin || Math.abs(days) < Math.abs(twin.days)) twin = { ...p, days };
  }
  return twin;
}

// The headline numbers: how many are older / younger, and the closest twin.
export function score(players, birthDate, famous) {
  const userDate = new Date(birthDate);
  let older = 0, younger = 0;
  for (const p of players) {
    const d = new Date(p.birth);
    if (d < userDate) older++;
    else if (d > userDate) younger++;
  }
  return { older, younger, total: players.length, twin: closestTwin(players, birthDate, famous) };
}
