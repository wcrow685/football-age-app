import { useState, useEffect, useEffectEvent, lazy, Suspense } from "react";
import { translations } from "./i18n";
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
      .catch(err => { playersPromise = undefined; throw err; });
  }
  return playersPromise;
}

// "Kenan Yıldız" and "Kenan Yildiz" (as the data spells it) should match.
const normalize = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").toLowerCase();
const slugify   = s => normalize(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// First three letters give the standard short month in both languages (Jun / Haz).
function formatBirth(birth, months) {
  const [y, m, d] = birth.split("-");
  return `${parseInt(d)} ${months[parseInt(m) - 1].slice(0, 3)} ${y}`;
}

const famousKey = (name, birth) => `${normalize(name)}|${birth}`;

function BallIcon({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="17" cy="17" r="15" />
      <path d="M17 10l6 4.4-2.3 7.1h-7.4L11 14.4z" />
      <path d="M17 10V2.5M23 14.4l7-2.4M20.7 21.5l4.4 6.1M13.3 21.5l-4.4 6.1M11 14.4l-7-2.4" />
    </svg>
  );
}

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

const YEAR_MS = 365.25 * 24 * 3600 * 1000;
const DAY_MS  = 24 * 3600 * 1000;

// `famous` is the famous player being compared, or undefined when it's the visitor.
function computeResult(players, total, birthDate, famous) {
  const userDate = new Date(birthDate);
  const today    = new Date();
  const isFamous = p => famous && p.birth === famous.birth && normalize(p.name) === normalize(famous.name);

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

  // Closest birth date in either direction; `days` > 0 means the twin was born later.
  let twin = null;
  for (const p of players) {
    if (isFamous(p)) continue;
    const days = Math.round((new Date(p.birth) - userDate) / DAY_MS);
    if (!twin || Math.abs(days) < Math.abs(twin.days)) twin = { ...p, days };
  }

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
  };
}

const FAMOUS_PLAYERS = [
  { name: "Lionel Messi",      birth: "1987-06-24", trFrom: "Lionel Messi'den" },
  { name: "Cristiano Ronaldo", birth: "1985-02-05", trFrom: "Cristiano Ronaldo'dan" },
  { name: "Kylian Mbappé",     birth: "1998-12-20", trFrom: "Kylian Mbappé'den" },
  { name: "Erling Haaland",    birth: "2000-07-21", trFrom: "Erling Haaland'dan" },
  { name: "Vinicius Junior",   birth: "2000-07-12", trFrom: "Vinicius Junior'dan" },
  { name: "Jude Bellingham",   birth: "2003-06-29", trFrom: "Jude Bellingham'dan" },
  { name: "Mohamed Salah",     birth: "1992-06-15", trFrom: "Mohamed Salah'tan" },
  { name: "Lamine Yamal",      birth: "2007-07-13", trFrom: "Lamine Yamal'dan" },
  { name: "Harry Kane",        birth: "1993-07-28", trFrom: "Harry Kane'den" },
  { name: "Neymar Jr",         birth: "1992-02-05", trFrom: "Neymar Jr'dan" },
  { name: "Pedri",             birth: "2002-11-25", trFrom: "Pedri'den" },
  { name: "Rodri",             birth: "1996-06-22", trFrom: "Rodri'den" },
  { name: "Arda Güler",        birth: "2005-02-25", trFrom: "Arda Güler'den", turkish: true },
  { name: "Kenan Yıldız",      birth: "2005-05-04", trFrom: "Kenan Yıldız'dan", turkish: true },
  { name: "Ferdi Kadıoğlu",    birth: "1999-10-07", trFrom: "Ferdi Kadıoğlu'ndan", turkish: true },
  { name: "Barış Alper Yılmaz", birth: "2000-05-23", trFrom: "Barış Alper Yılmaz'dan", turkish: true },
];

const LEAGUES = ["Premier League", "La Liga", "Bundesliga", "Serie A", "Ligue 1", "Eredivisie", "Liga Portugal", "Süper Lig", "Saudi Pro League", "MLS"];

function isValidBirth(d) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const [y, m, day] = d.split("-").map(Number);
  return y >= 1940 && m >= 1 && m <= 12 && day >= 1 && day <= daysInMonth(m, y) && new Date(d) <= new Date();
}

// ?p=lionel-messi for a famous player, ?d=1995-03-14 for a birth date.
function readUrl() {
  const q = new URLSearchParams(window.location.search);
  const famous = FAMOUS_PLAYERS.find(p => slugify(p.name) === q.get("p"));
  if (famous) return { birthDate: famous.birth, famous };
  const d = q.get("d");
  return d && isValidBirth(d) ? { birthDate: d } : null;
}

const resultPath = (birthDate, famous) => famous ? `/?p=${slugify(famous.name)}` : `/?d=${birthDate}`;

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
  const [lang, setLang]     = useState(() => localStorage.getItem("lang") || "en");

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

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  function changeLang(next) {
    setLang(next);
    localStorage.setItem("lang", next);
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
      if (push) window.history.pushState(null, "", resultPath(birthDate, famous));
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

  function handleReset() {
    setResult(null);
    setDateFields(null);
    setError(null);
    window.history.pushState(null, "", "/");
  }

  // Turkish visitors see the Turkish players first.
  const famousPlayers = lang === "tr"
    ? [...FAMOUS_PLAYERS.filter(p => p.turkish), ...FAMOUS_PLAYERS.filter(p => !p.turkish)]
    : FAMOUS_PLAYERS;

  const fmt = n => n.toLocaleString(t.locale);

  return (
    <div className="app">
      <header className="topbar">
        <div className="wrap topbar-inner">
          <a href="/" className="brand" onClick={e => { e.preventDefault(); handleReset(); }}>
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
              {LEAGUES.map(l => <span key={l}>{l}</span>)}
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
                  <span className="star-club">{famousClubs[famousKey(p.name, p.birth)] || "\u00a0"}</span>
                  <span className="star-name">{p.name}</span>
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
            shareUrl={SITE_URL + resultPath(result.birthDate, result.famous)}
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
