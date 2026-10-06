// Vercel Routing Middleware: a shared result link (/?d=… or /?p=…) gets
// link-preview meta tags with that result's score and an /api/og image, so
// WhatsApp, X etc. show "148 pro footballers are older than me" instead of
// the generic card. Everything else, and any failure, falls through to the
// static index.html untouched.
import { score } from "./src/players.js";
import { readShareParams, shareCopy } from "./src/shareCopy.js";

export const config = { matcher: "/" };

// Only link-preview fetchers and search engines read these tags; real visitors
// get the static page at once (the app computes the result in the browser).
// iMessage previews identify as facebookexternalhit/Twitterbot; no UA counts as a bot.
const PREVIEW_BOTS = /bot|crawl|spider|slurp|facebookexternalhit|facebot|whatsapp|telegram|discord|slack|linkedin|pinterest|skype|embedly|iframely|vkshare|snapchat|line\/|preview|google-inspectiontool|googleother/i;
const isPreviewBot = request => {
  const ua = request.headers.get("user-agent") || "";
  return !ua || PREVIEW_BOTS.test(ua);
};

const escapeAttr = s => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Swap the content="" of <meta property|name="key" content="…">, whatever the spacing.
function setMeta(html, attr, key, value) {
  const re = new RegExp(`(<meta\\s+${attr}="${key.replace(/:/g, "\\:")}"\\s+content=")[^"]*(")`);
  return html.replace(re, `$1${escapeAttr(value)}$2`);
}

export default async function middleware(request) {
  const url = new URL(request.url);
  if (!url.searchParams.has("d") && !url.searchParams.has("p")) return;
  if (!isPreviewBot(request)) return;

  try {
    const share = readShareParams(url.searchParams);
    if (!share) return;

    const [htmlRes, dataRes] = await Promise.all([
      // "/" without the query: this middleware passes it through to the static shell
      fetch(new URL("/", url)),
      fetch(new URL("/players.json", url)),
    ]);
    if (!htmlRes.ok || !dataRes.ok) return;
    const [html, data] = await Promise.all([htmlRes.text(), dataRes.json()]);

    const copy = shareCopy(share.lang, score(data.players, share.birthDate, share.famous), share.famous, share.birthDate);
    const image = new URL("/api/og", url);
    image.search = url.search;
    const pageUrl = url.origin + url.pathname + url.search;

    let out = html;
    out = setMeta(out, "property", "og:url", pageUrl);
    out = setMeta(out, "property", "og:title", copy.title);
    out = setMeta(out, "property", "og:description", copy.description);
    out = setMeta(out, "property", "og:image", image.toString());
    out = setMeta(out, "property", "og:image:alt", copy.alt);
    out = setMeta(out, "name", "twitter:title", copy.title);
    out = setMeta(out, "name", "twitter:description", copy.description);
    out = setMeta(out, "name", "twitter:image", image.toString());

    return new Response(out, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=0, must-revalidate",
      },
    });
  } catch {
    return;
  }
}
