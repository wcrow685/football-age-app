import { useId } from "react";
import { BALL_PATCHES, BALL_SEAMS } from "../ball";

function Ball({ size }) {
  const clip = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <clipPath id={clip}><circle cx="50" cy="50" r="46" /></clipPath>
      <circle cx="50" cy="50" r="46" fill="#F2F5EE" />
      <g clipPath={`url(#${clip})`} stroke="#0B2219" strokeWidth="5" strokeLinejoin="round">
        <path fill="#0B2219" d={BALL_PATCHES} />
        <path fill="none" d={BALL_SEAMS} />
      </g>
      <circle cx="50" cy="50" r="46" fill="none" stroke="#0B2219" strokeWidth="5" />
    </svg>
  );
}

// Shield-shaped card; colours come from the tier as CSS variables.
export default function PlayerCard({ card, t }) {
  const { colors } = card;
  const style = {
    "--card-rim": colors.rim,
    "--card-light": colors.light,
    "--card-base": colors.base,
    "--card-deep": colors.deep,
    "--card-ink": colors.ink,
  };
  return (
    <figure className="pcard" style={style} aria-label={`${card.name}, ${card.age}, ${card.pos}, ${card.stageLabel}`}>
      <div className="pcard-face">
        <div className="pcard-top">
          <div className="pcard-rating">
            <span className="pcard-age">{card.age}</span>
            <span className="pcard-pos">{card.pos}</span>
            <span className="pcard-rule" />
            <Ball size={28} />
          </div>
          <div className="pcard-portrait" aria-hidden="true">
            {card.initial ? <span lang={card.nameLang}>{card.initial}</span> : <Ball size={64} />}
          </div>
        </div>
        <div className="pcard-name" lang={card.nameLang}>{card.name}</div>
        <span className="pcard-divider" />
        <dl className="pcard-stats">
          {card.stats.map(s => (
            <div key={s.k}>
              <dt>{s.k}</dt>
              <dd>{s.v}</dd>
            </div>
          ))}
        </dl>
        <div className="pcard-footer">{t.card.footer(card.stageLabel)}</div>
      </div>
    </figure>
  );
}
