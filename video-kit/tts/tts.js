// Stránka pro převod textu na řeč: ovládání, průběh a uložení zvuku jako WAV. Výpočet běží v tts-worker.js.
(function () {
  "use strict";
  // ochrana proti vložení stránky do cizího rámečku
  if (window.top !== window.self) { document.documentElement.classList.add("framed"); try { window.top.location.replace(window.self.location.href); } catch (e) { } }
  const $ = id => document.getElementById(id);
  const text = $("ttsText"), speed = $("ttsSpeed"), speedOut = $("ttsSpeedOut"), go = $("ttsGo"), bar = $("ttsBar"), fill = $("ttsFill"),
    status = $("ttsStatus"), natural = $("ttsNatural"), out = $("ttsOut"), audio = $("ttsAudio"), dl = $("ttsDl"), count = $("ttsCount");
  let worker = null, url = null, t0 = 0;

  const say = (s, err) => { status.textContent = s; status.classList.toggle("err", !!err); };
  const progress = k => { bar.classList.toggle("hidden", k == null); fill.style.width = Math.round((k || 0) * 100) + "%"; };
  const showSpeed = () => { speedOut.textContent = (+speed.value).toFixed(2) + "×"; };
  const showCount = () => { count.textContent = text.value.length + " znaků"; };
  speed.addEventListener("input", showSpeed); text.addEventListener("input", showCount); showSpeed(); showCount();

  // 16bitový mono WAV z čísel −1 až 1
  function wav(samples, sr) {
    const b = new ArrayBuffer(44 + samples.length * 2), v = new DataView(b), w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, "RIFF"); v.setUint32(4, 36 + samples.length * 2, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) { const s = Math.max(-1, Math.min(1, samples[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
    return new Blob([b], { type: "audio/wav" });
  }
  const fileName = s => (s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "hlas") + ".wav";

  function start() {
    const t = text.value.trim();
    if (!t) { say("Napiš nejdřív nějaký text.", true); return; }
    if (!worker) {
      try { worker = new Worker("tts-worker.js?v=7", { type: "module" }); }
      catch (e) { say("Tenhle prohlížeč neumí spustit model (" + e.message + ").", true); return; }
      worker.onmessage = onMsg;
      worker.onerror = e => { say("Chyba při spuštění modelu: " + (e.message || "neznámá"), true); go.disabled = false; progress(null); };
    }
    go.disabled = true; t0 = performance.now(); say("Připravuji hlas…"); progress(0);
    worker.postMessage({ text: t, speed: +speed.value, natural: natural.checked });
  }
  function onMsg(e) {
    const m = e.data;
    if (m.type === "load") { progress(m.loaded / m.total); say("Stahuji model: " + Math.round(m.loaded / 1048576) + " z " + Math.round(m.total / 1048576) + " MB (jen poprvé)"); }
    else if (m.type === "part") { progress(m.i / m.n); say("Čtu větu " + (m.i + 1) + " z " + m.n + "…"); }
    else if (m.type === "done") {
      progress(null); go.disabled = false;
      if (url) URL.revokeObjectURL(url);
      url = URL.createObjectURL(wav(m.audio, m.sr));
      audio.src = url; dl.href = url; dl.download = fileName(text.value); out.classList.remove("hidden");
      say("Hotovo: " + (m.audio.length / m.sr).toFixed(1) + " s zvuku za " + ((performance.now() - t0) / 1000).toFixed(1) + " s.");
      audio.play().catch(() => {});
    }
    else if (m.type === "error") { progress(null); go.disabled = false; say("Nepovedlo se: " + m.message, true); }
  }
  go.addEventListener("click", start);
})();
