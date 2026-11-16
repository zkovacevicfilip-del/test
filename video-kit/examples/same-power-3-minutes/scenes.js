'use strict';
// SCÉNY krátkého videa „Two riders, same power, 3½ minutes apart“ (asi 30 s). Hook: záhada s otázkou „Why?“.
// Čísla: tools/physics.py 250 0.30 0.25 (84 kg s kolem, rovina): 37,8 a 40,0 km/h, rozdíl 2,2 km/h a 3,5 min na 40 km.

function sHook(t, a) {
  const ex = tw(t, a.end - 0.36, 0.36), c = i => cs('hook', i);
  ctx.save(); ctx.globalAlpha = 1 - ex; ctx.translate(0, -70 * ex);
  let p = pop(t, c(0), null); txt('Two riders.', 540, 500 + p.dy, { size: 80, w: 700, f: F.U, a: p.a, ls: -2 });
  p = pop(t, c(1), null); txt('Same power.', 540, 606 + p.dy, { size: 80, w: 700, f: F.U, a: p.a, ls: -2 });
  p = pop(t, c(2), null); txt('One finishes', 540, 780 + p.dy, { size: 54, w: 700, c: C.muted, a: p.a });
  p = popS(t, c(3), null, 0.7); txt('3.5 min', 540, 960, { size: 180, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -6 });
  p = pop(t, c(3) + 0.5, null); txt('ahead', 540, 1064 + p.dy, { size: 80, w: 700, f: F.U, a: p.a, ls: -2 });
  p = popS(t, c(4), null, 0.7); txt('Why?', 540, 1290, { size: 150, w: 800, f: F.U, a: p.a, s: p.s, ls: -4 });
  ctx.restore();
}

function sRace(t, a) {
  const io = actIO(t, a), y1 = 800 + io.dy, y2 = 1110 + io.dy, X0 = 130, X1 = 950;
  const T0 = cs('speeds', 0), T1 = cs('gap', 1) + 0.25, q = E.io(clamp((t - T0) / (T1 - T0))), pf = q, ps = q * (37.80 / 40.04);
  const hB = cs('only', 1) - 0.15, hC = cs('speeds', 2) - 0.15, hD = cs('gap', 1) - 0.15;
  ctx.save(); ctx.globalAlpha = io.a;
  // nadpis se střídá: 250 W → CdA → +2.2 km/h → 3.5 min
  let p = popS(t, cs('same', 1), hB); txt('250 W', 540, 392 + p.dy, { size: 150, w: 800, f: F.U, a: p.a, s: p.s, ls: -4 });
  let s = pop(t, cs('same', 2), hB); txt('same power · 40 km', 540, 470 + s.dy, { size: 46, w: 700, c: C.muted, a: s.a });
  p = popS(t, cs('only', 1), hC); txt('CdA', 540, 392 + p.dy, { size: 170, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -5 });
  s = pop(t, cs('only', 2), hC); txt('how much air you push aside', 540, 470 + s.dy, { size: 46, w: 700, a: s.a });
  p = popS(t, cs('speeds', 2), hD); txt('+2.2 km/h', 540, 392 + p.dy, { size: 128, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -4 });
  s = pop(t, cs('speeds', 2) + 0.15, hD); txt('same watts, lower CdA', 540, 470 + s.dy, { size: 46, w: 700, c: C.muted, a: s.a });
  p = popS(t, cs('gap', 1), null); txt('3.5 min', 540, 392 + p.dy, { size: 150, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -4 });
  s = pop(t, cs('gap', 1) + 0.3, null); txt('ahead after 40 km', 540, 470 + s.dy, { size: 46, w: 700, c: C.muted, a: s.a });
  // cílová čára
  const fa = tw(t, cs('same', 2), 0.6); ctx.save(); ctx.globalAlpha *= fa; ctx.strokeStyle = C.muted; ctx.lineWidth = 4; ctx.setLineDash([12, 12]); ctx.beginPath(); ctx.moveTo(X1, y1 - 150); ctx.lineTo(X1, y2 + 108); ctx.stroke(); ctx.restore();
  txt('40 km', X1, y2 + 150, { size: 32, w: 800, c: C.muted, a: fa, align: 'right', ls: 1 });
  [[y1, ps, '0.30', C.ink, 37.8, 0], [y2, pf, '0.25', C.pu, 40.0, 0.12]].forEach(([y, pr, cda, col, v, dl]) => {
    const e = pop(t, cs('same', 0) + dl, null), x = X0 + (X1 - X0 - 150) * pr + 150;
    ctx.save(); ctx.globalAlpha *= e.a; ctx.translate(0, e.dy);
    ctx.lineCap = 'round'; ctx.strokeStyle = C.line2; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(X1, y); ctx.stroke();
    ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(Math.max(X0 + 1, x - 20), y); ctx.stroke();
    const ca = pop(t, cs('only', 1) + dl, null); rich([['CdA ', C.muted], [cda, col]], X0 + 118, y + 70 + ca.dy, { size: 46, w: 800, a: ca.a });
    const va = pop(t, T0 + dl, null), vv = lerp(30, v, tw(t, T0 + dl, 0.9, E.quint)); txt(vv.toFixed(1) + ' km/h', X1 - 26, y + 70 + va.dy, { size: 46, w: 800, align: 'right', c: col, a: va.a });
    const sc = 0.44; ctx.drawImage(riderImg, x - 429 * sc, y - 4 - 414 * sc, 512 * sc, 512 * sc);
    ctx.restore();
  });
  // rozdíl v cíli
  const g = popS(t, T1 + 0.1, null), xs = X0 + (X1 - X0 - 150) * ps + 150;
  if (g.a > 0) { ctx.save(); ctx.globalAlpha *= g.a; ctx.strokeStyle = C.pu; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(xs + 6, y1 - 140); ctx.lineTo(X1 - 6, y1 - 140); ctx.moveTo(xs + 6, y1 - 154); ctx.lineTo(xs + 6, y1 - 126); ctx.moveTo(X1 - 6, y1 - 154); ctx.lineTo(X1 - 6, y1 - 126); ctx.stroke(); ctx.restore(); pill('3.5 min behind', X1 - 150, y1 - 206, { a: g.a, s: g.s, size: 36, ls: 0 }); }
  ctx.restore();
}

function sWhy(t, a) {
  const io = actIO(t, a), c = i => cs('why', i);
  const P = { back: tw(t, c(2), 1.0), elbows: tw(t, c(3), 1.0), head: tw(t, c(2) + 0.2, 1.0) };
  ctx.save(); ctx.globalAlpha = io.a;
  let q = pop(t, c(0), c(2) - 0.15); txt('The faster rider', 540, 330 + q.dy, { size: 50, w: 700, c: C.muted, a: q.a });
  let p = popS(t, c(1), c(2) - 0.15); txt('Not fitter', 540, 440 + p.dy, { size: 96, w: 800, f: F.U, a: p.a, s: p.s, ls: -3 });
  p = popS(t, c(2), null, 0.7); txt('Lower', 540, 384 + p.dy, { size: 104, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -3 });
  p = popS(t, c(3), null, 0.7); txt('& narrower', 540, 492 + p.dy, { size: 88, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -3 });
  ctx.fillStyle = C.line2; ctx.fillRect(250, 1322 + io.dy, 580, 5);
  frontRider(540, 1322 + io.dy, 0.94, { back: 0, elbows: 0, head: 0 }, C.bg, 0.30);
  frontRider(540, 1322 + io.dy, 0.94, P, C.pu, 1);
  ctx.restore();
}

// Akt (id ze script.json) → funkce scény. Každý akt musí mít scénu i hodnotu AMBIENT.
const SCENES = { hook: sHook, race: sRace, why: sWhy };
const AMBIENT = { hook: 0.34, race: 0.13, why: 0.16 };
// Tohle video nepoužívá žádné simulované proudění, jen jemný proud v pozadí.
const FLOWS = {};
