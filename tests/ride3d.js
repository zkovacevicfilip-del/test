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
      // asfalt a tráva ujíždějí s jezdcem (posun textury o ujetou vzdálenost)
      const ro = K.makeRoad({ outdoor: true }), env = K.makeOutdoor({}, K.LOOKS.golden); ro.update(0); env.update(0);
      const a0 = ro.asphalt.material.map.offset.x, g0 = env.grass.offset.x; ro.update(450); env.update(400); const a1 = ro.asphalt.material.map.offset.x, g1 = env.grass.offset.x;
      // video „3 tipy“ (24. 11. 2026): silniční helma → časovkářská, volný dres → kombinéza, ramena k sobě zmenší plochu zepředu
      const m2 = K.makeRider("purple", { road: "#F2F2EF", sleeve: 0.66, pre: { suit: "#EDECE8", suit2: "#16171A", sleeve: 0.44, loose: 1 } });
      m.update({ pose: 1 }); const def = { tt: m.helmets.tt.visible, road: m.helmets.road.visible, swap: m.cloth.uSwap.value, loose: m.cloth.uLoose.value };
      m2.update({ pose: 1, hs: [1, 0] }); const h1 = { road: m2.helmets.road.visible && m2.helmets.road.children.length === 1, tt: m2.helmets.tt.visible };
      m2.update({ pose: 1, hs: [0, 1], swap: 0.5 }); const h2 = { road: m2.helmets.road.visible, tt: m2.helmets.tt.visible, swap: m2.cloth.uSwap.value };
      const sw0 = K.makeRider("purple", { pre: { suit: "#EDECE8" } }).cloth.uSwap.value;
      // plocha zepředu: kamera před jezdcem, počet pixelů jezdce v poloze 1 a s hlavou dolů a rameny k sobě
      st.cam.position.set(1200, 175, 0); st.cam.lookAt(0, 175, 0);
      const front = o => { m.update(o); st.world.updateMatrixWorld(true); st.render(0); return scan(); };
      const fa0 = front({ pose: 1, shrug: 0 }), fa1 = front({ pose: 1.7, shrug: 1 });
      // ruce drží nástavce i s hlavou dole a rameny k sobě; ramena se stahují plynule (bez skoku na začátku)
      const LP = n => m.root.worldToLocal(m.root.getObjectByName(n).getWorldPosition(new K.THREE.Vector3()));
      m.update({ pose: 1 }); const wr1 = LP('wrist.R'), s0 = LP('upperarm01.R'); m.update({ pose: 1.7, shrug: 1 }); const wr2 = LP('wrist.R'), s1 = LP('upperarm01.R');
      m.update({ pose: 1, shrug: 0.02 }); const s02 = LP('upperarm01.R');
      const hold = { wrist: wr1.distanceTo(wr2), shrug: s0.distanceTo(s1), start: s0.distanceTo(s02) };
      // držátka nástavců blíž u sebe (gripIn): zápěstí blíž ke středu než bez nastavení
      const m3 = K.makeRider("purple", { gripIn: 0.22 }); m3.update({ pose: 1 }); m3.root.updateMatrixWorld(true);
      const grip = { def: Math.abs(wr1.z), narrow: Math.abs(m3.root.worldToLocal(m3.root.getObjectByName('wrist.R').getWorldPosition(new K.THREE.Vector3())).z) };
      return { def, h1, h2, sw0, fa0, fa1, hold, grip, a0, a1, g0, g1, n0, top0, top2, head0: [head0.x, head0.y], roadOnly, palms, w0, w1, roadLayers, bones: skinned ? skinned.skeleton.bones.length : 0, verts: H.meta.vertices, kits: Object.keys(K.KITS) };
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
    // oprava 22. 11. 2026 (autor): asfalt pod jezdcem se nehýbal
    ok("asfalt ujíždí podle vzdálenosti (450 jednotek = půl dlaždice textury)", Math.abs(r.a1 - r.a0 - 0.5) < 1e-6, r.a0 + " → " + r.a1);
    ok("tráva u silnice ujíždí taky", Math.abs(r.g1 - r.g0 - 0.75) < 1e-6, r.g0 + " → " + r.g1);
    ok("bez nastavení má jezdec jen časovkářskou helmu a kombinézu jako dřív", r.def.tt && !r.def.road && r.def.swap === 1 && r.def.loose === 0, JSON.stringify(r.def));
    ok("gripIn přisune držátka nástavců ke středu (zápěstí aspoň o třetinu blíž, ruce se ale nepřekrývají)", r.grip.narrow < r.grip.def * 0.67 && r.grip.narrow > 8, JSON.stringify(r.grip));
    ok("ruce drží nástavce i s hlavou dole a rameny k sobě (zápěstí se pohne nejvýš o 1,5 jednotky)", r.hold.wrist < 1.5, JSON.stringify(r.hold));
    ok("ramena k sobě: plynule od začátku (při shrug 0,02 posun do 0,6 jednotky), naplno znatelně (přes 3 jednotky)", r.hold.start < 0.6 && r.hold.shrug > 3, JSON.stringify(r.hold));
    ok("silniční helma (bez brýlí) se ukáže a schová podle hs, časovkářská naopak", r.h1.road && !r.h1.tt && !r.h2.road && r.h2.tt, JSON.stringify([r.h1, r.h2]));
    ok("oblečení před (volný dres) začíná na přechodu 0 a jde nastavit (swap 0,5)", r.sw0 === 0 && r.h2.swap === 0.5, r.sw0 + " / " + r.h2.swap);
    ok("hlava dolů a ramena k sobě zmenší plochu jezdce zepředu aspoň o 5 %", r.fa1 < r.fa0 * 0.95 && r.fa1 > r.fa0 * 0.5, r.fa0 + " → " + r.fa1);
    ok("dresy: bílý, fialový, černý", ["white", "purple", "black"].every(k => r.kits.includes(k)), r.kits.join(", "));
  } finally { await br.close(); server.close(); }
  if (fails) { console.log(`\n${fails} test(ů) selhalo`); process.exit(1); } else console.log("\n3D jezdci: vše v pořádku");
})().catch(e => { console.error(e); process.exit(1); });
