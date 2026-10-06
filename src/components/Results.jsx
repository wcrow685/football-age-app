import { useState } from "react";
import { renderStoryCard, shareOrDownload } from "../storyCard";
import { splitNames } from "../casing";
import { isSamePlayer, nameLang } from "../players";
import ClubSelect from "./ClubSelect";

// Uppercase headings in Turkish would turn "Messi" into "MESSİ"; mark the names
// as English so text-transform keeps "MESSI" while Turkish words keep "İ".
function Named({ text, names }) {
  return splitNames(text, names).map((p, i) => (p.name ? <span key={i} lang="en">{p.text}</span> : p.text));
}

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
  return p.slug
    ? <a className="player-link" href={`/player/${p.slug}`}>{p.name}</a>
    : <span>{p.name}</span>;
}

function Scoreboard({ older, younger, total, subject, names, t, fmt, pct }) {
  return (
    <section className="scoreboard" aria-label={subject.scoreHeader(fmt(total))}>
      <div className="scoreboard-top">
        <span><Named text={subject.scoreHeader(fmt(total))} names={names} /></span>
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
        <span className="twin-name" lang={nameLang(twin)}><PlayerName p={twin} /></span>
        <span className="twin-meta">{twin.club} · {twin.league} · {subject.twinSub(twin.days)}</span>
      </div>
    </div>
  );
}

function SharePanel({ older, younger, total, twin, famous, birthDate, subject, shareUrl, t }) {
  const [copied, setCopied] = useState(false);
  const [drawing, setDrawing] = useState(false);

  async function downloadStory() {
    setDrawing(true);
    try {
      const blob = await renderStoryCard({ older, younger, twin, t, subject, names: famous ? [famous.trFrom, famous.name] : [] });
      const name = famous ? famous.name.normalize("NFD").replace(/[^A-Za-z0-9]+/g, "-").toLowerCase() : birthDate;
      await shareOrDownload(blob, `older-than-me-${name}.png`, t.brand);
    } finally {
      setDrawing(false);
    }
  }
  const shareText = t.shareText(older, total, famous);
  const xUrl  = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
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
      <div className="share-grid">
        <button type="button" className="btn btn-accent share-main" onClick={downloadStory} disabled={drawing}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
          <span aria-live="polite">{drawing ? t.storyBusy : t.storyCard}</span>
        </button>
        <button type="button" className="btn share-main" onClick={copy}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" /></svg>
          <span aria-live="polite">{copied ? t.copied : t.copyLink}</span>
        </button>
        <a className="btn share-social" href={waUrl} target="_blank" rel="noopener noreferrer" aria-label={t.whatsapp}>
          <BrandIcon name="whatsapp" /><span className="share-social-label">WhatsApp</span>
        </a>
        <a className="btn share-social" href={xUrl} target="_blank" rel="noopener noreferrer" aria-label={t.shareOnX}>
          <BrandIcon name="x" /><span className="share-social-label">X</span>
        </a>
        <a className="btn share-social" href={fbUrl} target="_blank" rel="noopener noreferrer" aria-label={t.facebook}>
          <BrandIcon name="facebook" /><span className="share-social-label">Facebook</span>
        </a>
      </div>
    </div>
  );
}

const BRAND_ICONS = {
  whatsapp: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z",
  x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  facebook: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
};

function BrandIcon({ name }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={BRAND_ICONS[name]} />
    </svg>
  );
}

// Squad comparison: the chosen club's players oldest first, with the subject
// slotted in by birth date.
function TeamPanel({ team, clubs, onTeamChange, players, birthDate, famous, userAge, subject, names, t }) {
  const squad = team
    ? players.filter(p => p.clubSlug === team && !isSamePlayer(p, famous)).sort((a, b) => a.birth.localeCompare(b.birth))
    : [];
  const clubName = squad[0]?.club ?? clubs.flatMap(g => g.clubs).find(c => c.slug === team)?.name;
  const older = squad.filter(p => p.birth < birthDate).length;
  const younger = squad.filter(p => p.birth > birthDate).length;
  const youRow = { you: true };
  const rows = [...squad.slice(0, older), youRow, ...squad.slice(older)];

  return (
    <section className="panel team-panel">
      <div className="panel-head">
        <h2><Named text={subject.teamTitle} names={names} /></h2>
        <label className="team-picker">
          <span className="visually-hidden">{t.teamLabel}</span>
          <ClubSelect clubs={clubs} value={team} onChange={onTeamChange} noneLabel={t.teamNone} />
        </label>
      </div>

      {!squad.length ? (
        <p className="empty">{t.teamPick}</p>
      ) : (
        <>
          <p className="team-score">
            {older === 0 ? subject.teamOldest
              : younger === 0 ? subject.teamYoungest
              : subject.teamScore(older, squad.length, clubName)}
          </p>
          <div className="squad" role="table" aria-label={clubName}>
            <div className="squad-row squad-head" role="row">
              <span role="columnheader">{t.colPlayer}</span>
              <span role="columnheader">{t.colPosition}</span>
              <span role="columnheader" className="squad-age">{t.colAge}</span>
              <span role="columnheader" className="squad-born">{t.colBorn}</span>
            </div>
            {rows.map(p => p.you ? (
              <div key="you" className="squad-row is-you" role="row">
                <span role="cell" className="squad-name" lang="en">{subject.marker}</span>
                <span role="cell" className="squad-club" />
                <span role="cell" className="squad-age">{userAge}</span>
                <span role="cell" className="squad-born">{shortDate(birthDate, t.months)}</span>
              </div>
            ) : (
              <div key={playerKey(p)} className="squad-row" role="row">
                <span role="cell" className="squad-name"><PlayerName p={p} /></span>
                <span role="cell" className="squad-club muted-cell">{t.positions[p.position] || p.position}</span>
                <span role="cell" className="squad-age">{playerAge(p.birth)}</span>
                <span role="cell" className="squad-born">{shortDate(p.birth, t.months)}</span>
              </div>
            ))}
          </div>
          <a className="team-full" href={`/club/${team}`}>{t.teamFull(clubName)}</a>
        </>
      )}
    </section>
  );
}

// Language-independent sentinel so the "All" tab survives a language switch
const ALL = "__all__";

export default function Results({ result, onReset, t, shareUrl, team, clubs, onTeamChange }) {
  const { older, olderPlayers, sameBirthday, total, byLeague, topNationalities, ageDistribution, userAge, younger, twin, birthDate, famous, players } = result;
  const subject = famous ? t.them(famous) : t.me;
  const names = famous ? [famous.trFrom, famous.name] : [];
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
        <span><Named text={subject.context(longDate(birthDate, t.months), userAge)} names={names} /></span>
        <button type="button" className="btn btn-pill" onClick={onReset}>{t.changeDate}</button>
      </div>

      <Scoreboard older={older} younger={younger} total={total} subject={subject} names={names} t={t} fmt={fmt} pct={pct} />

      <div className="grid-2">
        {twin && <TwinCard twin={twin} subject={subject} t={t} />}
        <SharePanel
          older={older} younger={younger} total={total} twin={twin} famous={famous}
          birthDate={birthDate} subject={subject} shareUrl={shareUrl} t={t}
        />
      </div>

      <TeamPanel
        team={team} clubs={clubs} onTeamChange={onTeamChange} players={players}
        birthDate={birthDate} famous={famous} userAge={userAge} subject={subject} names={names} t={t}
      />

      <div className="grid-2 grid-top">
        <section className="panel">
          <div className="panel-head">
            <h2><Named text={subject.olderTitle(fmt(older))} names={names} /></h2>
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
                <span className="age-marker" lang="en">{a.age === userAge ? subject.marker : ""}</span>
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
            <h2><Named text={subject.sameBirthdayTitle} names={names} /></h2>
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
