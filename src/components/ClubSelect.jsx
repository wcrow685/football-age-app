// Native select grouped by league: accessible and comfortable on phones.
export default function ClubSelect({ clubs, value, onChange, noneLabel, id }) {
  return (
    <select id={id} value={value} onChange={e => onChange(e.target.value)}>
      <option value="">{noneLabel}</option>
      {clubs.map(g => (
        <optgroup key={g.league} label={g.league}>
          {g.clubs.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </optgroup>
      ))}
    </select>
  );
}
