// Aero a výkon: kalkulačka, čelní plocha, výkon v pozici, CdA z jízdy
const $ = id => document.getElementById(id);
const G = 9.80665, A4 = 0.210 * 0.297, FIT_EPOCH = 631065600;
const VER = "0.10.14", BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@" + VER;
const SEG_MODEL = "https://storage.googleapis.com/mediapipe-models/image_segmenter/deeplab_v3/float32/1/deeplab_v3.tflite";
const LS = "aero.v1";

// ---------- pomocné ----------
const num = (id, d) => { const el = $(id); if (!el) return d; const x = parseFloat(String(el.value).replace(",", ".")); return isFinite(x) ? x : d; };
const fmt = (x, d) => (isFinite(x) ? x.toFixed(d) : "–").replace(".", ",");
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const hms = s => { if (!isFinite(s) || s < 0) return "–"; s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(x).padStart(2, "0"); };
const sgn = (x, d) => (x > 0 ? "+" : x < 0 ? "−" : "") + fmt(Math.abs(x), d);
function load() { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } }
function save() { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) { } }
const S = load(); if (!S.calc) S.calc = {}; if (!Array.isArray(S.areas)) S.areas = []; if (typeof S.refIdx !== "number") S.refIdx = 0;

function rhoOf(tempC, altM) { const p = 101325 * Math.pow(1 - 2.25577e-5 * altM, 5.25588); return p / (287.058 * (tempC + 273.15)); }
function wheelPower(v, P) { return 0.5 * P.rho * P.cda * v * v * v + P.crr * P.m * G * v; }
function speedAt(watts, P) { const target = watts * P.eff; let lo = 0.05, hi = 40; for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (wheelPower(mid, P) > target) hi = mid; else lo = mid; } return (lo + hi) / 2; }
function calcParams(cdaOverride) {
  const c = {
    cda: num("c_cda", 0.24), mr: num("c_mr", 75), mb: num("c_mb", 9), crr: num("c_crr", 0.004), t: num("c_temp", 20), alt: num("c_alt", 300),
    eff: num("c_eff", 97.5) / 100, spd: num("c_spd", 40), pwr: num("c_pwr", 250), dist: num("c_dist", 40)
  };
  if (cdaOverride !== undefined) c.cda = cdaOverride;
  c.m = c.mr + c.mb; c.rho = rhoOf(c.t, c.alt); c.v = c.spd / 3.6;
  return c;
}
function wattsAt(c, cda) { const P = Object.assign({}, c, { cda: cda }); return wheelPower(c.v, P) / c.eff; }

function copyFrom(taId, msgId) {
  const ta = $(taId); ta.focus(); ta.select(); let ok = false;
  try { ok = document.execCommand("copy"); } catch (e) { }
  if (!ok && navigator.clipboard) { navigator.clipboard.writeText(ta.value).then(() => { $(msgId).textContent = "Zkopírováno"; }, () => { $(msgId).textContent = "Označ text a zkopíruj ručně"; }); return; }
  $(msgId).textContent = ok ? "Zkopírováno" : "Označ text a zkopíruj ručně";
}

// ---------- FIT parser (jen to, co potřebujeme) ----------
function parseFIT(buf) {
  const dv = new DataView(buf);
  if (buf.byteLength < 14) throw new Error("Soubor je příliš krátký.");
  const hs = dv.getUint8(0), dataSize = dv.getUint32(4, true);
  const sig = String.fromCharCode(dv.getUint8(8), dv.getUint8(9), dv.getUint8(10), dv.getUint8(11));
  if (sig !== ".FIT") throw new Error("Tohle není .fit soubor.");
  const end = Math.min(hs + dataSize, buf.byteLength);
  const defs = {}, records = [], laps = [];
  let p = hs, lastTs = 0;
  const rd = (base, size, off, le) => {
    const t = base & 0x1f;
    switch (t) {
      case 0: case 2: case 10: case 13: { const v = dv.getUint8(off); return (t === 10 ? v === 0 : v === 0xff) ? null : v; }
      case 1: { const v = dv.getInt8(off); return v === 0x7f ? null : v; }
      case 3: { if (size < 2) return null; const v = dv.getInt16(off, le); return v === 0x7fff ? null : v; }
      case 4: case 11: { if (size < 2) return null; const v = dv.getUint16(off, le); return (t === 11 ? v === 0 : v === 0xffff) ? null : v; }
      case 5: { if (size < 4) return null; const v = dv.getInt32(off, le); return v === 0x7fffffff ? null : v; }
      case 6: case 12: { if (size < 4) return null; const v = dv.getUint32(off, le); return (t === 12 ? v === 0 : v === 0xffffffff) ? null : v; }
      case 8: { if (size < 4) return null; const v = dv.getFloat32(off, le); return isFinite(v) ? v : null; }
      case 9: { if (size < 8) return null; const v = dv.getFloat64(off, le); return isFinite(v) ? v : null; }
      default: return null;
    }
  };
  const readData = (def, tsOverride) => {
    const vals = {};
    for (const f of def.fields) { if (p + f.size > buf.byteLength) throw new Error("Poškozený soubor."); vals[f.num] = rd(f.base, f.size, p, def.le); p += f.size; }
    for (const s of def.dev) p += s;
    if (vals[253] != null) lastTs = vals[253];
    else if (tsOverride != null) vals[253] = tsOverride;
    if (def.g === 20) {
      const sp = vals[73] != null ? vals[73] / 1000 : (vals[6] != null ? vals[6] / 1000 : null);
      const al = vals[78] != null ? vals[78] / 5 - 500 : (vals[2] != null ? vals[2] / 5 - 500 : null);
      records.push({ t: vals[253], alt: al, hr: vals[3], cad: vals[4], dist: vals[5] != null ? vals[5] / 100 : null, spd: sp, pwr: vals[7], temp: vals[13] });
    } else if (def.g === 19) {
      laps.push({ start: vals[2], end: vals[253], elapsed: vals[7] != null ? vals[7] / 1000 : null });
    }
  };
  while (p < end) {
    const h = dv.getUint8(p++);
    if (h & 0x80) {
      const lt = (h >> 5) & 3, off = h & 0x1f; const def = defs[lt]; if (!def) throw new Error("Poškozený soubor (chybí definice).");
      let ts = (lastTs & ~0x1f) + off; if (off < (lastTs & 0x1f)) ts += 0x20; lastTs = ts;
      readData(def, ts);
    } else if (h & 0x40) {
      const lt = h & 0x0f, hasDev = h & 0x20; p++;
      const le = dv.getUint8(p++) === 0; const g = dv.getUint16(p, le); p += 2;
      const n = dv.getUint8(p++); const fields = [];
      for (let i = 0; i < n; i++) { fields.push({ num: dv.getUint8(p), size: dv.getUint8(p + 1), base: dv.getUint8(p + 2) }); p += 3; }
      const dev = [];
      if (hasDev) { const nd = dv.getUint8(p++); for (let i = 0; i < nd; i++) { dev.push(dv.getUint8(p + 1)); p += 3; } }
      defs[lt] = { g, le, fields, dev };
    } else {
      const def = defs[h & 0x0f]; if (!def) throw new Error("Poškozený soubor (chybí definice).");
      readData(def, null);
    }
  }
  const rec = records.filter(r => r.t != null).sort((a, b) => a.t - b.t);
  let lp = laps.filter(l => l.end != null).map(l => ({ start: l.start != null ? l.start : (l.elapsed != null ? l.end - Math.round(l.elapsed) : null), end: l.end })).filter(l => l.start != null && l.end > l.start).sort((a, b) => a.start - b.start);
  return { records: rec, laps: lp };
}
function lapRecords(fit) {
  const R = fit.records;
  if (!R.length) return [];
  if (!fit.laps.length) return [{ start: R[0].t, end: R[R.length - 1].t, recs: R, whole: true }];
  return fit.laps.map((l, i) => {
    const last = i === fit.laps.length - 1;
    return { start: l.start, end: l.end, recs: R.filter(r => r.t >= l.start && (last ? r.t <= l.end : r.t < l.end)) };
  }).filter(l => l.recs.length > 1);
}
const avgOf = (recs, k) => { let s = 0, n = 0; for (const r of recs) if (r[k] != null) { s += r[k]; n++; } return n ? s / n : null; };
async function readFitFile(f) { const buf = await f.arrayBuffer(); return parseFIT(buf); }

// ---------- šablona ----------
const field = (id, label, val, step) => `<div><label for="${id}">${label}</label><input id="${id}" type="number" inputmode="decimal" step="${step || "any"}" value="${val}"></div>`;
$("s-aero").innerHTML = `
<div class="card"><div class="tabs" id="aTabs">
  <button class="tab on" data-a="calc">Kalkulačka</button>
  <button class="tab" data-a="area">Čelní plocha</button>
  <button class="tab" data-a="pow">Výkon v pozici</button>
  <button class="tab" data-a="cda">CdA z jízdy</button>
</div></div>

<div id="a-calc" class="apane">
  <div class="card">
    <h2>Watty a čas podle CdA</h2>
    <p class="muted">Čistá fyzika. Když znáš CdA, je výpočet přesný. CdA změříš v záložce CdA z jízdy, odtud se dá jedním klepnutím přenést sem.</p>
    <div class="grid">
      ${field("c_cda", "CdA (m²)", 0.24, "0.001")}
      ${field("c_spd", "Rychlost (km/h)", 40, "0.5")}
      ${field("c_mr", "Hmotnost jezdce (kg)", 75, "0.5")}
      ${field("c_mb", "Kolo a výbava (kg)", 9, "0.1")}
      ${field("c_crr", "Valivý odpor Crr", 0.004, "0.0001")}
      ${field("c_eff", "Účinnost převodů (%)", 97.5, "0.1")}
      ${field("c_temp", "Teplota vzduchu (°C)", 20, "1")}
      ${field("c_alt", "Nadmořská výška (m)", 300, "10")}
      ${field("c_pwr", "Tvůj výkon (W)", 250, "1")}
      ${field("c_dist", "Délka časovky (km)", 40, "0.1")}
    </div>
    <div id="c_out" style="margin-top:12px"></div>
  </div>
</div>

<div id="a-area" class="apane hidden">
  <div class="card">
    <h2>Čelní plocha z fotky zepředu</h2>
    <p class="muted">Foť přesně zepředu v ose kola, ze vzdálenosti aspoň 5 m (lépe 10 m se zoomem), telefon ve výšce hrudníku a vodorovně. Pozadí co nejjednodušší a v záběru jen ty. Pro měřítko přilep list A4 naležato nebo nastojato vedle sebe do výšky boků, kolmo k fotoaparátu. Při srovnávání variant nehýbej stativem.</p>
    <div class="grid">
      <div><label for="ar_name">Název varianty</label><input id="ar_name" type="text" placeholder="např. A – lokty 12 cm"></div>
      <div><label for="ar_scale">Měřítko</label><select id="ar_scale"><option value="a4">List A4 (doporučeno)</option><option value="wheel">Výška předního kola</option></select></div>
      <div id="ar_wbox" class="hidden">${field("ar_wd", "Průměr kola s pláštěm (mm)", 672, "1")}</div>
    </div>
    <label class="chk"><input type="checkbox" id="ar_bike" checked><span>Započítat i kolo (CdA zahrnuje jezdce i kolo)</span></label>
    <label for="ar_file" style="margin-top:10px">Vybrat fotku z galerie</label><input id="ar_file" type="file" accept="image/*">
    <label for="ar_cam" style="margin-top:8px">Vyfotit fotoaparátem</label><input id="ar_cam" type="file" accept="image/*" capture="environment">
    <div id="ar_step" class="step hidden"></div>
    <canvas id="ar_cv" class="hidden"></canvas>
    <p id="ar_status" class="muted status"></p>
    <div class="row hidden" id="ar_ctrl"><button class="btn ghost" id="ar_undo">Zpět o bod</button><button class="btn ghost" id="ar_reseg">Znovu najít obrys</button><button class="btn" id="ar_save">Uložit variantu</button></div>
    <div id="ar_res"></div>
  </div>
  <div class="card">
    <h2>Uložené varianty</h2>
    <div class="grid">
      ${field("ar_refcda", "Změřené CdA referenční varianty (m²)", S.refCdA != null ? S.refCdA : "", "0.001")}
    </div>
    <p class="muted" style="margin-top:6px">Bez změřeného CdA ukazuje aplikace jen rozdíly plochy. Se změřeným CdA spočítá tvůj osobní součinitel Cd = CdA / plocha a odhadne CdA a watty ostatních variant. Platí jen pro malé změny pozice, ne pro jinou helmu nebo kombinézu.</p>
    <div id="ar_list"></div>
  </div>
</div>

<div id="a-pow" class="apane hidden">
  <div class="card">
    <h2>Test výkonu ve třech pozicích</h2>
    <p class="muted">Cíl: zjistit, jestli aerodynamičtější pozice nestojí výkon. Porovnáváš až tři pozice. Popis nastavení každé pozice doplň až po měření, ať víš, co přesně jsi jel.</p>
    <div id="pw_pos"></div>
    <h3>Doporučený protokol</h3>
    <p class="muted">Na trenažéru jeď 6 intervalů po 8 min při stejném pocitovém úsilí, mezi nimi 4 min lehce. Pořadí <b>1, 2, 3, 3, 2, 1</b> vyrovná vliv únavy: žádná pozice není pořád první ani pořád poslední. Mezi pozicemi měň jen pozici, ne sedlo ani kliky, a před každým intervalem zmáčkni Lap. Další den test klidně zopakuj. Jeden den dává jen orientační výsledek.</p>
  </div>
  <div class="card">
    <h2>Odkud vezmu data</h2>
    <div class="tabs" id="pw_src">
      <button class="tab on" data-s="fit">Z .fit souboru</button>
      <button class="tab" data-s="man">Zadat ručně</button>
    </div>
    <div id="pw_fitbox" style="margin-top:10px">
      <label for="pw_file">Vybrat .fit soubory</label><input id="pw_file" type="file" multiple>
      <div class="grid" style="margin-top:8px">${field("pw_min", "Nejkratší započítané kolo (s)", 120, "10")}</div>
      <p id="pw_status" class="muted status"></p>
      <div id="pw_laps" class="scroll"></div>
    </div>
    <div id="pw_manbox" class="hidden" style="margin-top:10px">
      <p class="muted">Pro každý interval napiš pozici (1, 2 nebo 3), délku a průměry, které ukazuje tvůj cyklopočítač nebo trenažér. Tep a kadence nejsou povinné, ale bez tepu nejde srovnat watty na tep.</p>
      <div id="pw_man" class="scroll"></div>
      <div class="row"><button class="btn ghost" id="pw_addrow">Přidat interval</button><button class="btn ghost" id="pw_clearman">Smazat ruční data</button></div>
    </div>
  </div>
  <div class="card">
    <div id="pw_sum"></div>
    <div id="pw_outbox" class="hidden"><h3>Text pro Claude</h3><textarea id="pw_out" readonly></textarea><div class="row"><button class="btn" id="pw_copy">Zkopírovat</button><span class="muted" id="pw_copied"></span></div></div>
  </div>
</div>

<div id="a-cda" class="apane hidden">
  <div class="card">
    <h2>CdA z jízdy (virtual elevation)</h2>
    <p class="muted">Potřebuješ wattmetr, snímač rychlosti na kole (ne rychlost z GPS) a barometrický výškoměr. Jezdi okruh 1 až 3 min bez brzdění za bezvětří, 4 až 6 kol s různým výkonem, start a cíl kola na stejném místě a na každém průjezdu zmáčkni Lap. Pozici během kola neměň. Pro srovnání pozic jeď několik kol v každé a označ je níže.</p>
    <label for="cd_file">Vybrat .fit soubor z jízdy</label><input id="cd_file" type="file">
    <div class="grid" style="margin-top:8px">
      ${field("cd_m", "Celková hmotnost jezdec + kolo (kg)", 84, "0.5")}
      <div><label for="cd_pm">Wattmetr</label><select id="cd_pm"><option value="0.975">Klika nebo pedály (ztráty 2,5 %)</option><option value="1">Zadní náboj (bez ztrát)</option></select></div>
      <div><label for="cd_crrm">Valivý odpor</label><select id="cd_crrm"><option value="fit">Odhadnout z dat</option><option value="fix">Pevná hodnota</option></select></div>
      ${field("cd_crr", "Crr (při pevné hodnotě)", 0.004, "0.0001")}
      ${field("cd_temp", "Teplota vzduchu (°C)", "", "0.5")}
      ${field("cd_alt", "Nadmořská výška (m)", "", "10")}
    </div>
    <p id="cd_status" class="muted status"></p>
    <div id="cd_laps" class="scroll"></div>
    <div class="row hidden" id="cd_ctrl"><button class="btn" id="cd_run">Spočítat CdA</button></div>
    <div id="cd_res"></div>
    <div id="cd_chartbox" class="hidden">
      <h3>Virtuální vs. skutečná výška</h3>
      <p class="muted">Když CdA a Crr sedí, obě čáry se překrývají. Rozjíždějí se při větru, brzdění nebo chybném snímači rychlosti.</p>
      <div class="legend"><span><i style="background:var(--c1)"></i>Skutečná výška</span><span><i style="background:var(--c2)"></i>Virtuální výška</span></div>
      <div class="chartwrap" id="cd_wrap"><canvas id="cd_chart"></canvas><div class="tip hidden" id="cd_tip"></div></div>
    </div>
    <div id="cd_outbox" class="hidden"><h3>Text pro Claude</h3><textarea id="cd_out" readonly></textarea><div class="row"><button class="btn" id="cd_copy">Zkopírovat</button><span class="muted" id="cd_copied"></span></div></div>
  </div>
</div>`;

// ---------- navigace ----------
let prevPos = null;
$("topnav").onclick = e => {
  const b = e.target.closest("button"); if (!b) return;
  [...$("topnav").children].forEach(x => x.classList.toggle("on", x === b));
  const aero = b.dataset.top === "aero";
  if (aero) {
    if (!prevPos) prevPos = { mode: $("s-mode").classList.contains("hidden"), work: $("s-work").classList.contains("hidden") };
    $("s-mode").classList.add("hidden"); $("s-work").classList.add("hidden"); $("s-aero").classList.remove("hidden");
    if (curPane === "calc") renderCalc(); if (curPane === "area") renderAreaList(); if (curPane === "cda" && CD.fitRes) drawChart();
  } else {
    $("s-aero").classList.add("hidden");
    if (prevPos) { $("s-mode").classList.toggle("hidden", prevPos.mode); $("s-work").classList.toggle("hidden", prevPos.work); prevPos = null; }
  }
};
let curPane = "calc";
$("aTabs").onclick = e => {
  const b = e.target.closest("button"); if (!b) return;
  curPane = b.dataset.a;
  [...$("aTabs").children].forEach(x => x.classList.toggle("on", x === b));
  document.querySelectorAll(".apane").forEach(p => p.classList.toggle("hidden", p.id !== "a-" + curPane));
  if (curPane === "calc") renderCalc(); if (curPane === "area") { renderAreaList(); drawArea(); } if (curPane === "cda" && CD.fitRes) drawChart();
};

// ---------- 1. kalkulačka ----------
const CALC_IDS = ["c_cda", "c_spd", "c_mr", "c_mb", "c_crr", "c_eff", "c_temp", "c_alt", "c_pwr", "c_dist"];
CALC_IDS.forEach(id => { if (S.calc[id] != null && S.calc[id] !== "") $(id).value = S.calc[id]; });
if ((S.calc.c_mr == null || S.calc.c_mr === "") && $("h") && $("h").value) $("c_mr").value = $("h").value;
CALC_IDS.forEach(id => { $(id).addEventListener("input", () => { S.calc[id] = $(id).value; save(); renderCalc(); renderAreaList(); }); });
function renderCalc() {
  const c = calcParams();
  if (!(c.cda > 0 && c.v > 0 && c.m > 0 && c.eff > 0)) { $("c_out").innerHTML = "<p class='muted warn'>Doplň kladné hodnoty CdA, rychlosti, hmotnosti a účinnosti.</p>"; return; }
  const aero = 0.5 * c.rho * c.cda * Math.pow(c.v, 3), roll = c.crr * c.m * G * c.v, tot = (aero + roll) / c.eff, loss = tot - aero - roll;
  const per = 0.5 * c.rho * 0.01 * Math.pow(c.v, 3) / c.eff;
  const vP = c.pwr > 0 ? speedAt(c.pwr, c) : NaN, tP = c.dist * 1000 / vP;
  let rows = "";
  for (let d = -3; d <= 3; d++) {
    const cd = Math.round((c.cda + d * 0.01) * 1000) / 1000; if (cd <= 0.05) continue;
    const w = wattsAt(c, cd), v2 = speedAt(c.pwr, Object.assign({}, c, { cda: cd })), t2 = c.dist * 1000 / v2;
    rows += `<tr${d === 0 ? " style='background:var(--bg)'" : ""}><td>${fmt(cd, 3)}${d === 0 ? "<small>tvoje zadání</small>" : ""}</td><td>${fmt(w, 0)} W</td><td>${hms(t2)}</td><td>${d === 0 ? "–" : sgn(t2 - tP, 0) + " s"}</td></tr>`;
  }
  $("c_out").innerHTML = `
    <p class="muted">Při ${fmt(c.spd, 1)} km/h potřebuješ</p>
    <p class="big">${fmt(tot, 0)} W</p>
    <table>
      <tr><td>Aerodynamický odpor</td><td>${fmt(aero, 0)} W</td></tr>
      <tr><td>Valivý odpor</td><td>${fmt(roll, 0)} W</td></tr>
      <tr><td>Ztráty v převodech</td><td>${fmt(loss, 0)} W</td></tr>
      <tr><td>Hustota vzduchu<small>z teploty a nadmořské výšky</small></td><td>${fmt(c.rho, 3)} kg/m³</td></tr>
      <tr><td>Každých 0,01 m² CdA<small>při ${fmt(c.spd, 1)} km/h</small></td><td>${fmt(per, 1)} W</td></tr>
      <tr><td>Rychlost při ${fmt(c.pwr, 0)} W</td><td>${fmt(vP * 3.6, 1)} km/h</td></tr>
      <tr><td>Čas na ${fmt(c.dist, 1)} km při ${fmt(c.pwr, 0)} W</td><td>${hms(tP)}</td></tr>
    </table>
    <h3>Co udělá změna CdA</h3>
    <div class="scroll"><table class="wide"><tr><td>CdA (m²)</td><td>Watty při ${fmt(c.spd, 0)} km/h</td><td>Čas na ${fmt(c.dist, 0)} km při ${fmt(c.pwr, 0)} W</td><td>Rozdíl</td></tr>${rows}</table></div>
    <p class="muted" style="margin-top:8px">Bez větru a na rovině. Vítr, kopce a zatáčky výsledek mění, rozdíly mezi hodnotami CdA ale zůstávají vypovídající.</p>`;
}
renderCalc();

// ---------- 2. čelní plocha ----------
const AR = { img: null, w: 0, h: 0, pts: [], mask: null, busy: false, drag: -1, seg: null, segLoading: null, labels: null };
const arCv = $("ar_cv"), arCtx = arCv.getContext("2d");
$("ar_scale").onchange = () => { $("ar_wbox").classList.toggle("hidden", $("ar_scale").value !== "wheel"); AR.pts = []; updArea(); };
$("ar_bike").onchange = () => updArea();
$("ar_wd").oninput = () => updArea();
const AR_NAMES = { a4: ["levý horní roh listu A4", "pravý horní roh", "pravý dolní roh", "levý dolní roh"], wheel: ["horní okraj pláště předního kola", "místo dotyku předního kola se zemí"] };
const needPts = () => $("ar_scale").value === "a4" ? 4 : 2;

function getSeg() {
  if (AR.seg) return Promise.resolve(AR.seg);
  if (!AR.segLoading) AR.segLoading = (async () => {
    const m = await import(BASE + "/vision_bundle.mjs");
    const fs = await m.FilesetResolver.forVisionTasks(BASE + "/wasm");
    const seg = await m.ImageSegmenter.createFromOptions(fs, { baseOptions: { modelAssetPath: SEG_MODEL, delegate: "CPU" }, runningMode: "IMAGE", outputCategoryMask: true, outputConfidenceMasks: false });
    let labels = []; try { labels = seg.getLabels() || []; } catch (e) { }
    const low = labels.map(x => String(x).toLowerCase());
    AR.labels = { person: low.indexOf("person") >= 0 ? low.indexOf("person") : 15, bike: low.indexOf("bicycle") >= 0 ? low.indexOf("bicycle") : 2 };
    AR.seg = seg; return seg;
  })().catch(e => { AR.segLoading = null; throw e; });
  return AR.segLoading;
}
function runSeg(seg, canvas) {
  const r = seg.segment(canvas);
  const mk = r.categoryMask; if (!mk) throw new Error("Model nevrátil masku.");
  const out = { data: new Uint8Array(mk.getAsUint8Array()), w: mk.width, h: mk.height };
  try { r.close && r.close(); } catch (e) { }
  return out;
}
async function segmentArea() {
  if (!AR.img) return;
  AR.busy = true; AR.mask = null; setArStatus("Načítám model a hledám obrys těla… (poprvé se stahuje asi 3 MB)", false); updArea();
  try {
    const seg = await getSeg(), L = AR.labels;
    const sel = v => v === L.person || v === L.bike;
    // 1. průchod: celá fotka
    const sc1 = Math.min(1, 1024 / Math.max(AR.w, AR.h)), c1 = document.createElement("canvas");
    c1.width = Math.round(AR.w * sc1); c1.height = Math.round(AR.h * sc1); c1.getContext("2d").drawImage(AR.img, 0, 0, c1.width, c1.height);
    const m1 = runSeg(seg, c1);
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n1 = 0;
    for (let y = 0; y < m1.h; y++) for (let x = 0; x < m1.w; x++) if (sel(m1.data[y * m1.w + x])) { n1++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (n1 < 50) throw new Error("Na fotce nebyl nalezen jezdec.");
    // 2. průchod: výřez kolem jezdce ve vyšším rozlišení
    const fx = AR.w / m1.w, fy = AR.h / m1.h, pad = 0.08;
    let rx = x0 * fx, ry = y0 * fy, rw = (x1 - x0 + 1) * fx, rh = (y1 - y0 + 1) * fy;
    rx = Math.max(0, rx - rw * pad); ry = Math.max(0, ry - rh * pad); rw = Math.min(AR.w - rx, rw * (1 + 2 * pad)); rh = Math.min(AR.h - ry, rh * (1 + 2 * pad));
    const nat = AR.img.naturalWidth / AR.w, sc2 = Math.min(1, 1024 / Math.max(rw * nat, rh * nat)), c2 = document.createElement("canvas");
    c2.width = Math.max(1, Math.round(rw * nat * sc2)); c2.height = Math.max(1, Math.round(rh * nat * sc2));
    c2.getContext("2d").drawImage(AR.img, rx * nat, ry * nat, rw * nat, rh * nat, 0, 0, c2.width, c2.height);
    const m2 = runSeg(seg, c2);
    AR.mask = Object.assign(m2, { rect: { x: rx, y: ry, w: rw, h: rh } });
    const ov = document.createElement("canvas"); ov.width = m2.w; ov.height = m2.h;
    AR.mask.ov = ov; paintOverlay();
    setArStatus("Obrys nalezen. Zkontroluj zbarvenou plochu: má pokrývat tebe" + ($("ar_bike").checked ? " i kolo" : "") + ", nic víc. Když to nesedí, zkus jednodušší pozadí.", false);
  } catch (e) {
    setArStatus("Hledání obrysu selhalo: " + (e && e.message ? e.message : e) + " Zkus to znovu, případně jinou fotku s jednodušším pozadím.", true);
  }
  AR.busy = false; updArea();
}
function paintOverlay() {
  const M = AR.mask; if (!M || !M.ov) return;
  const L = AR.labels, bike = $("ar_bike").checked, ctx = M.ov.getContext("2d"), id = ctx.createImageData(M.w, M.h);
  const col = getComputedStyle(document.documentElement).getPropertyValue("--c1").trim() || "#0083a0";
  const rgb = [parseInt(col.slice(1, 3), 16), parseInt(col.slice(3, 5), 16), parseInt(col.slice(5, 7), 16)];
  let n = 0;
  for (let i = 0; i < M.data.length; i++) { const v = M.data[i]; if (v === L.person || (bike && v === L.bike)) { id.data[i * 4] = rgb[0]; id.data[i * 4 + 1] = rgb[1]; id.data[i * 4 + 2] = rgb[2]; id.data[i * 4 + 3] = 120; n++; } }
  ctx.putImageData(id, 0, 0);
  M.count = n * (M.rect.w / M.w) * (M.rect.h / M.h);
}
function setArStatus(t, bad) { const s = $("ar_status"); s.textContent = t; s.classList.toggle("bad", !!bad); }
const arPick = e => {
  const f = e.target.files[0]; if (!f) return;
  const im = new Image();
  im.onload = () => {
    AR.img = im; const sc = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight));
    AR.w = Math.round(im.naturalWidth * sc); AR.h = Math.round(im.naturalHeight * sc); AR.pts = [];
    arCv.width = AR.w; arCv.height = AR.h; arCv.classList.remove("hidden"); $("ar_ctrl").classList.remove("hidden"); $("ar_step").classList.remove("hidden");
    segmentArea();
  };
  im.onerror = () => setArStatus("Fotku se nepodařilo načíst.", true);
  im.src = URL.createObjectURL(f);
};
$("ar_file").onchange = arPick; $("ar_cam").onchange = arPick;
$("ar_undo").onclick = () => { AR.pts.pop(); updArea(); };
$("ar_reseg").onclick = () => segmentArea();
function arPos(e) { const r = arCv.getBoundingClientRect(); return { x: (e.clientX - r.left) * arCv.width / r.width, y: (e.clientY - r.top) * arCv.height / r.height, s: arCv.width / r.width }; }
arCv.addEventListener("pointerdown", e => {
  if (!AR.img) return; const p = arPos(e), need = needPts();
  let best = -1, bd = (AR.pts.length < need ? 12 : 36) * p.s;
  AR.pts.forEach((q, i) => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = i; } });
  if (best >= 0) AR.drag = best;
  else if (AR.pts.length < need) { AR.pts.push({ x: p.x, y: p.y }); AR.drag = AR.pts.length - 1; }
  else return;
  arCv.setPointerCapture(e.pointerId); updArea();
});
arCv.addEventListener("pointermove", e => { if (AR.drag < 0) return; const p = arPos(e); AR.pts[AR.drag] = { x: p.x, y: p.y }; updArea(); });
const arEnd = () => { AR.drag = -1; }; arCv.addEventListener("pointerup", arEnd); arCv.addEventListener("pointercancel", arEnd);

function drawArea() {
  if (!AR.img) return;
  arCtx.drawImage(AR.img, 0, 0, AR.w, AR.h);
  const M = AR.mask; if (M && M.ov) arCtx.drawImage(M.ov, M.rect.x, M.rect.y, M.rect.w, M.rect.h);
  const r = Math.max(6, AR.w / 110), css = getComputedStyle(document.documentElement), pt = css.getPropertyValue("--pt").trim();
  arCtx.strokeStyle = pt; arCtx.lineWidth = r / 2.5;
  if (AR.pts.length > 1) { arCtx.beginPath(); AR.pts.forEach((q, i) => i ? arCtx.lineTo(q.x, q.y) : arCtx.moveTo(q.x, q.y)); if (needPts() === 4 && AR.pts.length === 4) arCtx.closePath(); arCtx.stroke(); }
  arCtx.font = "bold " + (r * 2) + "px sans-serif";
  AR.pts.forEach((q, i) => { arCtx.fillStyle = pt; arCtx.beginPath(); arCtx.arc(q.x, q.y, r, 0, 7); arCtx.fill(); arCtx.lineWidth = r / 3; arCtx.strokeStyle = "#000"; arCtx.fillStyle = "#fff"; arCtx.strokeText(String(i + 1), q.x + r * 1.2, q.y - r * 1.2); arCtx.fillText(String(i + 1), q.x + r * 1.2, q.y - r * 1.2); arCtx.strokeStyle = pt; arCtx.lineWidth = r / 2.5; });
}
function areaResult() {
  const M = AR.mask, need = needPts();
  if (!M || M.count == null || AR.pts.length < need) return null;
  let scale, warn = "";
  if (need === 4) {
    const P = AR.pts; let s = 0; for (let i = 0; i < 4; i++) { const a = P[i], b = P[(i + 1) % 4]; s += a.x * b.y - b.x * a.y; }
    const qa = Math.abs(s) / 2; if (qa < 50) return null;
    scale = A4 / qa;
    const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y), s1 = (d(P[0], P[1]) + d(P[2], P[3])) / 2, s2 = (d(P[1], P[2]) + d(P[3], P[0])) / 2;
    const ratio = Math.max(s1, s2) / Math.min(s1, s2);
    if (Math.abs(ratio - 1.414) / 1.414 > 0.12) warn = "Poměr stran listu na fotce je " + fmt(ratio, 2) + " místo 1,41. List je asi natočený nebo body nesedí na rozích, měřítko je nepřesné.";
  } else {
    const len = Math.hypot(AR.pts[0].x - AR.pts[1].x, AR.pts[0].y - AR.pts[1].y); if (len < 10) return null;
    scale = Math.pow(num("ar_wd", 672) / 1000 / len, 2);
    warn = "Kolo je blíž k fotoaparátu než tvoje tělo, takže absolutní plocha vyjde trochu menší. Pro srovnání variant ze stejného místa to nevadí.";
  }
  return { area: M.count * scale, warn };
}
function updArea() {
  paintOverlay(); drawArea();
  const need = needPts(), names = AR_NAMES[$("ar_scale").value];
  $("ar_step").textContent = !AR.img ? "" : AR.busy ? "Hledám obrys těla…" : AR.pts.length < need ? "Klepni na: " + names[AR.pts.length] + " (" + (AR.pts.length + 1) + "/" + need + ")" : "Hotovo. Body můžeš přetáhnout, pak variantu ulož.";
  const R = areaResult();
  $("ar_res").innerHTML = R ? `<p class="muted" style="margin-top:8px">Čelní plocha (${$("ar_bike").checked ? "jezdec + kolo" : "jen jezdec"})</p><p class="big">${fmt(R.area, 3)} m²</p>${R.warn ? `<p class="muted warn">${esc(R.warn)}</p>` : ""}` : "";
}
$("ar_save").onclick = () => {
  const R = areaResult(); if (!R) { setArStatus("Nejdřív počkej na obrys a označ body měřítka.", true); return; }
  const name = $("ar_name").value.trim() || ("Varianta " + (S.areas.length + 1));
  S.areas.push({ name, area: R.area, bike: $("ar_bike").checked, scale: $("ar_scale").value, date: new Date().toISOString().slice(0, 10) });
  save(); renderAreaList(); setArStatus("Uloženo jako „" + name + "“.", false); $("ar_name").value = "";
};
$("ar_refcda").oninput = () => { const v = num("ar_refcda", NaN); S.refCdA = isFinite(v) && v > 0 ? v : null; save(); renderAreaList(); };
function renderAreaList() {
  const L = S.areas;
  if (!L.length) { $("ar_list").innerHTML = "<p class='muted'>Zatím žádná uložená varianta.</p>"; return; }
  if (S.refIdx >= L.length) S.refIdx = 0;
  const ref = L[S.refIdx], c = calcParams(), Cd = S.refCdA ? S.refCdA / ref.area : null, wRef = Cd ? wattsAt(c, Cd * ref.area) : null;
  const mixed = L.some(x => x.bike !== ref.bike || x.scale !== ref.scale);
  let h = `<div class="scroll"><table class="wide"><tr><td>Varianta</td><td>Plocha m²</td><td>Rozdíl</td>${Cd ? `<td>CdA</td><td>W</td><td>ΔW</td>` : ""}<td></td></tr>`;
  L.forEach((x, i) => {
    const d = (x.area / ref.area - 1) * 100, cda = Cd ? Cd * x.area : null, w = Cd ? wattsAt(c, cda) : null;
    h += `<tr><td><label class="chk" style="margin:0"><input type="radio" name="arref" data-i="${i}"${i === S.refIdx ? " checked" : ""}><span>${esc(x.name)}<small>${x.bike ? "jezdec + kolo" : "jen jezdec"}, ${x.scale === "a4" ? "A4" : "kolo"}, ${esc(x.date)}</small></span></label></td><td>${fmt(x.area, 3)}</td><td>${i === S.refIdx ? "reference" : sgn(d, 1) + " %"}</td>${Cd ? `<td>${fmt(cda, 3)}</td><td>${fmt(w, 0)}</td><td>${i === S.refIdx ? "–" : sgn(w - wRef, 0)}</td>` : ""}<td><button class="xbtn" data-del="${i}" aria-label="Smazat">×</button></td></tr>`;
  });
  h += "</table></div>";
  if (Cd) h += `<p class="muted" style="margin-top:6px">W a ΔW jsou watty při ${fmt(c.spd, 0)} km/h podle kalkulačky. Tvůj osobní Cd = ${fmt(Cd, 3)} (CdA ${fmt(S.refCdA, 3)} / plocha ${fmt(ref.area, 3)} m²). Odhad předpokládá stejný Cd u všech variant, takže zachytí změnu plochy, ne tvaru. Nejistota je aspoň ±2 až 3 %, rozdíly do ~3 W ber jako shodu.</p>`;
  else h += `<p class="muted" style="margin-top:6px">Radiem vyber referenční variantu. Rozdíl plochy v % zhruba odpovídá rozdílu CdA v %, pokud se nemění tvar (helma, kombinéza).</p>`;
  if (mixed) h += `<p class="muted warn">Varianty jsou měřené různě (s kolem a bez, nebo jiným měřítkem). Srovnávej jen stejně měřené.</p>`;
  $("ar_list").innerHTML = h;
}
$("ar_list").addEventListener("click", e => {
  const del = e.target.closest("[data-del]"); if (del) { S.areas.splice(+del.dataset.del, 1); if (S.refIdx >= S.areas.length) S.refIdx = 0; save(); renderAreaList(); return; }
});
$("ar_list").addEventListener("change", e => { if (e.target.name === "arref") { S.refIdx = +e.target.dataset.i; save(); renderAreaList(); } });
renderAreaList();

// ---------- 3. výkon v pozici ----------
const POS_DEF = [
  { id: "1", name: "Pozice 1: současná (reference)", desc: "" },
  { id: "2", name: "Pozice 2", desc: "" },
  { id: "3", name: "Pozice 3", desc: "" }
];
if (!S.pos) S.pos = {}; if (!S.pwr) S.pwr = { src: "fit", man: [], comfort: {} };
if (!S.pwr.comfort) S.pwr.comfort = {}; if (!Array.isArray(S.pwr.man)) S.pwr.man = [];
const PW = { laps: [] };
const cz = (n, a, b, c) => n === 1 ? a : (n >= 2 && n <= 4 ? b : c);
const posName = id => (POS_DEF.find(p => p.id === id) || {}).name || id;
function renderPosBox() {
  $("pw_pos").innerHTML = POS_DEF.map(p => `<div class="card" style="margin:8px 0;background:var(--bg)"><b>${esc(p.name)}</b>
    <label for="pd_${p.id}" style="margin-top:6px">Popis nastavení (výška, úhly, délka nástavců…)</label>
    <input id="pd_${p.id}" type="text" data-pd="${p.id}" placeholder="Doplníš po měření" value="${esc(S.pos[p.id] != null ? S.pos[p.id] : p.desc)}">
    <label for="pc_${p.id}" style="margin-top:6px">Pohodlí v této pozici (1 špatné až 10 výborné)</label>
    <input id="pc_${p.id}" type="number" inputmode="decimal" min="1" max="10" step="1" data-pc="${p.id}" value="${S.pwr.comfort[p.id] != null ? S.pwr.comfort[p.id] : ""}"></div>`).join("");
}
$("pw_pos").addEventListener("input", e => {
  if (e.target.dataset.pd) { S.pos[e.target.dataset.pd] = e.target.value; save(); }
  if (e.target.dataset.pc) { const v = parseFloat(String(e.target.value).replace(",", ".")); S.pwr.comfort[e.target.dataset.pc] = isFinite(v) ? v : null; save(); renderPwSum(); }
});
renderPosBox();

$("pw_src").onclick = e => {
  const b = e.target.closest("button"); if (!b) return;
  S.pwr.src = b.dataset.s; save(); applySrc();
};
function applySrc() {
  [...$("pw_src").children].forEach(x => x.classList.toggle("on", x.dataset.s === S.pwr.src));
  $("pw_fitbox").classList.toggle("hidden", S.pwr.src !== "fit"); $("pw_manbox").classList.toggle("hidden", S.pwr.src !== "man");
  renderPwSum();
}

$("pw_file").onchange = async e => {
  const files = [...e.target.files]; if (!files.length) return;
  PW.laps = []; $("pw_status").textContent = "Načítám…"; $("pw_status").classList.remove("bad");
  const errs = [];
  for (const f of files) {
    try {
      const fit = await readFitFile(f), L = lapRecords(fit);
      if (!L.length) throw new Error("bez záznamů");
      L.forEach((l, i) => {
        const dur = l.recs[l.recs.length - 1].t - l.recs[0].t + 1;
        PW.laps.push({ file: f.name, n: i + 1, dur, p: avgOf(l.recs, "pwr"), hr: avgOf(l.recs, "hr"), cad: avgOf(l.recs, "cad"), label: "", whole: !!l.whole });
      });
    } catch (err) { errs.push(f.name + ": " + (err.message || err)); }
  }
  const st = $("pw_status");
  st.textContent = (PW.laps.length ? "Načteno " + PW.laps.length + " kol." : "Nic se nenačetlo.") + (errs.length ? " Chyby: " + errs.join("; ") : "") + (PW.laps.some(l => l.whole) ? " Některý soubor nemá kola (Lap), bere se celý jako jedno kolo." : "");
  st.classList.toggle("bad", !!errs.length || !PW.laps.length);
  renderPwLaps();
};
$("pw_min").oninput = () => renderPwLaps();
const posSelect = (cur, attr) => `<select ${attr} style="padding:6px"><option value="">–</option>${POS_DEF.map(p => `<option value="${p.id}"${cur === p.id ? " selected" : ""}>${p.id}</option>`).join("")}</select>`;
function renderPwLaps() {
  const min = num("pw_min", 120), multi = new Set(PW.laps.map(l => l.file)).size > 1;
  const vis = PW.laps.filter(l => l.dur >= min);
  if (!PW.laps.length) { $("pw_laps").innerHTML = ""; renderPwSum(); return; }
  let h = `<table class="tbl-in wide"><tr><td>Kolo</td><td>Délka</td><td>Ø W</td><td>Ø tep</td><td>Ø kad.</td><td>Pozice</td></tr>`;
  vis.forEach(l => { const i = PW.laps.indexOf(l); h += `<tr><td>${multi ? esc(l.file) + " · " : ""}${l.n}</td><td>${hms(l.dur)}</td><td>${fmt(l.p, 0)}</td><td>${l.hr != null ? fmt(l.hr, 0) : "–"}</td><td>${l.cad != null ? fmt(l.cad, 0) : "–"}</td><td>${posSelect(l.label, 'data-pl="' + i + '"')}</td></tr>`; });
  h += "</table>";
  if (vis.length < PW.laps.length) h += `<p class="muted">Skryto ${PW.laps.length - vis.length} kratších kol (rozjetí, pauzy).</p>`;
  $("pw_laps").innerHTML = h; renderPwSum();
}
$("pw_laps").addEventListener("change", e => { const i = e.target.dataset.pl; if (i == null) return; PW.laps[+i].label = e.target.value; renderPwSum(); });

// ruční zadání
function renderMan() {
  const M = S.pwr.man;
  if (!M.length) { $("pw_man").innerHTML = "<p class='muted'>Zatím žádný interval. Klepni na Přidat interval.</p>"; return; }
  let h = `<table class="tbl-in wide"><tr><td>Pozice</td><td>Délka (min)</td><td>Ø W</td><td>Ø tep</td><td>Kadence</td><td></td></tr>`;
  M.forEach((r, i) => {
    const inp = (k, ph) => `<input type="number" inputmode="decimal" step="any" data-mi="${i}" data-mk="${k}" value="${r[k] != null ? r[k] : ""}" placeholder="${ph}" style="width:84px">`;
    h += `<tr><td>${posSelect(r.pos, 'data-mi="' + i + '" data-mk="pos"')}</td><td>${inp("min", "8")}</td><td>${inp("p", "250")}</td><td>${inp("hr", "150")}</td><td>${inp("cad", "90")}</td><td><button class="xbtn" data-mdel="${i}" aria-label="Smazat interval">×</button></td></tr>`;
  });
  $("pw_man").innerHTML = h + "</table>";
}
$("pw_addrow").onclick = () => { const last = S.pwr.man[S.pwr.man.length - 1]; S.pwr.man.push({ pos: "", min: last ? last.min : 8, p: null, hr: null, cad: null }); save(); renderMan(); renderPwSum(); };
$("pw_clearman").onclick = () => { S.pwr.man = []; save(); renderMan(); renderPwSum(); };
$("pw_man").addEventListener("input", e => {
  const i = e.target.dataset.mi, k = e.target.dataset.mk; if (i == null) return;
  if (k === "pos") S.pwr.man[+i].pos = e.target.value;
  else { const v = parseFloat(String(e.target.value).replace(",", ".")); S.pwr.man[+i][k] = isFinite(v) ? v : null; }
  save(); renderPwSum();
});
$("pw_man").addEventListener("change", e => { if (e.target.dataset.mk === "pos") { S.pwr.man[+e.target.dataset.mi].pos = e.target.value; save(); renderPwSum(); } });
$("pw_man").addEventListener("click", e => { const d = e.target.closest("[data-mdel]"); if (d) { S.pwr.man.splice(+d.dataset.mdel, 1); save(); renderMan(); renderPwSum(); } });

function pwIntervals() {
  if (S.pwr.src === "man") return S.pwr.man.filter(r => r.pos && r.min > 0 && r.p > 0).map(r => ({ label: r.pos, dur: r.min * 60, p: r.p, hr: r.hr > 0 ? r.hr : null, cad: r.cad > 0 ? r.cad : null }));
  const min = num("pw_min", 120);
  return PW.laps.filter(l => l.dur >= min && l.label).map(l => ({ label: l.label, dur: l.dur, p: l.p, hr: l.hr, cad: l.cad }));
}
function renderPwSum() {
  const I = pwIntervals(), G2 = new Map();
  I.forEach(l => {
    if (!G2.has(l.label)) G2.set(l.label, { t: 0, p: 0, hr: 0, thr: 0, cad: 0, tc: 0, n: 0 });
    const g = G2.get(l.label); g.n++; g.t += l.dur; g.p += (l.p || 0) * l.dur; if (l.hr != null) { g.hr += l.hr * l.dur; g.thr += l.dur; } if (l.cad != null) { g.cad += l.cad * l.dur; g.tc += l.dur; }
  });
  if (!G2.size) { $("pw_sum").innerHTML = "<h2>Srovnání pozic</h2><p class='muted'>" + (S.pwr.src === "man" ? "Přidej intervaly a vyber u nich pozici." : "Nahraj .fit soubor a ke kolům vyber pozici 1, 2 nebo 3.") + " Pak se tady objeví srovnání.</p>"; $("pw_outbox").classList.add("hidden"); return; }
  const rows = POS_DEF.filter(p => G2.has(p.id)).map(p => { const g = G2.get(p.id); return { k: p.id, n: g.n, t: g.t, p: g.p / g.t, hr: g.thr ? g.hr / g.thr : null, cad: g.tc ? g.cad / g.tc : null, cf: S.pwr.comfort[p.id] }; });
  rows.forEach(r => { r.wpb = r.hr ? r.p / r.hr : null; });
  const b = rows.find(r => r.k === "1") || rows[0];
  let h = `<h2>Srovnání pozic</h2><div class="scroll"><table class="wide"><tr><td>Pozice</td><td>Čas</td><td>Ø W</td><td>Ø tep</td><td>W/tep</td><td>Rozdíl W/tep</td><td>Pohodlí</td></tr>`;
  rows.forEach(r => { const d = (r.wpb && b.wpb) ? (r.wpb / b.wpb - 1) * 100 : null; h += `<tr><td>${esc(posName(r.k))}<small>${r.n} ${cz(r.n, "interval", "intervaly", "intervalů")}${r.cad ? ", " + fmt(r.cad, 0) + " ot/min" : ""}</small></td><td>${hms(r.t)}</td><td>${fmt(r.p, 0)}</td><td>${r.hr ? fmt(r.hr, 0) : "–"}</td><td>${r.wpb ? fmt(r.wpb, 2) : "–"}</td><td${d != null && d < -3 ? " class='flag'" : ""}>${r === b ? "reference" : d != null ? sgn(d, 1) + " %" : "–"}</td><td>${r.cf != null ? fmt(r.cf, 0) + "/10" : "–"}</td></tr>`; });
  h += "</table></div>";
  const notes = [];
  rows.filter(r => r !== b).forEach(r => {
    const dP = (r.p / b.p - 1) * 100;
    if (r.wpb && b.wpb) {
      const d = (r.wpb / b.wpb - 1) * 100;
      notes.push(Math.abs(d) <= 3 ? `${esc(posName(r.k))}: rozdíl ${sgn(d, 1)} % ve wattech na tep je v šumu, výkon pozice zřejmě neomezuje.` : d < 0 ? `${esc(posName(r.k))}: o ${fmt(-d, 1)} % méně wattů na tep než reference. Pozice může brzdit výkon, ověř opakováním.` : `${esc(posName(r.k))}: o ${fmt(d, 1)} % více wattů na tep než reference.`);
    } else notes.push(`${esc(posName(r.k))}: bez tepu srovnáváš jen výkon (${sgn(dP, 1)} % proti referenci). Interval musí být jeden na jednu pozici při stejném pocitovém úsilí.`);
    if (r.cf != null && b.cf != null && r.cf <= b.cf - 2) notes.push(`${esc(posName(r.k))}: pohodlí je o ${fmt(b.cf - r.cf, 0)} ${cz(Math.round(b.cf - r.cf), "bod", "body", "bodů")} horší než reference, delší časovku v ní můžeš nezvládnout udržet.`);
  });
  if (!rows.some(r => r.k === "1")) notes.push("Chybí pozice 1 (reference), srovnání proto bere jako referenci první dostupnou pozici.");
  const counts = rows.map(r => r.n); if (Math.min.apply(null, counts) < 2) notes.push("Pozice s jediným intervalem je méně spolehlivá. Protokol 1, 2, 3, 3, 2, 1 dává dva intervaly na pozici.");
  h += `<p class="muted" style="margin-top:8px">${notes.join("<br>")}</p><p class="muted">Tep roste s únavou, teplem a pořadím intervalů. Rozdíl do ~3 % proto ber jako shodu a závěr potvrď opakovaným testem v jiný den.</p>`;
  $("pw_sum").innerHTML = h;
  $("pw_out").value = "Testoval jsem výkon ve třech pozicích na trenažéru (stejné intervaly, stejné pocitové úsilí, pořadí 1, 2, 3, 3, 2, 1).\n\n" +
    POS_DEF.filter(p => G2.has(p.id)).map(p => `- ${p.name}: ${(S.pos[p.id] != null ? S.pos[p.id] : p.desc) || "bez popisu"}`).join("\n") + "\n\nVýsledky:\n" +
    rows.map(r => `- Pozice ${r.k}: ${r.n} ${cz(r.n, "interval", "intervaly", "intervalů")}, celkem ${hms(r.t)}, Ø ${fmt(r.p, 0)} W, Ø tep ${r.hr ? fmt(r.hr, 0) : "–"}, ${r.wpb ? fmt(r.wpb, 2) + " W/tep" : "bez tepu"}${r.cad ? ", kadence " + fmt(r.cad, 0) : ""}${r.cf != null ? ", pohodlí " + r.cf + "/10" : ""}`).join("\n") +
    "\n\nJednotlivé intervaly:\n" + I.map(l => `- pozice ${l.label}: ${hms(l.dur)}, ${fmt(l.p, 0)} W, tep ${l.hr != null ? fmt(l.hr, 0) : "–"}`).join("\n") +
    "\n\nZhodnoť, jestli některá pozice omezuje výkon, s ohledem na šum měření, únavu a pořadí intervalů. Která pozice dává nejlepší poměr aero, výkon a pohodlí pro časovku na 40 km? Navrhni, jak test případně zopakovat přesněji.";
  $("pw_outbox").classList.remove("hidden");
}
$("pw_copy").onclick = () => copyFrom("pw_out", "pw_copied");
renderMan(); applySrc();

// ---------- 4. CdA z jízdy ----------
const CD = { fit: null, laps: [], fitRes: null };
(function prefillMass() { const c = calcParams(); $("cd_m").value = Math.round((c.mr + c.mb) * 2) / 2; })();
$("cd_file").onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  const st = $("cd_status"); st.classList.remove("bad"); st.textContent = "Načítám…";
  CD.fitRes = null; $("cd_res").innerHTML = ""; $("cd_chartbox").classList.add("hidden"); $("cd_outbox").classList.add("hidden");
  try {
    const fit = await readFitFile(f), L = lapRecords(fit), R = fit.records;
    if (!R.length) throw new Error("Soubor neobsahuje žádné záznamy.");
    const has = k => R.some(r => r[k] != null);
    const miss = []; if (!has("pwr")) miss.push("výkon"); if (!has("spd")) miss.push("rychlost"); if (!has("alt")) miss.push("nadmořská výška");
    if (miss.length) throw new Error("V souboru chybí: " + miss.join(", ") + ".");
    CD.fit = fit;
    CD.laps = L.map((l, i) => {
      const r = l.recs, dur = r[r.length - 1].t - r[0].t + 1;
      return { n: i + 1, recs: r, dur, v: avgOf(r, "spd"), p: avgOf(r, "pwr"), dh: (r[r.length - 1].alt != null && r[0].alt != null) ? r[r.length - 1].alt - r[0].alt : null, inc: dur >= 20, label: "A", cda: null, whole: !!l.whole };
    });
    const tAvg = avgOf(R, "temp"), aAvg = avgOf(R, "alt");
    if (tAvg != null && $("cd_temp").value === "") $("cd_temp").value = Math.round(tAvg * 2) / 2;
    if (aAvg != null && $("cd_alt").value === "") $("cd_alt").value = Math.round(aAvg / 10) * 10;
    st.textContent = "Načteno " + R.length + " záznamů, " + CD.laps.length + " kol." + (tAvg != null ? " Teplota ze snímače " + fmt(tAvg, 1) + " °C (Garmin často ukazuje víc než skutečný vzduch, oprav podle předpovědi)." : " Doplň teplotu vzduchu.") + (L.length && L[0].whole ? " Soubor nemá kola (Lap), bere se celá jízda jako jedno kolo." : "");
    renderCdLaps(); $("cd_ctrl").classList.remove("hidden");
  } catch (err) { st.textContent = "Chyba: " + (err.message || err); st.classList.add("bad"); $("cd_laps").innerHTML = ""; $("cd_ctrl").classList.add("hidden"); }
};
function renderCdLaps() {
  let h = `<table class="tbl-in wide"><tr><td>Použít</td><td>Kolo</td><td>Délka</td><td>Ø km/h</td><td>Ø W</td><td>Δ výšky</td><td>Pozice</td>${CD.laps.some(l => l.cda != null) ? "<td>CdA kola</td>" : ""}</tr>`;
  CD.laps.forEach((l, i) => {
    h += `<tr><td style="text-align:left"><input type="checkbox" data-ci="${i}"${l.inc ? " checked" : ""} aria-label="Použít kolo ${l.n}"></td><td>${l.n}</td><td>${hms(l.dur)}</td><td>${fmt(l.v * 3.6, 1)}</td><td>${fmt(l.p, 0)}</td><td>${l.dh != null ? sgn(l.dh, 1) + " m" : "–"}</td><td><input type="text" data-cl="${i}" value="${esc(l.label)}"></td>${CD.laps.some(x => x.cda != null) ? `<td>${l.cda != null ? fmt(l.cda, 3) : "–"}</td>` : ""}</tr>`;
  });
  h += "</table><p class='muted'>Vyřaď rozjetí, otočky a kola s brzděním. Δ výšky je rozdíl mezi startem a cílem kola, u okruhu má být blízko nuly.</p>";
  $("cd_laps").innerHTML = h;
}
$("cd_laps").addEventListener("change", e => { const i = e.target.dataset.ci; if (i != null) CD.laps[+i].inc = e.target.checked; });
$("cd_laps").addEventListener("input", e => { const i = e.target.dataset.cl; if (i != null) CD.laps[+i].label = e.target.value.trim() || "A"; });

function solve(A, b) {
  const n = b.length, M = A.map((r, i) => r.concat([b[i]]));
  for (let c = 0; c < n; c++) {
    let piv = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    if (Math.abs(M[piv][c]) < 1e-12) return null;
    [M[c], M[piv]] = [M[piv], M[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; if (f) for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r, i) => r[n] / r[i]);
}
// Rozdělí kolo na souvislé úseky a spočítá kumulované členy virtuální výšky.
function buildSegs(laps, eff, m, rho) {
  const segs = [];
  laps.forEach(l => {
    let cur = null;
    for (let i = 0; i < l.recs.length; i++) {
      const r = l.recs[i], ok = r.spd != null && r.pwr != null && r.alt != null;
      const prev = i ? l.recs[i - 1] : null, dt = prev ? r.t - prev.t : 0;
      if (!ok || !prev || dt <= 0 || dt > 3 || prev.spd == null || prev.pwr == null || prev.alt == null) {
        if (cur && cur.h.length > 5) segs.push(cur);
        cur = ok ? { lap: l, X0: [0], X1: [0], X2: [0], h: [r.alt], t: [r.t] } : null; continue;
      }
      const v0 = prev.spd, v1 = r.spd, vm = (v0 + v1) / 2, d = vm * dt;
      const k = cur.h.length - 1;
      cur.X0.push(cur.X0[k] + r.pwr * eff * dt / (m * G) - (v1 * v1 - v0 * v0) / (2 * G));
      cur.X1.push(cur.X1[k] + d);
      cur.X2.push(cur.X2[k] + rho * (v0 * v0 + v1 * v1) / 2 * d / (2 * m * G));
      cur.h.push(r.alt); cur.t.push(r.t);
    }
    if (cur && cur.h.length > 5) segs.push(cur);
  });
  return segs;
}
// Nejmenší čtverce: h = c_seg + X0 − Crr·X1 − CdA_pozice·X2
function fitVE(segs, labels, crrFixed) {
  const nS = segs.length, nL = labels.length, fitCrr = crrFixed == null, p = nS + (fitCrr ? 1 : 0) + nL;
  const A = Array.from({ length: p }, () => new Array(p).fill(0)), b = new Array(p).fill(0);
  const iCrr = nS, iL = nS + (fitCrr ? 1 : 0);
  segs.forEach((s, si) => {
    const li = labels.indexOf(s.lap.label);
    for (let k = 0; k < s.h.length; k++) {
      const row = new Map(); row.set(si, 1); if (fitCrr) row.set(iCrr, -s.X1[k]); row.set(iL + li, -s.X2[k]);
      const y = s.h[k] - s.X0[k] + (fitCrr ? 0 : crrFixed * s.X1[k]);
      for (const [i, vi] of row) { b[i] += vi * y; for (const [j, vj] of row) A[i][j] += vi * vj; }
    }
  });
  const x = solve(A, b); if (!x) return null;
  const crr = fitCrr ? x[iCrr] : crrFixed, cda = labels.map((_, i) => x[iL + i]);
  let rss = 0, n = 0;
  const series = segs.map((s, si) => {
    const li = labels.indexOf(s.lap.label);
    return s.h.map((h, k) => { const ve = x[si] + s.X0[k] - crr * s.X1[k] - cda[li] * s.X2[k]; rss += (ve - h) * (ve - h); n++; return { t: s.t[k], h, ve }; });
  });
  return { crr, cda, rmse: Math.sqrt(rss / Math.max(1, n)), series, n };
}
$("cd_run").onclick = () => {
  const st = $("cd_status"); st.classList.remove("bad");
  const inc = CD.laps.filter(l => l.inc);
  if (!inc.length) { st.textContent = "Vyber aspoň jedno kolo."; st.classList.add("bad"); return; }
  const m = num("cd_m", NaN), eff = parseFloat($("cd_pm").value), tC = num("cd_temp", NaN), alt = num("cd_alt", 300);
  if (!(m > 30)) { st.textContent = "Zadej celkovou hmotnost."; st.classList.add("bad"); return; }
  if (!isFinite(tC)) { st.textContent = "Zadej teplotu vzduchu."; st.classList.add("bad"); return; }
  const rho = rhoOf(tC, alt), crrFixed = $("cd_crrm").value === "fix" ? num("cd_crr", 0.004) : null;
  const labels = [...new Set(inc.map(l => l.label))];
  const segs = buildSegs(inc, eff, m, rho);
  if (!segs.length) { st.textContent = "Ve vybraných kolech nejsou souvislá data (výkon, rychlost, výška).";  st.classList.add("bad"); return; }
  const R = fitVE(segs, labels, crrFixed);
  if (!R) { st.textContent = "Výpočet nejde vyřešit. Přidej kola s různou rychlostí nebo zvol pevnou hodnotu Crr."; st.classList.add("bad"); return; }
  // CdA jednotlivých kol při pevném Crr z celkového fitu
  CD.laps.forEach(l => { l.cda = null; });
  inc.forEach(l => { const sg = segs.filter(s => s.lap === l); if (!sg.length) return; const r1 = fitVE(sg, [l.label], R.crr); if (r1) l.cda = r1.cda[0]; });
  CD.fitRes = Object.assign(R, { labels, rho, m, eff, tC, alt, crrFixed });
  st.textContent = "Spočítáno z " + R.n + " sekund jízdy.";
  renderCdLaps(); renderCdRes(); $("cd_chartbox").classList.remove("hidden"); drawChart();
};
function renderCdRes() {
  const R = CD.fitRes, c = calcParams(), warns = [];
  const perLab = R.labels.map((lab, i) => {
    const v = CD.laps.filter(l => l.inc && l.label === lab && l.cda != null).map(l => l.cda);
    const mean = v.length ? v.reduce((a, b) => a + b, 0) / v.length : null, sd = v.length > 1 ? Math.sqrt(v.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (v.length - 1)) : null;
    return { lab, cda: R.cda[i], n: v.length, sd, w: wattsAt(Object.assign({}, c, { crr: R.crr }), R.cda[i]) };
  });
  if (R.crrFixed == null && (R.crr < 0.002 || R.crr > 0.008)) warns.push("Odhad Crr " + fmt(R.crr, 4) + " je mimo rozumný rozsah 0,002 až 0,008. Kola se asi málo liší rychlostí. Zvol pevnou hodnotu Crr (např. 0,004) a spočítej znovu.");
  perLab.forEach(x => { if (x.cda < 0.15 || x.cda > 0.45) warns.push("CdA pozice " + x.lab + " = " + fmt(x.cda, 3) + " je mimo obvyklý rozsah 0,15 až 0,45. Zkontroluj hmotnost, teplotu, snímač rychlosti a vítr."); });
  if (R.rmse > 1) warns.push("Virtuální výška se od skutečné liší v průměru o " + fmt(R.rmse, 2) + " m. To bývá vítr, brzdění nebo rychlost z GPS. Výsledek ber s rezervou.");
  if (CD.laps.filter(l => l.inc).length < 3) warns.push("Méně než 3 kola. Pro spolehlivý výsledek jeď aspoň 4 až 6 kol.");
  const b = perLab[0];
  let h = `<h3>Výsledek</h3><div class="scroll"><table class="wide"><tr><td>Pozice</td><td>CdA</td><td>Rozptyl kol</td><td>W při ${fmt(c.spd, 0)} km/h</td><td>Rozdíl</td></tr>`;
  perLab.forEach((x, i) => { h += `<tr><td>${esc(x.lab)}<small>${x.n} ${x.n === 1 ? "kolo" : x.n < 5 ? "kola" : "kol"}</small></td><td>${fmt(x.cda, 3)} m²</td><td>${x.sd != null ? "± " + fmt(x.sd, 3) : "–"}</td><td>${fmt(x.w, 0)}</td><td>${i === 0 ? "reference" : sgn(x.w - b.w, 0) + " W"}</td></tr>`; });
  h += `</table></div><table style="margin-top:8px"><tr><td>Valivý odpor Crr<small>${R.crrFixed == null ? "odhadnuto z dat" : "pevná hodnota"}</small></td><td>${fmt(R.crr, 4)}</td></tr><tr><td>Hustota vzduchu<small>${fmt(R.tC, 1)} °C, ${fmt(R.alt, 0)} m n. m.</small></td><td>${fmt(R.rho, 3)} kg/m³</td></tr><tr><td>Průměrná odchylka výšky<small>čím menší, tím lépe sedí model</small></td><td>${fmt(R.rmse, 2)} m</td></tr></table>`;
  if (perLab.length > 1) h += `<p class="muted" style="margin-top:8px">Rozdíl mezi pozicemi ber jako skutečný, jen když je větší než rozptyl jednotlivých kol. Watty jsou přepočtené na podmínky z kalkulačky.</p>`;
  if (warns.length) h += `<p class="muted warn">${warns.map(esc).join("<br>")}</p>`;
  h += `<div class="row"><select id="cd_pick" style="width:auto">${perLab.map((x, i) => `<option value="${i}">${esc(x.lab)}: ${fmt(x.cda, 3)}</option>`).join("")}</select><button class="btn ghost" id="cd_tocalc">Použít v kalkulačce</button><button class="btn ghost" id="cd_toref">Použít jako referenci pro čelní plochu</button></div><p class="muted" id="cd_msg"></p>`;
  $("cd_res").innerHTML = h;
  $("cd_tocalc").onclick = () => { const x = perLab[+$("cd_pick").value]; $("c_cda").value = Math.round(x.cda * 1000) / 1000; S.calc.c_cda = $("c_cda").value; save(); renderCalc(); $("cd_msg").textContent = "CdA " + fmt(x.cda, 3) + " je v kalkulačce."; };
  $("cd_toref").onclick = () => { const x = perLab[+$("cd_pick").value]; S.refCdA = Math.round(x.cda * 1000) / 1000; $("ar_refcda").value = S.refCdA; save(); renderAreaList(); $("cd_msg").textContent = "CdA " + fmt(x.cda, 3) + " je nastavené jako reference v záložce Čelní plocha. Vyber tam variantu se stejnou pozicí."; };
  $("cd_out").value = "Změřil jsem CdA z jízdy metodou virtual elevation (okruh, " + CD.laps.filter(l => l.inc).length + " kol).\n" +
    "Podmínky: " + fmt(R.tC, 1) + " °C, " + fmt(R.alt, 0) + " m n. m., hustota vzduchu " + fmt(R.rho, 3) + ", hmotnost " + fmt(R.m, 1) + " kg, účinnost " + fmt(R.eff * 100, 1) + " %.\n" +
    "Crr " + fmt(R.crr, 4) + (R.crrFixed == null ? " (odhad)" : " (pevné)") + ", průměrná odchylka výšky " + fmt(R.rmse, 2) + " m.\n\n" +
    perLab.map(x => `- Pozice ${x.lab}: CdA ${fmt(x.cda, 3)} m² (${x.n} kol${x.sd != null ? ", rozptyl ± " + fmt(x.sd, 3) : ""}), ${fmt(x.w, 0)} W při ${fmt(c.spd, 0)} km/h`).join("\n") +
    "\n\nJednotlivá kola:\n" + CD.laps.filter(l => l.inc).map(l => `- kolo ${l.n} (${l.label}): ${hms(l.dur)}, ${fmt(l.v * 3.6, 1)} km/h, ${fmt(l.p, 0)} W, CdA ${l.cda != null ? fmt(l.cda, 3) : "–"}`).join("\n") +
    (warns.length ? "\n\nUpozornění aplikace:\n" + warns.map(w => "- " + w).join("\n") : "") +
    "\n\nZhodnoť, jestli je měření spolehlivé a jestli je rozdíl mezi pozicemi skutečný. Poraď, co v pozici zkusit dál a jak test zpřesnit.";
  $("cd_outbox").classList.remove("hidden");
}
$("cd_copy").onclick = () => copyFrom("cd_out", "cd_copied");

// graf: skutečná a virtuální výška
function chartPts() {
  const R = CD.fitRes; if (!R) return [];
  const pts = []; let x = 0;
  R.series.forEach(s => { s.forEach((q, k) => { pts.push({ x: x, h: q.h, ve: q.ve, gap: k === 0 && pts.length > 0 }); x++; }); });
  return pts;
}
function drawChart() {
  const R = CD.fitRes, cv = $("cd_chart"), wrap = $("cd_wrap"); if (!R || !wrap.offsetWidth) return;
  const W = wrap.clientWidth, H = 260, dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = H + "px";
  const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
  const css = getComputedStyle(document.documentElement), c1 = css.getPropertyValue("--c1").trim(), c2 = css.getPropertyValue("--c2").trim(), ink = css.getPropertyValue("--muted").trim(), line = css.getPropertyValue("--line").trim();
  const P = chartPts(); if (P.length < 2) return;
  let lo = Infinity, hi = -Infinity; P.forEach(p => { lo = Math.min(lo, p.h, p.ve); hi = Math.max(hi, p.h, p.ve); });
  if (hi - lo < 2) { const m = (hi + lo) / 2; lo = m - 1; hi = m + 1; }
  const step = [0.5, 1, 2, 5, 10, 20, 50, 100].find(s => (hi - lo) / s <= 5) || 200;
  lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
  const L = 44, Rm = 12, T = 10, B = 26, xmax = P[P.length - 1].x || 1;
  const X = x => L + (W - L - Rm) * x / xmax, Y = y => T + (H - T - B) * (1 - (y - lo) / (hi - lo));
  ctx.font = "12px sans-serif"; ctx.fillStyle = ink; ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.textAlign = "right"; ctx.textBaseline = "middle";
  for (let y = lo; y <= hi + 1e-9; y += step) { ctx.beginPath(); ctx.moveTo(L, Y(y)); ctx.lineTo(W - Rm, Y(y)); ctx.stroke(); ctx.fillText(fmt(y, step < 1 ? 1 : 0), L - 6, Y(y)); }
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  const tstep = [30, 60, 120, 300, 600, 900, 1800].find(s => xmax / s <= 6) || 3600;
  for (let t = 0; t <= xmax; t += tstep) ctx.fillText(hms(t), X(t), H - B + 6);
  const path = (k, col) => { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.beginPath(); P.forEach((p, i) => { if (i === 0 || p.gap) ctx.moveTo(X(p.x), Y(p[k])); else ctx.lineTo(X(p.x), Y(p[k])); }); ctx.stroke(); };
  path("h", c1); path("ve", c2);
  CD.chart = { P, X, Y, L, Rm, W, H, T, B, xmax };
}
function chartHover(e) {
  const C = CD.chart, tip = $("cd_tip"); if (!C) return;
  const r = $("cd_chart").getBoundingClientRect(), px = e.clientX - r.left;
  if (px < C.L || px > C.W - C.Rm) { tip.classList.add("hidden"); drawChart(); return; }
  const xv = (px - C.L) / (C.W - C.L - C.Rm) * C.xmax; let best = C.P[0];
  for (const p of C.P) if (Math.abs(p.x - xv) < Math.abs(best.x - xv)) best = p;
  drawChart();
  const ctx = $("cd_chart").getContext("2d"), css = getComputedStyle(document.documentElement);
  ctx.strokeStyle = css.getPropertyValue("--muted").trim(); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(C.X(best.x), C.T); ctx.lineTo(C.X(best.x), C.H - C.B); ctx.stroke();
  [["h", "--c1"], ["ve", "--c2"]].forEach(([k, v]) => { ctx.fillStyle = css.getPropertyValue(v).trim(); ctx.strokeStyle = css.getPropertyValue("--surface").trim(); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(C.X(best.x), C.Y(best[k]), 4, 0, 7); ctx.fill(); ctx.stroke(); });
  tip.innerHTML = `${hms(best.x)}<br>Skutečná ${fmt(best.h, 1)} m<br>Virtuální ${fmt(best.ve, 1)} m<br>Rozdíl ${sgn(best.ve - best.h, 1)} m`;
  tip.classList.remove("hidden");
  const tx = Math.min(C.X(best.x) + 12, C.W - tip.offsetWidth - 4);
  tip.style.left = Math.max(4, tx) + "px"; tip.style.top = "8px";
}
$("cd_chart").addEventListener("pointermove", chartHover);
$("cd_chart").addEventListener("pointerdown", chartHover);
$("cd_chart").addEventListener("pointerleave", () => { $("cd_tip").classList.add("hidden"); drawChart(); });
window.addEventListener("resize", () => { if (CD.fitRes && !$("s-aero").classList.contains("hidden") && curPane === "cda") drawChart(); });
if (window.matchMedia) { try { window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (CD.fitRes) drawChart(); paintOverlay(); drawArea(); }); } catch (e) { } }

// pro testy
window.__aero = { parseFIT, fitVE, buildSegs, rhoOf, speedAt, calcParams };
