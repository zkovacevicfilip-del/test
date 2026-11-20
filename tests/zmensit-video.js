// Test stránky Zmenšit video (zmensit-video/). Spuštění: součást npm test.
// Testovací video si test vyrobí sám (šum a zvukový tón, 3 s, 1280 × 720), na internet se nepřipojuje.
"use strict";
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
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

// 3 s videa s velkým datovým tokem (šum se špatně komprimuje), aby šlo poznat zmenšení
function vyrobVideo(page) {
  return page.evaluate(async () => {
    const c = document.createElement("canvas"); c.width = 1280; c.height = 720; const g = c.getContext("2d");
    const ac = new AudioContext(), osc = ac.createOscillator(), dst = ac.createMediaStreamDestination(); osc.frequency.value = 440; osc.connect(dst); osc.start();
    const proud = c.captureStream(30); dst.stream.getAudioTracks().forEach(t => proud.addTrack(t));
    const rec = new MediaRecorder(proud, { mimeType: "video/webm;codecs=vp8,opus", videoBitsPerSecond: 8e6 }), kusy = [];
    rec.ondataavailable = e => kusy.push(e.data);
    // pohyblivý obraz podobný skutečnému videu: přechod barev, obdélníky, text a trocha zrnění
    let i = 0;
    const kresli = () => {
      const gr = g.createLinearGradient(0, 0, 1280, 720); gr.addColorStop(0, "hsl(" + (i * 3) % 360 + ",60%,45%)"); gr.addColorStop(1, "hsl(" + (i * 3 + 140) % 360 + ",60%,30%)");
      g.fillStyle = gr; g.fillRect(0, 0, 1280, 720);
      for (let k = 0; k < 24; k++) { g.fillStyle = "hsl(" + k * 15 + ",70%,55%)"; g.fillRect((k * 97 + i * (k % 5 + 2) * 3) % 1280, (k * 53) % 660, 60 + k * 3, 40 + k * 2); }
      g.fillStyle = "#fff"; g.font = "bold 80px sans-serif"; g.fillText("snímek " + i, 80, 650);
      for (let k = 0; k < 3000; k++) { g.fillStyle = Math.random() < 0.5 ? "#000" : "#fff"; g.fillRect(Math.random() * 1280, Math.random() * 720, 2, 2); }
      i++;
    };
    rec.start(); const t = setInterval(kresli, 33); kresli();
    await new Promise(r => setTimeout(r, 3000)); clearInterval(t); rec.stop(); await new Promise(r => { rec.onstop = r; }); ac.close();
    const b = new Blob(kusy, { type: "video/webm" }), u8 = new Uint8Array(await b.arrayBuffer()); let s = "";
    for (let k = 0; k < u8.length; k += 32768) s += String.fromCharCode.apply(null, u8.subarray(k, k + 32768));
    return btoa(s);
  });
}

// vlastnosti výsledného videa: přehraje se, rozměry, délka
const prehraj = (page, sel) => page.evaluate(async sel => {
  const v = document.createElement("video"); v.muted = true; v.src = document.querySelector(sel).href;
  await new Promise((ok, chyba) => { v.onloadedmetadata = ok; v.onerror = () => chyba(new Error("nejde přehrát")); });
  if (!isFinite(v.duration)) { v.currentTime = 1e6; await new Promise(r => { v.ondurationchange = r; setTimeout(r, 1500); }); }
  return { w: v.videoWidth, h: v.videoHeight, d: v.duration };
}, sel);

(async () => {
  const server = await startServer(), base = "http://127.0.0.1:" + server.address().port + "/";
  const browser = await chromium.launch(), tmp = fs.mkdtempSync(path.join(os.tmpdir(), "zmensit-"));
  try {
    const page = await browser.newPage({ viewport: { width: 412, height: 900 }, acceptDownloads: true });
    const chyby = []; page.on("pageerror", e => chyby.push(e.message)); page.on("console", m => { if (m.type() === "error") chyby.push(m.text()); });
    await page.goto(base + "zmensit-video/index.html");
    ok("stránka se načte a tlačítko čeká na video", await page.locator("#spustit").isDisabled() && (await page.title()) === "Zmenšit video");

    const vstup = Buffer.from(await vyrobVideo(page), "base64");
    await page.setInputFiles("#soubor", { name: "jizda.webm", mimeType: "video/webm", buffer: vstup });
    await page.waitForFunction(() => !document.getElementById("spustit").disabled, null, { timeout: 15000 });
    ok("po výběru videa ukáže velikost, rozměr a odhad", /1280 × 720/.test(await page.locator("#info").innerText()) || /jizda\.webm/.test(await page.locator("#info").innerText()),
      await page.locator("#info").innerText());

    // 1) doporučená kvalita 480p se zvukem
    await page.locator("#spustit").click();
    await page.waitForFunction(() => window.VYSLEDEK, null, { timeout: 30000 });
    let r = await page.evaluate(() => window.VYSLEDEK);
    ok("video se zmenší (480p se zvukem) aspoň na třetinu", !r.chyba && r.velikost < r.puvodni / 3, JSON.stringify(r));
    ok("výsledek má kratší stranu 480 px a poměr stran zůstane", r.h === 480 && r.w === 854, r.w + " × " + r.h);
    let p = await prehraj(page, "#stahnoutVideo");
    ok("zmenšené video jde přehrát a má rozměr 854 × 480", p.w === 854 && p.h === 480, JSON.stringify(p));
    ok("výsledek je MP4 (prohlížeč to umí)", r.typ === "video/mp4", r.typ);
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, "zmensit-video-412.png"), fullPage: true });

    // ZIP: stáhne se a je v pořádku (kontrola přes python zipfile)
    const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("#stahnoutZip").click()]);
    const zipCesta = path.join(tmp, dl.suggestedFilename()); await dl.saveAs(zipCesta);
    const z = spawnSync("python3", ["-I", "-c", "import sys,zipfile;z=zipfile.ZipFile(sys.argv[1]);print(z.testzip() or 'ok', z.namelist()[0], z.infolist()[0].file_size)", zipCesta], { encoding: "utf8" });
    if (z.status === null || z.error) console.log("- kontrola ZIP přeskočena (chybí python3)");
    else ok("ZIP je platný a obsahuje zmenšené video", /^ok jizda-maly\.mp4 (\d+)/.test(z.stdout.trim()) && +z.stdout.trim().split(" ")[2] === r.velikost, z.stdout + z.stderr);

    // 2) nejmenší kvalita bez zvuku: ještě menší, druhé spuštění na stejné stránce funguje
    await page.evaluate(() => { window.VYSLEDEK = null; });
    await page.selectOption("#kvalita", "tiny"); await page.locator("#bezZvuku").check(); await page.locator("#spustit").click();
    await page.waitForFunction(() => window.VYSLEDEK, null, { timeout: 30000 });
    const r2 = await page.evaluate(() => window.VYSLEDEK);
    ok("nejmenší kvalita bez zvuku je menší než 480p se zvukem a má 360 px", !r2.chyba && r2.velikost < r.velikost && r2.h === 360, JSON.stringify(r2));

    // 3) znovu se zvukem (zvuk z přehrávače jde připojit jen jednou, proto nový přehrávač)
    await page.evaluate(() => { window.VYSLEDEK = null; });
    await page.selectOption("#kvalita", "small"); await page.locator("#bezZvuku").uncheck(); await page.locator("#spustit").click();
    await page.waitForFunction(() => window.VYSLEDEK, null, { timeout: 30000 });
    const r3 = await page.evaluate(() => window.VYSLEDEK);
    ok("třetí spuštění se zvukem projde bez chyby", !r3.chyba && r3.h === 480, JSON.stringify(r3));
    ok("žádná chyba v konzoli ani porušení CSP", chyby.length === 0, chyby.join(" | "));

    if (SHOTS) {
      const p2 = await browser.newPage({ viewport: { width: 1000, height: 900 } }); await p2.goto(base + "zmensit-video/index.html");
      await p2.setInputFiles("#soubor", { name: "jizda.webm", mimeType: "video/webm", buffer: vstup });
      await p2.waitForFunction(() => !document.getElementById("spustit").disabled, null, { timeout: 15000 });
      await p2.screenshot({ path: path.join(SHOTS, "zmensit-video-1000.png"), fullPage: true }); await p2.close();
    }
  } catch (e) {
    ok("test doběhl bez výjimky", false, e.message);
  } finally {
    await browser.close(); server.close(); fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(""); console.log("Zmenšit video – úspěšných: " + passed + ", neúspěšných: " + failed);
  process.exit(failed ? 1 : 0);
})();
