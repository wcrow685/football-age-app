import { createCanvas } from "canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const W = 1200;
const H = 630;

const canvas = createCanvas(W, H);
const ctx = canvas.getContext("2d");

// Background gradient
const bg = ctx.createLinearGradient(0, 0, W, H);
bg.addColorStop(0,   "#0f0f23");
bg.addColorStop(0.5, "#1a1a3e");
bg.addColorStop(1,   "#0d1f12");
ctx.fillStyle = bg;
ctx.fillRect(0, 0, W, H);

// Green glow at top
const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 500);
glow.addColorStop(0,   "rgba(16,185,129,0.25)");
glow.addColorStop(1,   "rgba(16,185,129,0)");
ctx.fillStyle = glow;
ctx.fillRect(0, 0, W, H);

// Subtle grid lines
ctx.strokeStyle = "rgba(255,255,255,0.04)";
ctx.lineWidth = 1;
for (let x = 0; x < W; x += 80) {
  ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
}
for (let y = 0; y < H; y += 80) {
  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
}

// Football emoji (large)
ctx.font = "110px serif";
ctx.textAlign = "center";
ctx.fillText("⚽", W / 2, 180);

// Main title
ctx.fillStyle = "#f1f5f9";
ctx.font = "bold 72px Arial, sans-serif";
ctx.textAlign = "center";
ctx.fillText("How Many Football Players", W / 2, 295);
ctx.fillText("Are Older Than Me?", W / 2, 380);

// Green underline accent
ctx.fillStyle = "#10b981";
ctx.fillRect(W / 2 - 180, 400, 360, 5);

// Subtitle
ctx.fillStyle = "#94a3b8";
ctx.font = "32px Arial, sans-serif";
ctx.fillText("Compare your age to 5385 active pro footballers", W / 2, 460);
ctx.fillText("across 8 of the world's biggest leagues", W / 2, 505);

// Domain pill at bottom
ctx.fillStyle = "rgba(16,185,129,0.15)";
const pillW = 560, pillH = 48, pillX = (W - pillW) / 2, pillY = 548;
ctx.beginPath();
ctx.roundRect(pillX, pillY, pillW, pillH, 24);
ctx.fill();

ctx.strokeStyle = "rgba(16,185,129,0.4)";
ctx.lineWidth = 1.5;
ctx.stroke();

ctx.fillStyle = "#10b981";
ctx.font = "bold 22px Arial, sans-serif";
ctx.fillText("howmanyfootballplayersolderthanme.com", W / 2, 579);

// Save
const outPath = path.join(__dirname, "../public/og-image.png");
const buffer = canvas.toBuffer("image/png");
fs.writeFileSync(outPath, buffer);
console.log(`Saved: ${outPath} (${(buffer.length / 1024).toFixed(0)} KB)`);
