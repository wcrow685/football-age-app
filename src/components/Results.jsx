import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine,
} from "recharts";

const LEAGUE_COLORS = {
  "Premier League":   "#3b82f6",
  "La Liga":          "#ef4444",
  "Bundesliga":       "#f59e0b",
  "Serie A":          "#10b981",
  "Ligue 1":          "#8b5cf6",
  "Süper Lig":        "#ec4899",
  "Saudi Pro League": "#14b8a6",
  "MLS":              "#f97316",
};

const NAT_COLORS = [
  "#3b82f6","#ef4444","#f59e0b","#10b981","#8b5cf6",
  "#ec4899","#14b8a6","#f97316","#6366f1","#84cc16","#06b6d4","#a855f7",
];

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="stat-card" style={{ borderTopColor: accent }}>
      <div className="stat-value" style={{ color: accent }}>{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function playerAge(birth) {
  const today = new Date();
  const b = new Date(birth);
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age;
}

export default function Results({ result, onReset }) {
  const { older, olderPlayers, sameBirthday, total, byLeague, topNationalities, ageDistribution, userAge, percentileOlderThan } = result;
  const [leagueFilter, setLeagueFilter] = useState("All");
  const [showAll, setShowAll] = useState(false);

  const leagues = ["All", ...Object.keys(LEAGUE_COLORS).sort()];
  const filtered = leagueFilter === "All"
    ? olderPlayers
    : olderPlayers.filter(p => p.league === leagueFilter);
  const displayed = showAll ? filtered : filtered.slice(0, 20);

  return (
    <main className="results">

      {/* Big number */}
      <div className="big-result">
        <div className="big-number">{older}</div>
        <div className="big-label">active football players are older than you</div>
        <div className="big-sub">out of {total} players in our database</div>
      </div>

      {/* Stat cards */}
      <div className="stat-cards">
        <StatCard label="Your Age"       value={`${userAge}`}          sub="years old"                                        accent="#3b82f6" />
        <StatCard label="Older Than You" value={`${older}`}            sub={`${Math.round((older/total)*100)}% of players`}   accent="#10b981" />
        <StatCard label="Younger Than You" value={`${total - older}`}  sub={`${Math.round(((total-older)/total)*100)}% of players`} accent="#ef4444" />
        <StatCard label="You're Older Than" value={`${percentileOlderThan}%`} sub="of all players"                           accent="#f59e0b" />
      </div>

      {/* Player list */}
      <div className="chart-section">
        <h2>Players Older Than You ({older})</h2>
        <p className="chart-desc">Sorted from oldest to youngest</p>

        <div className="filter-tabs">
          {leagues.map(l => (
            <button
              key={l}
              className={`filter-tab ${leagueFilter === l ? "active" : ""}`}
              style={leagueFilter === l && l !== "All" ? { borderColor: LEAGUE_COLORS[l], color: LEAGUE_COLORS[l], background: `${LEAGUE_COLORS[l]}18` } : {}}
              onClick={() => { setLeagueFilter(l); setShowAll(false); }}
            >
              {l === "All" ? `All (${older})` : `${l} (${byLeague.find(x => x.name === l)?.count ?? 0})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="no-players">No players older than you in this league.</p>
        ) : (
          <>
            <div className="player-list">
              <div className="player-list-header">
                <span>#</span>
                <span>Player</span>
                <span>Club</span>
                <span>League</span>
                <span>Nationality</span>
                <span>Age</span>
                <span>Born</span>
              </div>
              {displayed.map((p, i) => {
                const color = LEAGUE_COLORS[p.league] || "#6366f1";
                return (
                  <div key={p.name} className="player-row">
                    <span className="player-rank">{i + 1}</span>
                    <span className="player-name">{p.name}</span>
                    <span className="player-club">
                      {p.crest && <img src={p.crest} alt="" className="club-logo" />}
                      <span className="cell-text">{p.club}</span>
                    </span>
                    <span className="player-league" style={{ color }}>
                      {p.leagueLogo && <img src={p.leagueLogo} alt="" className="league-logo" />}
                      <span className="cell-text">{p.league}</span>
                    </span>
                    <span className="player-nat">{p.nationality}</span>
                    <span className="player-age">{playerAge(p.birth)}</span>
                    <span className="player-born">{p.birth}</span>
                  </div>
                );
              })}
            </div>
            {filtered.length > 20 && !showAll && (
              <button className="show-more" onClick={() => setShowAll(true)}>
                Show all {filtered.length} players ↓
              </button>
            )}
          </>
        )}
      </div>

      {/* Same birthday */}
      <div className="chart-section">
        <h2>Same Birthday as You 🎂</h2>
        <p className="chart-desc">
          Players born on the same day &amp; month — any year
        </p>
        {sameBirthday.length === 0 ? (
          <p className="no-players">No players share your birthday.</p>
        ) : (
          <div className="player-list">
            <div className="player-list-header">
              <span>#</span>
              <span>Player</span>
              <span>Club</span>
              <span>League</span>
              <span>Nationality</span>
              <span>Age</span>
              <span>Born</span>
            </div>
            {sameBirthday.map((p, i) => {
              const color = LEAGUE_COLORS[p.league] || "#6366f1";
              return (
                <div key={p.name + p.birth} className="player-row birthday-row">
                  <span className="player-rank">{i + 1}</span>
                  <span className="player-name">{p.name}</span>
                  <span className="player-club">
                    {p.crest && <img src={p.crest} alt="" className="club-logo" />}
                    {p.club}
                  </span>
                  <span className="player-league" style={{ color }}>
                    {p.leagueLogo && <img src={p.leagueLogo} alt="" className="league-logo" />}
                    {p.league}
                  </span>
                  <span className="player-nat">{p.nationality}</span>
                  <span className="player-age">{playerAge(p.birth)}</span>
                  <span className="player-born">{p.birth}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* League chart */}
      <div className="chart-section">
        <h2>Older Players by League</h2>
        <p className="chart-desc">Number of players older than you in each league</p>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={byLeague} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
              <XAxis dataKey="name" tick={{ fill: "#a0aec0", fontSize: 12 }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fill: "#a0aec0", fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a3a", borderRadius: 8 }} labelStyle={{ color: "#e2e8f0" }} itemStyle={{ color: "#e2e8f0" }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {byLeague.map(e => <Cell key={e.name} fill={LEAGUE_COLORS[e.name] || "#6366f1"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Nationality chart */}
      <div className="chart-section">
        <h2>Top Nationalities — Older Players</h2>
        <p className="chart-desc">Which countries have the most players older than you</p>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={topNationalities} layout="vertical" margin={{ top: 10, right: 40, left: 110, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#a0aec0", fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#e2e8f0", fontSize: 12 }} width={100} />
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a3a", borderRadius: 8 }} labelStyle={{ color: "#e2e8f0" }} itemStyle={{ color: "#e2e8f0" }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {topNationalities.map((e, i) => <Cell key={e.name} fill={NAT_COLORS[i % NAT_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Age distribution */}
      <div className="chart-section">
        <h2>Age Distribution of All Players</h2>
        <p className="chart-desc">
          Where you stand among all {total} players — the green line marks your age ({userAge})
        </p>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ageDistribution} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
              <XAxis dataKey="age" tick={{ fill: "#a0aec0", fontSize: 11 }} />
              <YAxis tick={{ fill: "#a0aec0", fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a3a", borderRadius: 8 }}
                labelStyle={{ color: "#e2e8f0" }} itemStyle={{ color: "#e2e8f0" }}
                formatter={v => [v, "Players"]} labelFormatter={l => `Age ${l}`}
              />
              <ReferenceLine x={userAge} stroke="#10b981" strokeWidth={2} strokeDasharray="6 3"
                label={{ value: "You", fill: "#10b981", fontSize: 13, position: "top" }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* League breakdown table */}
      <div className="chart-section">
        <h2>Full League Breakdown</h2>
        <div className="league-table">
          <div className="league-table-header">
            <span>League</span>
            <span>Older than you</span>
            <span>Share</span>
          </div>
          {byLeague.map(row => {
            const color = LEAGUE_COLORS[row.name] || "#6366f1";
            return (
              <div key={row.name} className="league-table-row">
                <span className="league-name" style={{ color }}>
                  <span className="league-dot" style={{ background: color }} />
                  {row.name}
                </span>
                <span className="league-count">{row.count}</span>
                <span className="league-pct">
                  <span className="pct-bar-bg">
                    <span className="pct-bar-fill" style={{ width: `${Math.min(100, Math.round((row.count / total) * 100 * 5))}%`, background: color }} />
                  </span>
                  {Math.round((row.count / total) * 100)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="reset-wrap">
        <button className="btn-secondary" onClick={onReset}>Try Another Date</button>
      </div>
    </main>
  );
}
