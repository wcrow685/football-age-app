// Renders public/og-image.png (1200×630) in the Matchday look.
// Needs node-canvas: `npm i --no-save canvas && node server/generateOgImage.mjs`
import { createCanvas, registerFont } from "canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fonts = path.join(__dirname, "fonts");
registerFont(path.join(fonts, "Anton-Regular.ttf"), { family: "Anton" });
registerFont(path.join(fonts, "BarlowCondensed-Bold.ttf"), { family: "Barlow Condensed", weight: "bold" });
registerFont(path.join(fonts, "Barlow-Medium.ttf"), { family: "Barlow", weight: "500" });

const { total } = JSON.parse(fs.readFileSync(path.join(__dirname, "../public/players.json"), "utf8"));

const C = {
  pitch: "#0B2219", pitch2: "#0F2C21", lineSoft: "#22483A", line: "#2C5A47",
  board: "#04110C", chalk: "#F2F5EE", text: "#C9D8CF", muted: "#A9BDB2", accent: "#FFC83D",
};

const W = 1200, H = 630;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext("2d");

// Ground and pitch markings
ctx.fillStyle = C.pitch;
ctx.fillRect(0, 0, W, H);
ctx.strokeStyle = C.lineSoft;
ctx.lineWidth = 3;
ctx.beginPath(); ctx.moveTo(880, 0); ctx.lineTo(880, H); ctx.stroke();
ctx.beginPath(); ctx.arc(880, H / 2, 150, 0, Math.PI * 2); ctx.stroke();

// Same geometry as the site's logo (viewBox 0 0 100 100)
const PATCHES = [
  [[50, 35], [64.3, 45.4], [58.8, 62.1], [41.2, 62.1], [35.7, 45.4]],
  [[50, 21], [35.7, 10.6], [41.2, -6.1], [58.8, -6.1], [64.3, 10.6]],
  [[77.6, 41], [83, 24.3], [100.7, 24.3], [106.1, 41], [91.8, 51.4]],
  [[67, 73.5], [84.7, 73.5], [90.1, 90.2], [75.9, 100.6], [61.6, 90.2]],
  [[33, 73.5], [38.4, 90.2], [24.1, 100.6], [9.9, 90.2], [15.3, 73.5]],
  [[22.4, 41], [8.2, 51.4], [-6.1, 41], [-0.7, 24.3], [17, 24.3]],
];
const SEAMS = [
  [[50, 35], [50, 21]], [[64.3, 45.4], [77.6, 41]], [[58.8, 62.1], [67, 73.5]], [[41.2, 62.1], [33, 73.5]], [[35.7, 45.4], [22.4, 41]],
  [[64.3, 10.6], [83, 24.3]], [[91.8, 51.4], [84.7, 73.5]], [[61.6, 90.2], [38.4, 90.2]], [[15.3, 73.5], [8.2, 51.4]], [[17, 24.3], [35.7, 10.6]],
];

function drawBall(x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 100, size / 100);
  ctx.beginPath(); ctx.arc(50, 50, 46, 0, Math.PI * 2);
  ctx.fillStyle = C.chalk; ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = C.pitch; ctx.strokeStyle = C.pitch;
  ctx.lineWidth = 4; ctx.lineJoin = "round"; ctx.lineCap = "round";
  for (const pts of PATCHES) {
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  for (const [[x1, y1], [x2, y2]] of SEAMS) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

function spaced(text, x, y, spacing) {
  // node-canvas has no letterSpacing; draw glyph by glyph
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
}

ctx.textBaseline = "alphabetic";

// Brand
drawBall(72, 64, 64);
ctx.fillStyle = C.chalk;
ctx.font = "34px Anton";
ctx.fillText("OLDER THAN ME?", 154, 110);

// Kicker
ctx.fillStyle = C.accent;
ctx.beginPath(); ctx.arc(80, 205, 7, 0, Math.PI * 2); ctx.fill();
ctx.font = "bold 26px 'Barlow Condensed'";
spaced(`2026–27 SEASON · 10 LEAGUES · ${total.toLocaleString("en-US")} PLAYERS`, 100, 214, 3);

// Headline
ctx.fillStyle = C.chalk;
ctx.font = "84px Anton";
["HOW MANY PRO", "FOOTBALLERS ARE", "OLDER THAN YOU?"].forEach((line, i) => ctx.fillText(line, 72, 320 + i * 92));

// Scoreboard teaser on the centre circle
const bx = 760, by = 205, bw = 240, bh = 220;
ctx.fillStyle = C.board;
ctx.strokeStyle = C.lineSoft;
ctx.lineWidth = 4;
ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 12); ctx.fill(); ctx.stroke();
ctx.textAlign = "center";
ctx.font = "120px Anton";
ctx.fillStyle = C.accent; ctx.fillText("?", bx + 62, by + 150);
ctx.fillStyle = C.line; ctx.fillText(":", bx + bw / 2, by + 140);
ctx.fillStyle = C.chalk; ctx.fillText("?", bx + bw - 62, by + 150);
ctx.font = "bold 20px 'Barlow Condensed'";
ctx.fillStyle = C.muted;
ctx.fillText("OLDER", bx + 62, by + 190);
ctx.fillText("YOUNGER", bx + bw - 62, by + 190);
ctx.textAlign = "left";

// Footer URL
ctx.fillStyle = C.muted;
ctx.font = "bold 24px 'Barlow Condensed'";
spaced("HOWMANYFOOTBALLPLAYERSOLDERTHANME.COM", 72, 590, 2);

const out = path.join(__dirname, "../public/og-image.png");
fs.writeFileSync(out, canvas.toBuffer("image/png"));
console.log("Saved", out);
