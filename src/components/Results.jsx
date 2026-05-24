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

function ShareButtons({ older, total, famousPlayer, t }) {
  const shareText = t.shareText(older, total, famousPlayer);
  const shareUrl  = "https://www.howmanyfootballplayersolderthanme.com";
  const fullText  = `${shareText} ${shareUrl}`;

  const twitterUrl  = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(fullText)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="share-buttons">
      <span className="share-label">{t.shareResult}</span>
      <div className="share-row">
        <a className="share-btn share-x" href={twitterUrl} target="_blank" rel="noopener noreferrer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          {t.shareOnX}
        </a>
        <a className="share-btn share-fb" href={facebookUrl} target="_blank" rel="noopener noreferrer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          {t.facebook}
        </a>
        <a className="share-btn share-wa" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
          {t.whatsapp}
        </a>
      </div>
    </div>
  );
}

export default function Results({ result, onReset, t }) {
  const { older, olderPlayers, sameBirthday, total, byLeague, topNationalities, ageDistribution, userAge, percentileOlderThan, famousPlayer } = result;
  const [leagueFilter, setLeagueFilter] = useState(t.all);
  const [showAll, setShowAll] = useState(false);

  const leagues = [t.all, ...byLeague.map(l => l.name).filter(n => LEAGUE_COLORS[n])];
  const filtered = leagueFilter === t.all
    ? olderPlayers
    : olderPlayers.filter(p => p.league === leagueFilter);
  const displayed = showAll ? filtered : filtered.slice(0, 20);

  return (
    <main className="results">

      {/* Big number */}
      <div className="big-result">
        <div className="big-number">{older}</div>
        <div className="big-label">
          {t.olderThanYou} {famousPlayer ? <strong>{famousPlayer}</strong> : t.you}
        </div>
        <div className="big-sub">{t.outOf(total)}</div>
      </div>

      <ShareButtons older={older} total={total} famousPlayer={famousPlayer} t={t} />

      {/* Stat cards */}
      <div className="stat-cards">
        <StatCard label={t.yourAge}         value={`${userAge}`}               sub={t.yearsOld}                                       accent="#3b82f6" />
        <StatCard label={t.olderThanYouLabel} value={`${older}`}               sub={t.ofPlayers(Math.round((older/total)*100))}        accent="#10b981" />
        <StatCard label={t.youngerThanYou}  value={`${total - older}`}         sub={t.ofPlayers(Math.round(((total-older)/total)*100))} accent="#ef4444" />
        <StatCard label={t.youreOlderThan}  value={`${percentileOlderThan}%`}  sub={t.ofAllPlayers}                                   accent="#f59e0b" />
      </div>

      {/* Player list */}
      <div className="chart-section">
        <h2>{t.playersOlderTitle(older)}</h2>
        <p className="chart-desc">{t.sortedOldest}</p>

        <div className="filter-tabs">
          {leagues.map(l => (
            <button
              key={l}
              className={`filter-tab ${leagueFilter === l ? "active" : ""}`}
              style={leagueFilter === l && l !== t.all ? { borderColor: LEAGUE_COLORS[l], color: LEAGUE_COLORS[l], background: `${LEAGUE_COLORS[l]}18` } : {}}
              onClick={() => { setLeagueFilter(l); setShowAll(false); }}
            >
              {l === t.all ? `${t.all} (${older})` : `${l} (${byLeague.find(x => x.name === l)?.count ?? 0})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="no-players">{t.noPlayersLeague}</p>
        ) : (
          <>
            <div className="player-list">
              <div className="player-list-header">
                <span>#</span>
                <span>{t.colPlayer}</span>
                <span>{t.colClub}</span>
                <span>{t.colLeague}</span>
                <span>{t.colNationality}</span>
                <span>{t.colAge}</span>
                <span>{t.colBorn}</span>
              </div>
              {displayed.map((p, i) => {
                const color = LEAGUE_COLORS[p.league] || "#6366f1";
                return (
                  <div key={p.name} className="player-row">
                    <span className="player-rank">{i + 1}</span>
                    <a className="player-name player-stats-link" href={p.tmUrl || `https://statslook.com/tr/scout/players?search=${encodeURIComponent(p.name)}`} target="_blank" rel="noopener noreferrer">{p.name}</a>
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
                {t.showAll(filtered.length)}
              </button>
            )}
          </>
        )}
      </div>

      {/* Same birthday */}
      <div className="chart-section">
        <h2>{t.sameBirthdayTitle}</h2>
        <p className="chart-desc">{t.sameBirthdayDesc}</p>
        {sameBirthday.length === 0 ? (
          <p className="no-players">{t.noBirthday}</p>
        ) : (
          <div className="player-list">
            <div className="player-list-header">
              <span>#</span>
              <span>{t.colPlayer}</span>
              <span>{t.colClub}</span>
              <span>{t.colLeague}</span>
              <span>{t.colNationality}</span>
              <span>{t.colAge}</span>
              <span>{t.colBorn}</span>
            </div>
            {sameBirthday.map((p, i) => {
              const color = LEAGUE_COLORS[p.league] || "#6366f1";
              return (
                <div key={p.name + p.birth} className="player-row birthday-row">
                  <span className="player-rank">{i + 1}</span>
                  <a className="player-name player-stats-link" href={p.tmUrl || `https://statslook.com/tr/scout/players?search=${encodeURIComponent(p.name)}`} target="_blank" rel="noopener noreferrer">{p.name}</a>
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
        <h2>{t.olderByLeague}</h2>
        <p className="chart-desc">{t.olderByLeagueDesc}</p>
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
        <h2>{t.topNationalities}</h2>
        <p className="chart-desc">{t.topNationalitiesDesc}</p>
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
        <h2>{t.ageDistTitle}</h2>
        <p className="chart-desc">{t.ageDistDesc(total, userAge)}</p>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ageDistribution} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
              <XAxis dataKey="age" tick={{ fill: "#a0aec0", fontSize: 11 }} />
              <YAxis tick={{ fill: "#a0aec0", fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: "#1a1a2e", border: "1px solid #2a2a3a", borderRadius: 8 }}
                labelStyle={{ color: "#e2e8f0" }} itemStyle={{ color: "#e2e8f0" }}
                formatter={v => [v, t.playersLabel]} labelFormatter={l => t.ageLabel(l)}
              />
              <ReferenceLine x={userAge} stroke="#10b981" strokeWidth={2} strokeDasharray="6 3"
                label={{ value: t.youLabel, fill: "#10b981", fontSize: 13, position: "top" }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* League breakdown table */}
      <div className="chart-section">
        <h2>{t.leagueBreakdown}</h2>
        <div className="league-table">
          <div className="league-table-header">
            <span>{t.leagueCol}</span>
            <span>{t.olderCol}</span>
            <span>{t.shareCol}</span>
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
        <button className="btn-secondary" onClick={onReset}>{t.tryAnother}</button>
      </div>
    </main>
  );
}
