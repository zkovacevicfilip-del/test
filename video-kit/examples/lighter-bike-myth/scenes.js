'use strict';
// SCÉNY krátkého videa „Stop spending money on a lighter bike“ (asi 30 s). Hook: rozpor s tím, co si lidé myslí.
// Čísla: tools/physics.py 250 0.25 0.24 (84 kg s kolem, rovina, 250 W = 40 km/h):
// 1 kg méně = 0,45 W a 2,4 s na 40 km; 0,01 m² CdA méně = 8,5 W a 46 s na 40 km (poměr wattů 19×).

function sHook(t, a) {
  const ex = tw(t, a.end - 0.36, 0.36), c = i => cs('hook', i);
  ctx.save(); ctx.globalAlpha = 1 - ex; ctx.translate(0, -70 * ex);
  let p = popS(t, c(0), null, 0.7); txt('STOP', 540, 720, { size: 240, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -6 });
  p = pop(t, c(1), null); txt('spending money', 540, 860 + p.dy, { size: 74, w: 700, f: F.U, a: p.a, ls: -2 });
  p = pop(t, c(2), null); txt('on a lighter bike', 540, 960 + p.dy, { size: 66, w: 700, f: F.U, a: p.a, ls: -2 });
  p = popS(t, c(3), null); pill('look at this first', 540, 1130, { a: p.a, s: p.s, size: 46, bg: C.ink, c: C.bg, ls: 0 });
  ctx.restore();
}

function sCompare(t, a) {
  const io = actIO(t, a), k = i => cs('kilo', i), e = i => cs('eight', i), dy = io.dy;
  const h2 = L.shrink.start - 0.2, h3 = e(1) - 0.15, mv = tw(t, L.shrink.start - 0.25, 0.8);
  ctx.save(); ctx.globalAlpha = io.a;
  // nadpis: −1 kg → −0.01 m² → 19×
  let q = pop(t, k(0), h2); txt('FLAT ROAD · 40 KM/H', 540, 306 + q.dy, { size: 32, w: 800, c: C.muted, ls: 4, a: q.a });
  let p = popS(t, k(1), h2, 0.7); txt('−1 kg', 540, 456 + p.dy, { size: 150, w: 800, f: F.U, a: p.a, s: p.s, ls: -4 });
  q = pop(t, cs('shrink', 1), h3); txt('DRAG AREA · CdA', 540, 306 + q.dy, { size: 32, w: 800, c: C.muted, ls: 4, a: q.a });
  p = popS(t, cs('shrink', 3), h3, 0.7); txt('−0.01 m²', 540, 452 + p.dy, { size: 118, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -4 });
  p = popS(t, e(1), null, 0.7); txt('19×', 540, 420 + p.dy, { size: 190, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -6 });
  q = pop(t, e(1) + 0.25, null); txt('more watts saved', 540, 494 + q.dy, { size: 48, w: 700, a: q.a });
  // dva řádky: kilo dolů × 0,01 m² dolů
  const row = (y, label, col, watts, frac, secs, tIn, tW, tS) => {
    const en = pop(t, tIn, null), kb = tw(t, tW, 1.0, E.quint), nw = popS(t, tW, null), ns = popS(t, tS, null);
    if (en.a <= 0) return;
    ctx.save(); ctx.translate(0, en.dy * 0.6);
    txt(label, 110, y, { size: 46, w: 700, align: 'left', a: en.a });
    ctx.save(); ctx.globalAlpha *= en.a; ctx.fillStyle = C.line2; ctx.beginPath(); ctx.roundRect(110, y + 30, 860, 28, 14); ctx.fill();
    if (nw.a > 0) { ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(110, y + 30, Math.max(28, 860 * frac * kb), 28, 14); ctx.fill(); }
    ctx.restore();
    txt((watts * kb).toFixed(1) + ' W', 110, y + 168, { size: 88, w: 800, f: F.U, c: col, align: 'left', a: nw.a, ls: -3 });
    txt('SAVED', 114, y + 212, { size: 28, w: 800, c: C.muted, ls: 4, align: 'left', a: nw.a });
    txt(secs, 970, y + 168, { size: 88, w: 800, f: F.U, c: col, align: 'right', a: ns.a, ls: -3 });
    txt('OVER 40 KM', 968, y + 212, { size: 28, w: 800, c: C.muted, ls: 4, align: 'right', a: ns.a });
    ctx.restore();
  };
  row(lerp(860, 690, mv) + dy, '1 kg lighter', C.ink, 0.5, 0.45 / 8.47, '~2 s', k(1), k(3), cs('two', 1));
  row(1040 + dy, '0.01 m² less drag area', C.pu, 8.5, 1, '~45 s', cs('shrink', 3), e(0), e(2));
  ctx.restore();
}

function sVerdict(t, a) {
  const io = actIO(t, a), c = i => cs('verdict', i), s2 = c(4) - 0.15;
  const P = { back: tw(t, c(4), 1.0), elbows: tw(t, c(4) + 0.3, 1.0), head: tw(t, c(4) + 0.15, 1.0) };
  ctx.save(); ctx.globalAlpha = io.a;
  let q = pop(t, c(0), s2); rich([['Steep climbs: ', C.muted], ['weight wins', C.ink]], 540, 322 + q.dy, { size: 48, w: 700, a: q.a });
  q = pop(t, c(2), s2); txt('Everywhere else', 540, 400 + q.dy, { size: 48, w: 700, c: C.muted, a: q.a });
  let p = popS(t, c(3), s2, 0.7); txt('aero wins', 540, 500 + p.dy, { size: 100, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -3 });
  q = pop(t, c(4), null); txt('A better position', 540, 360 + q.dy, { size: 62, w: 700, f: F.U, a: q.a, ls: -2 });
  p = popS(t, c(5), null, 0.7); txt('is free', 540, 490 + p.dy, { size: 124, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -4 });
  ctx.fillStyle = C.line2; ctx.fillRect(250, 1322 + io.dy, 580, 5);
  frontRider(540, 1322 + io.dy, 0.94, { back: 0, elbows: 0, head: 0 }, C.bg, 0.30);
  frontRider(540, 1322 + io.dy, 0.94, P, C.pu, 1);
  ctx.restore();
}

// Akt (id ze script.json) → funkce scény. Každý akt musí mít scénu i hodnotu AMBIENT.
const SCENES = { hook: sHook, compare: sCompare, verdict: sVerdict };
const AMBIENT = { hook: 0.34, compare: 0.26, verdict: 0.16 };
// Tohle video nepoužívá žádné simulované proudění, jen jemný proud v pozadí.
const FLOWS = {};
