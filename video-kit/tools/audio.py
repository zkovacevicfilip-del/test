# Zvuková stopa: voiceover na přesné časy + velmi tiché šustnutí vzduchu na přechodech aktů.
#   python audio.py <work>
import json, os, sys
import numpy as np, soundfile as sf
WORK = sys.argv[1]; tl = json.load(open(WORK + "/timeline.json", encoding="utf-8")); SR = 48000
n = int(tl["total"] * SR) + SR // 10
vo = np.zeros(n, dtype=np.float32)
clips = {}
for key, l in tl["lines"].items():
    a, sr = sf.read(f"{WORK}/tts/{key}.wav", dtype="float32")
    m = int(len(a) * SR / sr); a = np.interp(np.linspace(0, len(a) - 1, m), np.arange(len(a)), a).astype(np.float32)
    f = int(0.012 * SR); a[:f] *= np.linspace(0, 1, f); a[-f:] *= np.linspace(1, 0, f)
    clips[key] = a
# hlasitost věty: "gain" v dB u věty ve scénáři (autor 25. 11. 2026: úvod hlasitěji, byl moc pasivní). Věta se zesílí s měkkým
# omezením špiček (tanh) na nejvyšší špičku ostatních vět, takže se celé video neztiší a ostatní věty zůstanou stejně hlasité
sp = os.path.join(WORK, "..", "script.json"); sc = json.load(open(sp, encoding="utf-8")) if os.path.exists(sp) else {"lines": {}}
gain = {k: float(sc["lines"].get(k, {}).get("gain", 0) or 0) for k in clips}
rest = [np.abs(clips[k]).max() for k in clips if not gain[k]]; pk = max(rest) if rest else 0.89
for key, l in tl["lines"].items():
    a = clips[key]
    if gain[key]: g = 10 ** (gain[key] / 20); a = (pk * np.tanh(g * a / pk)).astype(np.float32)
    i = int(l["start"] * SR); vo[i:i + len(a)] += a[: n - i]
vo *= 0.89 / np.abs(vo).max()
rng = np.random.default_rng(3); fx = np.zeros(n, dtype=np.float32)
def whoosh(t0, dur=0.55, gain=0.055):
    m = int(dur * SR); x = rng.standard_normal(m).astype(np.float32)
    X = np.fft.rfft(x); fr = np.fft.rfftfreq(m, 1 / SR); X *= np.exp(-((np.log(fr + 1) - np.log(900)) / 0.9) ** 2); x = np.fft.irfft(X, m).astype(np.float32)
    env = np.sin(np.linspace(0, np.pi, m)) ** 2.2; x = x / np.abs(x).max() * env * gain
    i = max(0, int((t0 - dur / 2) * SR)); fx[i:i + m] += x[: n - i]
# ---------- zvuky efektů a hudební podkres (autor 25. 11. 2026 podle reference RunLive) ----------
# ve scénáři: "sfx": [{"at": "one:0", "kind": "pop"}, …] (čas jako v popisu videa: 'věta', 'věta:2', 'věta$', +/- posun)
# a "bed": 0 bez podkresu, 1 jemný rytmus, 2 rytmus a akordy. Podkres se pod hlasem ztiší (sidechain), v pauzách je slyšet.
L = tl["lines"]
def tref(r):
    import re
    m = re.match(r"^([A-Za-z0-9_]+)(?::(\d+))?(\$)?([+-]\d*\.?\d+)?$", r)
    if not m or m.group(1) not in L: raise SystemExit(f"zvuk: neznámý čas „{r}“")
    l = L[m.group(1)]; t = l["chunks"][int(m.group(2))]["start"] if m.group(2) is not None else (l["end"] if m.group(3) else l["start"])
    return t + (float(m.group(4)) if m.group(4) else 0)
def add(t0, x):
    i = int(t0 * SR); j = max(0, i); x = x[j - i:]; fx[j:j + len(x)] += x[: n - j]
T = lambda d: np.arange(int(d * SR)) / SR
def env_exp(d, k): t = T(d); return np.exp(-t * k) * np.minimum(1, t / 0.003)
def pop(g=0.16):          # krátké „blup“: sinus klouže nahoru, k tomu cvaknutí
    t = T(0.09); f = 520 + 1400 * t / 0.09; x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(0.09, 38); return (x * g).astype(np.float32)
def ding(g=0.11):         # číslo naskočí: dva harmonické tóny s dozvukem
    t = T(0.6); x = (np.sin(2 * np.pi * 1318.5 * t) + 0.55 * np.sin(2 * np.pi * 1975.5 * t) + 0.25 * np.sin(2 * np.pi * 2637 * t)) * env_exp(0.6, 7); return (x / 1.8 * g).astype(np.float32)
def click(g=0.12):        # klepnutí na tlačítko
    x = rng.standard_normal(int(0.018 * SR)) * env_exp(0.018, 260); return (x * g).astype(np.float32)
def impact(g=0.32):       # velké číslo: hluboký úder a třesk
    t = T(0.7); f = 95 * np.exp(-t * 6) + 42; x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(0.7, 5.5)
    nz = rng.standard_normal(len(t)) * env_exp(0.7, 30) * 0.35; return ((x + nz) * g).astype(np.float32)
def riser(d=1.3, g=0.12):  # stoupající šum před trojkou
    m = int(d * SR); x = rng.standard_normal(m); X = np.fft.rfft(x); fr = np.fft.rfftfreq(m, 1 / SR); X *= np.exp(-((np.log(fr + 1) - np.log(2500)) / 1.2) ** 2); x = np.fft.irfft(X, m)
    e = np.linspace(0, 1, m) ** 2.2; e[-int(0.04 * SR):] *= np.linspace(1, 0, int(0.04 * SR)); return (x / np.abs(x).max() * e * g).astype(np.float32)
def shimmer(g=0.07):      # proměna dresu: třpytivý rychlý arpeggio nahoru
    out = np.zeros(int(1.1 * SR), dtype=np.float32)
    for k, f in enumerate([1046.5, 1318.5, 1568, 2093, 2637, 3136]):
        t = T(0.5); x = np.sin(2 * np.pi * f * t) * env_exp(0.5, 9); i = int(k * 0.07 * SR); out[i:i + len(x)] += x[: len(out) - i]
    return out / 3 * g
KINDS = {"pop": pop, "ding": ding, "click": click, "impact": impact, "shimmer": shimmer}
for e in sc.get("sfx", []) or []:
    t0 = tref(e["at"])
    if e["kind"] == "riser": add(t0 - 1.3, riser())      # riser končí přesně v čase at
    else: add(t0, KINDS[e["kind"]]())
bedk = int(sc.get("bed", 0) or 0)
bed = np.zeros(n, dtype=np.float32)
if bedk:
    bpm = 104; beat = 60 / bpm; tt = np.arange(n) / SR
    def kick():
        t = T(0.32); f = 120 * np.exp(-t * 30) + 48; return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(0.32, 9)
    def hat():
        x = rng.standard_normal(int(0.05 * SR)); X = np.fft.rfft(x); fr = np.fft.rfftfreq(len(x), 1 / SR); X[fr < 7000] = 0; x = np.fft.irfft(X, len(x)); return x / np.abs(x).max() * env_exp(0.05, 70)
    kb, hb = kick(), hat()
    for k in range(int(tl["total"] / beat) + 1):
        i = int(k * beat * SR)
        bed[i:i + len(kb)] += (0.5 * kb)[: n - i]
        j = int((k + 0.5) * beat * SR); bed[j:j + len(hb)] += (0.12 * hb)[: max(0, n - j)]
    if bedk >= 2:   # akordy: Am – F – C – G, každý 2 takty, měkký zvuk (trojúhelník s pomalým náběhem)
        prog = [[220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [196.0, 261.63, 329.63], [196.0, 246.94, 293.66]]
        bar = 4 * beat
        for k in range(int(tl["total"] / (2 * bar)) + 1):
            ch = prog[k % 4]; i = int(k * 2 * bar * SR); m = int(2 * bar * SR); t = np.arange(m) / SR
            e = np.minimum(1, t / 0.5) * np.minimum(1, (2 * bar - t) / 0.4)
            x = sum(2 / np.pi * np.arcsin(np.sin(2 * np.pi * f * t)) for f in ch) / 3 * e
            bed[i:i + m] += (0.16 * x)[: max(0, n - i)]
    # sidechain: pod hlasem se podkres ztiší asi o 8 dB, v pauzách se vrátí
    w = int(0.05 * SR); envv = np.sqrt(np.convolve(vo ** 2, np.ones(w) / w, mode="same")); envv = envv / (envv.max() + 1e-9)
    duck = 1 - 0.6 * np.clip(envv * 3, 0, 1); a2 = 1 - np.exp(-1 / (0.08 * SR)); sm = np.empty_like(duck); acc = 1.0
    for i in range(0, n, 64): acc += (duck[i] - acc) * min(1, a2 * 64); sm[i:i + 64] = acc
    bed *= sm * 0.42
    fade = int(0.6 * SR); bed[-fade:] *= np.linspace(1, 0, fade)
for a in tl["acts"][1:]: whoosh(a["start"], gain=0.09 if (sc.get("sfx") or bedk) else 0.055)
sf.write(WORK + "/audio.wav", np.clip(vo + fx + bed, -1, 1), SR)
print(f"zvuk {n / SR:.1f} s, přechodů {len(tl['acts']) - 1}" + (f", efektů {len(sc.get('sfx') or [])}" if sc.get("sfx") else "") + (f", podkres {bedk}" if bedk else ""))
