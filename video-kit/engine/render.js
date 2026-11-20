// Vykreslí snímky videa v prohlížeči (Playwright).
//   node render.js frames <od> <do>      → work/frames/00000.jpg …
//   node render.js stills <f1,f2,…>      → work/stills/00000.jpg …
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const [, , mode, a, b] = process.argv; const WORK = path.join(__dirname, '..', 'work'); const PORT = process.env.KIT_PORT || 8140;
(async () => {
  // WebGL bez grafické karty (SwiftShader) pro 3D jezdce ve formátu „ride“
  const br = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await br.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => { console.log('CHYBA', e.message); process.exitCode = 1; });
  p.on('console', m => { if (m.type() === 'error') console.log('console:', m.text()); });
  await p.goto(`http://localhost:${PORT}/engine/index.html`);
  const total = await p.evaluate(() => window.setup());
  const save = async (f, dir) => { const d = await p.evaluate(f => window.frameJPEG(f), f); fs.writeFileSync(path.join(WORK, dir, String(f).padStart(5, '0') + '.jpg'), Buffer.from(d.split(',')[1], 'base64')); };
  if (mode === 'stills') { fs.mkdirSync(path.join(WORK, 'stills'), { recursive: true }); for (const f of a.split(',').map(Number)) await save(Math.min(f, total - 1), 'stills'); }
  else { fs.mkdirSync(path.join(WORK, 'frames'), { recursive: true }); const A = +a, B = Math.min(+b, total); await p.evaluate(f => window.prepare(f), A); for (let f = A; f < B; f++) await save(f, 'frames'); console.log(`snímky ${A}–${B - 1} hotové`); }
  const over = await p.evaluate(() => window.OVER);
  for (const s in over) { console.log(`PŘETÉKÁ MIMO OBRAZ: „${s}“ (snímek ${over[s]}) → zmenši písmo nebo zkrať text`); process.exitCode = 1; }
  await br.close();
})().catch(e => { console.log('CHYBA', e.message.split('\n')[0]); process.exit(1); });
