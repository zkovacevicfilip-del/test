# Test ořezu ticha v hlasu (video-kit/tools/tts.py → trim). Spouští ho tests/video-kit.js, když je k dispozici numpy.
import ast, sys, numpy as np
src = open(sys.argv[1], encoding="utf-8").read()
fns = [n for n in ast.parse(src).body if isinstance(n, ast.FunctionDef) and n.name in ("trim", "shorten_pauses")]
g = {"np": np}; exec(compile(ast.Module(fns, []), "tts", "exec"), g); trim, shorten = g["trim"], g["shorten_pauses"]
sr = 44100; rng = np.random.default_rng(1)
speech = (0.2 * rng.standard_normal(int(2.0 * sr))).astype(np.float32)
sil = lambda s: np.zeros(int(s * sr), np.float32)
click = np.zeros(int(0.005 * sr), np.float32); click[::7] = 0.3
fails = []
# 1) řeč + 0,75 s ticha + cvaknutí → cvaknutí i ticho pryč (chyba z videa drag-is-behind-you)
t = trim(np.concatenate([sil(0.2), speech, sil(0.75), click, sil(0.4)]), sr)
if abs(len(t) / sr - 2.11) > 0.05: fails.append(f"cvaknutí po tichu: délka {len(t)/sr:.2f} s, čekáno 2,11 s")
# 2) krátká pauza uvnitř věty a krátké slovo po ní zůstane
word = (0.2 * rng.standard_normal(int(0.08 * sr))).astype(np.float32)
t = trim(np.concatenate([speech, sil(0.2), word]), sr)
if len(t) / sr < 2.28 - 0.03: fails.append(f"krátké slovo po pauze uříznuto: délka {len(t)/sr:.2f} s")
# 3) dlouhá pauza uvnitř věty (1,1 s) se zkrátí na 0,35 s, krátká (0,2 s) zůstane, řeč se neztratí
t = shorten(np.concatenate([speech, sil(1.1), speech, sil(0.2), speech]), sr, 0.35)
if abs(len(t) / sr - (6.0 + 0.35 + 0.2)) > 0.05: fails.append(f"zkrácení pauz: délka {len(t)/sr:.2f} s, čekáno 6,55 s")
if len(shorten(speech, sr, None)) != len(speech): fails.append("bez max_pause se zvuk nesmí měnit")
print("\n".join(fails) or "ok"); sys.exit(1 if fails else 0)
