# Test zesílení věty ve zvukové stopě (video-kit/tools/audio.py, "gain" v dB u věty, autor 25. 11. 2026: úvod hlasitěji).
#   python audio-gain.py <cesta k audio.py>
# Dvě stejné věty (hook a one) se stejnou hlasitostí: bez gain musí vyjít stejně hlasité, s gain 5 u hooku má být hook
# aspoň o 3 dB hlasitější a jeho špičky nesmí přerůst ostatní věty (měkké omezení), celé video se neztiší.
import json, os, subprocess, sys, tempfile
import numpy as np, soundfile as sf
AUDIO = sys.argv[1]; SR = 48000
def rms(x): return float(np.sqrt(np.mean(x ** 2)) + 1e-12)
def run(gain):
    d = tempfile.mkdtemp(); w = os.path.join(d, "work"); os.makedirs(w + "/tts")
    t = np.arange(int(1.5 * SR)) / SR; env = 0.24 + 0.76 * (np.sin(2 * np.pi * 2 * t) > 0.995)   # řeč: většinou středně hlasitě, občas krátká špička (špička asi 15 dB nad průměrem jako u hlasu)
    for k in ["hook", "one"]: sf.write(f"{w}/tts/{k}.wav", (0.5 * env * np.sin(2 * np.pi * 220 * t)).astype(np.float32), SR)
    json.dump({"total": 4.0, "acts": [{"id": "hook", "start": 0}, {"id": "one", "start": 2.0}], "lines": {"hook": {"start": 0.2}, "one": {"start": 2.2}}}, open(w + "/timeline.json", "w"))
    json.dump({"lines": {"hook": {"say": "x", "gain": gain}, "one": {"say": "y"}}}, open(d + "/script.json", "w"))
    subprocess.run([sys.executable, AUDIO, w], check=True, capture_output=True)
    a, _ = sf.read(w + "/audio.wav"); return a[int(0.3 * SR):int(1.6 * SR)], a[int(2.3 * SR):int(3.6 * SR)], float(np.abs(a).max())
h0, o0, p0 = run(0); h5, o5, p5 = run(5)
d0 = 20 * np.log10(rms(h0) / rms(o0)); d5 = 20 * np.log10(rms(h5) / rms(o5)); keep = 20 * np.log10(rms(o5) / rms(o0))
bad = []
if abs(d0) > 0.5: bad.append(f"bez gain se věty liší o {d0:.1f} dB")
if d5 < 3: bad.append(f"s gain 5 je úvod hlasitější jen o {d5:.1f} dB")
if abs(keep) > 0.5: bad.append(f"ostatní věty se změnily o {keep:.1f} dB")
if np.abs(h5).max() > np.abs(o5).max() + 1e-3: bad.append("špičky úvodu přerostly ostatní věty")
print("; ".join(bad) if bad else f"úvod +{d5:.1f} dB, ostatní {keep:+.1f} dB, špička {p5:.2f}"); sys.exit(1 if bad else 0)
