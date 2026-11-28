# Časová osa varianty videa (trial reels, autor 28. 11. 2026): stejná jako u základního videa, jen první věta (háček) je jiná.
#   python variant_timeline.py <timeline základu> <script varianty> <work varianty>
# Háček má jiný hlas a délku. Zbytek videa se nemění, jen druhá věta se smí posunout o d (nejvýš do mezery před další větou),
# aby na ni háček navázal. Když se háček nevejde ani tak, hlas háčku se zrychlí (ffmpeg atempo, nejvýš 1,15×).
# Na posunu nezáleží pro snímky za koncem prvního aktu: animace v něm jen přesune, ne změní (stejné délky úseků).
import copy, json, re, subprocess, sys

GAP, MIN_GAP, MAX_TEMPO = 0.15, 0.15, 1.15


def chunk_times(chunks, words, dur):
    out, pos = [], 0
    for c in chunks:
        text, anchor = (c, None) if isinstance(c, str) else (c[0], c[1])
        cands = [x.upper() for x in (anchor.split("|") if anchor else [re.sub(r"[^A-Za-z']", "", text.split()[0])])]
        j = next((k for k in range(pos, len(words)) if words[k][0].upper() in cands), None)
        if j is None: raise SystemExit(f"varianta: titulek „{text}“ – slovo {'|'.join(cands)} není v přepisu ({' '.join(w[0] for w in words)})")
        out.append([text, max(0.0, words[j][1] - 0.09)]); pos = j + 1
    out[0][1] = 0.0 if out[0][1] > 0.25 else out[0][1]
    return [{"text": o[0], "rel": o[1], "rel_end": out[i + 1][1] if i + 1 < len(out) else dur + 0.12} for i, o in enumerate(out)]


def build(base, chunks, words, dur):
    """Vrátí (timeline, tempo). tempo > 1 znamená, že hlas háčku je třeba zrychlit (a words/dur jsou už přepočtené)."""
    tl = copy.deepcopy(base); L = tl["lines"]; order = sorted(L, key=lambda k: L[k]["start"])
    h, nxt, after = L[order[0]], L[order[1]], L[order[2]]
    room = after["start"] - MIN_GAP - nxt["end"]                       # o kolik se smí druhá věta posunout
    need = h["start"] + dur + GAP - nxt["start"]
    tempo = 1.0
    if need > room:
        tempo = (dur) / (nxt["start"] + room - GAP - h["start"])
        if tempo > MAX_TEMPO: raise SystemExit(f"varianta: háček je moc dlouhý ({dur:.2f} s), ani zrychlení {MAX_TEMPO}× nestačí – zkrať větu")
        words = [[w[0], w[1] / tempo] for w in words]; dur = dur / tempo; need = h["start"] + dur + GAP - nxt["start"]
    d = max(0.0, need)
    ch = chunk_times(chunks, words, dur)
    h["end"] = round(h["start"] + dur, 3)
    h["chunks"] = [{"text": c["text"], "start": round(h["start"] + c["rel"], 3), "end": round(h["start"] + c["rel_end"], 3)} for c in ch]
    if d > 0:
        nxt["start"] = round(nxt["start"] + d, 3); nxt["end"] = round(nxt["end"] + d, 3)
        for c in nxt["chunks"]: c["start"] = round(c["start"] + d, 3); c["end"] = round(c["end"] + d, 3)
    return tl, tempo, d


if __name__ == "__main__":
    base = json.load(open(sys.argv[1], encoding="utf-8")); sc = json.load(open(sys.argv[2], encoding="utf-8")); W = sys.argv[3]
    key = sorted(base["lines"], key=lambda k: base["lines"][k]["start"])[0]
    vo = json.load(open(W + "/tts/vo.json", encoding="utf-8")); line = next(l for l in vo["lines"] if l["key"] == key)
    words = json.load(open(W + "/asr/words.json"))[key]
    tl, tempo, d = build(base, sc["lines"][key]["chunks"], words, line["dur"])
    if tempo > 1.0:
        wav = f"{W}/tts/{key}.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-filter:a", f"atempo={tempo:.4f}", wav + ".tmp.wav"], check=True)
        subprocess.run(["mv", wav + ".tmp.wav", wav], check=True)
        line["dur"] = round(line["dur"] / tempo, 3); json.dump(vo, open(W + "/tts/vo.json", "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    json.dump(tl, open(W + "/timeline.json", "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    h = tl["lines"][key]
    print(f"VARIANTA: háček {h['start']:.2f}–{h['end']:.2f} s" + (f", zrychlený {tempo:.2f}×" if tempo > 1 else "") + (f", další věta posunutá o {d:.2f} s" if d > 0 else ""))
