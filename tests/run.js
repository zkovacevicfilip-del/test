// Kouřové testy aplikace v prohlížeči. Spuštění: npm test
// Nic se neinstaluje: Playwright s prohlížečem je v cloudovém prostředí Claude Code předinstalovaný.
// Aplikaci si test sám spustí z této složky na místní adrese, na internet se nepřipojuje.
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const data = require("./data.js");

const ROOT = path.join(__dirname, "..");
const WIDTHS = [412, 1000];
const LIMIT_MS = 110000; // celý běh se musí vejít do 2 minut
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json", ".webmanifest": "application/manifest+json",
  ".png": "image/png", ".svg": "image/svg+xml", ".wasm": "application/wasm"
};

// ---------- výpis ----------
let passed = 0, failed = 0;
function ok(label, cond, detail) {
  if (cond) { passed++; console.log("✓ " + label); }
  else { failed++; console.log("✗ " + label + (detail ? " → " + detail : "")); }
}
function summary() {
  console.log("");
  console.log("Úspěšných: " + passed + ", neúspěšných: " + failed);
}

// ---------- místní server se soubory aplikace ----------
function startServer() {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p === "/") p = "/index.html";
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404); res.end("nenalezeno"); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(resolve => server.listen(0, "127.0.0.1", () => resolve(server)));
}

// ---------- nezávislý výpočet pro kalkulačku wattů ----------
// Vzorce jsou tu napsané znovu, bez použití kódu aplikace:
// tlak z barometrické rovnice, hustota ze stavové rovnice plynu,
// výkon = (odpor vzduchu + valivý odpor) / účinnost převodů.
function expected(i) {
  const tlak = 101325 * Math.pow(1 - 2.25577e-5 * i.alt, 5.25588);
  const rho = tlak / (287.058 * (i.temp + 273.15));
  const v = i.spd / 3.6, m = i.mr + i.mb, eff = i.eff / 100;
  const aero = 0.5 * rho * i.cda * v * v * v, roll = i.crr * m * 9.80665 * v;
  const total = (aero + roll) / eff;
  // rychlost při zadaném výkonu: Newtonova metoda pro 0,5·ρ·CdA·v³ + Crr·m·g·v = výkon·účinnost
  let x = 10;
  for (let k = 0; k < 60; k++) {
    const f = 0.5 * rho * i.cda * x * x * x + i.crr * m * 9.80665 * x - i.pwr * eff;
    x -= f / (1.5 * rho * i.cda * x * x + i.crr * m * 9.80665);
  }
  return { rho, aero, roll, total, loss: total - aero - roll, kmh: x * 3.6, sec: i.dist * 1000 / x };
}
const cz = (x, d) => x.toFixed(d).replace(".", ",");
function clock(s) {
  s = Math.round(s);
  const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
  return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(x).padStart(2, "0");
}
const CALC_CASES = [
  // 15 °C u hladiny moře: hustota vzduchu má vyjít 1,225 kg/m³ (tabulková hodnota standardní atmosféry)
  { name: "hladina moře, 45 km/h", cda: 0.215, spd: 45, mr: 70, mb: 8.5, crr: 0.0035, eff: 97, temp: 15, alt: 0, pwr: 300, dist: 20, rhoText: "1,225 kg/m³" },
  { name: "hory, 36 km/h", cda: 0.3, spd: 36, mr: 82.5, mb: 10, crr: 0.005, eff: 98, temp: 5, alt: 1200, pwr: 220, dist: 100 }
];
const FIELD = { cda: "c_cda", spd: "c_spd", mr: "c_mr", mb: "c_mb", crr: "c_crr", eff: "c_eff", temp: "c_temp", alt: "c_alt", pwr: "c_pwr", dist: "c_dist" };

// ---------- testy pro jednu šířku ----------
async function runWidth(browser, base, width) {
  const T = "[" + width + " px] ";
  const context = await browser.newContext({ viewport: { width, height: width < 600 ? 915 : 700 }, locale: "cs-CZ" });
  context.setDefaultTimeout(4000); // krátké čekání: i úplně rozbitá aplikace se musí otestovat do 2 minut
  const problems = [], foreign = [];
  // porušení CSP hlásí prohlížeč událostí, zachytíme ji dřív, než se spustí kód aplikace
  await context.exposeBinding("__cspReport", (src, text) => { problems.push("CSP: " + text); });
  await context.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", e => window.__cspReport(e.violatedDirective + " blokuje " + (e.blockedURI || "kód ve stránce")));
  });
  // žádné spojení mimo místní server (test nesmí záviset na internetu)
  await context.route(u => !u.href.startsWith(base), r => { foreign.push(r.request().url()); return r.abort(); });
  const page = await context.newPage();
  page.on("console", m => { if (m.type() === "error") problems.push("konzole: " + m.text()); });
  page.on("pageerror", e => problems.push("chyba skriptu: " + e.message));
  page.on("response", r => { if (r.status() >= 400) problems.push("soubor nejde načíst (" + r.status() + "): " + r.url()); });
  page.on("dialog", d => d.dismiss().catch(() => {}));

  const visible = sel => page.locator(sel).isVisible();
  const step = async (label, fn) => {
    try { await fn(); } catch (e) { ok(T + label, false, String(e && e.message || e).split("\n")[0]); }
  };

  // ----- 1. načtení a okno s podmínkami -----
  await step("aplikace se načte", async () => {
    await page.goto(base + "/index.html", { waitUntil: "load" });
    await page.locator("#tgDoc h2, #tgDoc h3, #tgDoc p:not(.muted)").first().waitFor(); // znění podmínek je načtené
    ok(T + "aplikace se načte a okno s podmínkami ukáže jejich znění", await visible("#termsGate") && (await page.locator("#tgDoc").innerText()).length > 500);
  });

  await step("podmínky blokují aplikaci", async () => {
    const nav = page.locator('#topnav button[data-top="aero"]');
    const st = await nav.evaluate(b => {
      const r = b.getBoundingClientRect(), top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { hidden: getComputedStyle(b).visibility === "hidden", inert: !!b.closest("[inert]"), covered: !!(top && top.closest("#termsGate")), x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    ok(T + "před přijetím podmínek je aplikace skrytá a překrytá oknem", st.hidden && st.covered, JSON.stringify(st));
    ok(T + "před přijetím podmínek nejde aplikace ovládat klávesnicí ani čtečkou", st.inert);
    await page.mouse.click(st.x, st.y);            // klepnutí do místa, kde je menu
    await nav.evaluate(b => b.focus());             // pokus dostat se na tlačítko jinak
    await page.keyboard.press("Enter");
    ok(T + "klepnutí na menu pod oknem s podmínkami nic nepřepne", !(await visible("#s-aero")) && await page.locator("#s-aero").evaluate(e => e.classList.contains("hidden")));
    ok(T + "tlačítko Pokračovat je bez zaškrtnutí souhlasu vypnuté", await page.locator("#tgGo").isDisabled());
    ok(T + "bez přijetí se souhlas neuloží", await page.evaluate(() => localStorage.getItem("aero.terms")) === null);
  });

  await step("přijetí podmínek", async () => {
    await page.locator("#tgOk").check();
    await page.locator("#tgGo").click();
    await page.locator("#termsGate").waitFor({ state: "hidden" });
    ok(T + "po přijetí podmínek okno zmizí a aplikace je vidět", !(await visible("#termsGate")) && await visible("#topnav") && await visible("#s-mode"));
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("aero.terms") || "null"));
    ok(T + "přijetí podmínek se uloží v zařízení (verze a čas)", !!(saved && saved.v && saved.at), JSON.stringify(saved));
    await page.reload({ waitUntil: "load" });
    await page.locator("#topnav").waitFor();
    ok(T + "po novém otevření se okno s podmínkami už neukáže", !(await visible("#termsGate")) && await visible("#s-mode"));
  });

  // ----- logo a ikony (wattIF) -----
  await step("logo a ikony", async () => {
    const logo = await page.evaluate(() => {
      const h = document.querySelector(".hero"), img = h && h.querySelector("h1.brand img"), r = img && img.getBoundingClientRect();
      return img ? { alt: img.alt, w: img.naturalWidth, shown: r.width > 100 && r.height > 15, text: h.innerText.trim() } : null;
    });
    ok(T + "v hlavičce je jen logo wattIF (načtené, viditelné, bez dalšího textu)", !!logo && logo.alt === "wattIF" && logo.w > 0 && logo.shown && logo.text === "", JSON.stringify(logo));
    const icons = await page.evaluate(async () => {
      const m = await (await fetch(document.querySelector('link[rel="manifest"]').href)).json();
      const extra = [...document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]')].map(l => ({ src: l.getAttribute("href"), sizes: l.getAttribute("sizes") || "180x180" }));
      return Promise.all(m.icons.concat(extra).map(i => new Promise(res => { const im = new Image(); im.onload = () => res(i.src + " " + im.naturalWidth + "x" + im.naturalHeight + " ~ " + i.sizes); im.onerror = () => res(i.src + " NENAČTENO"); im.src = new URL(i.src, location.href); })));
    });
    ok(T + "všechny ikony (manifest, záložka, iPhone) se načtou ve správné velikosti", icons.every(s => { const m = s.match(/ (\d+x\d+) ~ (\d+x\d+)$/); return m && m[1] === m[2]; }), icons.join("; "));
  });

  // ----- 2. hlavní menu -----
  await step("hlavní menu", async () => {
    const parts = { pos: "#s-mode", aero: "#s-aero", hist: "#s-hist" }, names = { pos: "Pozice a mobilita", aero: "Aero a výkon", hist: "Moje pozice" };
    for (const key of ["aero", "hist", "pos"]) {
      await page.locator('#topnav button[data-top="' + key + '"]').click();
      const shown = [];
      for (const k of Object.keys(parts)) if (await visible(parts[k])) shown.push(k);
      const on = await page.locator("#topnav button.on").getAttribute("data-top");
      ok(T + "menu přepne na část " + names[key] + " a ostatní skryje", shown.length === 1 && shown[0] === key && on === key, "vidět: " + shown.join(", ") + "; zvolené: " + on);
    }
    const box = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, win: window.innerWidth }));
    ok(T + "stránka nepřetéká do strany", box.page <= box.win, box.page + " > " + box.win);
  });

  // ----- 3. kalkulačka wattů -----
  await step("kalkulačka wattů", async () => {
    await page.locator('#topnav button[data-top="aero"]').click();
    await page.locator("#c_out .big").waitFor();
    for (const c of CALC_CASES) {
      for (const k of Object.keys(FIELD)) await page.locator("#" + FIELD[k]).fill(String(c[k]));
      const e = expected(c);
      const big = (await page.locator("#c_out .big").innerText()).trim();
      const rows = await page.locator("#c_out table").first().locator("tr").evaluateAll(trs => trs.map(tr => tr.lastElementChild.textContent.trim()));
      const want = [cz(e.aero, 0) + " W", cz(e.roll, 0) + " W", cz(e.loss, 0) + " W", c.rhoText || cz(e.rho, 3) + " kg/m³", null, cz(e.kmh, 1) + " km/h", clock(e.sec)];
      const L = T + "kalkulačka (" + c.name + "): ";
      ok(L + "potřebný výkon " + cz(e.total, 0) + " W", big === cz(e.total, 0) + " W", "aplikace ukazuje " + big);
      ok(L + "odpor vzduchu, valivý odpor a ztráty v převodech", rows[0] === want[0] && rows[1] === want[1] && rows[2] === want[2], "aplikace: " + rows.slice(0, 3).join(" / ") + "; správně: " + want.slice(0, 3).join(" / "));
      ok(L + "hustota vzduchu " + want[3], rows[3] === want[3], "aplikace ukazuje " + rows[3]);
      ok(L + "rychlost a čas při " + c.pwr + " W: " + want[5] + ", " + want[6], rows[5] === want[5] && rows[6] === want[6], "aplikace: " + rows[5] + ", " + rows[6]);
    }
    await page.locator("#c_cda").fill("0");
    ok(T + "kalkulačka: při nulovém CdA místo výsledku požádá o kladné hodnoty", (await page.locator("#c_out").innerText()).includes("Doplň kladné hodnoty") && !(await page.locator("#c_out .big").count()));
  });

  // ----- 4. načtení zálohy -----
  await step("načtení zálohy", async () => {
    await page.locator('#topnav button[data-top="hist"]').click();
    const input = page.locator('#histRoot input[data-h="import"]'), msg = page.locator('#histRoot [data-h="bmsg"]');
    const cards = () => page.locator("#histRoot .card[data-id]").count();
    const stored = () => page.evaluate(() => { try { const a = JSON.parse(localStorage.getItem("aero.pos.v1")); return Array.isArray(a) ? a.length : 0; } catch (e) { return -1; } });
    const load = async (file, re) => {
      await msg.evaluate(m => { m.textContent = ""; }).catch(() => {});
      await input.setInputFiles(file);
      await page.waitForFunction(() => { const m = document.querySelector('#histRoot [data-h="bmsg"]'); return m && m.textContent.trim().length > 0; });
      const t = (await msg.innerText()).trim();
      return { t, ok: re.test(t) };
    };
    const L = T + "záloha: ";
    ok(L + "na začátku není uložená žádná pozice", await cards() === 0 && await stored() === 0);

    let r = await load(data.files.notJson(), /není záloha ve formátu JSON/);
    ok(L + "odmítne soubor, který není JSON", r.ok && await cards() === 0 && await stored() === 0, r.t);
    r = await load(data.files.notList(), /neobsahuje seznam pozic/);
    ok(L + "odmítne JSON, který není seznam pozic", r.ok && await cards() === 0 && await stored() === 0, r.t);
    r = await load(data.files.badRecords(), /Načteno 0 nových pozic\. Vynecháno 4 záznamů/);
    ok(L + "vynechá záznamy se špatným tvarem a nic neuloží", r.ok && await cards() === 0 && await stored() === 0, r.t);
    r = await load(data.files.tooBig(), /větší než 5 MB/);
    ok(L + "odmítne soubor větší než 5 MB", r.ok && await cards() === 0 && await stored() === 0, r.t);

    r = await load(data.files.valid(3), /^Načteno 3 nových pozic\.$/);
    ok(L + "přijme platný soubor se 3 pozicemi a zobrazí je", r.ok && await cards() === 3, r.t + " (karet: " + await cards() + ")");
    const names = await page.locator('#histRoot .card[data-id] input[data-h="name"]').evaluateAll(a => a.map(i => i.value)).catch(() => []);
    const text = await page.locator("#histRoot").innerText();
    ok(L + "načtené pozice mají správné názvy", data.validBackup(3).every(p => names.includes(p.name) || text.includes(p.name)), names.join(", "));
    ok(L + "načtené pozice se uloží do zařízení", await stored() === 3, "uloženo: " + await stored());
    r = await load(data.files.valid(3), /^Načteno 0 nových pozic\.$/);
    ok(L + "stejný soubor podruhé pozice nezdvojí", r.ok && await cards() === 3 && await stored() === 3, r.t);

    r = await load(data.files.hostile(), /^Načteno 1 nových pozic\.$/);
    const hostile = await page.evaluate(() => {
      const rec = (JSON.parse(localStorage.getItem("aero.pos.v1")) || []).find(x => x.id === "zly-1") || {};
      return { el: !!document.getElementById("vetrelec"), ran: !!window.__napadeno, extra: "cizi" in rec, torso: rec.side ? rec.side.torso : "chybí" };
    });
    ok(L + "cizí kód v názvu pozice se nespustí ani nevloží do stránky", r.ok && !hostile.el && !hostile.ran, r.t + " " + JSON.stringify(hostile));
    ok(L + "neznámá pole a texty místo čísel se ze souboru nepřevezmou", !hostile.extra && hostile.torso === null, JSON.stringify(hostile));
    await page.reload({ waitUntil: "load" });
    await page.locator('#topnav button[data-top="hist"]').click();
    ok(L + "načtené pozice zůstanou i po novém otevření aplikace", await cards() === 4, "karet: " + await cards());
  });

  // ----- 5. chyby za celý průchod -----
  await page.waitForTimeout(300);
  const csp = problems.filter(p => p.startsWith("CSP:") || /Content Security Policy/i.test(p));
  const other = problems.filter(p => !csp.includes(p));
  ok(T + "za celý průchod žádné porušení CSP", csp.length === 0, csp.slice(0, 3).join(" | "));
  ok(T + "za celý průchod žádná chyba v konzoli ani nenačtený soubor", other.length === 0, other.slice(0, 3).join(" | "));
  ok(T + "aplikace se nepřipojuje nikam mimo vlastní adresu", foreign.length === 0, foreign.slice(0, 3).join(" | "));
  await context.close();
}

// ---------- spuštění ----------
(async () => {
  const t0 = Date.now();
  const guard = setTimeout(() => {
    ok("celý běh se vejde do 2 minut", false, "test běžel déle než " + LIMIT_MS / 1000 + " s a byl ukončen");
    summary(); process.exit(1);
  }, LIMIT_MS);
  let server, browser;
  try {
    let chromium;
    try { ({ chromium } = require("playwright")); }
    catch (e) { throw new Error("Playwright není k dispozici. Testy běží v cloudovém prostředí Claude Code, kde je předinstalovaný."); }
    server = await startServer();
    const base = "http://127.0.0.1:" + server.address().port;
    browser = await chromium.launch();
    for (const w of WIDTHS) await runWidth(browser, base, w);
  } catch (e) {
    ok("testy doběhly", false, String(e && e.message || e).split("\n")[0]);
  } finally {
    clearTimeout(guard);
    if (browser) await browser.close().catch(() => {});
    if (server) server.close();
  }
  summary();
  console.log("Doba běhu: " + ((Date.now() - t0) / 1000).toFixed(1).replace(".", ",") + " s");
  process.exit(failed ? 1 : 0);
})();
