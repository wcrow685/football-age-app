// Turkish uppercasing turns i into İ: right for Turkish words ("BİR"), wrong for
// foreign names ("LİONEL MESSİ"). Text that mixes both is split so the names
// can be uppercased with English rules and everything else with the page's.

const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// → [{ text, name }] where `name` marks a piece that is one of `names`.
export function splitNames(text, names) {
  const list = [...new Set(names.filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!list.length) return [{ text, name: false }];
  const re = new RegExp(`(${list.map(escapeRe).join("|")})`, "g");
  return text.split(re).filter(Boolean).map(part => ({ text: part, name: list.includes(part) }));
}

// For canvas / image text, where there is no CSS text-transform to lean on.
export const upperMixed = (text, names, locale) =>
  splitNames(text, names).map(p => p.text.toLocaleUpperCase(p.name ? "en-US" : locale)).join("");
