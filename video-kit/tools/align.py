# Přepíše voiceover rozpoznáváním řeči se slovními časy: kontrola výslovnosti + přesné titulky.
#   python align.py <work>
import json, sys
import numpy as np, soundfile as sf, sherpa_onnx
WORK = sys.argv[1]; M = WORK + "/asr/sherpa-onnx-zipformer-gigaspeech-2023-12-12"
rec = sherpa_onnx.OfflineRecognizer.from_transducer(encoder=M + "/encoder-epoch-30-avg-1.int8.onnx", decoder=M + "/decoder-epoch-30-avg-1.onnx",
    joiner=M + "/joiner-epoch-30-avg-1.int8.onnx", tokens=M + "/tokens.txt", num_threads=1, decoding_method="greedy_search")
vo = json.load(open(WORK + "/tts/vo.json", encoding="utf-8")); out = {}
print("PŘEPIS (porovnej s textem; zkratky jako CdA musí být slyšet jako písmena):")
for l in vo["lines"]:
    a, sr = sf.read(f"{WORK}/tts/{l['key']}.wav", dtype="float32")
    if sr != 16000:
        n = int(len(a) * 16000 / sr); a = np.interp(np.linspace(0, len(a) - 1, n), np.arange(len(a)), a).astype(np.float32)
    s = rec.create_stream(); s.accept_waveform(16000, a); rec.decode_stream(s)
    r = s.result; words = []
    for tok, ts in zip(r.tokens, r.timestamps):
        if tok[:1] in ("▁", " ") or not words: words.append([tok.strip("▁ "), round(float(ts), 2)])
        else: words[-1][0] += tok.strip()
    out[l["key"]] = words
    print(f"  {l['key']:10s} {r.text.strip()}")
json.dump(out, open(WORK + "/asr/words.json", "w"))
