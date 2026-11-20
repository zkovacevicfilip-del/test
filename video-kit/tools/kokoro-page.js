// Náš hlas pro videa (Kokoro: směs am_fenrir/am_puck/am_onyx + živý přednes a stoupání u otázek).
// Projde naši stránku video-kit/tts v prohlížeči bez okna, takže hlas zní stejně jako na stránce.
//   node kokoro-page.js <tts_slozka> <vety.json> <vystupni_slozka>
// vety.json: [{ "key": "hook", "text": "…", "speed": 1.15 }] → <vystupni_slozka>/<key>.wav
// Model (asi 90 MB) se stáhne z Hugging Face při každém spuštění (asi 20 s). Trvalý profil prohlížeče se nepoužívá:
// jeho mezipaměť občas hlásila „Failed to execute 'match' on 'Cache'“ a hlas se zasekl; podstrčení modelu přes
// page.route zase shazovalo stránku (90 MB přes protokol prohlížeče).
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const [ROOT, LIST, OUT] = process.argv.slice(2);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.wasm': 'application/wasm', '.bin': 'application/octet-stream', '.svg': 'image/svg+xml', '.png': 'image/png' };

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html', file = path.resolve(ROOT, rel);
  if (!file.startsWith(path.resolve(ROOT)) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/`, lines = JSON.parse(fs.readFileSync(LIST, 'utf8'));
  // bypassCSP: zvuk se čte z blob: adresy, kterou CSP stránky (connect-src) jinak nepustí; stránka sama se nemění
  const br = await chromium.launch(), ctx = await br.newContext({ bypassCSP: true });
  try {
    const page = ctx.pages()[0] || await ctx.newPage();
    await page.goto(base + 'index.html', { waitUntil: 'load' });
    for (const l of lines) {
      await page.evaluate(({ text, speed }) => {
        const t = document.getElementById('ttsText'), s = document.getElementById('ttsSpeed');
        t.value = text; s.value = String(speed); document.getElementById('ttsNatural').checked = true;
        t.dispatchEvent(new Event('input')); s.dispatchEvent(new Event('input'));
        document.getElementById('ttsStatus').textContent = '';
      }, { text: l.text, speed: l.speed || 1.15 });
      await page.click('#ttsGo');
      await page.waitForFunction(() => /^(Hotovo|Nepovedlo)/.test(document.getElementById('ttsStatus').textContent), null, { timeout: 600000 });
      const st = await page.textContent('#ttsStatus');
      if (!st.startsWith('Hotovo')) throw new Error(`věta ${l.key}: ${st}`);
      const b64 = await page.evaluate(async () => {
        const r = await fetch(document.getElementById('ttsAudio').src), u = new Uint8Array(await r.arrayBuffer());
        let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
        return btoa(s);
      });
      fs.writeFileSync(path.join(OUT, l.key + '.wav'), Buffer.from(b64, 'base64'));
      console.log(`${l.key}: ${st}`);
    }
  } finally { await br.close(); server.close(); }
})().catch(e => { console.error('Náš hlas se nepovedl: ' + e.message); process.exit(1); });
