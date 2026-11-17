// Test stránky Zkoušení oblečení (obleceni/). Spuštění: součást npm test.
// Fotky si test vyrobí sám (umělá postava a umělé tričko), na internet se nepřipojuje.
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..");
const SHOTS = process.env.SNIMKY || ""; // složka pro snímky obrazovky (nepovinné)
let passed = 0, failed = 0;
function ok(label, cond, detail) {
  if (cond) { passed++; console.log("✓ " + label); }
  else { failed++; console.log("✗ " + label + (detail ? " → " + detail : "")); }
}

function startServer() {
  const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png" };
  const server = http.createServer((req, res) => {
    const f = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
    if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(resolve => server.listen(0, "127.0.0.1", () => resolve(server)));
}

// Umělá postava 600 × 1200 px: temeno y = 100, chodidla y = 1100 (180 cm → 5,56 px na cm),
// hrudník x 210–390 v y = 350, pas x 225–375 v y = 500. Umělé tričko 800 × 800 na bílém pozadí:
// trup x 200–600 (šířka v podpaží 400 px), y 150–700, čára podpaží y = 250, bílé logo uprostřed.
async function vyrobFotky(page) {
  return page.evaluate(() => {
    const png = (w, h, kresli) => { const c = document.createElement("canvas"); c.width = w; c.height = h; kresli(c.getContext("2d")); return c.toDataURL("image/png").split(",")[1]; };
    const postava = png(600, 1200, g => {
      g.fillStyle = "#506070"; g.fillRect(0, 0, 600, 1200);
      g.fillStyle = "#c8a080";
      g.beginPath(); g.arc(300, 160, 60, 0, 7); g.fill();       // hlava, temeno y = 100
      g.fillRect(210, 230, 180, 250);                            // hrudník
      g.fillRect(225, 480, 150, 120);                            // pas
      g.fillRect(230, 600, 60, 500); g.fillRect(310, 600, 60, 500); // nohy až k y = 1100
    });
    const tricko = png(800, 800, g => {
      g.fillStyle = "#ffffff"; g.fillRect(0, 0, 800, 800);
      g.fillStyle = "#d02020";
      g.fillRect(200, 150, 400, 550);                            // trup
      g.fillRect(90, 150, 110, 160); g.fillRect(600, 150, 110, 160); // rukávy
      g.fillStyle = "#ffffff"; g.fillRect(360, 400, 80, 60);      // bílé logo uvnitř
    });
    return { postava, tricko };
  });
}

// barva pixelu v koláži (souřadnice v pixelech fotky)
const pixel = (page, x, y) => page.evaluate(([x, y]) => Array.from(document.getElementById("kolaz").getContext("2d").getImageData(x, y, 1, 1).data), [x, y]);
const cervena = p => p[0] > 150 && p[1] < 90 && p[2] < 90;

// klepnutí na místo v obrázku (souřadnice v pixelech obrázku)
async function klepni(page, id, w, h, body) {
  const loc = page.locator("#" + id), box = await loc.boundingBox();
  for (const [x, y] of body) await loc.click({ position: { x: x / w * box.width, y: y / h * box.height } });
}

async function runWidth(browser, base, width, fotky) {
  const T = "[" + width + " px] oblečení: ";
  const context = await browser.newContext({ viewport: { width, height: width < 600 ? 915 : 700 }, locale: "cs-CZ" });
  context.setDefaultTimeout(5000);
  const problems = [], foreign = [];
  await context.exposeBinding("__csp", (s, t) => problems.push("CSP: " + t));
  await context.addInitScript(() => document.addEventListener("securitypolicyviolation", e => window.__csp(e.violatedDirective + " " + e.blockedURI)));
  await context.route(u => !u.href.startsWith(base), r => { foreign.push(r.request().url()); return r.abort(); });
  const page = await context.newPage();
  page.on("console", m => { if (m.type() === "error") problems.push("konzole: " + m.text()); });
  page.on("pageerror", e => problems.push("chyba skriptu: " + e.message));

  try {
    await page.goto(base + "/obleceni/index.html", { waitUntil: "load" });
    const info = await page.evaluate(() => ({
      inline: document.querySelectorAll("script:not([src]), [onclick], [style]").length,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      pole: document.querySelectorAll("#teloMiry input").length
    }));
    ok(T + "žádný kód ani styl přímo v HTML", info.inline === 0, "nalezeno: " + info.inline);
    ok(T + "formulář má 11 tělesných měr", info.pole === 11, String(info.pole));

    // ----- výpočet (čisté funkce) -----
    const v = await page.evaluate(() => {
      const M = k => MIRY.find(m => m.k === k), H = M("hrudnik");
      return {
        rozsah: cisla("96–100").join("/"), carka: cisla("52,5")[0],
        naplocho: kusCm(H, "52", { naplocho: true }), postava: kusCm(H, "96-100", { postava: true }),
        male: posud(H, 100, 98, false).stav, malePruzne: posud(H, 100, 98, true).stav, moc: posud(H, 100, 90, true).stav,
        tesne: posud(H, 100, 102, false).stav, sedi: posud(H, 100, 106, false).stav, volne: posud(H, 100, 125, false).stav,
        rukav: posud(M("delkaPaze"), 62, 57, false).stav,
        verdikt: vyhodnot({ hrudnik: "100", pas: "85" }, { dil: "horni", miry: { hrudnik: "47", pas: "50" }, naplocho: true }).celkem.text
      };
    });
    ok(T + "čte čísla z textu tabulky (96–100, 52,5)", v.rozsah === "96/100" && v.carka === 52.5, v.rozsah + " " + v.carka);
    ok(T + "míra naplocho se zdvojí, tabulka postavy se převede s obvyklou rezervou", v.naplocho === 104 && v.postava === 108, v.naplocho + " " + v.postava);
    ok(T + "menší kus se nevejde, pružný se natáhne jen o 8 %", v.male === "nevejde" && v.malePruzne === "tesne" && v.moc === "nevejde", [v.male, v.malePruzne, v.moc].join(" "));
    ok(T + "rezervy: +2 těsné, +6 sedí, +25 volné, rukáv o 5 cm kratší je krátký", v.tesne === "tesne" && v.sedi === "sedi" && v.volne === "volne" && v.rukav === "kratke");
    ok(T + "verdikt řekne, kde a kolik chybí", v.verdikt === "Na tebe se to nevejde: obvod hrudníku chybí 6 cm.", v.verdikt);

    // ----- celý postup s fotkami -----
    await page.setInputFiles('input[data-foto="predek"]', { name: "postava.png", mimeType: "image/png", buffer: Buffer.from(fotky.postava, "base64") });
    await page.locator("#teloPlatno:not(.hidden)").waitFor();
    await klepni(page, "teloPlatno", 600, 1200, [[300, 100], [300, 1100], [210, 350], [390, 350], [225, 500], [375, 500]]);
    ok(T + "po 6 klepnutích jsou body na postavě označené", (await page.locator("#teloKrok").innerText()) === "Body jsou označené.");
    for (const [k, val] of [["vyska", "180"], ["hrudnik", "100"], ["pas", "85"]]) await page.fill(`input[data-telo="${k}"]`, val);

    await page.setInputFiles("#kusFoto", { name: "tricko.png", mimeType: "image/png", buffer: Buffer.from(fotky.tricko, "base64") });
    await page.locator("#kusPlatno:not(.hidden)").waitFor();
    const pozadi = await page.evaluate(() => { const g = document.getElementById("kusPlatno").getContext("2d"); return [g.getImageData(10, 10, 1, 1).data[3], g.getImageData(400, 430, 1, 1).data[3], g.getImageData(400, 300, 1, 1).data[3]]; });
    ok(T + "bílé pozadí kusu zmizí, bílé logo uvnitř zůstane", pozadi[0] === 0 && pozadi[1] === 255 && pozadi[2] === 255, pozadi.join(" "));
    await klepni(page, "kusPlatno", 800, 800, [[200, 250], [600, 250]]);
    await page.check("#kusNaplocho");
    await page.fill('input[data-kus="hrudnik"]', "53");
    await page.locator("#kolaz:not(.hidden)").waitFor();
    ok(T + "kus 53 cm naplocho na hrudník 100 cm sedí", (await page.locator("#verdikt").innerText()) === "Mělo by ti to sedět.", await page.locator("#verdikt").innerText());
    // šířka: 180 px × 106/100 = 191 px kolem x = 300; délka: 5,56 px/cm × 53 / 400 px = 0,736 → trup y 276–681, rukávy končí v y = 394
    const p = {};
    for (const [n, x, y] of [["stred", 300, 350], ["uvnitr", 210, 420], ["venku", 198, 420], ["dole", 300, 670], ["podDolem", 300, 695], ["nadHorem", 300, 268]]) p[n] = await pixel(page, x, y);
    ok(T + "koláž: tričko je na hrudníku a široké podle měr", cervena(p.stred) && cervena(p.uvnitr) && !cervena(p.venku), JSON.stringify([p.stred, p.uvnitr, p.venku]));
    ok(T + "koláž: délka trička odpovídá cm (konec kolem y = 681)", cervena(p.dole) && !cervena(p.podDolem), JSON.stringify([p.dole, p.podDolem]));
    ok(T + "koláž: bílé pozadí kusu není vidět", p.nadHorem[0] < 230 && !cervena(p.nadHorem), JSON.stringify(p.nadHorem));
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "obleceni-" + width + "-sedi.png"), fullPage: true });

    await page.fill('input[data-kus="hrudnik"]', "45");
    ok(T + "kus 45 cm naplocho: napíše, že se nevejde a kolik chybí", (await page.locator("#verdikt").innerText()) === "Na tebe se to nevejde: obvod hrudníku chybí 10 cm.", await page.locator("#verdikt").innerText());
    ok(T + "malý kus je v koláži užší než tělo (162 px)", !cervena(await pixel(page, 214, 420)) && cervena(await pixel(page, 300, 350)));
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "obleceni-" + width + "-nevejde.png"), fullPage: true });

    await page.reload({ waitUntil: "load" });
    await page.locator("#kolaz:not(.hidden)").waitFor();
    ok(T + "po novém otevření zůstanou míry, fotky i body", (await page.inputValue('input[data-telo="hrudnik"]')) === "100" && (await page.locator("#verdikt").innerText()).startsWith("Na tebe se to nevejde"));
    ok(T + "nic nepřetéká do šířky", await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth) <= 0);
  } catch (e) {
    ok(T + "test doběhl", false, String(e && e.message || e).split("\n")[0]);
  }
  ok(T + "žádné porušení CSP ani chyba v konzoli", problems.length === 0, problems.slice(0, 3).join(" | "));
  ok(T + "nic se neposílá mimo vlastní web", foreign.length === 0, foreign.slice(0, 3).join(" | "));
  await context.close();
}

(async () => {
  const server = await startServer(), base = "http://127.0.0.1:" + server.address().port;
  const browser = await chromium.launch();
  try {
    const p = await browser.newPage(), fotky = await vyrobFotky(p);
    await p.close();
    for (const w of [412, 1000]) await runWidth(browser, base, w, fotky);
  } finally {
    await browser.close(); server.close();
  }
  console.log("\nZkoušení oblečení – úspěšných: " + passed + ", neúspěšných: " + failed);
  process.exit(failed ? 1 : 0);
})();
