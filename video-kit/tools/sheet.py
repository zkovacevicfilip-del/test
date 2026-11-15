# Náhledy ke kontrole: vybere klíčové snímky (střed a konec každé věty) a složí je do archů po 12.
#   python sheet.py frames <work>   → vypíše čísla snímků oddělená čárkou
#   python sheet.py make <work>     → work/stills/sheet-1.jpg …
import json, sys, glob, os
mode, WORK = sys.argv[1], sys.argv[2]
tl = json.load(open(WORK + "/timeline.json", encoding="utf-8"))
fr = sorted({min(tl["frames"] - 1, int(round(x * 30))) for l in tl["lines"].values() for x in ((l["start"] + l["end"]) / 2, l["end"] - 0.1)} | {tl["frames"] - 20})
if mode == "frames": print(",".join(map(str, fr))); sys.exit()
from PIL import Image, ImageDraw
for old in glob.glob(WORK + "/stills/sheet-*.jpg"): os.remove(old)
for n in range(0, len(fr), 12):
    part = fr[n:n + 12]; sh = Image.new("RGB", (4 * 280, ((len(part) + 3) // 4) * 500), (90, 90, 90))
    for i, f in enumerate(part):
        im = Image.open(f"{WORK}/stills/{f:05d}.jpg").resize((270, 480)); ImageDraw.Draw(im).text((8, 6), f"{f / 30:.1f} s", fill=(255, 255, 0))
        sh.paste(im, ((i % 4) * 280 + 5, (i // 4) * 500 + 10))
    p = f"{WORK}/stills/sheet-{n // 12 + 1}.jpg"; sh.save(p, quality=86); print("náhled:", p)
