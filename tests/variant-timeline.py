# Test časové osy varianty (video-kit/tools/variant_timeline.py, trial reels, autor 28. 11. 2026).
#   python variant-timeline.py <cesta k variant_timeline.py>
# Základ: háček 0,15–1,42, druhá věta 1,74–6,06, třetí od 6,68. Krátký háček nic neposune, delší posune druhou větu jen do
# volného místa (časy dalších vět stejné), moc dlouhý se zrychlí (nejvýš 1,15×), ještě delší se odmítne.
import importlib.util, sys
spec = importlib.util.spec_from_file_location("vt", sys.argv[1]); vt = importlib.util.module_from_spec(spec); spec.loader.exec_module(vt)
base = {"total": 46.7, "frames": 1401, "acts": [{"id": "hook", "start": 0, "end": 6.37}, {"id": "study", "start": 6.37, "end": 14.6}],
        "lines": {"hook": {"start": 0.15, "end": 1.42, "chunks": [{"text": "Want a faster", "start": 0.15, "end": 0.7}, {"text": "bike split?", "start": 0.7, "end": 1.54}]},
                  "intro": {"start": 1.74, "end": 6.06, "chunks": [{"text": "There's one session", "start": 1.74, "end": 2.37}, {"text": "that boosts", "start": 2.37, "end": 6.06}]},
                  "study": {"start": 6.68, "end": 13.9, "chunks": [{"text": "A study", "start": 6.68, "end": 13.9}]}}}
ch = [["Stuck at the same", "STUCK"], ["bike split?", "BIKE"]]
bad = []
tl, tempo, d = vt.build(base, ch, [["STUCK", 0.05], ["AT", 0.3], ["BIKE", 0.8]], 1.3)
if not (tempo == 1.0 and d == 0 and tl["lines"]["intro"]["start"] == 1.74 and tl["lines"]["hook"]["chunks"][1]["text"] == "bike split?"): bad.append(f"krátký háček: {tempo} {d}")
tl, tempo, d = vt.build(base, ch, [["STUCK", 0.05], ["BIKE", 1.1]], 1.75)
if not (tempo == 1.0 and abs(d - 0.31) < 0.01 and abs(tl["lines"]["intro"]["end"] - 6.37) < 0.01 and tl["lines"]["study"]["start"] == 6.68 and tl["acts"] == base["acts"]): bad.append(f"delší háček: {tempo} {d}")
tl, tempo, d = vt.build(base, ch, [["STUCK", 0.05], ["BIKE", 1.3]], 2.1)
if not (1.0 < tempo <= 1.15 and tl["lines"]["intro"]["end"] <= 6.68 - 0.15 + 1e-6 and tl["lines"]["hook"]["end"] + 0.15 <= tl["lines"]["intro"]["start"] + 1e-6): bad.append(f"dlouhý háček: {tempo} {d}")
try: vt.build(base, ch, [["STUCK", 0.05], ["BIKE", 2.0]], 3.0); bad.append("moc dlouhý háček prošel")
except SystemExit: pass
if base["lines"]["intro"]["start"] != 1.74: bad.append("build změnil základ")
print("; ".join(bad) if bad else "háček se vejde, posun jen do volného místa, zrychlení nejvýš 1,15×"); sys.exit(1 if bad else 0)
