// Převod textu na řeč v samostatném vlákně (aby stránka během výpočtu nezamrzla).
// Model Kokoro-82M se stáhne z Hugging Face při prvním použití a prohlížeč si ho uloží do mezipaměti.
import { KokoroTTS, TextSplitterStream, env } from "./vendor/kokoro.web.js";
import { shape } from "./prosody.mjs?v=4";

const MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";
// Jediný hlas stránky: směs amerických hlasů Kokoro 50 % am_fenrir + 25 % am_puck + 25 % am_onyx (soubor voice-mix.bin, licence Apache-2.0).
// Proti čistému Fenrirovi je hlubší (F0 119 místo 141 Hz) a bez britského hlasu ve směsi (ten dával cizí přízvuk), viz README.
// Knihovna umí jen hlasy ze svého seznamu, proto směs nastoupí na místo hlasu am_santa, který stránka jinak nepoužívá:
// stažení am_santa se přesměruje na voice-mix.bin a starý obsah mezipaměti pro tenhle hlas se při startu smaže.
const VOICE = "am_santa";
const SLOT_URL = "https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/voices/am_santa.bin";
const MIX_URL = new URL("./voice-mix.bin?v=2", import.meta.url).href;
const realFetch = self.fetch.bind(self);
self.fetch = (input, init) => realFetch((typeof input === "string" ? input : input.url) === SLOT_URL ? MIX_URL : input, init);
const GAP = 0.29;            // pauza mezi větami v sekundách (medián u Liama)
env.wasmPaths = new URL("./vendor/", import.meta.url).href;   // výpočetní jádro z vlastního webu, ne z cizího serveru

let tts = null, loading = null;
function load() {
  if (tts) return Promise.resolve(tts);
  if (!loading) {
    const clear = (self.caches ? caches.open("kokoro-voices").then(c => c.delete(SLOT_URL)) : Promise.resolve()).catch(() => {});
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
    }).then(m => clear.then(() => (tts = m))).catch(e => { loading = null; throw e; });
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
  const { text, speed, natural } = e.data;
  try {
    const m = await load();
    const parts = split(text); if (!parts.length) throw new Error("Prázdný text.");
    const chunks = []; let sr = 24000;
    for (let i = 0; i < parts.length; i++) {
      postMessage({ type: "part", i, n: parts.length });
      // stream vrací i fonetický přepis, podle kterého se odhadne, kde které slovo je
      // s textem místo proudu by stream čekal na další text donekonečna, proto vlastní proud, který se hned uzavře
      const sp = new TextSplitterStream(); sp.push(parts[i]); sp.close();
      for await (const x of m.stream(sp, { voice: VOICE, speed })) {
        sr = x.audio.sampling_rate;
        chunks.push(natural ? shape(x.audio.audio, sr, x.text, x.phonemes) : x.audio.audio);
      }
    }
    const gap = Math.round(GAP * sr), len = chunks.reduce((s, c) => s + c.length, 0) + gap * (chunks.length - 1), audio = new Float32Array(len);
    let o = 0; chunks.forEach((c, i) => { audio.set(c, o); o += c.length + (i < chunks.length - 1 ? gap : 0); });
    // vyrovnání hlasitosti: špička na −1 dB (úprava přednesu může místy zesilovat)
    let pk = 0; for (const v of audio) pk = Math.max(pk, Math.abs(v)); if (pk > 0) { const k = 0.89 / pk; for (let j = 0; j < audio.length; j++) audio[j] *= k; }
    postMessage({ type: "done", audio, sr, parts: parts.length }, [audio.buffer]);
  } catch (err) {
    postMessage({ type: "error", message: String(err && err.message || err) });
  }
};
