# Apply Transfermarkt spellings from fetchTmNames.py output to public/players.json.
#   python3 server/applyTmNames.py /tmp/tm_names*.json          (dry run: prints changes)
#   python3 server/applyTmNames.py /tmp/tm_names*.json --write
# A name changes only when it differs from Transfermarkt's by accents alone, or
# word-by-word where single words match ("Mert Yandas" → "Mert Yandaş"), so
# nicknames and wrong Transfermarkt matches are left alone. Slugs don't change.
import json, os, sys, unicodedata
ROOT = os.path.join(os.path.dirname(__file__), "../public/players.json")
WRITE = "--write" in sys.argv
def norm(s):
    s = s.replace("ı", "i").replace("İ", "I")
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn").lower().strip()

tm = {}
for f in [x for x in sys.argv[1:] if not x.startswith("--")]:
    tm.update(json.load(open(f, encoding="utf-8")))

CLUBS = {  # Süper Lig clubs as the data spells them → Turkish spelling
    "Besiktas": "Beşiktaş", "Caykur Rizespor": "Çaykur Rizespor", "Eyupspor": "Eyüpspor",
    "Fenerbahce": "Fenerbahçe", "Genclerbirligi": "Gençlerbirliği", "Goztepe": "Göztepe",
    "Istanbul Basaksehir": "İstanbul Başakşehir", "Kasimpasa": "Kasımpaşa",
}

# Two names arrived with HTML entities and a stray capital ("Bahad&#305;R").
ENTITY_FIXES = {"Bahad&#305;R Han Gungordu": "Bahadır Han Güngördü", "Ibrahim Alk&#305;S": "İbrahim Alkış"}

def borrow_accents(ours, theirs):
    """Keep our name's words; take a word's accented form from TM where it matches."""
    pool = {norm(w): w for w in theirs.split()}
    return " ".join(pool.get(norm(w), w) for w in ours.split())

raw = open(ROOT, encoding="utf-8").read()
d = json.loads(raw)
renamed, skipped, clubs_fixed = [], [], 0
for p in d["players"]:
    if p["club"] in CLUBS:
        p["club"] = CLUBS[p["club"]]; clubs_fixed += 1
    if p["name"] in ENTITY_FIXES:
        renamed.append((p["name"], ENTITY_FIXES[p["name"]])); p["name"] = ENTITY_FIXES[p["name"]]
        continue
    r = tm.get(p.get("tmUrl"))
    if not r or not r.get("tm") or r["tm"] == p["name"]:
        continue
    if norm(r["tm"]) == norm(p["name"]):
        renamed.append((p["name"], r["tm"])); p["name"] = r["tm"]
    else:
        merged = borrow_accents(p["name"], r["tm"])
        if merged != p["name"]:
            renamed.append((p["name"], merged + "   (word-by-word)")); p["name"] = merged
        else:
            skipped.append((p["name"], r["tm"]))

print(f"lookups: {len(tm)}  renamed: {len(renamed)}  skipped (not just accents): {len(skipped)}  club rows fixed: {clubs_fixed}")
for a, b in renamed[:400]: print(f"  {a}  →  {b}")
print("--- skipped")
for a, b in skipped: print(f"  {a}  ≠  {b}")
print("--- famous clubs (ours vs Transfermarkt)")
for url, r in tm.items():
    if r.get("club_tm") and r["ours"] in {"Lionel Messi","Cristiano Ronaldo","Kylian Mbappé","Erling Haaland","Vinícius Júnior","Jude Bellingham","Mohamed Salah","Lamine Yamal","Harry Kane","Pedri","Rodri","Arda Güler"}:
        print(f"  {r['ours']}: {r['club_ours']}  |  TM: {r['club_tm']}")
for p in d["players"]:
    p["name"] = p["name"].replace("   (word-by-word)", "")
if WRITE:
    open(ROOT, "w", encoding="utf-8").write(json.dumps(d, ensure_ascii=False, separators=(",", ":")))
    print("written")
