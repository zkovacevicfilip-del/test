'use strict';
// SCÉNY krátkého videa „What if getting lower is making you slower“ (asi 25 s). Hook: „What if…“ + rozpor s tím, co všichni radí.
// Čísla: tools/physics.py (84 kg s kolem, rovina, 40 km): 250 W a CdA 0,25 = 59:56; 250 W a CdA 0,24 = 59:10 (o 46 s rychleji);
// 235 W a CdA 0,24 = 60:33 (o 37 s pomaleji než na začátku). 0,01 m² CdA = 8,5 W při 40 km/h, ztráta 15 W je 6 % výkonu.

// úvodní „what IF“ ve stylu loga aplikace: bílé „what“, fialové „IF“
function whatIf(t, tin, y) { const p = popS(t, tin, null, 0.7); rich([['what', C.ink], ['IF', C.pu]], 540, y, { size: 170, w: 800, f: F.U, a: p.a, s: p.s, ls: -5 }); }

function sHook(t, a) {
  const ex = tw(t, a.end - 0.36, 0.36), c = i => cs('hook', i);
  ctx.save(); ctx.globalAlpha = 1 - ex; ctx.translate(0, -70 * ex);
  whatIf(t, c(0), 540);
  let p = pop(t, c(1), null); txt('getting lower', 540, 730 + p.dy, { size: 80, w: 700, f: F.U, a: p.a, ls: -2 });
  p = pop(t, c(2), null); txt('on the bike', 540, 816 + p.dy, { size: 54, w: 700, f: F.U, c: C.muted, a: p.a, ls: -2 });
  p = pop(t, c(3), null); txt('is making you', 540, 990 + p.dy, { size: 60, w: 700, f: F.U, a: p.a, ls: -2 });
  p = popS(t, c(4), null, 0.7); txt('slower?', 540, 1180, { size: 170, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -5 });
  ctx.restore();
}

function sTrade(t, a) {
  const io = actIO(t, a), g = i => cs('gain', i), l = i => cs('loss', i), G = 1322 + io.dy;
  const h1 = g(3) - 0.15, h2 = l(0) - 0.2, h3 = l(3) - 0.15, h4 = l(5) - 0.15;
  // záda jdou dolů, pak se jezdec složí až moc
  const P = { back: 0.55 * tw(t, g(0), 1.0) + 0.45 * tw(t, l(0), 1.0), elbows: 0.4 * tw(t, g(0) + 0.2, 1.0) + 0.6 * tw(t, l(0) + 0.1, 1.0), head: 0.4 * tw(t, g(0) + 0.1, 1.0) + 0.6 * tw(t, l(0) + 0.2, 1.0) };
  ctx.save(); ctx.globalAlpha = io.a;
  // nadpis: Less drag → 45 s faster → Fold too far → −15 W → 37 s slower
  let p = pop(t, g(0), h1); txt('Drop your back', 540, 350 + p.dy, { size: 62, w: 700, f: F.U, a: p.a, ls: -2 });
  let q = popS(t, g(1), h1, 0.7); txt('less drag', 540, 470 + q.dy, { size: 110, w: 800, f: F.U, c: C.pu, a: q.a, s: q.s, ls: -3 });
  q = popS(t, g(3), h2, 0.7); txt('45 s faster', 540, 410 + q.dy, { size: 112, w: 800, f: F.U, c: C.pu, a: q.a, s: q.s, ls: -4 });
  p = pop(t, g(4), h2); txt('over 40 km · same watts', 540, 490 + p.dy, { size: 46, w: 700, a: p.a });
  p = pop(t, l(0), h3); txt('Fold too far', 540, 380 + p.dy, { size: 84, w: 700, f: F.U, a: p.a, ls: -2 });
  q = pop(t, l(2), h3); txt('and your legs lose power', 540, 460 + q.dy, { size: 48, w: 700, c: C.muted, a: q.a });
  q = popS(t, l(3), h4, 0.7); txt('−15 W', 540, 420 + q.dy, { size: 180, w: 800, f: F.U, a: q.a, s: q.s, ls: -5 });
  p = pop(t, l(3) + 0.25, h4); txt('just 6% of your power', 540, 500 + p.dy, { size: 46, w: 700, c: C.muted, a: p.a });
  q = popS(t, l(5), null, 0.7); txt('37 s slower', 540, 410 + q.dy, { size: 112, w: 800, f: F.U, c: C.pu, a: q.a, s: q.s, ls: -4 });
  p = pop(t, l(6), null); txt('than where you started', 540, 490 + p.dy, { size: 46, w: 700, a: p.a });
  // jezdec a dva sloupce: ušetřený odpor × ztracený výkon (15 W = 300 px)
  ctx.fillStyle = C.line2; ctx.fillRect(250, G, 580, 5);
  frontRider(540, G, 0.94, { back: 0, elbows: 0, head: 0 }, C.bg, 0.30);
  frontRider(540, G, 0.94, P, C.pu, 1);
  [[212, 8.5, g(1), C.pu, 'DRAG SAVED', '8.5 W'], [868, 15, l(3), C.ink, 'POWER LOST', '15 W']].forEach(([x, watts, tin, col, label, val]) => {
    const e = pop(t, tin, null), k = tw(t, tin + 0.1, 1.0, E.quint), h = Math.max(6, 300 * watts / 15 * k), base = G - 96;
    if (e.a <= 0) return;
    ctx.save(); ctx.globalAlpha *= e.a; ctx.fillStyle = C.line2; ctx.fillRect(x - 74, base, 148, 4);
    ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x - 52, base - h, 104, h, [16, 16, 0, 0]); ctx.fill(); ctx.restore();
    txt(val, x, base - h - 22, { size: 50, w: 800, f: F.U, c: col, a: e.a * clamp(k * 3), ls: -2 });
    txt(label, x, base + 46, { size: 26, w: 800, c: C.muted, ls: 2, a: e.a });
  });
  ctx.restore();
}

function sRule(t, a) {
  const io = actIO(t, a), r = i => cs('rule', i), p3 = i => cs('tip', i), G = 1290 + io.dy, h1 = r(2) - 0.15, h2 = p3(0) - 0.15;
  const hi = tw(t, r(2), 0.6), no = tw(t, r(1), 0.5);
  ctx.save(); ctx.globalAlpha = io.a;
  let q = pop(t, r(0), h1); txt('The fastest position', 540, 340 + q.dy, { size: 52, w: 700, c: C.muted, a: q.a });
  let p = popS(t, r(1), h1, 0.7); txt("isn't the lowest", 540, 460 + p.dy, { size: 80, w: 800, f: F.U, a: p.a, s: p.s, ls: -3 });
  q = pop(t, r(2), h2); txt("It's the lowest one", 540, 350 + q.dy, { size: 60, w: 700, f: F.U, a: q.a, ls: -2 });
  p = popS(t, r(4), h2, 0.7); txt('at full power', 540, 470 + p.dy, { size: 100, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -3 });
  p = popS(t, p3(0), null, 0.7); txt('Test it', 540, 400 + p.dy, { size: 130, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -4 });
  q = pop(t, p3(1), null); txt('same effort · both positions', 540, 486 + q.dy, { size: 48, w: 700, a: q.a });
  // dva jezdci vedle sebe: nízko s plným výkonem × moc nízko
  ctx.fillStyle = C.line2; ctx.fillRect(140, G, 800, 5);
  frontRider(310, G, 0.68, { back: 0.55, elbows: 0.6, head: 0.5 }, mix(RGB.surf, RGB.pu, hi), 1);
  frontRider(770, G, 0.68, { back: 1, elbows: 1, head: 1 }, C.surf, lerp(1, 0.55, hi));
  txt('250 W', 310, G + 66, { size: 50, w: 800, f: F.U, c: mix(RGB.ink, RGB.pu, hi), ls: -2 });
  txt('235 W', 770, G + 66, { size: 50, w: 800, f: F.U, c: C.muted, ls: -2 });
  txt('LOW', 310, 640 + io.dy, { size: 30, w: 800, c: C.muted, ls: 4 });
  txt('TOO LOW', 770, 640 + io.dy, { size: 30, w: 800, c: C.muted, ls: 4 });
  // křížek přes příliš nízkou pozici a štítek u té rychlejší
  if (no > 0) { const x = 770, y = G - 300, d = 62 * no; ctx.save(); ctx.globalAlpha *= clamp(no * 2); ctx.strokeStyle = C.ink; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - d, y - d); ctx.lineTo(x + d, y + d); ctx.moveTo(x + d, y - d); ctx.lineTo(x - d, y + d); ctx.stroke(); ctx.restore(); }
  const pl = popS(t, r(4), null); if (pl.a > 0) pill('faster', 310, 720 + io.dy + pl.dy, { a: pl.a, s: pl.s, size: 38, ls: 1 });
  ctx.restore();
}

// Akt (id ze script.json) → funkce scény. Každý akt musí mít scénu i hodnotu AMBIENT.
const SCENES = { hook: sHook, trade: sTrade, rule: sRule };
const AMBIENT = { hook: 0.34, trade: 0.16, rule: 0.16 };
// Tohle video nepoužívá žádné simulované proudění, jen jemný proud v pozadí.
const FLOWS = {};
