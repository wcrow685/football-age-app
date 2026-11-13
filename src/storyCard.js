// Draws the 1080×1920 share image (Instagram/WhatsApp story): the player card plus the scoreline.
import { BALL_PATCHES, BALL_SEAMS } from "./ball";
import { upperMixed } from "./casing";

const W = 1080;
const H = 1920;
const PAD = 96;

const C = {
  pitch: "#0B2219", ghost: "#1A4434", lineSoft: "#22483A", line: "#2C5A47",
  board: "#04110C", chalk: "#F2F5EE", text: "#C9D8CF", muted: "#A9BDB2",
  ink: "#0B2219", ink2: "#2F4239", inkMuted: "#4A5D53", accent: "#FFC83D",
};

const DISPLAY = "Anton, Impact, sans-serif";
const LABEL = "'Barlow Condensed', 'Arial Narrow', sans-serif";
const BODY = "Barlow, system-ui, sans-serif";

function setSpacing(ctx, px) {
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${px}px`;
}

// Shrinks the font until `text` fits `maxWidth`.
function fitFont(ctx, text, maxWidth, size, family, weight = "") {
  let s = size;
  do {
    ctx.font = `${weight} ${s}px ${family}`.trim();
    if (ctx.measureText(text).width <= maxWidth) break;
    s -= 2;
  } while (s > 12);
  return s;
}

// Word-wraps centred text; returns the y below the last line.
function wrapCentered(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = next;
    }
  }
  ctx.fillText(line, x, y);
  return y + lineHeight;
}

function drawBall(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 100, size / 100);
  ctx.beginPath();
  ctx.arc(50, 50, 46, 0, Math.PI * 2);
  ctx.fillStyle = C.chalk;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = C.ink;
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const patches = new Path2D(BALL_PATCHES);
  ctx.fill(patches);
  ctx.stroke(patches);
  ctx.stroke(new Path2D(BALL_SEAMS));
  ctx.restore();
  ctx.restore();
}

async function loadFonts() {
  if (!document.fonts?.load) return;
  await Promise.all([
    document.fonts.load(`360px ${DISPLAY}`),
    document.fonts.load(`700 40px ${LABEL}`),
    document.fonts.load(`500 40px ${BODY}`),
  ]).catch(() => {});
}

// The card's shield outline (same polygon as .pcard in App.css), scaled to w×h at x,y.
function shieldPath(ctx, x, y, w, h) {
  const pts = [[0.5, 0], [1, 0.07], [1, 0.84], [0.5, 1], [0, 0.84], [0, 0.07]];
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i ? ctx.lineTo(x + px * w, y + py * h) : ctx.moveTo(x + px * w, y + py * h)));
  ctx.closePath();
}

function drawPlayerCard(ctx, card, t, x, y, w, h) {
  const s = w / 320; // the on-page card is 320 px wide
  const { colors } = card;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 30;
  shieldPath(ctx, x, y, w, h);
  ctx.fillStyle = colors.rim;
  ctx.fill();
  ctx.restore();

  const i = 5 * s;
  const face = ctx.createLinearGradient(x, y, x + w * 0.36, y + h);
  face.addColorStop(0, colors.light);
  face.addColorStop(0.55, colors.base);
  face.addColorStop(1, colors.deep);
  shieldPath(ctx, x + i, y + i, w - 2 * i, h - 2 * i);
  ctx.fillStyle = face;
  ctx.fill();

  const ink = colors.ink;
  const top = y + 36 * s;
  const left = x + 26 * s;
  const right = x + w - 26 * s;
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;
  ctx.textAlign = "center";

  // Rating column: age, position, rule, ball
  const rx = left + 34 * s;
  ctx.font = `${62 * s}px ${DISPLAY}`;
  ctx.fillText(String(card.age), rx, top + 52 * s);
  ctx.font = `700 ${21 * s}px ${LABEL}`;
  ctx.fillText(card.pos, rx, top + 78 * s);
  ctx.globalAlpha = 0.4;
  ctx.fillRect(rx - 15 * s, top + 88 * s, 30 * s, 2 * s);
  ctx.globalAlpha = 1;
  drawBall(ctx, rx - 14 * s, top + 96 * s, 28 * s);

  // Portrait circle: initial, or the ball when no name was given
  const pr = 69 * s;
  const pcx = right - pr;
  const pcy = top + pr;
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  ctx.arc(pcx, pcy, pr - 1.5 * s, 0, Math.PI * 2);
  ctx.stroke();
  if (card.initial) {
    ctx.font = `${74 * s}px ${DISPLAY}`;
    ctx.fillText(card.initial.toLocaleUpperCase(card.nameLang === "tr" ? "tr-TR" : "en-US"), pcx, pcy + 27 * s);
  } else {
    drawBall(ctx, pcx - 32 * s, pcy - 32 * s, 64 * s);
  }

  // Name and divider
  const nameY = top + 138 * s + 44 * s;
  const name = card.name.toLocaleUpperCase(card.nameLang === "tr" ? "tr-TR" : "en-US");
  ctx.fillStyle = ink;
  fitFont(ctx, name, w - 70 * s, 32 * s, DISPLAY);
  ctx.fillText(name, x + w / 2, nameY);
  ctx.globalAlpha = 0.35;
  ctx.fillRect(left, nameY + 10 * s, right - left, 2 * s);
  ctx.globalAlpha = 1;

  // Stats: value right-aligned, key after it, two columns
  const colW = (right - left - 18 * s) / 2;
  card.stats.forEach((st, k) => {
    const cx = left + (k % 2) * (colW + 18 * s);
    const cy = nameY + 42 * s + Math.floor(k / 2) * 27 * s;
    ctx.textAlign = "right";
    ctx.font = `${21 * s}px ${DISPLAY}`;
    ctx.fillText(st.v, cx + 52 * s, cy);
    ctx.textAlign = "left";
    ctx.font = `700 ${19 * s}px ${LABEL}`;
    ctx.fillText(st.k, cx + 60 * s, cy);
  });

  ctx.textAlign = "center";
  ctx.globalAlpha = 0.8;
  ctx.font = `700 ${12 * s}px ${LABEL}`;
  setSpacing(ctx, 2 * s);
  ctx.fillText(t.card.footer(card.stageLabel).toLocaleUpperCase(t.locale), x + w / 2, nameY + 42 * s + 2 * 27 * s + 34 * s);
  setSpacing(ctx, 0);
  ctx.globalAlpha = 1;
}

/**
 * @param {object} p
 * @param {object} p.card     buildCard() output
 * @param {number} p.older    players older than the subject
 * @param {number} p.younger  players younger than the subject
 * @param {object} p.t        translations for the current language
 * @param {object} p.subject  t.me or t.them(famous)
 * @param {string[]} [p.names] the famous player's name forms, uppercased with English rules
 * @returns {Promise<Blob>}
 */
export async function renderStoryCard({ card, older, younger, t, subject, names = [] }) {
  await loadFonts();
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const fmt = n => n.toLocaleString(t.locale);
  const upper = str => upperMixed(str, names, t.locale);

  // Ground and pitch markings
  ctx.fillStyle = C.pitch;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = C.ghost;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 760); ctx.lineTo(W, 760); ctx.stroke();
  ctx.beginPath(); ctx.arc(W / 2, 760, 360, 0, Math.PI * 2); ctx.stroke();

  // Top row
  ctx.textBaseline = "alphabetic";
  ctx.font = `700 34px ${LABEL}`;
  setSpacing(ctx, 5);
  ctx.textAlign = "left";
  ctx.fillStyle = C.muted;
  ctx.fillText(upper(t.storyTop), PAD, 140);
  ctx.textAlign = "right";
  ctx.fillStyle = C.accent;
  ctx.fillText("2026–27", W - PAD, 140);
  setSpacing(ctx, 0);

  // The player card
  const cw = 680, chh = Math.round(cw * 472 / 320);
  drawPlayerCard(ctx, card, t, (W - cw) / 2, 210, cw, chh);

  // Scoreline under the card
  const sy = 210 + chh + 130;
  ctx.textAlign = "center";
  ctx.fillStyle = C.accent;
  ctx.font = `150px ${DISPLAY}`;
  ctx.fillText(fmt(older), W / 2, sy);
  ctx.fillStyle = C.chalk;
  ctx.font = `700 44px ${LABEL}`;
  setSpacing(ctx, 4);
  wrapCentered(ctx, upper(subject.storyOlder), W / 2, sy + 62, W - 2 * PAD, 52);
  setSpacing(ctx, 0);
  ctx.fillStyle = C.text;
  ctx.font = `500 40px ${BODY}`;
  wrapCentered(ctx, subject.storyYounger(fmt(younger)), W / 2, sy + 136, W - 2 * PAD, 52);

  // Footer
  drawBall(ctx, W / 2 - 34, 1700, 68);
  ctx.textAlign = "center";
  ctx.font = `700 30px ${LABEL}`;
  setSpacing(ctx, 3);
  ctx.fillStyle = C.muted;
  ctx.fillText(upper(t.storyCta), W / 2, 1822);
  ctx.fillStyle = C.chalk;
  fitFont(ctx, "HOWMANYFOOTBALLPLAYERSOLDERTHANME.COM", W - 2 * PAD, 30, LABEL, "700");
  ctx.fillText("HOWMANYFOOTBALLPLAYERSOLDERTHANME.COM", W / 2, 1866);
  setSpacing(ctx, 0);

  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error("Could not create image"))), "image/png"),
  );
}

// Opens the share sheet where the browser can share files (phones), else downloads.
export async function shareOrDownload(blob, filename, title) {
  const file = new File([blob], filename, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return;
    } catch (err) {
      if (err.name === "AbortError") return;
      // NotAllowedError (activation expired while drawing) falls through to a download
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
