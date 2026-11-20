# Voiceover po větách podle script.json. Hotové věty se nepřegenerují (šetří znaky ElevenLabs).
#   python tts.py <kit> <work>
import json, os, subprocess, sys, urllib.request, urllib.error
import numpy as np, soundfile as sf

KIT, WORK = sys.argv[1], sys.argv[2]
sc = json.load(open(KIT + "/script.json", encoding="utf-8")); vo = sc["voice"]
keys = [k for a in sc["acts"] for k in a["lines"]]
out_dir = WORK + "/tts"; os.makedirs(out_dir, exist_ok=True)
old = {}
if os.path.exists(out_dir + "/vo.json"):
    j = json.load(open(out_dir + "/vo.json", encoding="utf-8"))
    if j.get("voice") == vo: old = {l["key"]: l for l in j["lines"]}


def trim(a, sr):
    # ořízne ticho na začátku a konci; řeč = okna 20 ms s hlasitostí nad prahem.
    # Osamocené cvaknutí (kratší než 60 ms, za tichem delším než 0,3 s) se nepočítá za řeč a odřízne se.
    w = int(0.02 * sr); n = len(a) // w
    if n == 0: return a
    loud = np.sqrt((a[: n * w].reshape(n, w) ** 2).mean(axis=1)) > 0.01
    on = np.where(loud)[0]
    if len(on) == 0: return a
    runs, s0 = [], on[0]
    for p, q in zip(on[:-1], on[1:]):
        if q - p > 1: runs.append((s0, p)); s0 = q
    runs.append((s0, on[-1]))
    keep = [r for i, r in enumerate(runs) if r[1] - r[0] + 1 >= 3
            or not ((i == 0 or r[0] - runs[i - 1][1] > 15) and (i == len(runs) - 1 or runs[i + 1][0] - r[1] > 15))] or runs
    return a[max(0, keep[0][0] * w - int(0.03 * sr)): min(len(a), (keep[-1][1] + 1) * w + int(0.08 * sr))]


def eleven(i, key):
    text = sc["lines"][key]["say"]
    body = {"text": text, "model_id": vo.get("model", "eleven_multilingual_v2"), "voice_settings": vo.get("settings", {}),
            "previous_text": sc["lines"][keys[i - 1]]["say"] if i else None, "next_text": sc["lines"][keys[i + 1]]["say"] if i + 1 < len(keys) else None}
    # klíč doplní síťová proxy prostředí (uložený přes request_credential); proměnná je jen pro běh mimo ni
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{vo['voice_id']}?output_format=mp3_44100_128", data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json", "xi-api-key": os.environ.get("ELEVENLABS_API_KEY", "proxy-injected")})
    try:
        with urllib.request.urlopen(req, timeout=120) as r: open(f"{out_dir}/{key}.mp3", "wb").write(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f"ElevenLabs odmítl požadavek ({e.code}): {e.read()[:300].decode(errors='replace')}\n"
                 "401/403 = chybí nebo neplatí klíč. Požádej uživatele o klíč nástrojem request_credential (host api.elevenlabs.io, hlavička xi-api-key), nikdy ne v chatu.")
    except Exception as e:
        sys.exit(f"ElevenLabs nedostupný: {e}. Je host api.elevenlabs.io povolený a klíč uložený (request_credential)?")
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", f"{out_dir}/{key}.mp3", "-ac", "1", "-ar", "44100", f"{out_dir}/{key}.wav"], check=True)
    os.remove(f"{out_dir}/{key}.mp3")
    return sf.read(f"{out_dir}/{key}.wav", dtype="float32")


def shorten_pauses(a, sr, cap):
    # zkrátí ticha uvnitř věty na nejvýš `cap` sekund (vystřihne prostředek ticha, na švu krátké prolnutí)
    w = int(0.02 * sr); n = len(a) // w
    if not cap or n == 0: return a
    quiet = np.sqrt((a[: n * w].reshape(n, w) ** 2).mean(axis=1)) < 0.008
    out, last, i, keep, f = [], 0, 0, int(cap * sr / 2), int(0.01 * sr)
    while i < n:
        if not quiet[i]: i += 1; continue
        j = i
        while j < n and quiet[j]: j += 1
        s0, s1 = i * w, j * w
        if 0 < i and j < n and s1 - s0 > cap * sr:
            out.append(a[last: s0 + keep].copy()); last = s1 - keep
            out[-1][-f:] *= np.linspace(1, 0, f, dtype=np.float32)
            out.append(a[last: last + f] * np.linspace(0, 1, f, dtype=np.float32)); last += f
        i = j
    out.append(a[last:])
    return np.concatenate(out).astype(np.float32)


_k = None
def kokoro(i, key):
    # náhradní hlas bez klíče: pip install kokoro-onnx, modely z GitHub releases thewh1teagle/kokoro-onnx (model-files-v1.0)
    global _k
    from kokoro_onnx import Kokoro
    if _k is None: _k = Kokoro(WORK + "/kokoro/kokoro-v1.0.onnx", WORK + "/kokoro/voices-v1.0.bin")
    a, sr = _k.create(sc["lines"][key]["say"].replace("-", " "), voice=vo.get("voice_id", "am_michael"), speed=vo.get("speed", 1.08), lang="en-us")
    return np.asarray(a, dtype=np.float32), sr


def ours_batch(todo):
    # náš hlas ze stránky video-kit/tts (Kokoro + živý přednes): všechny nové věty najednou, model se načte jen jednou
    here = os.path.dirname(os.path.abspath(__file__))
    root = next((d for d in [os.path.join(KIT, "tts"), os.path.join(KIT, "..", "..", "..", "tts"), os.path.join(here, "..", "tts")]
                 if os.path.exists(os.path.join(d, "tts-worker.js"))), None)
    if not root: sys.exit("Nenašel jsem stránku video-kit/tts s naším hlasem.")
    lst = out_dir + "/ours.json"
    json.dump([{"key": k, "text": sc["lines"][k]["say"], "speed": vo.get("speed", 1.15)} for k in todo], open(lst, "w", encoding="utf-8"))
    prof = os.path.join(root, "..", "work", "kokoro-profile"); os.makedirs(prof, exist_ok=True)
    subprocess.run(["node", os.path.join(here, "kokoro-page.js"), root, lst, out_dir, prof], check=True)


def ours(i, key):
    return sf.read(f"{out_dir}/{key}.wav", dtype="float32")


gen = {"elevenlabs": eleven, "kokoro": kokoro, "ours": ours}[vo["provider"]]
if vo["provider"] == "ours":
    todo = [k for k in keys if not (k in old and old[k]["text"] == sc["lines"][k]["say"] and os.path.exists(f"{out_dir}/{k}.wav"))]
    if todo: ours_batch(todo)
CAP = sc.get("timing", {}).get("max_pause")   # nejdelší pauza uvnitř věty v sekundách (nepovinné)
lines, chars, sr = [], 0, 44100
for i, key in enumerate(keys):
    text = sc["lines"][key]["say"]; wav = f"{out_dir}/{key}.wav"
    if key in old and old[key]["text"] == text and os.path.exists(wav):
        a, sr = sf.read(wav, dtype="float32"); note = "beze změny"
        t = shorten_pauses(trim(a, sr), sr, CAP)
        if len(t) < len(a): a = t; sf.write(wav, a, sr); note = "oříznuto ticho / zkráceny pauzy"
    else:
        a, sr = gen(i, key); a = shorten_pauses(trim(a, sr), sr, CAP); sf.write(wav, a, sr); chars += len(text); note = "nově"
    lines.append({"key": key, "text": text, "dur": round(len(a) / sr, 3)})
    print(f"{key:10s} {len(a)/sr:5.2f} s  {note}", flush=True)
json.dump({"voice": vo, "sr": sr, "lines": lines}, open(out_dir + "/vo.json", "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print(f"celkem řeči {sum(l['dur'] for l in lines):.1f} s, nově vygenerováno {chars} znaků")
