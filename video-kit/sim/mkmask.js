// node mkmask.js <logo.svg> <work>: z loga vyrobí masku jezdce pro simulaci (jezdec čelem doleva, vítr zleva) a kresbu jezdce.
const { chromium } = require('playwright');
const fs = require('fs');
const NX = 360, NY = 250, K = 0.42, OX = 62, OY = 34; // buňky mřížky; K = buněk na jednotku loga
(async () => {
  let svg = fs.readFileSync(process.argv[2], 'utf8').split('\n').slice(1).join('');
  const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<rect[^>]*\/>/, '');
  // části: vše bez pozadí; fialové proudnice pryč
  const parts = inner.replace(/<path[^>]*stroke="#8B3DFF"[^>]*\/>/g, '');
  fs.writeFileSync(process.argv[3] + '/rider-art.svg.txt', parts);
  const solid = parts.replace(/<path[^>]*fill="#17191B"[^>]*\/>/g, '').replace(/#E4E3DE/g, '#ffffff');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: NX, height: NY }, deviceScaleFactor: 1 });
  await p.setContent(`<html><body style="margin:0;background:#000;overflow:hidden"><svg xmlns="http://www.w3.org/2000/svg" width="${NX}" height="${NY}" shape-rendering="geometricPrecision"><g transform="translate(${OX + 512 * K} ${OY}) scale(${-K} ${K})">${solid}</g></svg></body></html>`);
  await p.screenshot({ path: process.argv[3] + '/sim/rider-mask.png' });
  await b.close();
  fs.writeFileSync(process.argv[3] + '/sim/rider-place.json', JSON.stringify({ NX, NY, K, OX, OY }));
})();
