# How Many Football Players Are Older Than Me?

**[howmanyfootballplayersolderthanme.com](https://www.howmanyfootballplayersolderthanme.com)** — enter a birthday and see how many of the ~5,700 active players in ten top leagues are older than you, shown as a scoreline (`706 : 5,039`), with your closest age twin, league and country breakdowns, a shareable story card and per-result link previews. English and Turkish.

Leagues: Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Eredivisie, Liga Portugal, Süper Lig, Saudi Pro League, MLS (2026–27 squads).

## Stack

- **React 19 + Vite** single-page app, deployed on **Vercel** from `main`
- **Static squad data** in `public/players.json` (no backend at runtime)
- **Vercel Routing Middleware** (`middleware.js`) and a **Node function** (`api/og.js`, `@vercel/og`) for link previews
- Post-build **static pages** for SEO (`scripts/build-static-pages.mjs`)

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run lint
npm run build      # vite build + static pages into dist/
npm run preview    # serve dist/ on http://localhost:4173
```

The middleware and `/api/og` only run on Vercel; the static pages are served at clean URLs there (`cleanUrls` in `vercel.json`), so locally open them as `dist/player/<slug>.html`.

## How it fits together

| Path | What |
|---|---|
| `src/App.jsx` | Home (birth-date "ticket", star cards, FAQ), URL state (`?d=1995-03-14`, `?p=lionel-messi`), `/tr` |
| `src/components/Results.jsx` | Scoreboard, age twin, share panel, squad list, league table, charts (plain HTML bars) |
| `src/players.js` | Shared by app, middleware, OG image and page builder: slugs, famous players, `score()`, `closestTwin()` |
| `src/i18n.js` | UI copy, EN/TR; `me` vs `them(player)` wording |
| `src/shareCopy.js` | Wording for link previews |
| `src/casing.js` | Uppercases names with English rules inside Turkish text (`LIONEL MESSI`, not `LİONEL MESSİ`) |
| `src/storyCard.js` | Draws the 1080×1920 share card on a canvas |
| `middleware.js` | For preview bots on `/?d=…` / `/?p=…`: swaps og/twitter tags for that result's score |
| `api/og.js` | `GET /api/og?d=…` → 1200×630 scoreboard PNG (falls back to `/og-image.png`) |
| `scripts/build-static-pages.mjs` | Writes `/player/<slug>`, `/club/<slug>`, `/league/<slug>`, `/tr` and `sitemap.xml` |
| `server/` | Squad fetch / enrichment scripts (not deployed) |

Add `&l=tr` to a result link for a Turkish preview; the app opens in Turkish too.

## Updating squad data

The fetch scripts in `server/` pull squads from API-Sports and ESPN and enrich them with Transfermarkt links; they write `public/players.json` (`{ players: [...], total }`). They read the API key from `server/.env` (see `server/.env.example`) — never commit keys.

After a refresh:

1. Check for players listed at two clubs (stale transfers) and keep the current one.
2. Update the player count in `index.html` meta tags if it changed.
3. Regenerate the static share image: `npm i --no-save canvas && node server/generateOgImage.mjs`
4. `npm run build` to check, then commit and push — Vercel redeploys.
