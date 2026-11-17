// Převod textu na řeč v samostatném vlákně (aby stránka během výpočtu nezamrzla).
// Model Kokoro-82M se stáhne z Hugging Face při prvním použití a prohlížeč si ho uloží do mezipaměti.
import { KokoroTTS, env } from "./vendor/kokoro.web.js";

const MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";
const VOICE = "am_fenrir";   // jediný hlas stránky (nejpodobnější stylu videí podle srovnání výšky a barvy hlasu)
const GAP = 0.25;            // pauza mezi větami v sekundách
env.wasmPaths = new URL("./vendor/", import.meta.url).href;   // výpočetní jádro z vlastního webu, ne z cizího serveru

let tts = null, loading = null;
function load() {
  if (tts) return Promise.resolve(tts);
  if (!loading) {
    const files = {};
    loading = KokoroTTS.from_pretrained(MODEL, {
      dtype: "q8", device: "wasm",
      progress_callback: p => {
        if (p.status === "progress" && p.total) {
          files[p.file] = [p.loaded, p.total];
          let a = 0, b = 0; for (const k in files) { a += files[k][0]; b += files[k][1]; }
          postMessage({ type: "load", loaded: a, total: b });
        }
      }
    }).then(m => (tts = m)).catch(e => { loading = null; throw e; });
  }
  return loading;
}

// rozdělí text na věty, dlouhé věty ještě podle čárek (model zvládne jen omezenou délku najednou)
function split(text) {
  const out = [];
  for (const s of text.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]*["')\]]*/g) || []) {
    let t = s.trim(); if (!t) continue;
    while (t.length > 300) { const cut = t.lastIndexOf(",", 300); const at = cut > 80 ? cut + 1 : 300; out.push(t.slice(0, at).trim()); t = t.slice(at).trim(); }
    if (t) out.push(t);
  }
  return out;
}

onmessage = async e => {
  const { text, speed } = e.data;
  try {
    const m = await load();
    const parts = split(text); if (!parts.length) throw new Error("Prázdný text.");
    const chunks = []; let sr = 24000;
    for (let i = 0; i < parts.length; i++) {
      postMessage({ type: "part", i, n: parts.length });
      const a = await m.generate(parts[i], { voice: VOICE, speed });
      sr = a.sampling_rate; chunks.push(a.audio);
    }
    const gap = Math.round(GAP * sr), len = chunks.reduce((s, c) => s + c.length, 0) + gap * (chunks.length - 1), audio = new Float32Array(len);
    let o = 0; chunks.forEach((c, i) => { audio.set(c, o); o += c.length + (i < chunks.length - 1 ? gap : 0); });
    postMessage({ type: "done", audio, sr, parts: parts.length }, [audio.buffer]);
  } catch (err) {
    postMessage({ type: "error", message: String(err && err.message || err) });
  }
};
