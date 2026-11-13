// The "player card" shown on results and drawn into the story image.
// Number = age; colour follows a FIFA-style career curve; position comes from
// the closest-age player (a famous player keeps their own); six stats from the result.
import { isSamePlayer } from "./players";

// Bronze → silver → gold → silver → bronze; famous players get the legend card.
export const TIERS = {
  bronze: { rim: "#6B3E1F", light: "#F2C9A1", base: "#C98A55", deep: "#99602F", ink: "#2E1808" },
  silver: { rim: "#6E767C", light: "#F4F6F7", base: "#C9CFD3", deep: "#9AA3A9", ink: "#24292D" },
  gold:   { rim: "#8A6A17", light: "#FBE7A1", base: "#E2B84A", deep: "#B88A1F", ink: "#3A2A06" },
  legend: { rim: "#FFC83D", light: "#2A2A2A", base: "#141414", deep: "#050505", ink: "#FFC83D" },
};

// [max age, tier, label key] — first row whose max age fits wins.
const CURVE = [
  [20, "bronze", "young"],
  [24, "silver", "rising"],
  [31, "gold", "prime"],
  [34, "silver", "experienced"],
  [Infinity, "bronze", "veteran"],
];

export function cardTier(age, famous) {
  if (famous) return { tier: "legend", stage: "legend" };
  const [, tier, stage] = CURVE.find(([max]) => age <= max);
  return { tier, stage };
}

const LEAGUE_SHORT = {
  "Premier League": "PL", "La Liga": "LL", "Bundesliga": "BL", "Serie A": "SA", "Ligue 1": "L1",
  "Eredivisie": "ERE", "Liga Portugal": "LPT", "Süper Lig": "SL", "Saudi Pro League": "SPL", "MLS": "MLS",
};

// Short name for the card: last word, unless the famous entry says otherwise.
const famousCardName = f => f.cardName || f.name.split(" ").slice(-1)[0];

/**
 * @param {object} result  computeResult() output
 * @param {object} t       translations for the current language
 * @param {string} [typedName] the visitor's name, if they gave one
 */
export function buildCard(result, t, typedName = "") {
  const { userAge, older, younger, total, twin, sameBirthday, byLeague, famous, players } = result;
  const { tier, stage } = cardTier(userAge, famous);

  const self = famous && players.find(p => isSamePlayer(p, famous));
  const position = (self || twin)?.position;
  const name = famous ? famousCardName(famous) : typedName.trim() || t.card.you;
  // Capped at 99: rounding 99.6 up to "100%" would claim you're older than everyone
  const pctOlderThan = Math.min(99, Math.round((younger / total) * 100));

  return {
    tier,
    colors: TIERS[tier],
    stageLabel: t.card.stages[stage],
    age: userAge,
    pos: t.card.positions[position] || "—",
    name,
    nameLang: famous ? "en" : t.locale.slice(0, 2),
    // No typed name: the ball stands in for an initial
    initial: famous || typedName.trim() ? name.trim()[0] : null,
    stats: [
      { k: t.card.stats.top, v: t.percent(pctOlderThan) },
      { k: t.card.stats.older, v: String(older) },
      { k: t.card.stats.younger, v: String(younger) },
      { k: t.card.stats.twin, v: twin ? `${Math.abs(twin.days)}${t.card.dayShort}` : "—" },
      { k: t.card.stats.bday, v: String(sameBirthday.length) },
      { k: t.card.stats.league, v: older ? LEAGUE_SHORT[byLeague[0]?.name] || "—" : "—" },
    ],
  };
}
