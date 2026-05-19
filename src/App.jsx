import { useState, useEffect } from "react";
import Results from "./components/Results";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const USE_STATIC = import.meta.env.VITE_USE_STATIC !== "false";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const SHORT_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatBirth(birth) {
  const [y, m, d] = birth.split("-");
  return `${parseInt(d)} ${SHORT_MONTHS[parseInt(m) - 1]} ${y}`;
}

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

const FAMOUS_PLAYERS = [
  { name: "Lionel Messi",      birth: "1987-06-24", photo: "https://img.a.transfermarkt.technology/portrait/medium/28003-1694529629.jpg" },
  { name: "Cristiano Ronaldo", birth: "1985-02-05", photo: "https://img.a.transfermarkt.technology/portrait/medium/8198-1716198662.jpg" },
  { name: "Kylian Mbappé",     birth: "1998-12-20", photo: "https://img.a.transfermarkt.technology/portrait/medium/342229-1720090574.jpg" },
  { name: "Erling Haaland",    birth: "2000-07-21", photo: "https://img.a.transfermarkt.technology/portrait/medium/418560-1715778481.jpg" },
  { name: "Vinicius Junior",   birth: "2000-07-12", photo: "https://img.a.transfermarkt.technology/portrait/medium/371998-1710946169.jpg" },
  { name: "Jude Bellingham",   birth: "2003-06-29", photo: "https://img.a.transfermarkt.technology/portrait/medium/581678-1715345696.jpg" },
  { name: "Mohamed Salah",     birth: "1992-06-15", photo: "https://img.a.transfermarkt.technology/portrait/medium/148455-1715683864.jpg" },
  { name: "Lamine Yamal",      birth: "2007-07-13", photo: "https://img.a.transfermarkt.technology/portrait/medium/987714-1722413524.jpg" },
  { name: "Harry Kane",        birth: "1993-07-28", photo: "https://img.a.transfermarkt.technology/portrait/medium/132098-1715945570.jpg" },
  { name: "Neymar Jr",         birth: "1992-02-05", photo: "https://img.a.transfermarkt.technology/portrait/medium/68290-1715683897.jpg" },
  { name: "Pedri",             birth: "2002-11-25", photo: "https://img.a.transfermarkt.technology/portrait/medium/553919-1716198882.jpg" },
  { name: "Rodri",             birth: "1996-06-22", photo: "https://img.a.transfermarkt.technology/portrait/medium/357905-1715683975.jpg" },
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

  const maxDays = month && year ? daysInMonth(Number(month), Number(year)) : 31;
  const years = Array.from({ length: currentYear - 1939 }, (_, i) => currentYear - i);
  const days  = Array.from({ length: maxDays }, (_, i) => i + 1);

  // Fetch total count for the hint text
  useEffect(() => {
    if (USE_STATIC) {
      fetch("/players.json")
        .then(r => r.json())
        .then(d => { if (d.total) setTotalPlayers(d.total); })
        .catch(() => {});
    } else {
      fetch(`${API_URL}/api/status`)
        .then(r => r.json())
        .then(d => { if (d.total) setTotalPlayers(d.total); })
        .catch(() => {});
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!day || !month || !year) return;

    setLoading(true);
    setLoadingSlow(false);
    setError(null);

    const slowTimer = setTimeout(() => setLoadingSlow(true), 5000);

    try {
      const url = USE_STATIC ? "/players.json" : `${API_URL}/api/players`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const { players, total } = await res.json();

      const birthDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const userDate  = new Date(birthDate);
      const today     = new Date();

      const olderPlayers = players
        .filter(p => new Date(p.birth) < userDate)
        .sort((a, b) => new Date(a.birth) - new Date(b.birth));

      // Same day & month, any year
      const sameBirthday = players
        .filter(p => {
          const d = new Date(p.birth);
          return d.getMonth() === userDate.getMonth() && d.getDate() === userDate.getDate();
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

      const userAgeYears = (today - userDate) / (365.25 * 24 * 3600 * 1000);

      const buckets = {};
      players.forEach(p => {
        const age = Math.floor((today - new Date(p.birth)) / (365.25 * 24 * 3600 * 1000));
        buckets[age] = (buckets[age] || 0) + 1;
      });
      const ageDistribution = Object.entries(buckets)
        .map(([age, count]) => ({ age: Number(age), count }))
        .sort((a, b) => a.age - b.age);

      const younger = players.filter(p => new Date(p.birth) > userDate).length;

      setResult({
        older: olderPlayers.length,
        olderPlayers,
        sameBirthday,
        total,
        byLeague: Object.entries(byLeague)
          .sort((a, b) => b[1] - a[1])
          .map(([name, count]) => ({ name, count })),
        topNationalities,
        ageDistribution,
        userAge: Math.floor(userAgeYears),
        percentileOlderThan: Math.round((younger / total) * 100),
      });
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Server is taking too long to respond. Please try again in a moment.");
      } else {
        setError(err.message);
      }
    } finally {
      clearTimeout(slowTimer);
      setLoading(false);
      setLoadingSlow(false);
    }
  }

  async function handleFamousPlayer(player) {
    const [y, m, d] = player.birth.split("-");
    setDay(String(parseInt(d)));
    setMonth(String(parseInt(m)));
    setYear(y);
    // Trigger search with this birth date directly
    setLoading(true);
    setLoadingSlow(false);
    setError(null);
    const slowTimer = setTimeout(() => setLoadingSlow(true), 5000);
    try {
      const url = USE_STATIC ? "/players.json" : `${API_URL}/api/players`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const { players, total } = await res.json();

      const userDate = new Date(player.birth);
      const today = new Date();
      const olderPlayers = players.filter(p => new Date(p.birth) < userDate).sort((a, b) => new Date(a.birth) - new Date(b.birth));
      const sameBirthday = players.filter(p => { const dd = new Date(p.birth); return dd.getMonth() === userDate.getMonth() && dd.getDate() === userDate.getDate(); }).sort((a, b) => new Date(a.birth) - new Date(b.birth));
      const byLeague = {}; olderPlayers.forEach(p => { byLeague[p.league] = (byLeague[p.league] || 0) + 1; });
      const byNat = {}; olderPlayers.forEach(p => { byNat[p.nationality] = (byNat[p.nationality] || 0) + 1; });
      const topNationalities = Object.entries(byNat).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([name, count]) => ({ name, count }));
      const userAgeYears = (today - userDate) / (365.25 * 24 * 3600 * 1000);
      const buckets = {}; players.forEach(p => { const age = Math.floor((today - new Date(p.birth)) / (365.25 * 24 * 3600 * 1000)); buckets[age] = (buckets[age] || 0) + 1; });
      const ageDistribution = Object.entries(buckets).map(([age, count]) => ({ age: Number(age), count })).sort((a, b) => a.age - b.age);
      const younger = players.filter(p => new Date(p.birth) > userDate).length;
      setResult({
        older: olderPlayers.length, olderPlayers, sameBirthday, total,
        byLeague: Object.entries(byLeague).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
        topNationalities, ageDistribution,
        userAge: Math.floor(userAgeYears),
        percentileOlderThan: Math.round((younger / total) * 100),
        famousPlayer: player.name,
      });
    } catch (err) {
      setError(err.name === "AbortError" ? "Server is taking too long." : err.message);
    } finally {
      clearTimeout(slowTimer);
      setLoading(false);
      setLoadingSlow(false);
    }
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
          <div className="ball-icon" style={{ cursor: result ? "pointer" : "default" }} onClick={result ? handleReset : undefined}>⚽</div>
          <h1 style={{ cursor: result ? "pointer" : "default" }} onClick={result ? handleReset : undefined}>How Many Football Players<br />Are Older Than Me?</h1>
          <p className="subtitle">
            Find out how you compare in age to today's top active football players
            across the world's biggest leagues.
          </p>
        </div>
      </header>

      {!result ? (
        <main className="input-section">
          <div className="card input-card">
            <h2>Enter Your Birth Date</h2>
            <form onSubmit={handleSubmit}>
              <div className="date-dropdowns">
                <select value={day} onChange={e => setDay(e.target.value)} required>
                  <option value="" disabled>Day</option>
                  {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={month} onChange={e => setMonth(e.target.value)} required>
                  <option value="" disabled>Month</option>
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
                <select value={year} onChange={e => setYear(e.target.value)} required>
                  <option value="" disabled>Year</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {error && <p className="error-msg">{error}</p>}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <span className="spinner" /> : "Compare Me →"}
              </button>
              {loadingSlow && (
                <p className="hint" style={{color: "#94a3b8", marginTop: 8}}>
                  Server is waking up, please wait a moment...
                </p>
              )}
            </form>
            <p className="hint">
              Based on {totalPlayers} active players from Premier League, La Liga,
              Bundesliga, Serie A, Ligue 1, Süper Lig, Saudi Pro League &amp; MLS (2025-26 season).
            </p>
          </div>
          <div className="famous-section">
            <p className="famous-label">Or compare with a famous player</p>
            <div className="famous-grid">
              {FAMOUS_PLAYERS.map(p => (
                <button key={p.name} className="famous-card" onClick={() => handleFamousPlayer(p)} disabled={loading}>
                  <span className="famous-name">{p.name}</span>
                  <span className="famous-birth">🎂 {formatBirth(p.birth)}</span>
                </button>
              ))}
            </div>
          </div>
        </main>
      ) : (
        <Results result={result} onReset={handleReset} />
      )}

      <footer>
        <p>Data from ESPN · 2025-26 season · For entertainment purposes only.</p>
      </footer>
    </div>
  );
}
