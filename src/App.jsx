import { useState, useEffect } from "react";
import Results from "./components/Results";
import { translations } from "./i18n";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const USE_STATIC = import.meta.env.VITE_USE_STATIC !== "false";

// First three letters give the standard short month in both languages (Jun / Haz).
function formatBirth(birth, months) {
  const [y, m, d] = birth.split("-");
  return `${parseInt(d)} ${months[parseInt(m) - 1].slice(0, 3)} ${y}`;
}

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

const YEAR_MS = 365.25 * 24 * 3600 * 1000;

// `famous` is the famous player being compared, or undefined when it's the visitor.
function computeResult(players, total, birthDate, famous) {
  const userDate = new Date(birthDate);
  const today    = new Date();
  const isFamous = p => famous && p.name === famous.name && p.birth === famous.birth;

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
    famous,
  };
}

const FAMOUS_PLAYERS = [
  { name: "Lionel Messi",      birth: "1987-06-24", trFrom: "Lionel Messi'den", photo: "https://img.a.transfermarkt.technology/portrait/medium/28003-1694529629.jpg" },
  { name: "Cristiano Ronaldo", birth: "1985-02-05", trFrom: "Cristiano Ronaldo'dan", photo: "https://img.a.transfermarkt.technology/portrait/medium/8198-1716198662.jpg" },
  { name: "Kylian Mbappé",     birth: "1998-12-20", trFrom: "Kylian Mbappé'den", photo: "https://img.a.transfermarkt.technology/portrait/medium/342229-1720090574.jpg" },
  { name: "Erling Haaland",    birth: "2000-07-21", trFrom: "Erling Haaland'dan", photo: "https://img.a.transfermarkt.technology/portrait/medium/418560-1715778481.jpg" },
  { name: "Vinicius Junior",   birth: "2000-07-12", trFrom: "Vinicius Junior'dan", photo: "https://img.a.transfermarkt.technology/portrait/medium/371998-1710946169.jpg" },
  { name: "Jude Bellingham",   birth: "2003-06-29", trFrom: "Jude Bellingham'dan", photo: "https://img.a.transfermarkt.technology/portrait/medium/581678-1715345696.jpg" },
  { name: "Mohamed Salah",     birth: "1992-06-15", trFrom: "Mohamed Salah'tan", photo: "https://img.a.transfermarkt.technology/portrait/medium/148455-1715683864.jpg" },
  { name: "Lamine Yamal",      birth: "2007-07-13", trFrom: "Lamine Yamal'dan", photo: "https://img.a.transfermarkt.technology/portrait/medium/987714-1722413524.jpg" },
  { name: "Harry Kane",        birth: "1993-07-28", trFrom: "Harry Kane'den", photo: "https://img.a.transfermarkt.technology/portrait/medium/132098-1715945570.jpg" },
  { name: "Neymar Jr",         birth: "1992-02-05", trFrom: "Neymar Jr'dan", photo: "https://img.a.transfermarkt.technology/portrait/medium/68290-1715683897.jpg" },
  { name: "Pedri",             birth: "2002-11-25", trFrom: "Pedri'den", photo: "https://img.a.transfermarkt.technology/portrait/medium/553919-1716198882.jpg" },
  { name: "Rodri",             birth: "1996-06-22", trFrom: "Rodri'den", photo: "https://img.a.transfermarkt.technology/portrait/medium/357905-1715683975.jpg" },
];

export default function App() {
  const currentYear = new Date().getFullYear();
  const [day, setDay]       = useState("");
  const [month, setMonth]   = useState("");
  const [year, setYear]     = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSlow, setLoadingSlow] = useState(false);
  const [error, setError]   = useState(null);
  const [totalPlayers, setTotalPlayers] = useState("...");
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

  function toggleLang() {
    const next = lang === "en" ? "tr" : "en";
    setLang(next);
    localStorage.setItem("lang", next);
  }

  // Fetch total count for the hint text
  useEffect(() => {
    fetch(USE_STATIC ? "/players.json" : `${API_URL}/api/status`)
      .then(r => r.json())
      .then(d => { if (d.total) setTotalPlayers(d.total); })
      .catch(() => {});
  }, []);

  async function runComparison(birthDate, famous) {
    setLoading(true);
    setLoadingSlow(false);
    setError(null);

    const slowTimer = setTimeout(() => setLoadingSlow(true), 5000);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const url = USE_STATIC ? "/players.json" : `${API_URL}/api/players`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const { players, total } = await res.json();
      setResult(computeResult(players, total, birthDate, famous));
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
    const [y, m, d] = player.birth.split("-");
    setDay(String(parseInt(d)));
    setMonth(String(parseInt(m)));
    setYear(y);
    runComparison(player.birth, player);
  }

  function handleReset() {
    setResult(null);
    setDay(""); setMonth(""); setYear("");
    setError(null);
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-content">
          <button className="lang-toggle" onClick={toggleLang}>
            {lang === "en" ? "🇹🇷 TR" : "🇬🇧 EN"}
          </button>
          <div className="ball-icon" style={{ cursor: result ? "pointer" : "default" }} onClick={result ? handleReset : undefined}>⚽</div>
          <h1 style={{ cursor: result ? "pointer" : "default" }} onClick={result ? handleReset : undefined}>
            {t.title.split("\n").map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
          </h1>
          <p className="subtitle">{t.subtitle}</p>
        </div>
      </header>

      {!result ? (
        <main className="input-section">
          <div className="card input-card">
            <h2>{t.enterBirthDate}</h2>
            <form onSubmit={handleSubmit}>
              <div className="date-dropdowns">
                <select value={day} onChange={e => setDay(e.target.value)} required>
                  <option value="" disabled>{t.day}</option>
                  {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={month} onChange={e => { setMonth(e.target.value); clampDay(e.target.value, year); }} required>
                  <option value="" disabled>{t.month}</option>
                  {t.months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
                <select value={year} onChange={e => { setYear(e.target.value); clampDay(month, e.target.value); }} required>
                  <option value="" disabled>{t.year}</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {error && <p className="error-msg">{error}</p>}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <span className="spinner" /> : t.compareBtn}
              </button>
              {loadingSlow && !USE_STATIC && (
                <p className="hint" style={{color: "#94a3b8", marginTop: 8}}>
                  {t.serverWaking}
                </p>
              )}
            </form>
            <p className="hint">{t.hint(totalPlayers)}</p>
          </div>
          <div className="famous-section">
            <p className="famous-label">{t.orCompareFamous}</p>
            <div className="famous-grid">
              {FAMOUS_PLAYERS.map(p => (
                <button key={p.name} className="famous-card" onClick={() => handleFamousPlayer(p)} disabled={loading}>
                  <span className="famous-name">{p.name}</span>
                  <span className="famous-birth">🎂 {formatBirth(p.birth, t.months)}</span>
                </button>
              ))}
            </div>
          </div>
        </main>
      ) : (
        <Results result={result} onReset={handleReset} t={t} />
      )}

      <footer>
        <p>{t.footer}</p>
      </footer>
    </div>
  );
}
