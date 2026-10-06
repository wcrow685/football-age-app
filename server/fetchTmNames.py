# Fetch Transfermarkt display names (and current club) for Turkish players and
# Süper Lig squads, so applyTmNames.py can restore Turkish/accented spellings.
#   python3 server/fetchTmNames.py /tmp/tm_names.json [--partial]
# --partial: names that already have some accents (e.g. "Gündogan"); default: plain-ASCII names.
# Polite: one request every ~1.2 s (≈ 10–20 min for the Süper Lig + Turkish players).
import json, os, re, subprocess, sys, time, html
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141 Safari/537.36"
data = json.load(open(os.path.join(os.path.dirname(__file__), "../public/players.json"), encoding="utf-8"))["players"]
PARTIAL = "--partial" in sys.argv
OUT = next(a for a in sys.argv[1:] if not a.startswith("--"))
is_ascii = lambda s: all(ord(c) < 128 for c in s)
FAMOUS = {"Lionel Messi","Cristiano Ronaldo","Kylian Mbappé","Erling Haaland","Vinícius Júnior","Jude Bellingham","Mohamed Salah","Lamine Yamal","Harry Kane","Pedri","Rodri","Arda Güler"}
turkish = lambda p: p["nationality"] == "Türkiye" or p["league"] == "Süper Lig"
targets = [p for p in data if p.get("tmUrl") and (
    (turkish(p) and is_ascii(p["name"]) != PARTIAL and p["name"] not in FAMOUS) or (not PARTIAL and p["name"] in FAMOUS))]
out = {}
for i, p in enumerate(targets):
    try:
        h = subprocess.run(["curl", "-sL", "--max-time", "20", "-A", UA, p["tmUrl"]], capture_output=True, text=True).stdout
        m = re.search(r'<h1 class="data-header__headline-wrapper[^"]*">(.*?)</h1>', h, re.S)
        name = None
        if m:
            t = re.sub(r'<span class="data-header__shirt-number">.*?</span>', "", m.group(1), flags=re.S)
            name = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", t))).strip()
        c = re.search(r'data-header__club"[^>]*>\s*<a[^>]*title="([^"]+)"', h)
        out[p["tmUrl"]] = {"ours": p["name"], "tm": name, "club_ours": p["club"], "club_tm": html.unescape(c.group(1)) if c else None}
    except Exception as e:
        out[p["tmUrl"]] = {"ours": p["name"], "error": str(e)}
    if i % 25 == 0:
        print(f"{i}/{len(targets)}", flush=True)
        json.dump(out, open(OUT, "w"), ensure_ascii=False, indent=1)
    time.sleep(1.2)
json.dump(out, open(OUT, "w"), ensure_ascii=False, indent=1)
print("done", len(out), flush=True)
