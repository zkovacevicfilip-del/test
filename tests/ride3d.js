// Test 3D jezdců pro formát „ride“ (video-kit/engine/rider3d.mjs): model člověka MakeHuman se načte, jezdec se
// vykreslí v prohlížeči bez grafické karty, poloha 2 (nejnižší) má helmu níž než poloha 0, kolo se točí,
// silnice je ve vlastní vrstvě a helma s hledím je na hlavě.
const http = require("http"), fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const ROOT = path.join(__dirname, "..", "video-kit", "engine");
let fails = 0;
const ok = (name, cond, info) => { console.log((cond ? "✓ " : "✗ ") + name + (cond || info == null ? "" : " → " + info)); if (!cond) fails++; };
const TYPES = { ".mjs": "text/javascript", ".js": "text/javascript", ".html": "text/html", ".json": "application/json" };
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
    await p.waitForFunction(() => window.RIDE3D && window.RIDE3D_READY, null, { timeout: 30000 });
    const r = await p.evaluate(async () => {
      const K = window.RIDE3D, H = await window.RIDE3D_READY, st = K.makeStage(400, 400, { fov: 40 }), road = K.makeRoad({ lanes: [-200] }), m = K.makeRider("purple");
      st.world.add(road.group, m.root); st.cam.position.set(0, 220, 1200); st.cam.lookAt(0, 180, 0);
      const scan = () => { const c = document.createElement("canvas"); c.width = c.height = 400; const g = c.getContext("2d"); g.drawImage(st.canvas, 0, 0); const d = g.getImageData(0, 0, 400, 400).data; let n = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i] > 20) n++; return n; };
      m.update({ pose: 0 }); st.world.updateMatrixWorld(true); st.render(0); const n0 = scan(), top0 = m.top(), head0 = m.head();
      m.update({ pose: 2 }); const top2 = m.top();
      st.render(2); const roadOnly = scan();
      const rear = m.root.children[0].children[0], w0 = rear.rotation.z; m.update({ pose: 0, wheel: 1.2 }); const w1 = rear.rotation.z;
      let roadLayers = true; road.group.traverse(o => { if (!o.layers.isEnabled(2) || o.layers.isEnabled(0)) roadLayers = false; });
      let skinned = null; m.root.traverse(o => { if (o.isSkinnedMesh) skinned = o; });
      // dlaň: normála z kostí (zápěstí → prostředek prstů) × (ukazováček → malíček), u levé ruky opačně; v souřadnicích jezdce
      const palm = (pose, s) => { m.update({ pose }); m.root.updateMatrixWorld(true);
        const P = n => m.root.worldToLocal(m.root.getObjectByName(n).getWorldPosition(new K.THREE.Vector3()));
        const f = P('finger3-1.' + s).sub(P('wrist.' + s)), a = P('finger5-1.' + s).sub(P('finger2-1.' + s));
        return new K.THREE.Vector3().crossVectors(f, a).multiplyScalar(s === 'R' ? 1 : -1).normalize().toArray(); };
      const palms = { base: [palm(0, 'R'), palm(0, 'L')], aero: [palm(1, 'R'), palm(1, 'L')] };
      return { n0, top0, top2, head0: [head0.x, head0.y], roadOnly, palms, w0, w1, roadLayers, bones: skinned ? skinned.skeleton.bones.length : 0, verts: H.meta.vertices, kits: Object.keys(K.KITS) };
    });
    ok("model člověka (MakeHuman) se načte: 163 kostí, přes 13 000 bodů", r.bones === 163 && r.verts > 13000, r.bones + " / " + r.verts);
    ok("jezdec se vykreslí bez chyb (WebGL bez grafické karty)", errs.length === 0 && r.n0 > 3000, errs.join("; ") + " / bodů " + r.n0);
    ok("helma sedí na hlavě nad koly (výška 1,5 až 2 m nad zemí ve vzpřímené poloze)", r.top0 > 300 && r.top0 < 430 && r.head0[0] > 20, JSON.stringify(r));
    ok("nejnižší poloha (2) má helmu níž než vzpřímená (0)", r.top2 < r.top0 - 20, r.top0 + " → " + r.top2);
    ok("silnice je jen ve vrstvě 2 a bez jezdců jde vykreslit zvlášť", r.roadLayers && r.roadOnly > 1000 && r.roadOnly !== r.n0, r.roadOnly);
    ok("kolo se otáčí podle úhlu wheel", Math.abs(r.w1 - r.w0 + 1.2) < 1e-6, r.w0 + " → " + r.w1);
    // oprava 21. 11. 2026: na základním řídítku byla zápěstí vykroucená a řídítko vedlo ven z ruky; autor chce dlaně
    // dovnitř k nástavcům (jako v nástavcích), pravá ruka je blíž k divákovi (z > 0), takže její dlaň míří k −z
    ok("na základním řídítku dlaně dovnitř k nástavcům, ne nahoru", r.palms.base[0][2] < -0.6 && r.palms.base[1][2] > 0.6 && r.palms.base.every(n => n[1] < 0.3), JSON.stringify(r.palms.base));
    ok("v aero nástavcích dlaně k sobě (pravá k −z, levá k +z)", r.palms.aero[0][2] < -0.6 && r.palms.aero[1][2] > 0.6, JSON.stringify(r.palms.aero));
    ok("dresy: bílý, fialový, černý", ["white", "purple", "black"].every(k => r.kits.includes(k)), r.kits.join(", "));
  } finally { await br.close(); server.close(); }
  if (fails) { console.log(`\n${fails} test(ů) selhalo`); process.exit(1); } else console.log("\n3D jezdci: vše v pořádku");
})().catch(e => { console.error(e); process.exit(1); });
