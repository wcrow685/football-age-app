import { useState } from "react";

// Whole percentages hide small shares (23/5757 → "0%"), so show one decimal near 0 and 100.
function formatPct(part, total, decimalSep, digits = 0) {
  const pct = (part / total) * 100;
  const text = pct > 0 && pct < 0.1 ? "<0.1"
             : pct > 99.9 && pct < 100 ? ">99.9"
             : (pct > 0 && pct < 1) || (pct > 99 && pct < 100) ? pct.toFixed(1)
             : pct.toFixed(digits).replace(/\.0$/, "");
  return text.replace(".", decimalSep);
}

// Two players can share a name (e.g. both Luis Suárez), so key on more than the name.
const playerKey = p => `${p.name}|${p.birth}|${p.club}`;

function playerAge(birth) {
  const today = new Date();
  const b = new Date(birth);
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age;
}

function longDate(iso, months) {
  const [y, m, d] = iso.split("-");
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

function shortDate(iso, months) {
  const [y, m, d] = iso.split("-");
  return `${parseInt(d)} ${months[parseInt(m) - 1].slice(0, 3)} ${y}`;
}

function PlayerName({ p }) {
  return p.tmUrl
    ? <a className="player-link" href={p.tmUrl} target="_blank" rel="noopener noreferrer">{p.name}</a>
    : <span>{p.name}</span>;
}

function Scoreboard({ older, younger, total, subject, t, fmt, pct }) {
  return (
    <section className="scoreboard" aria-label={subject.scoreHeader(fmt(total))}>
      <div className="scoreboard-top">
        <span>{subject.scoreHeader(fmt(total))}</span>
        <span className="accent">{t.scoreMeta}</span>
      </div>
      <div className="score">
        <div className="score-side">
          <span className="score-num accent">{fmt(older)}</span>
          <span className="score-label">{subject.olderLabel}</span>
        </div>
        <span className="score-colon" aria-hidden="true">:</span>
        <div className="score-side">
          <span className="score-num">{fmt(younger)}</span>
          <span className="score-label">{subject.youngerLabel}</span>
        </div>
      </div>
      <div className="score-bar" aria-hidden="true">
        <span style={{ width: `${(older / total) * 100}%` }} />
      </div>
      <div className="score-caption">
        <span>{subject.olderShare(t.percent(pct(older, 1)))}</span>
        <span>{subject.olderThanShare(t.percent(pct(younger, 1)))}</span>
      </div>
    </section>
  );
}

function TwinCard({ twin, subject, t }) {
  const sign = twin.days > 0 ? "+" : twin.days < 0 ? "−" : "";
  return (
    <div className="twin">
      <div className="twin-days" aria-hidden="true">
        <span className="twin-days-num">{sign}{Math.abs(twin.days)}</span>
        <span className="twin-days-label">{t.daysLabel(Math.abs(twin.days))}</span>
      </div>
      <div className="twin-body">
        <span className="eyebrow">{subject.twinTitle}</span>
        {/* Data names are ASCII-folded ("Yilmaz"), so Turkish uppercasing would give "YİLMAZ" */}
        <span className="twin-name" lang="en"><PlayerName p={twin} /></span>
        <span className="twin-meta">{twin.club} · {twin.league} · {subject.twinSub(twin.days)}</span>
      </div>
    </div>
  );
}

function SharePanel({ older, total, famous, shareUrl, t }) {
  const [copied, setCopied] = useState(false);
  const shareText = t.shareText(older, total, famous);
  const xUrl  = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  function copy() {
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  return (
    <div className="share">
      <span className="eyebrow">{t.shareResult}</span>
      <div className="share-row">
        <button type="button" className="btn btn-accent" onClick={copy}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" /></svg>
          <span aria-live="polite">{copied ? t.copied : t.copyLink}</span>
        </button>
        <a className="btn" href={waUrl} target="_blank" rel="noopener noreferrer">{t.whatsapp}</a>
        <a className="btn" href={xUrl} target="_blank" rel="noopener noreferrer">{t.shareOnX}</a>
        <a className="btn" href={fbUrl} target="_blank" rel="noopener noreferrer">{t.facebook}</a>
      </div>
    </div>
  );
}

// Language-independent sentinel so the "All" tab survives a language switch
const ALL = "__all__";

export default function Results({ result, onReset, t, shareUrl }) {
  const { older, olderPlayers, sameBirthday, total, byLeague, topNationalities, ageDistribution, userAge, younger, twin, birthDate, famous } = result;
  const subject = famous ? t.them(famous) : t.me;
  const fmt = n => n.toLocaleString(t.locale);
  const pct = (n, digits) => formatPct(n, total, t.decimalSep, digits);

  const [leagueFilter, setLeagueFilter] = useState(ALL);
  const [showAll, setShowAll] = useState(false);

  const filtered = leagueFilter === ALL ? olderPlayers : olderPlayers.filter(p => p.league === leagueFilter);
  const displayed = showAll ? filtered : filtered.slice(0, 20);
  const maxLeague = byLeague[0]?.count || 1;
  const maxNat = topNationalities[0]?.count || 1;
  const maxAge = Math.max(...ageDistribution.map(a => a.count));

  return (
    <main className="wrap results">
      <div className="context-bar">
        <span>{subject.context(longDate(birthDate, t.months), userAge)}</span>
        <button type="button" className="btn btn-pill" onClick={onReset}>{t.changeDate}</button>
      </div>

      <Scoreboard older={older} younger={younger} total={total} subject={subject} t={t} fmt={fmt} pct={pct} />

      <div className="grid-2">
        {twin && <TwinCard twin={twin} subject={subject} t={t} />}
        <SharePanel older={older} total={total} famous={famous} shareUrl={shareUrl} t={t} />
      </div>

      <div className="grid-2 grid-top">
        <section className="panel">
          <div className="panel-head">
            <h2>{subject.olderTitle(fmt(older))}</h2>
            <span>{t.sortedOldest}</span>
          </div>

          {byLeague.length > 1 && (
            <div className="filter-tabs" role="group" aria-label={t.colLeague}>
              <button type="button" aria-pressed={leagueFilter === ALL} onClick={() => { setLeagueFilter(ALL); setShowAll(false); }}>
                {t.all} ({fmt(older)})
              </button>
              {byLeague.map(l => (
                <button key={l.name} type="button" aria-pressed={leagueFilter === l.name} onClick={() => { setLeagueFilter(l.name); setShowAll(false); }}>
                  {l.name} ({l.count})
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <p className="empty">{subject.noPlayersLeague}</p>
          ) : (
            <>
              <div className="squad" role="table" aria-label={subject.olderTitle(fmt(older))}>
                <div className="squad-row squad-head" role="row">
                  <span role="columnheader">{t.colPlayer}</span>
                  <span role="columnheader">{t.colClub}</span>
                  <span role="columnheader" className="squad-age">{t.colAge}</span>
                  <span role="columnheader" className="squad-born">{t.colBorn}</span>
                </div>
                {displayed.map(p => (
                  <div key={playerKey(p)} className="squad-row" role="row">
                    <span role="cell" className="squad-name"><PlayerName p={p} /></span>
                    <span role="cell" className="squad-club">
                      {p.crest && <img src={p.crest} alt="" className="crest" loading="lazy" />}
                      <span className="ellipsis">{p.club}</span>
                    </span>
                    <span role="cell" className="squad-age">{playerAge(p.birth)}</span>
                    <span role="cell" className="squad-born">{shortDate(p.birth, t.months)}</span>
                  </div>
                ))}
              </div>
              {filtered.length > 20 && !showAll && (
                <button type="button" className="btn btn-block" onClick={() => setShowAll(true)}>
                  {t.showAll(fmt(filtered.length))}
                </button>
              )}
            </>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>{t.leagueTable}</h2>
            <span>{subject.olderCol}</span>
          </div>
          <ol className="table-list">
            {byLeague.map((l, i) => (
              <li key={l.name}>
                <span className="table-pos">{i + 1}</span>
                <span className="table-name">{l.name}</span>
                <span className="meter" aria-hidden="true"><span style={{ width: `${(l.count / maxLeague) * 100}%` }} /></span>
                <span className="table-count">{l.count}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>{t.ageDistTitle}</h2>
          <span>{subject.ageDistDesc(fmt(total), userAge)}</span>
        </div>
        <div className="age-scroll">
          <div className="age-chart" role="img" aria-label={subject.ageDistDesc(fmt(total), userAge)} style={{ gridTemplateColumns: `repeat(${ageDistribution.length}, minmax(0, 1fr))` }}>
            {ageDistribution.map(a => (
              <div key={a.age} className="age-col" title={`${t.colAge} ${a.age}: ${a.count}`}>
                <span className="age-marker">{a.age === userAge ? subject.marker : ""}</span>
                <span className="age-track">
                  <span
                    className={`age-bar${a.age === userAge ? " is-you" : a.age > userAge ? " is-older" : ""}`}
                    style={{ height: `${Math.max(1, (a.count / maxAge) * 100)}%` }}
                  />
                </span>
                <span className="age-label">{a.age % 5 === 0 || a.age === userAge ? a.age : ""}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid-2 grid-top">
        <section className="panel panel-outline">
          <div className="panel-head">
            <h2>{subject.sameBirthdayTitle}</h2>
          </div>
          {sameBirthday.length === 0 ? (
            <p className="empty">{subject.noBirthday}</p>
          ) : (
            <div className="chips">
              {sameBirthday.map(p => (
                <span key={playerKey(p)} className="chip">
                  <PlayerName p={p} />
                  <span>{p.club} · {p.birth.slice(0, 4)}</span>
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="panel panel-outline">
          <div className="panel-head">
            <h2>{t.topNationalities}</h2>
          </div>
          <div className="nat-list">
            {topNationalities.slice(0, 8).map(n => (
              <div key={n.name} className="nat-row">
                <span className="ellipsis">{n.name}</span>
                <span className="meter meter-chalk" aria-hidden="true"><span style={{ width: `${(n.count / maxNat) * 100}%` }} /></span>
                <span className="nat-count">{n.count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="results-end">
        <button type="button" className="btn btn-pill" onClick={onReset}>{t.tryAnother}</button>
      </div>
    </main>
  );
}
