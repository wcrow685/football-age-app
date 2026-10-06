// GET /api/og?d=1995-03-14 (or ?p=lionel-messi, &l=tr) → 1200×630 PNG link
// preview showing that result's scoreline. Invalid params fall back to the
// static og-image.png.
import { ImageResponse } from "@vercel/og";
import { score } from "../src/players.js";
import { readShareParams, shareCopy, formatNumber } from "../src/shareCopy.js";
import { BALL_PATCHES, BALL_SEAMS } from "../src/ball.js";

export const config = { runtime: "edge" };

const C = {
  pitch: "#0B2219", lineSoft: "#22483A", line: "#2C5A47", board: "#04110C",
  chalk: "#F2F5EE", text: "#C9D8CF", muted: "#A9BDB2", accent: "#FFC83D",
};

const BALL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><clipPath id="c"><circle cx="50" cy="50" r="46"/></clipPath><circle cx="50" cy="50" r="46" fill="${C.chalk}"/><g clip-path="url(#c)" stroke="${C.pitch}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"><path fill="${C.pitch}" d="${BALL_PATCHES}"/><path fill="none" d="${BALL_SEAMS}"/></g></svg>`;
const BALL_SRC = `data:image/svg+xml;base64,${btoa(BALL_SVG)}`;

// Satori takes React-element-shaped objects; every box is a flex container.
const box = (style, ...children) => ({ type: "div", props: { style: { display: "flex", ...style }, children } });
const text = (style, value) => ({ type: "div", props: { style: { display: "flex", ...style }, children: value } });

async function font(origin, file) {
  const res = await fetch(new URL(`/fonts/${file}`, origin));
  if (!res.ok) throw new Error(`font ${file}: ${res.status}`);
  return res.arrayBuffer();
}

export default async function handler(request) {
  const url = new URL(request.url);
  const share = readShareParams(url.searchParams);
  if (!share) return Response.redirect(new URL("/og-image.png", url), 302);

  const [data, anton, condensed, barlow] = await Promise.all([
    fetch(new URL("/players.json", url)).then(r => r.json()),
    font(url, "Anton-Regular.ttf"),
    font(url, "BarlowCondensed-Bold.ttf"),
    font(url, "Barlow-Medium.ttf"),
  ]);

  const { lang, famous, birthDate } = share;
  const s = score(data.players, birthDate, famous);
  const copy = shareCopy(lang, s, famous, birthDate);
  const up = str => str.toLocaleUpperCase(lang === "tr" ? "tr-TR" : "en-US");
  const n = x => formatNumber(x, lang);
  const label = { fontFamily: "Barlow Condensed", fontSize: 26, letterSpacing: 3 };

  const side = (num, color, caption) =>
    box({ flex: 1, flexDirection: "column", alignItems: "center", gap: 6 },
      text({ fontFamily: "Anton", fontSize: 168, lineHeight: 1, color }, num),
      text({ ...label, color: C.chalk, textAlign: "center" }, up(caption)),
    );

  const tree = box(
    { width: "100%", height: "100%", flexDirection: "column", justifyContent: "space-between", padding: "52px 64px", background: C.pitch, color: C.chalk },
    box({ justifyContent: "space-between", alignItems: "center" },
      box({ alignItems: "center", gap: 16 },
        { type: "img", props: { src: BALL_SRC, width: 56, height: 56 } },
        text({ fontFamily: "Anton", fontSize: 32, letterSpacing: 1 }, up(copy.brand)),
      ),
      text({ ...label, color: C.accent }, `${up(copy.top)} · 2026–27`),
    ),
    text({ ...label, color: C.muted }, up(copy.subject)),
    box(
      { alignItems: "center", padding: "26px 32px 22px", background: C.board, border: `4px solid ${C.lineSoft}`, borderRadius: 16 },
      side(n(s.older), C.accent, copy.olderLabel),
      text({ fontFamily: "Anton", fontSize: 128, color: C.line, padding: "0 12px 40px" }, ":"),
      side(n(s.younger), C.chalk, copy.youngerLabel),
    ),
    box({ justifyContent: "space-between", alignItems: "center", gap: 24 },
      text({ fontFamily: "Barlow", fontSize: 28, color: C.text }, copy.twinLine),
      text({ ...label, fontSize: 28, color: C.accent }, `${up(copy.cta)} →`),
    ),
  );

  // Render fully before answering: ImageResponse streams, so a render error
  // would otherwise reach WhatsApp & co. as an empty 200.
  try {
    const png = await new ImageResponse(tree, {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Anton", data: anton, weight: 400, style: "normal" },
        { name: "Barlow Condensed", data: condensed, weight: 700, style: "normal" },
        { name: "Barlow", data: barlow, weight: 500, style: "normal" },
      ],
    }).arrayBuffer();
    if (!png.byteLength) throw new Error("empty image");
    return new Response(png, {
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err) {
    console.error("og render failed", err);
    return new Response(null, {
      status: 302,
      headers: { location: new URL("/og-image.png", url).toString(), "x-og-error": String(err?.message || err).slice(0, 200) },
    });
  }
}
