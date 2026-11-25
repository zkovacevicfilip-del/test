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
for a in tl["acts"][1:]: whoosh(a["start"])
sf.write(WORK + "/audio.wav", np.clip(vo + fx, -1, 1), SR)
print(f"zvuk {n / SR:.1f} s, přechodů {len(tl['acts']) - 1}")
