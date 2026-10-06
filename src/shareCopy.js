// Wording for a shared result's link preview (meta tags and the /api/og image).
// Kept apart from i18n.js so the server side doesn't pull in the app's UI copy.
import { findFamous, isValidBirth } from "./players.js";

// ?d=1995-03-14 or ?p=lionel-messi, plus &l=tr for a Turkish preview.
export function readShareParams(params) {
  const famous = params.get("p") ? findFamous(params.get("p")) : undefined;
  const birthDate = famous ? famous.birth : params.get("d");
  if (!famous && !(birthDate && isValidBirth(birthDate))) return null;
  return { famous, birthDate, lang: params.get("l") === "tr" ? "tr" : "en" };
}

const MONTHS = {
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  tr: ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"],
};

// Intl in edge runtimes may lack Turkish data, so group digits by hand.
export const formatNumber = (n, lang) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, lang === "tr" ? "." : ",");

function longDate(iso, lang) {
  const [y, m, d] = iso.split("-");
  return `${parseInt(d)} ${MONTHS[lang][parseInt(m) - 1]} ${y}`;
}

/**
 * @param {"en"|"tr"} lang
 * @param {{older:number, younger:number, total:number, twin:object|null}} s  from players.score()
 * @param {object|undefined} famous  a FAMOUS_PLAYERS entry, or undefined for a birth date
 * @param {string} birthDate  YYYY-MM-DD
 */
export function shareCopy(lang, s, famous, birthDate) {
  const n = x => formatNumber(x, lang);
  const date = longDate(birthDate, lang);
  const twin = s.twin;

  if (lang === "tr") {
    const from = famous ? famous.trFrom || famous.name : "benden";
    return {
      brand: "Benden Yaşlı mı?",
      title: `${n(s.older)} profesyonel futbolcu ${from} yaşlı ⚽`,
      description: `10 büyük ligdeki ${n(s.total)} aktif futbolcu arasından.`
        + (twin ? ` ${famous ? "En yakın yaşıtı" : "En yakın yaşıtım"}: ${twin.name}.` : "")
        + " Senin skorun ne?",
      top: "Maç sonu",
      subject: famous ? `${famous.name} · ${date}` : `${date} doğumlu`,
      olderLabel: famous ? "Ondan yaşlı" : "Benden yaşlı",
      youngerLabel: famous ? "Ondan genç" : "Benden genç",
      twinLine: twin ? `${famous ? "Yaşıtı" : "Yaşıtım"}: ${twin.name} (${twin.club})` : "",
      cta: "Senin skorun ne?",
      alt: `Skor: ${n(s.older)} ${famous ? "ondan" : "benden"} yaşlı, ${n(s.younger)} ${famous ? "ondan" : "benden"} genç`,
    };
  }

  const who = famous ? famous.name : "me";
  return {
    brand: "Older Than Me?",
    title: `${n(s.older)} pro footballers are older than ${who} ⚽`,
    description: `Out of ${n(s.total)} active players in 10 top leagues.`
      + (twin ? ` ${famous ? `${famous.name}'s` : "My"} closest age twin: ${twin.name}.` : "")
      + " What's your score?",
    top: "Full time",
    subject: famous ? `${famous.name} · born ${date}` : `Born ${date}`,
    olderLabel: famous ? `Older than ${famous.name}` : "Older than me",
    youngerLabel: famous ? `Younger than ${famous.name}` : "Younger than me",
    twinLine: twin ? `${famous ? "Age twin" : "My age twin"}: ${twin.name} (${twin.club})` : "",
    cta: "What's your score?",
    alt: `Scoreline: ${n(s.older)} older, ${n(s.younger)} younger`,
  };
}
