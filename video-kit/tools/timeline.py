# Sestaví časovou osu videa: věty za sebou podle délky hlasu, titulky přesně na slova z rozpoznání řeči.
#   python timeline.py <kit> <work>
import json, re, sys
KIT, WORK = sys.argv[1], sys.argv[2]
sc = json.load(open(KIT + "/script.json", encoding="utf-8")); T = sc.get("timing", {})
LEAD, GAP_LINE, GAP_ACT, TAIL = T.get("lead", 0.40), T.get("gap_line", 0.32), T.get("gap_act", 0.62), T.get("tail", 1.90)
dur = {l["key"]: l["dur"] for l in json.load(open(WORK + "/tts/vo.json", encoding="utf-8"))["lines"]}
WORDS = json.load(open(WORK + "/asr/words.json"))
lines, acts, t, bad = {}, [], LEAD, []
for ai, act in enumerate(sc["acts"]):
    a_start = t - (LEAD if ai == 0 else GAP_ACT / 2)
    for ki, key in enumerate(act["lines"]):
        d, aw, out, pos = dur[key], WORDS[key], [], 0
        for c in sc["lines"][key]["chunks"]:
            text, anchor = (c, None) if isinstance(c, str) else (c[0], c[1])
            cands = [x.upper() for x in (anchor.split("|") if anchor else [re.sub(r"[^A-Za-z']", "", text.split()[0])])]
            if not cands[0]: sys.exit(f"script.json: titulek „{text}“ (věta {key}) nezačíná slovem. Přidej kotvu: [\"{text}\", \"SLOVO\"] = první slovo, jak ho zapíše přepis.")
            j = next((k for k in range(pos, len(aw)) if aw[k][0].upper() in cands), None)
            if j is None: bad.append(f"{key}: titulek „{text}“ – slovo {'|'.join(cands)} není v přepisu ({' '.join(w[0] for w in aw)})"); out.append([text, None])
            else: out.append([text, max(0.0, aw[j][1] - 0.09)]); pos = j + 1
        if out[0][1] is None or out[0][1] > 0.25: out[0][1] = 0.0
        for i, o in enumerate(out):          # nenalezené dopočítat mezi sousedy
            if o[1] is None:
                nxt = next((k for k in range(i + 1, len(out)) if out[k][1] is not None), None)
                hi = out[nxt][1] if nxt is not None else d
                o[1] = out[i - 1][1] + (hi - out[i - 1][1]) / ((nxt or len(out)) - i + 1)
        ch = [{"text": o[0], "start": round(t + o[1], 3), "end": round(t + (out[i + 1][1] if i + 1 < len(out) else d + 0.12), 3)} for i, o in enumerate(out)]
        lines[key] = {"start": round(t, 3), "end": round(t + d, 3), "captions": sc["lines"][key].get("captions", True), "chunks": ch}
        t += d + (GAP_LINE if ki + 1 < len(act["lines"]) else GAP_ACT)
    acts.append({"id": act["id"], "start": round(a_start, 3), "end": round(t - GAP_ACT / 2, 3)})
total = t - GAP_ACT + TAIL
acts[-1]["end"] = round(total, 3)
json.dump({"fps": 30, "total": round(total, 3), "frames": int(round(total * 30)), "acts": acts, "lines": lines}, open(WORK + "/timeline.json", "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print(f"ČASOVÁ OSA: {total:.1f} s, {int(round(total * 30))} snímků")
for a in acts: print(f"  akt {a['id']:10s} {a['start']:6.2f} – {a['end']:6.2f}")
for k, l in lines.items(): print(f"  věta {k:10s} {l['start']:6.2f} – {l['end']:6.2f}  titulků {len(l['chunks'])}")
if bad:
    print("POZOR, titulky bez přesného času (doplň kotvu ve script.json nebo oprav výslovnost):"); [print("  " + b) for b in bad]; sys.exit(2)
