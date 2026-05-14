import { useState, useEffect } from "react";
import Results from "./components/Results";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

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
    fetch(`${API_URL}/api/status`)
      .then(r => r.json())
      .then(d => { if (d.total) setTotalPlayers(d.total); })
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!day || !month || !year) return;

    setLoading(true);
    setLoadingSlow(false);
    setError(null);

    const slowTimer = setTimeout(() => setLoadingSlow(true), 5000);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const res = await fetch(`${API_URL}/api/players`, { signal: controller.signal });
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

  function handleReset() {
    setResult(null);
    setDay(""); setMonth(""); setYear("");
    setError(null);
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-content">
          <div className="ball-icon">⚽</div>
          <h1>How Many Football Players<br />Are Older Than Me?</h1>
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
              Bundesliga, Serie A, Ligue 1, Süper Lig &amp; Saudi Pro League (2024-25 season).
            </p>
          </div>
        </main>
      ) : (
        <Results result={result} onReset={handleReset} />
      )}

      <footer>
        <p>Data from API-Football · 2024-25 season · For entertainment purposes only.</p>
      </footer>
    </div>
  );
}
