'use strict';
// Zkušební časová osa BEZ hlasu: odhadne délky vět podle počtu slov, aby šel udělat náhled scén,
// i když zrovna není k dispozici hlas (vyčerpaná kvóta, chybí klíč). Krok „voice“ ji později přepíše skutečnou.
//   node dry.js <pracovní kopie sady>
const fs = require('fs'), path = require('path');
const kit = process.argv[2], sc = JSON.parse(fs.readFileSync(path.join(kit, 'script.json'), 'utf8')), T = sc.timing;
const W = s => s.trim().split(/\s+/).length, RATE = 3.5;
let t = T.lead; const lines = {}, acts = [];
sc.acts.forEach((act, ai) => {
  const start = t - (ai === 0 ? T.lead : T.gap_act / 2);
  act.lines.forEach((key, ki) => {
    const l = sc.lines[key], d = W(l.say) / RATE + 0.25, texts = l.chunks.map(c => Array.isArray(c) ? c[0] : c), tot = texts.reduce((s, x) => s + W(x), 0);
    let acc = 0; const starts = texts.map(x => { const s = t + d * acc / tot; acc += W(x); return s; });
    lines[key] = { start: +t.toFixed(3), end: +(t + d).toFixed(3), captions: l.captions !== false,
      chunks: texts.map((x, i) => ({ text: x, start: +starts[i].toFixed(3), end: +(i + 1 < texts.length ? starts[i + 1] : t + d + 0.12).toFixed(3) })) };
    t += d + (ki + 1 < act.lines.length ? T.gap_line : T.gap_act);
  });
  acts.push({ id: act.id, start: +start.toFixed(3), end: +(t - T.gap_act / 2).toFixed(3) });
});
const total = t - T.gap_act + T.tail; acts[acts.length - 1].end = +total.toFixed(3);
fs.mkdirSync(path.join(kit, 'work'), { recursive: true });
fs.writeFileSync(path.join(kit, 'work', 'timeline.json'), JSON.stringify({ fps: 30, total: +total.toFixed(3), frames: Math.round(total * 30), dry: true, acts, lines }, null, 1));
console.log('ZKUŠEBNÍ ČASOVÁ OSA (bez hlasu): ' + total.toFixed(1) + ' s');
