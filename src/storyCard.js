// Draws the 1080×1920 share card (Instagram/WhatsApp story) on a canvas.
import { BALL_PATCHES, BALL_SEAMS } from "./ball";
import { upperMixed } from "./casing";
import { nameLang } from "./players";

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

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
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

/**
 * @param {object} p
 * @param {number} p.older    players older than the subject
 * @param {number} p.younger  players younger than the subject
 * @param {object|null} p.twin closest-age player ({ name, club, league, days })
 * @param {object} p.t        translations for the current language
 * @param {object} p.subject  t.me or t.them(famous)
 * @param {string[]} [p.names] the famous player's name forms, uppercased with English rules
 * @returns {Promise<Blob>}
 */
export async function renderStoryCard({ older, younger, twin, t, subject, names = [] }) {
  await loadFonts();
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const fmt = n => n.toLocaleString(t.locale);
  const upper = s => upperMixed(s, names, t.locale);

  // Ground and pitch markings
  ctx.fillStyle = C.pitch;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = C.ghost;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(W / 2, H / 2, 360, 0, Math.PI * 2); ctx.stroke();

  // Top row
  ctx.textBaseline = "alphabetic";
  ctx.font = `700 34px ${LABEL}`;
  setSpacing(ctx, 5);
  ctx.textAlign = "left";
  ctx.fillStyle = C.muted;
  ctx.fillText(upper(t.storyTop), PAD, 172);
  ctx.textAlign = "right";
  ctx.fillStyle = C.accent;
  ctx.fillText("2026–27", W - PAD, 172);
  setSpacing(ctx, 0);

  // Scoreboard
  const bx = 160, by = 420, bw = W - 320, bh = 600;
  roundRect(ctx, bx, by, bw, bh, 16);
  ctx.fillStyle = C.board;
  ctx.fill();
  ctx.strokeStyle = C.lineSoft;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = C.accent;
  fitFont(ctx, fmt(older), bw - 80, 360, DISPLAY);
  ctx.fillText(fmt(older), W / 2, by + 380);

  ctx.fillStyle = C.chalk;
  ctx.font = `700 46px ${LABEL}`;
  setSpacing(ctx, 4);
  wrapCentered(ctx, upper(subject.storyOlder), W / 2, by + 480, bw - 80, 56);
  setSpacing(ctx, 0);

  // "…and I'm older than N of them."
  ctx.fillStyle = C.text;
  ctx.font = `500 46px ${BODY}`;
  wrapCentered(ctx, subject.storyYounger(fmt(younger)), W / 2, by + bh + 110, W - 2 * PAD - 80, 60);

  // Age twin
  if (twin) {
    const cx = PAD, cy = 1330, cw = W - 2 * PAD, ch = 260;
    roundRect(ctx, cx, cy, cw, ch, 12);
    ctx.fillStyle = C.chalk;
    ctx.fill();

    roundRect(ctx, cx + 40, cy + 40, 150, 180, 8);
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 4;
    ctx.stroke();
    const sign = twin.days > 0 ? "+" : twin.days < 0 ? "−" : "";
    ctx.fillStyle = C.ink;
    ctx.textAlign = "center";
    fitFont(ctx, `${sign}${Math.abs(twin.days)}`, 130, 72, DISPLAY);
    ctx.fillText(`${sign}${Math.abs(twin.days)}`, cx + 115, cy + 145);
    ctx.font = `700 26px ${LABEL}`;
    setSpacing(ctx, 3);
    ctx.fillText(upper(t.daysLabel(Math.abs(twin.days))), cx + 115, cy + 190);

    const tx = cx + 230, tw = cw - 270;
    ctx.textAlign = "left";
    ctx.fillStyle = C.inkMuted;
    ctx.font = `700 28px ${LABEL}`;
    ctx.fillText(upper(subject.storyTwin), tx, cy + 80);
    setSpacing(ctx, 0);
    ctx.fillStyle = C.ink;
    const name = twin.name.toLocaleUpperCase(nameLang(twin) === "tr" ? "tr-TR" : "en-US");
    fitFont(ctx, name, tw, 64, DISPLAY);
    ctx.fillText(name, tx, cy + 155);
    ctx.fillStyle = C.ink2;
    fitFont(ctx, `${twin.club} · ${twin.league}`, tw, 30, BODY, "500");
    ctx.fillText(`${twin.club} · ${twin.league}`, tx, cy + 205);
  }

  // Footer
  drawBall(ctx, W / 2 - 40, 1650, 80);
  ctx.textAlign = "center";
  ctx.font = `700 32px ${LABEL}`;
  setSpacing(ctx, 3);
  ctx.fillStyle = C.muted;
  ctx.fillText(upper(t.storyCta), W / 2, 1800);
  ctx.fillStyle = C.chalk;
  fitFont(ctx, "HOWMANYFOOTBALLPLAYERSOLDERTHANME.COM", W - 2 * PAD, 32, LABEL, "700");
  ctx.fillText("HOWMANYFOOTBALLPLAYERSOLDERTHANME.COM", W / 2, 1848);
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
