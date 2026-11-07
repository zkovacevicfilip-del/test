// Dobrovolné anonymní sdílení čísel do výzkumné databáze (Supabase).
// Odesílají se jen čísla. Fotky, poznámky, popisy pozic a názvy variant nikdy.
(() => {
  const API = "https://mtkxpqvrlvwicnnraevw.supabase.co/rest/v1/submissions";
  const KEY = "sb_publishable_9oUCSBm_U6I1kd2NQT6xGw_UmztkADg"; // veřejný klíč, smí jen zapisovat
  const SCHEMA = 1;
  const ls = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } } };
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)));
  const device = () => { let d = ls.get("aero.device"); if (!d) { d = uuid(); ls.set("aero.device", d); } return d; };
  const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return String(h); };

  // Vloží do kontejneru souhlas a tlačítko. getData() vrací objekt s čísly, nebo null.
  function attach(boxId, kind, getData) {
    const box = document.getElementById(boxId); if (!box) return;
    if (!box.dataset.ready) {
      box.dataset.ready = "1";
      box.innerHTML = `<div class="card" style="margin:12px 0 0;background:var(--bg)">
        <h3 style="margin-top:0">Pomoz výzkumu (dobrovolné)</h3>
        <label class="chk" style="margin-top:4px"><input type="checkbox" data-sh="ok"><span>Souhlasím s anonymním odesláním čísel z tohoto výsledku do výzkumné databáze. Fotky, poznámky ani názvy se neodesílají. <a href="soukromi.html" target="_blank" rel="noopener">Zásady ochrany soukromí</a></span></label>
        <div class="row"><button class="btn ghost" data-sh="send" disabled>Odeslat anonymně</button><span class="muted" data-sh="msg"></span></div>
        <p class="muted" style="margin:6px 0 0;font-size:.8rem">Tvoje anonymní ID (pro případné smazání dat): <span data-sh="id"></span></p></div>`;
      const ok = box.querySelector('[data-sh="ok"]'), btn = box.querySelector('[data-sh="send"]'), msg = box.querySelector('[data-sh="msg"]');
      ok.checked = ls.get("aero.share.ok") === "1"; btn.disabled = !ok.checked;
      ok.onchange = () => { ls.set("aero.share.ok", ok.checked ? "1" : "0"); btn.disabled = !ok.checked; msg.textContent = ""; };
      btn.onclick = async () => {
        const data = box._get && box._get();
        if (!data) { msg.textContent = "Není co odeslat."; return; }
        const body = JSON.stringify({ device_id: device(), kind, schema_ver: SCHEMA, data });
        const key = "aero.share.last." + kind, hb = hash(JSON.stringify(data));
        if (ls.get(key) === hb) { msg.textContent = "Tento výsledek už jsi odeslal."; return; }
        btn.disabled = true; msg.textContent = "Odesílám…";
        try {
          const r = await fetch(API, { method: "POST", headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json", Prefer: "return=minimal" }, body });
          if (!r.ok) throw new Error("server odpověděl " + r.status);
          ls.set(key, hb); msg.textContent = "Odesláno, díky!";
        } catch (e) {
          msg.textContent = navigator.onLine === false ? "Jsi offline, zkus to později." : "Odeslání se nepovedlo (" + e.message + ").";
        }
        btn.disabled = !ok.checked;
      };
    }
    box._get = getData;
    box.querySelector('[data-sh="id"]').textContent = device();
    box.querySelector('[data-sh="msg"]').textContent = "";
  }
  window.aeroShare = { attach };
})();
