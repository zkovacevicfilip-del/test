// Test 3D jezdců pro formát „ride“ (video-kit/engine/rider3d.mjs): v prohlížeči bez grafické karty se vykreslí,
// poloha 0 (vzpřímeně) je vyšší než poloha 2 (skrčeně), kolo se točí a silnice je ve vlastní vrstvě (kreslí se zvlášť).
const http = require("http"), fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const ROOT = path.join(__dirname, "..", "video-kit", "engine");
let fails = 0;
const ok = (name, cond, info) => { console.log((cond ? "✓ " : "✗ ") + name + (cond || info == null ? "" : " → " + info)); if (!cond) fails++; };
const TYPES = { ".mjs": "text/javascript", ".js": "text/javascript", ".html": "text/html" };
const server = http.createServer((req, res) => {
  const u = req.url.split("?")[0];
  if (u === "/test.html") { res.writeHead(200, { "Content-Type": "text/html" }); res.end('<!doctype html><meta charset="utf-8"><script type="module" src="three-boot.mjs"></script>'); return; }
  const f = path.join(ROOT, decodeURIComponent(u));
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
});
(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const br = await chromium.launch({ args: ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  try {
    const p = await br.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
    await p.goto(`http://127.0.0.1:${server.address().port}/test.html`);
    await p.waitForFunction(() => window.RIDE3D, null, { timeout: 30000 });
    const r = await p.evaluate(() => {
      const K = window.RIDE3D, st = K.makeStage(400, 400, { fov: 40 }), road = K.makeRoad({ lanes: [-200] }), m = K.makeRider("white", { helmet: "#8B3DFF" });
      st.world.add(road.group, m.root); st.cam.position.set(0, 200, 1100); st.cam.lookAt(0, 180, 0);
      // nejvyšší neprůhledný řádek obrazu a počet barevných bodů
      const scan = () => { const c = document.createElement("canvas"); c.width = c.height = 400; const g = c.getContext("2d"); g.drawImage(st.canvas, 0, 0); const d = g.getImageData(0, 0, 400, 400).data; let top = 400, n = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i] > 20) { n++; top = Math.min(top, Math.floor((i >> 2) / 400)); } return { top, n }; };
      m.update({ pose: 0 }); st.render(0); const up = scan();
      m.update({ pose: 2 }); st.render(0); const low = scan();
      st.render(2); const roadOnly = scan();
      const wheel0 = m.root.children[0].children[0].children[1].rotation.z; m.update({ pose: 0, wheel: 1.2 }); const wheel1 = m.root.children[0].children[0].children[1].rotation.z;
      let roadLayers = true; road.group.traverse(o => { if (!o.layers.isEnabled(2) || o.layers.isEnabled(0)) roadLayers = false; });
      return { up, low, roadOnly, wheel0, wheel1, roadLayers, kits: Object.keys(K.KITS) };
    });
    ok("3D jezdec se vykreslí bez chyb (WebGL bez grafické karty)", errs.length === 0 && r.up.n > 3000, errs.join("; ") + " / bodů " + r.up.n);
    ok("skrčená poloha (2) je nižší než vzpřímená (0)", r.low.top > r.up.top + 15, r.up.top + " → " + r.low.top);
    ok("silnice je jen ve vrstvě 2 a bez jezdců jde vykreslit zvlášť", r.roadLayers && r.roadOnly.n > 1000 && r.roadOnly.n !== r.up.n, JSON.stringify(r.roadOnly));
    ok("kolo se otáčí podle úhlu wheel", Math.abs(r.wheel1 - r.wheel0 + 1.2) < 1e-6, r.wheel0 + " → " + r.wheel1);
    ok("dresy: bílý (vzor), fialový, černý", ["white", "purple", "black"].every(k => r.kits.includes(k)), r.kits.join(", "));
  } finally { await br.close(); server.close(); }
  if (fails) { console.log(`\n${fails} test(ů) selhalo`); process.exit(1); } else console.log("\n3D jezdci: vše v pořádku");
})().catch(e => { console.error(e); process.exit(1); });
