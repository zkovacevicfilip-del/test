// Instalace aplikace (PWA), aktualizace a příprava pro offline.
(() => {
  const $ = id => document.getElementById(id);
  const CDN_CACHE = "aero-cdn-v1"; // stejný název jako v sw.js
  const MP = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
  const FILES = [
    [MP + "/vision_bundle.mjs", "knihovna MediaPipe"],
    [MP + "/wasm/vision_wasm_internal.js", "jádro (js)"],
    [MP + "/wasm/vision_wasm_internal.wasm", "jádro (wasm)"],
    ["https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task", "model detekce těla"],
    ["https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite", "model obrysu (čelní plocha)"]
  ];
  const st = $("pwaStatus"), bOff = $("pwaOffline"), bIns = $("pwaInstall"), upd = $("pwaUpdate");
  const say = t => { if (st) st.textContent = t; };

  if (!("serviceWorker" in navigator) || !window.caches) {
    say("Tento prohlížeč neumí offline režim ani instalaci. Použij Chrome.");
    if (bOff) bOff.disabled = true;
    return;
  }

  // Registrace service workeru a nabídka nové verze
  navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(reg => {
    const offer = w => {
      if (!w || !navigator.serviceWorker.controller) return;
      upd.classList.remove("hidden");
      $("pwaReload").onclick = () => w.postMessage("SKIP_WAITING");
    };
    if (reg.waiting) offer(reg.waiting);
    reg.addEventListener("updatefound", () => {
      const w = reg.installing;
      w && w.addEventListener("statechange", () => { if (w.state === "installed") offer(w); });
    });
  }).catch(e => say("Offline režim se nepodařilo zapnout: " + e.message));
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading || !upd || upd.classList.contains("hidden")) return;
    reloading = true; location.reload();
  });

  // Tlačítko Nainstalovat (Chrome ho nabídne, jen když aplikace ještě není nainstalovaná)
  let prompt = null;
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); prompt = e; bIns.classList.remove("hidden"); });
  bIns.onclick = async () => {
    if (!prompt) return;
    prompt.prompt();
    await prompt.userChoice.catch(() => {});
    prompt = null; bIns.classList.add("hidden");
  };
  window.addEventListener("appinstalled", () => { bIns.classList.add("hidden"); say("Aplikace je nainstalovaná. Najdeš ji mezi aplikacemi."); });

  // Stav offline přípravy
  const missing = async () => {
    const out = [];
    for (const f of FILES) if (!(await caches.match(f[0]))) out.push(f);
    return out;
  };
  const refresh = async () => {
    const m = await missing();
    if (!m.length) { say("Připraveno pro offline: aplikace i modely jsou uložené v zařízení."); bOff.textContent = "Offline připraveno ✓"; }
    else if (m.length === FILES.length) say("Pro práci bez internetu stáhni modely (asi 21 MB, jednou).");
    else say("Chybí pro offline: " + m.map(f => f[1]).join(", ") + ".");
    if (!navigator.onLine) say(st.textContent + " Teď jsi offline.");
  };

  bOff.onclick = async () => {
    bOff.disabled = true;
    try {
      if (navigator.storage && navigator.storage.persist) await navigator.storage.persist().catch(() => {});
      const c = await caches.open(CDN_CACHE);
      const m = await missing();
      let i = 0;
      for (const [url, name] of m) {
        say("Stahuji " + (++i) + "/" + m.length + ": " + name + "…");
        const res = await fetch(url, { mode: "cors", cache: "no-store" });
        if (!res.ok) throw new Error(name + " (HTTP " + res.status + ")");
        await c.put(url, res);
      }
      await refresh();
    } catch (e) {
      say("Stažení se nepovedlo: " + e.message + ". Zkontroluj připojení a zkus to znovu.");
    }
    bOff.disabled = false;
  };

  window.addEventListener("online", refresh);
  window.addEventListener("offline", refresh);
  refresh();
})();
