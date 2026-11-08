// Dobrovolné sdílení čísel do výzkumné databáze (Supabase), jen s výslovným souhlasem.
// Odesílají se jen čísla. Fotky, poznámky, popisy pozic, názvy variant ani GPS nikdy.
(() => {
  const BASE = "https://mtkxpqvrlvwicnnraevw.supabase.co/rest/v1";
  const API = BASE + "/submissions";
  const KEY = "sb_publishable_9oUCSBm_U6I1kd2NQT6xGw_UmztkADg"; // veřejný klíč, smí jen zapisovat (a volat funkce pro vlastní data)
  const SCHEMA = 1;
  // Verze textu souhlasu. Při změně rozsahu sdílených dat ji zvýšit: aplikace si pak souhlas vyžádá znovu.
  const CONSENT_VER = "2026-11-08";
  const ls = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } },
    del: k => { try { localStorage.removeItem(k); } catch (e) { } }
  };
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)));
  // Anonymní ID zařízení vzniká až při udělení souhlasu (ne dřív)
  const deviceId = () => ls.get("aero.device");
  const ensureDevice = () => { let d = deviceId(); if (!d) { d = uuid(); ls.set("aero.device", d); } return d; };
  const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return String(h); };

  // Záznam o souhlasu (verze a čas) se ukládá v zařízení a posílá s každým záznamem, aby šel souhlas doložit (čl. 7 odst. 1 GDPR)
  const consent = () => { try { const c = JSON.parse(ls.get("aero.share.consent")); return c && c.v === CONSENT_VER && c.at ? c : null; } catch (e) { return null; } };
  const give = () => { ensureDevice(); ls.set("aero.share.consent", JSON.stringify({ v: CONSENT_VER, at: new Date().toISOString() })); ls.del("aero.share.ok"); };
  const revoke = () => { ls.set("aero.share.consent", JSON.stringify({ v: CONSENT_VER, revokedAt: new Date().toISOString() })); ls.del("aero.share.ok"); };

  // Souhlas platí pro všechny nabídky sdílení v aplikaci najednou
  function sync() {
    const on = !!consent(), id = deviceId();
    document.querySelectorAll('[data-sh="ok"]').forEach(c => { c.checked = on; });
    document.querySelectorAll('[data-sh="send"]').forEach(btn => { if (btn.dataset.busy !== "1") btn.disabled = !on; });
    document.querySelectorAll('[data-sh="id"]').forEach(s => { s.textContent = id || "vznikne po udělení souhlasu"; });
  }
  // Vloží do kontejneru souhlas a tlačítko. getData() vrací objekt s čísly (nebo pole objektů = víc řádků), nebo null.
  // opts: schema (verze dat), key (klíč proti dvojímu odeslání), emptyMsg, onSent(data)
  function attach(boxId, kind, getData, opts) {
    const box = document.getElementById(boxId); if (!box) return;
    if (!box.dataset.ready) {
      box.dataset.ready = "1";
      box.innerHTML = `<div class="card" style="margin:12px 0 0;background:var(--bg)">
        <h3 style="margin-top:0">Pomoz výzkumu (dobrovolné)</h3>
        <label class="chk" style="margin-top:4px"><input type="checkbox" data-sh="ok"><span>Výslovně souhlasím, aby provozovatel aplikace (Filip Kovačević) zpracovával čísla z mých výsledků pro statistický výzkum a zlepšování aplikace, včetně údajů, které se mohou týkat zdraví (mobilita, tělesné míry, tepová frekvence). Je mi alespoň 15 let. Fotky, poznámky ani názvy se neodesílají. Souhlas můžu kdykoli odvolat. <a href="soukromi.html#vyzkum" target="_blank" rel="noopener">Podrobnosti v Zásadách ochrany osobních údajů</a></span></label>
        <div class="row"><button class="btn ghost" data-sh="send" disabled>Odeslat anonymně</button><span class="muted" data-sh="msg"></span></div>
        <p class="muted" style="margin:6px 0 0;font-size:.8rem">Anonymní ID zařízení: <span data-sh="id"></span>. <a href="soukromi.html#moje-data" target="_blank" rel="noopener">Stáhnout nebo smazat odeslaná data</a></p></div>`;
      const ok = box.querySelector('[data-sh="ok"]'), btn = box.querySelector('[data-sh="send"]'), msg = box.querySelector('[data-sh="msg"]');
      ok.onchange = () => { if (ok.checked) give(); else revoke(); sync(); msg.textContent = ok.checked ? "" : "Souhlas odvolán, nic dalšího se neodešle."; };
      btn.onclick = async () => {
        const o = box._opts || {}, data = box._get && box._get(), c = consent();
        if (!c) { msg.textContent = "Nejdřív zaškrtni souhlas."; sync(); return; }
        if (!data) { msg.textContent = o.emptyMsg || "Není co odeslat."; return; }
        const rec = { v: c.v, at: c.at };
        const row = d => ({ device_id: ensureDevice(), kind, schema_ver: o.schema || SCHEMA, data: Object.assign({}, d, { consent: rec }) });
        const body = JSON.stringify(Array.isArray(data) ? data.map(row) : row(data));
        const key = "aero.share.last." + (o.key || kind), hb = hash(JSON.stringify(data));
        if (ls.get(key) === hb) { msg.textContent = "Tento výsledek už jsi odeslal."; return; }
        btn.disabled = true; btn.dataset.busy = "1"; msg.textContent = "Odesílám…";
        try {
          const r = await fetch(API, { method: "POST", headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json", Prefer: "return=minimal" }, body });
          if (!r.ok) throw new Error(await dbMsg(r));
          ls.set(key, hb);
          try { if (o.onSent) o.onSent(data); } catch (e) { }
          msg.textContent = Array.isArray(data) ? "Odesláno (" + data.length + " " + (data.length === 1 ? "záznam" : data.length < 5 ? "záznamy" : "záznamů") + "), díky!" : "Odesláno, díky!";
        } catch (e) {
          msg.textContent = navigator.onLine === false ? "Jsi offline, zkus to později." : "Odeslání se nepovedlo (" + e.message + ").";
        }
        btn.dataset.busy = ""; sync();
      };
    }
    box._get = getData; box._opts = opts || {};
    box.querySelector('[data-sh="msg"]').textContent = "";
    sync();
  }
  function detach(boxId) { const box = document.getElementById(boxId); if (box) { box.innerHTML = ""; delete box.dataset.ready; box._get = null; } }

  // Hláška z databáze: vlastní české hlášky (limity, kontrola dat) se ukážou, ostatní jen jako číslo chyby
  async function dbMsg(r) {
    try { const j = await r.json(); if (j && j.code === "P0001" && typeof j.message === "string") return j.message.slice(0, 120); } catch (e) { }
    return "server odpověděl " + r.status;
  }

  // Funkce pro stránku Zásad ochrany osobních údajů: stažení, smazání, odvolání souhlasu
  async function rpc(name, args) {
    const r = await fetch(BASE + "/rpc/" + name, { method: "POST", headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" }, body: JSON.stringify(args) });
    if (r.status === 404) { const e = new Error("funkce v databázi zatím není zapnutá"); e.missing = true; throw e; }
    if (!r.ok) throw new Error("server odpověděl " + r.status);
    return r.json();
  }
  const forgetSent = () => { try { Object.keys(localStorage).filter(k => k.startsWith("aero.share.last.")).forEach(k => localStorage.removeItem(k)); } catch (e) { } };

  window.aeroShare = {
    attach, detach, consent, revoke, deviceId, CONSENT_VER,
    getMyData: () => rpc("get_my_data", { p_device: deviceId() }),
    deleteMyData: async () => { const n = await rpc("delete_my_data", { p_device: deviceId() }); forgetSent(); return n; }
  };
})();
