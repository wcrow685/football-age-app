import { useState, useEffect, useEffectEvent, useId, lazy, Suspense } from "react";
import { translations } from "./i18n";
import { BALL_PATCHES, BALL_SEAMS } from "./ball";
import ClubSelect from "./components/ClubSelect";
import { track } from "./analytics";
import { normalize, slugify, daysInMonth, isValidBirth, FAMOUS_PLAYERS, findFamous, isSamePlayer, closestTwin, assignSlugs, clubsByLeague } from "./players";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const USE_STATIC = import.meta.env.VITE_USE_STATIC !== "false";
const SITE_URL   = "https://www.howmanyfootballplayersolderthanme.com";

// The results page is only needed after a comparison, so load it as its own chunk.
const loadResults = () => import("./components/Results");
const Results = lazy(loadResults);

// Fetched once and shared by the hint count and every comparison.
let playersPromise;
function loadPlayers() {
  if (!playersPromise) {
    const url = USE_STATIC ? "/players.json" : `${API_URL}/api/players`;
    playersPromise = fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`Server error: ${r.status}`);
        return r.json();
      })
      .then(d => { assignSlugs(d.players); return d; })
      .catch(err => { playersPromise = undefined; throw err; });
  }
  return playersPromise;
}


// First three letters give the standard short month in both languages (Jun / Haz).
function formatBirth(birth, months) {
  const [y, m, d] = birth.split("-");
  return `${parseInt(d)} ${months[parseInt(m) - 1].slice(0, 3)} ${y}`;
}

const famousKey = (name, birth) => `${normalize(name)}|${birth}`;

function BallIcon({ size = 34 }) {
  const clipId = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <clipPath id={clipId}><circle cx="50" cy="50" r="46" /></clipPath>
      <circle cx="50" cy="50" r="46" fill="var(--chalk)" />
      <g clipPath={`url(#${clipId})`} stroke="var(--ink)" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
        <path fill="var(--ink)" d={BALL_PATCHES} />
        <path fill="none" d={BALL_SEAMS} />
      </g>
      <circle cx="50" cy="50" r="46" fill="none" stroke="var(--ink)" strokeWidth="4" />
    </svg>
  );
}

const YEAR_MS = 365.25 * 24 * 3600 * 1000;

// `famous` is the famous player being compared, or undefined when it's the visitor.
function computeResult(players, total, birthDate, famous) {
  const userDate = new Date(birthDate);
  const today    = new Date();
  const isFamous = p => isSamePlayer(p, famous);

  const olderPlayers = players
    .filter(p => new Date(p.birth) < userDate)
    .sort((a, b) => new Date(b.birth) - new Date(a.birth));

  // Same day & month, any year (minus the famous player themselves)
  const sameBirthday = players
    .filter(p => {
      const d = new Date(p.birth);
      return d.getMonth() === userDate.getMonth() && d.getDate() === userDate.getDate() && !isFamous(p);
    })
    .sort((a, b) => new Date(a.birth) - new Date(b.birth));

  const byLeague = {};
  olderPlayers.forEach(p => { byLeague[p.league] = (byLeague[p.league] || 0) + 1; });

  const byNat = {};
  olderPlayers.forEach(p => { byNat[p.nationality] = (byNat[p.nationality] || 0) + 1; });
  const topNationalities = Object.entries(byNat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, count]) => ({ name, count }));

  const buckets = {};
  players.forEach(p => {
    const age = Math.floor((today - new Date(p.birth)) / YEAR_MS);
    buckets[age] = (buckets[age] || 0) + 1;
  });
  const ageDistribution = Object.entries(buckets)
    .map(([age, count]) => ({ age: Number(age), count }))
    .sort((a, b) => a.age - b.age);

  const younger = players.filter(p => new Date(p.birth) > userDate).length;

  const twin = closestTwin(players, birthDate, famous);

  return {
    older: olderPlayers.length,
    olderPlayers,
    sameBirthday,
    total,
    byLeague: Object.entries(byLeague)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count })),
    topNationalities,
    ageDistribution,
    userAge: Math.floor((today - userDate) / YEAR_MS),
    younger,
    twin,
    birthDate,
    famous,
    players,
  };
}


const LEAGUES = ["Premier League", "La Liga", "Bundesliga", "Serie A", "Ligue 1", "Eredivisie", "Liga Portugal", "Süper Lig", "Saudi Pro League", "MLS"];

// ?p=lionel-messi for a famous player, ?d=1995-03-14 for a birth date.
function readUrl() {
  const q = new URLSearchParams(window.location.search);
  const famous = findFamous(q.get("p"));
  if (famous) return { birthDate: famous.birth, famous };
  const d = q.get("d");
  return d && isValidBirth(d) ? { birthDate: d } : null;
}

const isTurkishPath = () => window.location.pathname === "/tr" || window.location.pathname.startsWith("/tr/");
const basePath = () => (isTurkishPath() ? "/tr" : "/");
// &c=fenerbahce adds the squad comparison ("your team")
const resultQuery = (birthDate, famous, team) =>
  (famous ? `?p=${slugify(famous.name)}` : `?d=${birthDate}`) + (team ? `&c=${team}` : "");
const urlTeam = () => new URLSearchParams(window.location.search).get("c") || "";

// The chosen team is a per-browser convenience; storage may be unavailable.
function savedTeam() {
  try { return localStorage.getItem("team") || ""; } catch { return ""; }
}
function saveTeam(slug) {
  try { slug ? localStorage.setItem("team", slug) : localStorage.removeItem("team"); } catch { /* private mode */ }
}

export default function App() {
  const currentYear = new Date().getFullYear();
  // A shared link (?d= / ?p=) starts out filled in and loading.
  const [initialTarget] = useState(readUrl);
  const [initialY, initialM, initialD] = initialTarget ? initialTarget.birthDate.split("-") : [];
  const [day, setDay]       = useState(initialD ? String(parseInt(initialD)) : "");
  const [month, setMonth]   = useState(initialM ? String(parseInt(initialM)) : "");
  const [year, setYear]     = useState(initialY || "");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(!!initialTarget);
  const [loadingSlow, setLoadingSlow] = useState(false);
  const [error, setError]   = useState(null);
  const [totalPlayers, setTotalPlayers] = useState(null);
  const [famousClubs, setFamousClubs] = useState({});
  const [oldest, setOldest] = useState(null);
  const [clubs, setClubs]   = useState([]);
  // A link's &c= wins over the team remembered in this browser.
  const [team, setTeam]     = useState(() => urlTeam() || savedTeam());
  // /tr is the Turkish page; a shared link from a Turkish visitor carries &l=tr
  // (a saved choice wins there, but not over the /tr address itself).
  const [lang, setLang]     = useState(() =>
    isTurkishPath() ? "tr"
      : localStorage.getItem("lang") || (new URLSearchParams(window.location.search).get("l") === "tr" ? "tr" : "en"));

  const t = translations[lang];

  // Without a year yet, allow 29 Feb (2000 is a leap year); clampDay trims it once the year is known.
  const maxDays = month ? daysInMonth(Number(month), Number(year) || 2000) : 31;
  const years = Array.from({ length: currentYear - 1939 }, (_, i) => currentYear - i);
  const days  = Array.from({ length: maxDays }, (_, i) => i + 1);

  // Keep the chosen day valid when month/year change, e.g. 31 → 28 for February.
  function clampDay(nextMonth, nextYear) {
    if (!day || !nextMonth) return;
    const max = daysInMonth(Number(nextMonth), Number(nextYear) || 2000);
    if (Number(day) > max) setDay(String(max));
  }

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = translations[lang].pageTitle;
  }, [lang]);

  function changeLang(next) {
    setLang(next);
    localStorage.setItem("lang", next);
    // Keep the address in step so /tr stays the Turkish page and / the English one.
    window.history.replaceState(null, "", (next === "tr" ? "/tr" : "/") + window.location.search);
  }

  // Load the squad data up front (for the count, the stars' current clubs and
  // the FAQ's oldest players) and warm up the results chunk.
  useEffect(() => {
    if (USE_STATIC) {
      loadPlayers()
        .then(({ players, total }) => {
          setTotalPlayers(total);
          const clubs = {};
          players.forEach(p => { clubs[famousKey(p.name, p.birth)] = p.club; });
          setFamousClubs(clubs);
          setOldest([...players].sort((a, b) => a.birth.localeCompare(b.birth)).slice(0, 3).map(p => `${p.name} (${p.club})`));
          setClubs(clubsByLeague(players));
        })
        .catch(() => {});
    } else {
      fetch(`${API_URL}/api/status`).then(r => r.json())
        .then(d => { if (d.total) setTotalPlayers(d.total); })
        .catch(() => {});
    }
    loadResults();
  }, []);

  function setDateFields(birthDate) {
    const [y, m, d] = birthDate ? birthDate.split("-") : ["", "", ""];
    setYear(y);
    setMonth(m && String(parseInt(m)));
    setDay(d && String(parseInt(d)));
  }

  // Back/forward: show whatever the address bar now asks for.
  const onPopState = useEffectEvent(() => {
    const target = readUrl();
    setTeam(urlTeam());
    if (target) {
      runComparison(target.birthDate, target.famous, { push: false });
    } else {
      setResult(null);
      setDateFields(null);
      setError(null);
    }
  });

  const finishInitial = useEffectEvent(() => {
    if (initialTarget) finishComparison(initialTarget.birthDate, initialTarget.famous, { push: false });
  });

  useEffect(() => {
    finishInitial();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function runComparison(birthDate, famous, options) {
    setDateFields(birthDate);
    setLoading(true);
    setLoadingSlow(false);
    setError(null);
    return finishComparison(birthDate, famous, options);
  }

  // The async half of a comparison; the caller has already set the loading state.
  async function finishComparison(birthDate, famous, { push = true } = {}) {
    const slowTimer = setTimeout(() => setLoadingSlow(true), 5000);
    let timeout;

    try {
      const timedOut = new Promise((_, reject) => {
        timeout = setTimeout(() => reject(Object.assign(new Error("timeout"), { name: "AbortError" })), 60000);
      });
      const { players, total } = await Promise.race([loadPlayers(), timedOut]);
      setResult(computeResult(players, total, birthDate, famous));
      // from_link: opened from a shared URL or back/forward rather than a click here
      track("compare", { method: famous ? "famous" : "date", famous: famous?.name, has_team: !!team, from_link: !push, language: lang });
      if (push) window.history.pushState(null, "", basePath() + resultQuery(birthDate, famous, team));
      window.scrollTo(0, 0);
    } catch (err) {
      if (err.name === "AbortError") {
        setError(t.errorTimeout);
      } else {
        setError(err.message);
      }
    } finally {
      clearTimeout(timeout);
      clearTimeout(slowTimer);
      setLoading(false);
      setLoadingSlow(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!day || !month || !year) return;
    runComparison(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }

  function handleFamousPlayer(player) {
    runComparison(player.birth, player);
  }

  function changeTeam(slug) {
    if (slug) track("select_team", { club: slug, where: result ? "results" : "home" });
    setTeam(slug);
    saveTeam(slug);
    if (result) window.history.replaceState(null, "", basePath() + resultQuery(result.birthDate, result.famous, slug));
  }

  function handleReset() {
    setResult(null);
    setDateFields(null);
    setError(null);
    window.history.pushState(null, "", basePath());
  }

  // Turkish visitors see Arda Güler first.
  const famousPlayers = lang === "tr"
    ? [...FAMOUS_PLAYERS.filter(p => p.turkish), ...FAMOUS_PLAYERS.filter(p => !p.turkish)]
    : FAMOUS_PLAYERS;

  const fmt = n => n.toLocaleString(t.locale);

  return (
    <div className="app">
      <header className="topbar">
        <div className="wrap topbar-inner">
          <a href={basePath()} className="brand" onClick={e => { e.preventDefault(); handleReset(); }}>
            <BallIcon />
            <span>{t.brand}</span>
          </a>
          <div className="lang-switch" role="group" aria-label={t.langLabel}>
            <button type="button" aria-pressed={lang === "en"} onClick={() => changeLang("en")}>EN</button>
            <button type="button" aria-pressed={lang === "tr"} onClick={() => changeLang("tr")}>TR</button>
          </div>
        </div>
      </header>

      {!result ? (
        <main>
          <section className="wrap hero">
            <div className="hero-copy">
              <p className="kicker"><span className="kicker-dot" />{t.kicker(totalPlayers ? fmt(totalPlayers) : "…")}</p>
              <h1>{t.heroTitle}</h1>
              <p className="hero-sub">{t.subtitle}</p>
            </div>

            <div className="pitch">
              <span className="pitch-halfway" aria-hidden="true" />
              <span className="pitch-circle" aria-hidden="true" />
              <form className="ticket" onSubmit={handleSubmit}>
                <div className="ticket-head">
                  <span className="ticket-title">{t.ticketTitle}</span>
                  <span className="ticket-stub">{t.ticketStub}</span>
                </div>
                <div className="ticket-fields">
                  <label>
                    {t.day}
                    <select value={day} onChange={e => setDay(e.target.value)} required>
                      <option value="" disabled>–</option>
                      {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </label>
                  <label>
                    {t.month}
                    <select value={month} onChange={e => { setMonth(e.target.value); clampDay(e.target.value, year); }} required>
                      <option value="" disabled>–</option>
                      {t.months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </select>
                  </label>
                  <label>
                    {t.year}
                    <select value={year} onChange={e => { setYear(e.target.value); clampDay(month, e.target.value); }} required>
                      <option value="" disabled>–</option>
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </label>
                </div>

                <label className="ticket-team">
                  {t.teamLabel}
                  <ClubSelect clubs={clubs} value={team} onChange={changeTeam} noneLabel={t.teamNone} />
                </label>

                {error && <p className="error-msg" role="alert">{error}</p>}

                <button type="submit" className="kickoff" disabled={loading}>
                  {loading ? <span className="spinner" aria-label="Loading" /> : (
                    <>
                      {t.compareBtn}
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </>
                  )}
                </button>
                <p className="ticket-note">{loadingSlow && !USE_STATIC ? t.serverWaking : t.ticketNote}</p>
              </form>
            </div>
          </section>

          <section className="league-strip" aria-label={t.leaguesLabel}>
            <div className="wrap league-strip-inner">
              {/* Names keep English casing in Turkish (no "LİGUE"); Süper Lig is Turkish itself */}
              {LEAGUES.map(l => <a key={l} href={`/league/${slugify(l)}`} lang={l === "Süper Lig" ? "tr" : "en"}>{l}</a>)}
            </div>
          </section>

          <section className="wrap stars">
            <div className="section-head">
              <h2>{t.starsTitle}</h2>
              <p>{t.starsDesc}</p>
            </div>
            <div className="star-grid">
              {famousPlayers.map(p => (
                <button key={p.name} type="button" className="star-card" onClick={() => handleFamousPlayer(p)} disabled={loading}>
                  <span className="star-year" aria-hidden="true">{p.birth.slice(2, 4)}</span>
                  <span className="star-club" lang="en">{famousClubs[famousKey(p.name, p.birth)] || "\u00a0"}</span>
                  <span className="star-name" lang="en">{p.name}</span>
                  <span className="star-born">{t.bornOn(formatBirth(p.birth, t.months))}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="wrap faq">
            {t.faq(oldest).map((item, i) => (
              <details key={item.q} open={i === 0}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </section>
        </main>
      ) : (
        <Suspense fallback={<main className="wrap results-loading"><span className="spinner" aria-label="Loading" /></main>}>
          <Results
            result={result}
            onReset={handleReset}
            t={t}
            team={team}
            clubs={clubs}
            onTeamChange={changeTeam}
            // Shared links stay on "/" (the preview middleware matches it) and carry the language
            shareUrl={`${SITE_URL}/${resultQuery(result.birthDate, result.famous, team)}${lang === "tr" ? "&l=tr" : ""}`}
          />
        </Suspense>
      )}

      <footer className="site-footer">
        <div className="wrap site-footer-inner">
          <span>{t.footer}</span>
          <span>howmanyfootballplayersolderthanme.com</span>
        </div>
      </footer>
    </div>
  );
}
