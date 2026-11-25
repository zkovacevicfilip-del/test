# Test zvukových efektů a podkresu (video-kit/tools/audio.py, "sfx" a "bed" ve scénáři, autor 25. 11. 2026 podle reference).
#   python audio-sfx.py <cesta k audio.py>
# Dvě věty s pauzou mezi nimi: bez sfx a bed je v pauze ticho; efekt „ding“ v pauze musí být slyšet právě ve svůj čas;
# s bed 1 je v pauze slyšet rytmus, ale pod hlasem zůstane aspoň 10 dB pod ním a výsledek se nikde neořízne.
import json, os, subprocess, sys, tempfile
import numpy as np, soundfile as sf
AUDIO = sys.argv[1]; SR = 48000
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
def run(sfx, bed):
    d = tempfile.mkdtemp(); w = os.path.join(d, "work"); os.makedirs(w + "/tts")
    t = np.arange(int(1.5 * SR)) / SR; voice = (0.5 * (0.24 + 0.76 * (np.sin(2 * np.pi * 2 * t) > 0.995)) * np.sin(2 * np.pi * 220 * t)).astype(np.float32)
    for k in ["one", "two"]: sf.write(f"{w}/tts/{k}.wav", voice, SR)
    json.dump({"total": 6.0, "acts": [{"id": "one", "start": 0}, {"id": "two", "start": 3.5}],
               "lines": {"one": {"start": 0.2, "end": 1.7, "chunks": [{"start": 0.2}]}, "two": {"start": 4.0, "end": 5.5, "chunks": [{"start": 4.0}]}}}, open(w + "/timeline.json", "w"))
    json.dump({"lines": {"one": {"say": "x"}, "two": {"say": "y"}}, "sfx": sfx, "bed": bed}, open(d + "/script.json", "w"))
    subprocess.run([sys.executable, AUDIO, w], check=True, capture_output=True)
    a, _ = sf.read(w + "/audio.wav"); return a
seg = lambda a, t0, t1: a[int(t0 * SR):int(t1 * SR)]
a0 = run([], 0); a1 = run([{"at": "one$+0.8", "kind": "ding"}], 0); a2 = run([], 1)
bad = []
if db(seg(a0, 2.6, 3.0)) > -60: bad.append(f"bez efektů není v pauze ticho ({db(seg(a0, 2.6, 3.0)):.0f} dB)")
if db(seg(a1, 2.5, 2.9)) < db(seg(a0, 2.5, 2.9)) + 20: bad.append("efekt ding v pauze (2,5 s) není slyšet")
if db(seg(a1, 2.0, 2.45)) > db(seg(a0, 2.0, 2.45)) + 3: bad.append("efekt zazněl moc brzy")
pause, voice, bedv = db(seg(a2, 2.0, 3.6)), db(seg(a0, 0.3, 1.6)), db(seg(a2, 0.3, 1.6) - seg(a0, 0.3, 1.6))
if pause < -45: bad.append(f"rytmus v pauze není slyšet ({pause:.0f} dB)")
if voice - bedv < 10: bad.append(f"rytmus pod hlasem je jen {voice - bedv:.1f} dB pod hlasem")
if np.abs(a2).max() > 0.999 or np.abs(a1).max() > 0.999: bad.append("zvuk se ořízl")
print("; ".join(bad) if bad else f"efekt ve svůj čas, rytmus v pauze {pause:.0f} dB, pod hlasem {voice - bedv:.0f} dB pod ním"); sys.exit(1 if bad else 0)
