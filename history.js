// Moje pozice: uložené pozice v čase, srovnání před a po, osobní model CdA.
// Vše se ukládá jen v prohlížeči (localStorage). Fotky se neukládají.
(() => {
  const $ = id => document.getElementById(id);
  const KEY = "aero.pos.v1";
  const read = () => { try { const a = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
  let P = read();
  const store = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); return true; } catch (e) { return false; } };
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ok = x => x != null && isFinite(x);
  const fmt = (x, d) => ok(x) ? (+x).toFixed(d).replace(".", ",") : "–";
  const sgn = (x, d) => ok(x) ? (x > 0 ? "+" : x < 0 ? "−" : "") + fmt(Math.abs(x), d) : "–";
  const num = v => { const x = parseFloat(String(v).replace(",", ".")); return isFinite(x) ? x : null; };
  const uuid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : "r" + Date.now().toString(36) + Math.random().toString(36).slice(2);
  const today = () => new Date().toISOString().slice(0, 10);
  const czDate = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ""); return m ? (+m[3]) + ". " + (+m[2]) + ". " + m[1] : "–"; };
  const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return String(h); };
  const tq = df => { const T = [[1, 12.71], [2, 4.30], [3, 3.18], [4, 2.78], [5, 2.57], [6, 2.45], [7, 2.36], [8, 2.31], [9, 2.26], [10, 2.23], [12, 2.18], [15, 2.13], [20, 2.09], [30, 2.04], [60, 2.00]]; for (const [d, t] of T) if (df <= d) return t; return 1.96; };
  const W40 = 0.5 * 1.2 * Math.pow(40 / 3.6, 3); // watty na 1 m² CdA při 40 km/h (hustota 1,2)

  // ---------- ukazatele pozice ----------
  const avg = a => { const v = a.filter(ok); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
  const side = (r, k) => r.side ? avg(["left", "right"].map(s => r.side[s] && r.side[s][k] ? r.side[s][k].mean : null)) : null;
  const METRICS = [
    { k: "trunk", name: "Sklon trupu", short: "Trup", unit: "°", d: 1, step: 1, get: r => side(r, "trunk"), model: true },
    { k: "elbow", name: "Úhel lokte", short: "Loket", unit: "°", d: 1, step: 1, get: r => side(r, "elbow"), model: true },
    { k: "arm", name: "Úhel ramene (trup–paže)", short: "Rameno", unit: "°", d: 1, step: 1, get: r => side(r, "arm"), model: true },
    { k: "hip", name: "Úhel kyčle", short: "Kyčel", unit: "°", d: 1, step: 1, get: r => side(r, "hip") },
    { k: "knee", name: "Úhel kolena", short: "Koleno", unit: "°", d: 1, step: 1, get: r => side(r, "knee") },
    { k: "elbW", name: "Šířka loktů / šířka ramen", short: "Lokty/ramena", unit: "", d: 2, step: 0.1, get: r => r.front && r.front.elbW ? r.front.elbW.mean : null, model: true },
    { k: "area", name: "Čelní plocha", short: "Plocha", unit: " m²", d: 3, step: 0.01, get: r => r.area ? r.area.m2 : null, model: true }
  ];
  const MOB = [["m1", "Mobilita kyčle"], ["m2", "Mobilita ramene"], ["m3", "Mobilita kotníku"], ["m4", "Předklon vsedě"]];
  const cdaOf = r => r.cda && r.cda.value > 0 ? r.cda.value : null;
  const srcOf = r => {
    const v = Array.isArray(r.views) ? r.views.filter(x => !/^m\d$/.test(x.view)) : [];
    if (!v.length) return r.mobility && MOB.some(m => ok(r.mobility[m[0]])) ? "jen mobilita" : "bez úhlů";
    return v.some(x => x.video) ? "video" : "fotky";
  };

  // Co se odesílá: bez názvu, poznámky a názvu varianty
  const strip = r => ({
    rid: r.rid, date: String(r.date || "").slice(0, 10), mode: r.mode || null, views: r.views || [], rider: r.rider || null,
    side: r.side || null, front: r.front || null, back: r.back || null, mobility: r.mobility || null,
    area: r.area ? { m2: r.area.m2, bike: !!r.area.bike, scale: r.area.scale || null } : null,
    cda: r.cda ? { value: r.cda.value, sd: ok(r.cda.sd) ? r.cda.sd : null, laps: r.cda.laps || null, source: r.cda.source || null, wind: !!r.cda.wind } : null,
    comfort: ok(r.comfort) ? r.comfort : null
  });
  const sentOk = r => r.sentHash && r.sentHash === hash(JSON.stringify(strip(r)));

  // Načtení zálohy: ze souboru se převezmou jen známé položky se správným typem.
  // Soubor může pocházet odjinud, proto žádné cizí texty ani neznámá pole
  // (nedostanou se tak ani do výzkumné databáze, kam jdou jen čísla a krátké hodnoty).
  const isNum = x => typeof x === "number" && isFinite(x);
  const tok = (x, n) => typeof x === "string" && x.length <= (n || 40) && /^[0-9A-Za-z._:-]*$/.test(x) ? x : null;
  const txt = (x, n) => typeof x === "string" ? x.slice(0, n) : "";
  const BADKEY = /^(__proto__|constructor|prototype)$/;
  const val = (v, d) => isNum(v) || typeof v === "boolean" || v === null ? v : typeof v === "object" ? nums(v, d) : null; // v úhlech a mírách jen čísla
  function nums(o, d) {
    if (!o || typeof o !== "object" || d > 4) return null;
    if (Array.isArray(o)) return o.slice(0, 50).map(v => val(v, d + 1));
    const out = {};
    Object.keys(o).slice(0, 64).forEach(k => { if (/^[A-Za-z0-9_]{1,32}$/.test(k) && !BADKEY.test(k)) out[k] = val(o[k], d + 1); });
    return out;
  }
  // Převezme jen položky, které v záznamu jsou, každou přes její kontrolu (tvar záznamu se nemění).
  const pickK = (o, spec) => { const out = {}; Object.keys(spec).forEach(k => { if (Object.prototype.hasOwnProperty.call(o, k)) out[k] = spec[k](o[k]); }); return out; };
  const obj = x => x && typeof x === "object" && !Array.isArray(x);
  const AREA = { m2: v => v, bike: v => !!v, scale: v => tok(v, 10), variant: v => txt(v, 80) };
  const CDA = { value: v => v, sd: v => isNum(v) ? v : null, laps: v => isNum(v) ? v : null, source: v => ["jízda", "plocha", "ručně"].includes(v) ? v : "ručně", wind: v => !!v, date: v => tok(v, 30) };
  const REC = {
    id: v => v, rid: v => v, name: v => txt(v, 80).trim() || "Pozice", note: v => txt(v, 500), mode: v => tok(v, 10),
    date: v => typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) && tok(v) ? v : new Date().toISOString(),
    views: v => Array.isArray(v) ? v.slice(0, 20).filter(x => obj(x) && tok(x.view, 10)).map(x => ({ view: x.view, video: !!x.video, frames: isNum(x.frames) ? x.frames : 1, edited: !!x.edited })) : [],
    rider: v => nums(v, 1), side: v => nums(v, 1), front: v => nums(v, 1), back: v => nums(v, 1), mobility: v => nums(v, 1),
    area: v => obj(v) && isNum(v.m2) ? pickK(v, AREA) : null,
    cda: v => obj(v) && isNum(v.value) ? pickK(v, CDA) : null,
    comfort: v => isNum(v) && v >= 1 && v <= 10 ? Math.round(v) : null,
    sentHash: v => tok(v, 16)
  };
  function clean(r) {
    if (!obj(r) || !tok(r.id, 64) || !tok(r.rid, 64)) return null;
    const out = pickK(r, REC);
    if (!out.name) out.name = "Pozice";
    if (!out.date) out.date = new Date().toISOString();
    return out;
  }

  // ---------- osobní model: CdA = a + b · ukazatel ----------
  function fit(pts) {
    const n = pts.length; if (n < 4) return null;
    const mx = pts.reduce((s, p) => s + p.x, 0) / n, my = pts.reduce((s, p) => s + p.y, 0) / n;
    const Sxx = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0), Sxy = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0), Syy = pts.reduce((s, p) => s + (p.y - my) ** 2, 0);
    if (!(Sxx > 0) || !(Syy > 0)) return null;
    const b = Sxy / Sxx, a = my - b * mx, ssr = pts.reduce((s, p) => s + (p.y - a - b * p.x) ** 2, 0);
    const s = Math.sqrt(ssr / (n - 2)), t = tq(n - 2), ciB = t * s / Math.sqrt(Sxx);
    const lo = Math.min(...pts.map(p => p.x)), hi = Math.max(...pts.map(p => p.x));
    return { n, a, b, ciB, r2: 1 - ssr / Syy, sig: Math.abs(b) > ciB, lo, hi, pred: x => ({ y: a + b * x, half: t * s * Math.sqrt(1 + 1 / n + (x - mx) ** 2 / Sxx), out: x < lo - 0.1 * (hi - lo) || x > hi + 0.1 * (hi - lo) }) };
  }
  function models() {
    return METRICS.filter(m => m.model).map(m => ({ m, f: fit(P.filter(r => ok(cdaOf(r)) && ok(m.get(r))).map(r => ({ x: m.get(r), y: cdaOf(r) }))) })).filter(x => x.f);
  }

  // ---------- veřejné funkce pro ostatní části aplikace ----------
  function add(data, name) {
    const r = Object.assign(JSON.parse(JSON.stringify(data || {})), { id: uuid(), rid: uuid(), name: name || ("Pozice " + (P.length + 1)), date: new Date().toISOString(), note: "", area: null, cda: null, comfort: null, sentHash: null });
    P.push(r); store(); return r;
  }
  const list = () => P.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).map(r => ({ id: r.id, label: r.name + " (" + czDate(r.date) + ")", cda: cdaOf(r) }));
  function setCdA(id, cda) { const r = P.find(x => x.id === id); if (!r) return false; r.cda = cda; store(); if (visible()) render(); return true; }
  const visible = () => { const s = $("s-hist"); return s && !s.classList.contains("hidden"); };

  // Tlačítko Uložit pozici ve výsledcích části Pozice a mobilita
  function saveBox(boxId, getData) {
    const box = $(boxId); if (!box) return;
    if (!box.dataset.ready) {
      box.dataset.ready = "1";
      box.innerHTML = `<div class="card" style="margin:12px 0 0;background:var(--bg)"><h3 style="margin-top:0">Uložit do Moje pozice</h3>
        <label for="${boxId}_name">Název pozice (zůstane jen v zařízení)</label><input type="text" id="${boxId}_name" placeholder="např. Lokty o 2 cm užší">
        <div class="row"><button class="btn" data-hs="save">Uložit pozici</button><span class="muted" data-hs="msg"></span></div>
        <p class="muted" style="margin:6px 0 0">Uloží úhly, mobilitu a údaje o jezdci, fotky ne. V záložce Moje pozice k ní pak přiřadíš čelní plochu a změřené CdA a porovnáš ji s ostatními.</p></div>`;
      box.querySelector('[data-hs="save"]').onclick = () => {
        const d = box._get && box._get(), msg = box.querySelector('[data-hs="msg"]');
        if (!d) { msg.textContent = "Není co uložit."; return; }
        const h = hash(JSON.stringify(d));
        if (box._last === h) { msg.textContent = "Tahle pozice už je uložená."; return; }
        const nm = $(boxId + "_name").value.trim();
        const r = add(d, nm || null); box._last = h; $(boxId + "_name").value = "";
        msg.textContent = "Uloženo jako „" + r.name + "“. Najdeš ji v záložce Moje pozice.";
      };
    }
    box._get = getData;
  }
  function clearSaveBox(boxId) { const box = $(boxId); if (box) { box.innerHTML = ""; delete box.dataset.ready; box._get = null; } }

  // ---------- vykreslení záložky Moje pozice ----------
  const sel = [];
  const areasSaved = () => { try { const s = JSON.parse(localStorage.getItem("aero.v1")); return Array.isArray(s && s.areas) ? s.areas : []; } catch (e) { return []; } };

  function card(r, best) {
    const chips = METRICS.map(m => { const v = m.get(r); return ok(v) ? `<span class="hchip">${m.short} <b>${fmt(v, m.d)}${m.unit}</b></span>` : ""; }).join("") +
      MOB.map(([k, n]) => r.mobility && ok(r.mobility[k]) ? `<span class="hchip">${n.replace("Mobilita ", "Mob. ")} <b>${fmt(r.mobility[k], 0)}°</b></span>` : "").join("");
    const A = areasSaved();
    const aOpts = A.map((x, i) => `<option value="${i}">${esc(x.name)}: ${fmt(x.area, 3)} m²${x.mcda > 0 ? ", CdA " + fmt(x.mcda, 3) : ""}</option>`).join("");
    const c = r.cda, cInfo = c ? [c.source === "jízda" ? "z jízdy" : c.source === "plocha" ? "z varianty plochy" : "zadáno ručně", c.date ? czDate(c.date) : "", ok(c.sd) ? "± " + fmt(c.sd, 3) : "", c.laps ? c.laps + " kol" : "", c.wind ? "s korekcí větru" : ""].filter(Boolean).join(", ") : "";
    let pred = "";
    if (!cdaOf(r) && best) {
      const x = best.m.get(r);
      if (ok(x)) { const p = best.f.pred(x); pred = `<p class="muted" style="margin:8px 0 0">Odhad CdA podle osobního modelu (${best.m.name.toLowerCase()}): <b>${fmt(p.y, 3)} ± ${fmt(p.half, 3)} m²</b>${p.out ? " <span class='flag'>mimo změřený rozsah, spíš orientačně</span>" : ""}</p>`; }
    }
    const sent = sentOk(r) ? "✓ odesláno do výzkumu" : r.sentHash ? "změněno od odeslání" : "";
    return `<div class="card" data-id="${esc(r.id)}">
      <div class="row" style="margin-top:0;justify-content:space-between"><label class="chk" style="margin:0"><input type="checkbox" data-h="cmp"${sel.includes(r.id) ? " checked" : ""}><span>Srovnat</span></label><span class="muted">${czDate(r.date)} · ${srcOf(r)}</span></div>
      <label style="margin-top:6px">Název (jen v zařízení)</label><input type="text" data-h="name" value="${esc(r.name)}">
      <div class="hchips">${chips || "<span class='muted'>Bez naměřených úhlů.</span>"}</div>
      <div class="grid">
        <div><label>Změřené CdA (m²)</label><input type="text" inputmode="decimal" autocomplete="off" data-h="cda" value="${cdaOf(r) ? fmt(cdaOf(r), 3) : ""}" placeholder="–">${cInfo ? `<small class="muted">${esc(cInfo)}</small>` : ""}</div>
        <div><label>Pohodlí (1 až 10)</label><select data-h="comfort"><option value="">–</option>${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => `<option${r.comfort === i ? " selected" : ""}>${i}</option>`).join("")}</select></div>
        <div><label>Čelní plocha</label><select data-h="area"><option value="">${r.area ? "✓ " + fmt(r.area.m2, 3) + " m²" : A.length ? "Vybrat variantu z Čelní plochy" : "Žádná uložená varianta"}</option>${aOpts}${r.area ? '<option value="none">Odebrat plochu</option>' : ""}</select></div>
        <div><label>Poznámka (jen v zařízení)</label><input type="text" data-h="note" value="${esc(r.note)}"></div>
      </div>${pred}
      <div class="row" style="justify-content:space-between"><span class="muted">${sent}</span><button class="xbtn" data-h="del">Smazat</button></div>
    </div>`;
  }

  function compare() {
    const S = sel.map(id => P.find(r => r.id === id)).filter(Boolean);
    if (S.length < 2) return S.length ? `<div class="card"><p class="muted" style="margin:0">Zaškrtni ještě jednu pozici ke srovnání.</p></div>` : "";
    const [A, B] = S.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const row = (name, a, b, d, unit, flag) => { const df = ok(a) && ok(b) ? b - a : null; return `<tr><td>${name}</td><td>${fmt(a, d)}</td><td>${fmt(b, d)}</td><td${flag && flag(df) ? " class='flag'" : ""}>${ok(df) ? sgn(df, d) + unit : "–"}</td></tr>`; };
    let h = `<div class="card"><h2>Srovnání</h2><p class="muted" style="margin-bottom:6px">„${esc(A.name)}“ (${czDate(A.date)}) proti „${esc(B.name)}“ (${czDate(B.date)}). Rozdíl = novější − starší.</p>
      <table style="font-size:.9rem"><tr><td></td><td>Starší</td><td>Novější</td><td>Rozdíl</td></tr>`;
    METRICS.forEach(m => { if (ok(m.get(A)) || ok(m.get(B))) h += row(m.name, m.get(A), m.get(B), m.d, m.unit); });
    h += row("Změřené CdA (m²)", cdaOf(A), cdaOf(B), 3, "");
    h += row("Pohodlí (1–10)", A.comfort, B.comfort, 0, "", d => d < 0);
    MOB.forEach(([k, n]) => { const a = A.mobility && A.mobility[k], b = B.mobility && B.mobility[k]; if (ok(a) || ok(b)) h += row(n, a, b, 1, "°"); });
    h += "</table>";
    const notes = [];
    if (ok(cdaOf(A)) && ok(cdaOf(B))) { const d = cdaOf(B) - cdaOf(A); notes.push(`CdA ${d < 0 ? "kleslo" : "stouplo"} o ${fmt(Math.abs(d), 3)} m², to je asi ${fmt(Math.abs(d) * W40, 0)} W ${d < 0 ? "méně" : "víc"} při 40 km/h. Rozdíly do ~0,003 m² bývají v šumu měření.`); }
    if (srcOf(A) !== srcOf(B) && srcOf(A) !== "jen mobilita" && srcOf(B) !== "jen mobilita") notes.push("Pozice jsou měřené jinak (fotky × video). Úhly kolena a kyčle se proto nedají přímo srovnat, trup, loket a rameno ano.");
    if (A.mode && B.mode && A.mode !== B.mode) notes.push("Pozice jsou měřené v jiném režimu (stativ × z ruky), úhly ber s rezervou.");
    if (notes.length) h += `<p class="muted" style="margin-top:8px">${notes.join("<br>")}</p>`;
    return h + "</div>";
  }

  // Korelace dvou ukazatelů u pozic se změřeným CdA (když se mění spolu, model je neoddělí)
  function corr(m1, m2) {
    const pts = P.filter(r => ok(cdaOf(r)) && ok(m1.get(r)) && ok(m2.get(r))).map(r => [m1.get(r), m2.get(r)]);
    if (pts.length < 4) return null;
    const n = pts.length, ax = pts.reduce((s, p) => s + p[0], 0) / n, ay = pts.reduce((s, p) => s + p[1], 0) / n;
    const sxy = pts.reduce((s, p) => s + (p[0] - ax) * (p[1] - ay), 0), sxx = pts.reduce((s, p) => s + (p[0] - ax) ** 2, 0), syy = pts.reduce((s, p) => s + (p[1] - ay) ** 2, 0);
    return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : null;
  }
  function modelHtml(M, best) {
    const n = P.filter(r => ok(cdaOf(r))).length;
    let h = `<div class="card"><h2>Osobní model CdA</h2>`;
    if (n < 4) return h + `<p class="muted" style="margin:0">Zatím máš ${n} ${n === 1 ? "pozici" : n >= 2 && n <= 4 ? "pozice" : "pozic"} se změřeným CdA. Model se spočítá od 4, spolehlivější je od 8 až 10. Model ukáže, jak tvoje CdA souvisí se sklonem trupu, lokty, rameny a čelní plochou, a odhadne CdA pozic, které jsi neměřil.</p></div>`;
    if (!M.length) return h + `<p class="muted" style="margin:0">Pozice se změřeným CdA zatím nemají dost společných údajů (úhly z boku, šířka loktů nebo čelní plocha). Ulož k nim úhly z fotek nebo přiřaď čelní plochu.</p></div>`;
    h += `<table><tr><td>Ukazatel</td><td>Vliv na CdA</td></tr>`;
    M.slice().sort((a, b) => b.f.r2 - a.f.r2).forEach(({ m, f }) => {
      const per = f.b * m.step, ci = f.ciB * m.step, stepTxt = sgn(m.step, m.d === 3 ? 2 : m.step < 1 ? 1 : 0) + m.unit;
      h += `<tr><td>${m.name}<small>${f.n} ${f.n < 5 ? "pozice" : "pozic"} · R² ${fmt(f.r2, 2)}${best && best.m === m ? " · nejlepší ukazatel" : ""}</small></td><td>${sgn(per, 4)} m² na ${stepTxt}<small>± ${fmt(ci, 4)} · asi ${sgn(per * W40, 1)} W při 40 km/h · ${f.sig ? "průkazné" : "<span class='flag'>neprůkazné</span>"}</small></td></tr>`;
    });
    const sigM = M.filter(x => x.f.sig), warn = [];
    for (let i = 0; i < sigM.length; i++) for (let j = i + 1; j < sigM.length; j++) {
      const c = corr(sigM[i].m, sigM[j].m);
      if (ok(c) && Math.abs(c) > 0.8) warn.push(`${sigM[i].m.name} a ${sigM[j].m.name.toLowerCase()} se u tvých změřených pozic měnily spolu (korelace ${fmt(c, 2)}), proto model jejich vliv od sebe neoddělí a oba mohou vypadat průkazně. Příště měň mezi pozicemi jen jednu věc.`);
    }
    h += `</table>${warn.length ? `<p class="muted warn" style="margin-top:8px">${warn.join("<br>")}</p>` : ""}<p class="muted" style="margin-top:8px">${best ? `Odhady CdA u neměřených pozic se počítají podle ukazatele „${best.m.name.toLowerCase()}“. ` : "Zatím žádný ukazatel nesouvisí s CdA průkazně, rozdíly mezi pozicemi jsou malé nebo měření nepřesné. Přidej další pozice s různým nastavením. "}R² ukazuje, jak velkou část rozdílů v CdA ukazatel vysvětlí (1 = úplně). ± je 95% nejistota. Model bere vždy jen jeden ukazatel: když měníš víc věcí najednou (trup i lokty), účinky se smíchají. Souvislost není důkaz příčiny, ověř ji měřením.</p></div>`;
    return h;
  }

  function render() {
    const root = $("histRoot"); if (!root) return;
    for (let i = sel.length - 1; i >= 0; i--) if (!P.some(r => r.id === sel[i])) sel.splice(i, 1);
    const M = models(), sig = M.filter(x => x.f.sig).sort((a, b) => b.f.r2 - a.f.r2), best = sig[0] || null;
    let h = `<div class="card"><h2>Moje pozice</h2><p class="muted" style="margin:0">Uložené pozice v čase. 1) V části Pozice a mobilita → Výsledky klepni na Uložit pozici. 2) Tady k ní přiřaď čelní plochu a změřené CdA (v CdA z jízdy tlačítkem Zapsat k pozici, nebo ručně) a pohodlí. 3) Zaškrtni dvě pozice a porovnej je. Data jsou jen v tomto zařízení, zálohu si stáhni tlačítkem dole.</p></div>`;
    h += compare();
    if (!P.length) h += `<div class="card"><p class="muted" style="margin:0">Zatím žádná uložená pozice.</p></div>`;
    h += P.slice().sort((a, b) => String(b.date).localeCompare(String(a.date))).map(r => card(r, best)).join("");
    h += modelHtml(M, best);
    h += `<div class="card"><h2>Záloha</h2><p class="muted">Pozice jsou uložené jen v prohlížeči. Při smazání dat prohlížeče nebo odinstalaci by se ztratily.</p>
      <div class="row"><button class="btn ghost" data-h="export"${P.length ? "" : " disabled"}>Stáhnout zálohu</button><label class="lbtn">Načíst zálohu<input type="file" accept=".json,application/json" data-h="import" style="display:none"></label><span class="muted" data-h="bmsg"></span></div></div>`;
    root.innerHTML = h;
    // nabídka sdílení je mimo překreslovanou část, aby po odeslání zůstala hláška
    if (window.aeroShare) {
      if (P.length) window.aeroShare.attach("shHist", "position", shareData, { schema: 2, key: "hist", emptyMsg: "Všechny pozice už jsou odeslané.", onSent: markSent });
      else window.aeroShare.detach("shHist");
    }
  }

  // Sdílení: jeden řádek v databázi = jedna pozice. Posílají se jen nové nebo změněné.
  function shareData() { const recs = P.filter(r => !sentOk(r)).slice(0, 40).map(strip); return recs.length ? recs : null; }
  function markSent(recs) { recs.forEach(d => { const r = P.find(x => x.rid === d.rid); if (r) r.sentHash = hash(JSON.stringify(d)); }); store(); render(); }

  function bmsg(t) { const m = document.querySelector('#histRoot [data-h="bmsg"]'); if (m) m.textContent = t; }
  document.addEventListener("change", e => {
    const root = $("histRoot"); if (!root || !root.contains(e.target)) return;
    const t = e.target, h = t.dataset.h;
    if (h === "import") {
      const f = t.files && t.files[0]; if (!f) return;
      if (f.size > 5e6) { bmsg("Načtení se nepovedlo: soubor je větší než 5 MB, to není záloha z této aplikace."); return; }
      f.text().then(s => {
        const a = JSON.parse(s); if (!Array.isArray(a)) throw new Error("soubor neobsahuje seznam pozic");
        let n = 0, bad = 0;
        a.slice(0, 1000).forEach(x => { const r = clean(x); if (!r) { bad++; return; } if (!P.some(y => y.id === r.id)) { P.push(r); n++; } });
        const saved = store(); render();
        bmsg("Načteno " + n + " nových pozic." + (bad ? " Vynecháno " + bad + " záznamů, které nemají správný tvar." : "") + (a.length > 1000 ? " Načte se nejvýš 1000 záznamů." : "") + (saved ? "" : " Pozor: v prohlížeči došlo místo, pozice se neuložily."));
      }).catch(err => bmsg("Načtení se nepovedlo: " + (err instanceof SyntaxError ? "soubor není záloha ve formátu JSON." : err.message)));
      return;
    }
    const c = t.closest("[data-id]"); if (!c) return;
    const r = P.find(x => x.id === c.dataset.id); if (!r) return;
    if (h === "cmp") { const i = sel.indexOf(r.id); if (t.checked && i < 0) { sel.push(r.id); if (sel.length > 2) sel.shift(); } if (!t.checked && i >= 0) sel.splice(i, 1); }
    else if (h === "name") r.name = t.value.trim() || r.name;
    else if (h === "note") r.note = t.value;
    else if (h === "comfort") r.comfort = t.value ? +t.value : null;
    else if (h === "cda") { const v = num(t.value); r.cda = v > 0.1 && v < 0.6 ? { value: v, source: "ručně", date: today() } : null; }
    else if (h === "area") {
      if (t.value === "none") r.area = null;
      else if (t.value !== "") {
        const x = areasSaved()[+t.value];
        if (x) { r.area = { m2: x.area, bike: !!x.bike, scale: x.scale || null, variant: x.name }; if (x.mcda > 0 && !cdaOf(r)) r.cda = { value: x.mcda, source: "plocha", date: today() }; }
      }
    }
    store(); render();
  });
  document.addEventListener("click", e => {
    const root = $("histRoot"); if (!root || !root.contains(e.target)) return;
    const h = e.target.dataset.h;
    if (h === "del") {
      const c = e.target.closest("[data-id]"), r = c && P.find(x => x.id === c.dataset.id);
      if (r && confirm("Smazat pozici „" + r.name + "“? Nejde to vrátit.")) { P = P.filter(x => x !== r); store(); render(); }
    } else if (h === "export") {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(P, null, 1)], { type: "application/json" }));
      a.download = "aero-pozice-zaloha-" + today() + ".json"; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      bmsg("Záloha stažená.");
    }
  });

  window.aeroHist = { add, list, setCdA, render, saveBox, clearSaveBox };
})();
