// Runs after `vite build`: writes crawlable static pages into dist/ —
//   /player/<slug>  "How old is X?" for every player
//   /club/<slug>    squad ages per club
//   /league/<slug>  clubs and ages per league
//   /tr             Turkish copy of the app shell (hreflang target)
//   sitemap.xml     every URL above
// Pages are plain HTML (no React) so they load instantly and index cleanly.
// Vercel's cleanUrls serves dist/player/x.html at /player/x.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { slugify, assignSlugs, nameLang, clubLang } from "../src/players.js";
import { BALL_PATCHES, BALL_SEAMS } from "../src/ball.js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const SITE = "https://www.howmanyfootballplayersolderthanme.com";
const BRAND = "Older Than Me?";
const SEASON = "2026–27";
const GA_ID = "G-XTRK6XNP5C";

const { players } = JSON.parse(fs.readFileSync(path.join(ROOT, "public/players.json"), "utf8"));
const TOTAL = players.length;
const TODAY = new Date();
const TODAY_ISO = TODAY.toISOString().slice(0, 10);

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const fmt = n => n.toLocaleString("en-US");
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const longDate = iso => { const [y, m, d] = iso.split("-"); return `${parseInt(d)} ${MONTHS[m - 1]} ${y}`; };
const shortDate = iso => { const [y, m, d] = iso.split("-"); return `${parseInt(d)} ${MONTHS[m - 1].slice(0, 3)} ${y}`; };
function ageOn(birth, on = TODAY) {
  const b = new Date(birth);
  let a = on.getFullYear() - b.getFullYear();
  if (on.getMonth() < b.getMonth() || (on.getMonth() === b.getMonth() && on.getDate() < b.getDate())) a--;
  return a;
}
const avg = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
const oneDecimal = x => x.toFixed(1);

// ── Slugs ──────────────────────────────────────────────────────────────
assignSlugs(players);
players.forEach(p => {
  p.clubSlug = slugify(p.club);
  p.leagueSlug = slugify(p.league);
  p.age = ageOn(p.birth);
});

// Oldest first; ties keep data order. Index = how many are strictly older (handles shared birthdays).
const byBirth = [...players].sort((a, b) => a.birth.localeCompare(b.birth));
const olderCount = new Map();
let firstOfDate = 0;
byBirth.forEach((p, i) => {
  if (i === 0 || byBirth[i - 1].birth !== p.birth) firstOfDate = i;
  olderCount.set(p, firstOfDate);
});
const sameDateCount = birth => byBirth.filter(p => p.birth === birth).length;

// The six players born closest to `p` (either side), excluding p.
function nearest(p, n = 6) {
  const i = byBirth.indexOf(p);
  const out = [];
  let lo = i - 1, hi = i + 1;
  const t = new Date(p.birth);
  while (out.length < n && (lo >= 0 || hi < byBirth.length)) {
    const dl = lo >= 0 ? Math.abs(t - new Date(byBirth[lo].birth)) : Infinity;
    const dh = hi < byBirth.length ? Math.abs(new Date(byBirth[hi].birth) - t) : Infinity;
    out.push(dl <= dh ? byBirth[lo--] : byBirth[hi++]);
  }
  return out;
}

const clubs = new Map();
const leagues = new Map();
players.forEach(p => {
  if (!clubs.has(p.clubSlug)) clubs.set(p.clubSlug, { name: p.club, slug: p.clubSlug, league: p.league, leagueSlug: p.leagueSlug, crest: p.crest, players: [] });
  clubs.get(p.clubSlug).players.push(p);
  if (!leagues.has(p.leagueSlug)) leagues.set(p.leagueSlug, { name: p.league, slug: p.leagueSlug, logo: p.leagueLogo, clubs: new Set(), players: [] });
  const l = leagues.get(p.leagueSlug);
  l.clubs.add(p.clubSlug);
  l.players.push(p);
});

// ── Shared chrome ──────────────────────────────────────────────────────
const BALL = `<svg width="34" height="34" viewBox="0 0 100 100" aria-hidden="true"><clipPath id="b"><circle cx="50" cy="50" r="46"/></clipPath><circle cx="50" cy="50" r="46" fill="#F2F5EE"/><g clip-path="url(#b)" stroke="#0B2219" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"><path fill="#0B2219" d="${BALL_PATCHES}"/><path fill="none" d="${BALL_SEAMS}"/></g></svg>`;

// Ages are baked in at build time; this refreshes any [data-birth] after a birthday.
const AGE_SCRIPT = `<script>for(const e of document.querySelectorAll("[data-birth]")){const b=new Date(e.dataset.birth),t=new Date();let a=t.getFullYear()-b.getFullYear();if(t.getMonth()<b.getMonth()||(t.getMonth()===b.getMonth()&&t.getDate()<b.getDate()))a--;e.textContent=a}</script>`;

function page({ urlPath, title, description, body, jsonLd }) {
  const url = SITE + urlPath;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${url}" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<meta name="theme-color" content="#0B2219" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="${BRAND}" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${SITE}/og-image.png" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/pages.css" />
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');</script>
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>` : ""}
</head>
<body>
<header class="topbar"><div class="wrap topbar-inner"><a class="brand" href="/">${BALL}<span>${BRAND}</span></a><a class="btn" href="/">Compare your age</a></div></header>
<main class="wrap">
${body}
</main>
<footer class="site-footer"><div class="wrap site-footer-inner"><span>Squad data ${SEASON} · For entertainment only</span><nav aria-label="Leagues">${[...leagues.values()].sort((a, b) => a.name.localeCompare(b.name)).map(l => `<a href="/league/${l.slug}">${esc(l.name)}</a>`).join("")}</nav></div></footer>
${AGE_SCRIPT}
</body>
</html>
`;
}

const crumbs = items => `<nav class="crumbs" aria-label="Breadcrumb">${items.map(([label, href]) => href ? `<a href="${href}">${esc(label)}</a>` : `<span aria-current="page">${esc(label)}</span>`).join('<span aria-hidden="true">›</span>')}</nav>`;
const crest = (src, cls = "crest") => src ? `<img class="${cls}" src="${esc(src)}" alt="" width="20" height="20" loading="lazy" />` : "";
const cta = `<a class="cta" href="/">How many pros are older than you? <span aria-hidden="true">→</span></a>`;
const age = p => `<span data-birth="${p.birth}">${p.age}</span>`;
// Pages are lang="en"; Turkish names and clubs get lang="tr" so uppercase headings read KAHVECİ, not KAHVECI.
const pName = p => nameLang(p) === "tr" ? `<span lang="tr">${esc(p.name)}</span>` : esc(p.name);
const cName = (club, league) => clubLang(league) === "tr" ? `<span lang="tr">${esc(club)}</span>` : esc(club);

// ── Player pages ───────────────────────────────────────────────────────
function playerPage(p) {
  const older = olderCount.get(p);
  const same = sameDateCount(p.birth) - 1;
  const younger = TOTAL - older - same - 1;
  const club = clubs.get(p.clubSlug);
  const near = nearest(p);
  const title = `How old is ${p.name}? Age, birthday & club | ${BRAND}`;
  const description = `${p.name} is ${p.age} years old, born ${longDate(p.birth)}. ${p.position} for ${p.club} (${p.league}). ${fmt(older)} of ${fmt(TOTAL)} active pros are older.`;
  const body = `
${crumbs([["Home", "/"], [p.league, `/league/${p.leagueSlug}`], [p.club, `/club/${p.clubSlug}`], [p.name]])}
<p class="kicker">${esc(p.position)} · ${cName(p.club, p.league)}</p>
<h1>How old is ${pName(p)}?</h1>
<p class="answer"><strong>${esc(p.name)} is ${age(p)} years old</strong>, born on ${longDate(p.birth)}.</p>
<dl class="facts">
  <div><dt>Age</dt><dd>${age(p)}</dd></div>
  <div><dt>Birthday</dt><dd>${longDate(p.birth)}</dd></div>
  <div><dt>Club</dt><dd><a href="/club/${p.clubSlug}">${crest(p.crest)}${esc(p.club)}</a></dd></div>
  <div><dt>League</dt><dd><a href="/league/${p.leagueSlug}">${esc(p.league)}</a></dd></div>
  <div><dt>Nationality</dt><dd>${esc(p.nationality)}</dd></div>
  <div><dt>Position</dt><dd>${esc(p.position)}</dd></div>
</dl>
<section class="scoreboard" aria-label="Where ${esc(p.name)} ranks by age">
  <div class="score"><div class="score-side"><span class="score-num accent">${fmt(older)}</span><span class="score-label">Older than ${pName(p)}</span></div><span class="score-colon" aria-hidden="true">:</span><div class="score-side"><span class="score-num">${fmt(younger)}</span><span class="score-label">Younger</span></div></div>
  <p class="score-caption">Out of ${fmt(TOTAL)} active players in the 10 top leagues, ${SEASON} season.${same ? ` ${same} other player${same === 1 ? " shares" : "s share"} the exact birth date.` : ""}</p>
</section>
${cta}
<section class="panel">
  <h2>Born around the same time</h2>
  <ul class="rows">${near.map(n => `<li><a href="/player/${n.slug}">${esc(n.name)}</a><span>${crest(n.crest)}${esc(n.club)}</span><span class="muted">${shortDate(n.birth)}</span></li>`).join("")}</ul>
</section>
<section class="panel">
  <h2>${cName(p.club, p.league)} squad</h2>
  <p>${club.players.length} players, average age ${oneDecimal(avg(club.players.map(x => x.age)))}. <a href="/club/${p.clubSlug}">See every ${esc(p.club)} player by age →</a></p>
</section>
${p.tmUrl ? `<p class="muted small">More on <a href="${esc(p.tmUrl)}" rel="noopener" target="_blank">Transfermarkt</a>.</p>` : ""}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.name,
    birthDate: p.birth,
    nationality: p.nationality,
    jobTitle: `Professional footballer (${p.position})`,
    memberOf: { "@type": "SportsTeam", name: p.club, sport: "Football" },
    ...(p.tmUrl ? { sameAs: [p.tmUrl] } : {}),
  };
  return page({ urlPath: `/player/${p.slug}`, title, description, body, jsonLd });
}

// ── Club pages ─────────────────────────────────────────────────────────
function clubPage(c) {
  const squad = [...c.players].sort((a, b) => a.birth.localeCompare(b.birth));
  const oldest = squad[0], youngest = squad[squad.length - 1];
  const mean = oneDecimal(avg(squad.map(p => p.age)));
  const title = `${c.name} squad ages ${SEASON}: oldest & youngest players | ${BRAND}`;
  const description = `All ${squad.length} ${c.name} players by age. Average age ${mean}; oldest ${oldest.name} (${oldest.age}), youngest ${youngest.name} (${youngest.age}).`;
  const body = `
${crumbs([["Home", "/"], [c.league, `/league/${c.leagueSlug}`], [c.name]])}
<p class="kicker">${esc(c.league)} · ${SEASON}</p>
<h1>${crest(c.crest, "crest crest-lg")}${cName(c.name, c.league)} squad ages</h1>
<dl class="facts">
  <div><dt>Players</dt><dd>${squad.length}</dd></div>
  <div><dt>Average age</dt><dd>${mean}</dd></div>
  <div><dt>Oldest</dt><dd><a href="/player/${oldest.slug}">${esc(oldest.name)}</a> (${age(oldest)})</dd></div>
  <div><dt>Youngest</dt><dd><a href="/player/${youngest.slug}">${esc(youngest.name)}</a> (${age(youngest)})</dd></div>
</dl>
${cta}
<section class="panel">
  <h2>Every player, oldest first</h2>
  <div class="table" role="table" aria-label="${esc(c.name)} players by age">
    <div class="tr th" role="row"><span role="columnheader">Player</span><span role="columnheader">Position</span><span role="columnheader" class="num">Age</span><span role="columnheader" class="num">Born</span></div>
    ${squad.map(p => `<div class="tr" role="row"><span role="cell"><a href="/player/${p.slug}">${esc(p.name)}</a></span><span role="cell" class="muted">${esc(p.position)}</span><span role="cell" class="num strong">${age(p)}</span><span role="cell" class="num muted">${shortDate(p.birth)}</span></div>`).join("\n    ")}
  </div>
</section>`;
  const jsonLd = { "@context": "https://schema.org", "@type": "SportsTeam", name: c.name, sport: "Football", memberOf: { "@type": "SportsOrganization", name: c.league } };
  return page({ urlPath: `/club/${c.slug}`, title, description, body, jsonLd });
}

// ── League pages ───────────────────────────────────────────────────────
function leaguePage(l) {
  const ps = [...l.players].sort((a, b) => a.birth.localeCompare(b.birth));
  const clubRows = [...l.clubs].map(s => clubs.get(s)).map(c => ({ ...c, mean: avg(c.players.map(p => p.age)) })).sort((a, b) => b.mean - a.mean);
  const mean = oneDecimal(avg(ps.map(p => p.age)));
  const title = `${l.name} player ages ${SEASON}: oldest, youngest & every club | ${BRAND}`;
  const description = `${fmt(ps.length)} ${l.name} players across ${clubRows.length} clubs. Average age ${mean}. Oldest: ${ps[0].name} (${ps[0].age}). Youngest: ${ps[ps.length - 1].name} (${ps[ps.length - 1].age}).`;
  const list = xs => `<ul class="rows">${xs.map(p => `<li><a href="/player/${p.slug}">${esc(p.name)}</a><span>${crest(p.crest)}${esc(p.club)}</span><span class="num strong">${age(p)}</span></li>`).join("")}</ul>`;
  const body = `
${crumbs([["Home", "/"], [l.name]])}
<p class="kicker">${SEASON} season</p>
<h1>${l.logo ? `<img class="crest crest-lg" src="${esc(l.logo)}" alt="" width="40" height="40" />` : ""}${esc(l.name)} player ages</h1>
<dl class="facts">
  <div><dt>Players</dt><dd>${fmt(ps.length)}</dd></div>
  <div><dt>Clubs</dt><dd>${clubRows.length}</dd></div>
  <div><dt>Average age</dt><dd>${mean}</dd></div>
</dl>
${cta}
<div class="grid-2">
  <section class="panel"><h2>Oldest players</h2>${list(ps.slice(0, 10))}</section>
  <section class="panel"><h2>Youngest players</h2>${list(ps.slice(-10).reverse())}</section>
</div>
<section class="panel">
  <h2>Clubs by average age</h2>
  <div class="table" role="table" aria-label="${esc(l.name)} clubs by average age">
    <div class="tr th tr-club" role="row"><span role="columnheader">Club</span><span role="columnheader" class="num">Players</span><span role="columnheader" class="num">Avg age</span></div>
    ${clubRows.map(c => `<div class="tr tr-club" role="row"><span role="cell"><a href="/club/${c.slug}">${crest(c.crest)}${esc(c.name)}</a></span><span role="cell" class="num muted">${c.players.length}</span><span role="cell" class="num strong">${oneDecimal(c.mean)}</span></div>`).join("\n    ")}
  </div>
</section>`;
  return page({ urlPath: `/league/${l.slug}`, title, description, body });
}

// ── Turkish app shell ──────────────────────────────────────────────────
function turkishShell() {
  let html = fs.readFileSync(path.join(DIST, "index.html"), "utf8");
  const set = (re, value) => { const next = html.replace(re, value); if (next === html) throw new Error(`tr shell: no match for ${re}`); html = next; };
  const trTitle = "Kaç Futbolcu Benden Yaşlı?";
  const trDesc = `Doğum tarihini gir, 10 büyük ligdeki ${fmt(TOTAL).replace(/,/g, ".")} aktif profesyonel futbolcudan kaçının senden yaşlı olduğunu gör.`;
  set(/<html lang="en">/, '<html lang="tr">');
  set(/<title>[^<]*<\/title>/, `<title>${trTitle}</title>`);
  set(/(<meta name="description" content=")[^"]*/, `$1${trDesc}`);
  set(/(<link rel="canonical" href=")[^"]*/, `$1${SITE}/tr`);
  set(/(<meta property="og:url"\s+content=")[^"]*/, `$1${SITE}/tr`);
  set(/(<meta property="og:title"\s+content=")[^"]*/, `$1${trTitle}`);
  set(/(<meta property="og:description"\s+content=")[^"]*/, `$1${trDesc}`);
  set(/(<meta name="twitter:title"\s+content=")[^"]*/, `$1${trTitle}`);
  set(/(<meta name="twitter:description"\s+content=")[^"]*/, `$1${trDesc}`);
  return html;
}

// ── Write everything ───────────────────────────────────────────────────
function write(rel, content) {
  const file = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

fs.copyFileSync(path.join(ROOT, "scripts/pages.css"), path.join(DIST, "pages.css"));
players.forEach(p => write(`player/${p.slug}.html`, playerPage(p)));
clubs.forEach(c => write(`club/${c.slug}.html`, clubPage(c)));
leagues.forEach(l => write(`league/${l.slug}.html`, leaguePage(l)));
write("tr.html", turkishShell());

const urls = [
  ["/", "1.0"], ["/tr", "0.9"],
  ...[...leagues.keys()].map(s => [`/league/${s}`, "0.8"]),
  ...[...clubs.keys()].map(s => [`/club/${s}`, "0.7"]),
  ...players.map(p => [`/player/${p.slug}`, "0.6"]),
];
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, pr]) => `  <url><loc>${SITE}${u}</loc><lastmod>${TODAY_ISO}</lastmod><priority>${pr}</priority></url>`).join("\n")}
</urlset>
`);

console.log(`static pages: ${players.length} players, ${clubs.size} clubs, ${leagues.size} leagues, /tr, sitemap (${urls.length} URLs)`);
