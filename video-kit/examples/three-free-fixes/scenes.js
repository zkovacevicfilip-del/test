'use strict';
// SCÉNY krátkého videa „You're wasting watts: 3 free fixes“ (asi 30 s). Hook: skrytá chyba + slib tří kroků.
// Čísla: tools/physics.py 250 0.30 0.25 (84 kg s kolem, rovina): při 40 km/h jde 85 % odporu na vzduch
// a 0,01 m² CdA = 8,5 W.

function sHook(t, a) {
  const ex = tw(t, a.end - 0.36, 0.36), c = i => cs('hook', i);
  ctx.save(); ctx.globalAlpha = 1 - ex; ctx.translate(0, -70 * ex);
  let p = pop(t, c(0), null); txt("You're wasting", 540, 540 + p.dy, { size: 72, w: 700, f: F.U, a: p.a, ls: -2 });
  p = popS(t, c(1), null, 0.7); txt('watts', 540, 760, { size: 196, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -7 });
  p = pop(t, c(2), null); txt('on every single ride', 540, 880 + p.dy, { size: 58, w: 700, f: F.U, a: p.a, ls: -2 });
  p = popS(t, c(4), null, 0.7); rich([['3 ', C.pu], ['free fixes', C.ink]], 540, 1140, { size: 100, w: 800, f: F.U, a: p.a, s: p.s, ls: -3 });
  ctx.restore();
}

function sAir(t, a) {
  const io = actIO(t, a), s0 = cs('air', 1);
  ctx.save(); ctx.globalAlpha = io.a;
  panel(FLOW.rider, 1052 + io.dy, 640, 1);
  let q = pop(t, cs('air', 0), s0 - 0.25); txt('At 40 km/h', 540, 430 + q.dy, { size: 88, w: 700, f: F.U, a: q.a, ls: -2 });
  let p = popS(t, s0, null, 0.7); const n = Math.round(85 * tw(t, s0, 1.0, E.quint));
  txt(n + '%', 540, 470, { size: 240, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -7 });
  q = pop(t, cs('air', 2) - 0.1, null); txt('of your effort just pushes air', 540, 556 + q.dy, { size: 50, w: 700, a: q.a });
  const b = tw(t, cs('air', 3) - 0.2, 1.0), ba = clamp((t - (cs('air', 3) - 0.2)) / 0.2);
  if (ba > 0) {
    ctx.save(); ctx.globalAlpha *= ba; ctx.fillStyle = C.line2; ctx.beginPath(); ctx.roundRect(110, 606, 860, 26, 13); ctx.fill();
    ctx.fillStyle = C.pu; ctx.beginPath(); ctx.roundRect(110, 606, Math.max(26, 860 * 0.85 * b), 26, 13); ctx.fill();
    txt('AIR 85%', 110, 678, { size: 30, w: 800, align: 'left', c: C.pu, ls: 2 }); txt('ROLLING 15%', 970, 678, { size: 30, w: 800, align: 'right', c: C.muted, ls: 2 });
    txt('flat road', 540, 678, { size: 28, w: 600, c: C.muted }); ctx.restore();
  }
  ctx.restore();
}

function sFixes(t, a) {
  const io = actIO(t, a), c = i => cs('fixes', i), w = i => cs('worth', i), out = w(0) - 0.2;
  const P = { back: tw(t, c(0) + 0.25, 1.0), elbows: tw(t, c(1) + 0.25, 1.0), head: tw(t, c(2) + 0.25, 1.0) };
  ctx.save(); ctx.globalAlpha = io.a;
  ['Lower your back', 'Bring your elbows in', 'Tuck your head'].forEach((s, i) => {
    const p = pop(t, c(i), out), y = 300 + i * 78 + p.dy, x = 280 - (1 - p.k) * 70;
    ctx.save(); ctx.globalAlpha *= p.a; ctx.fillStyle = C.pu; ctx.beginPath(); ctx.arc(x, y - 17, 27, 0, 7); ctx.fill(); ctx.restore();
    txt(String(i + 1), x, y - 5, { size: 34, w: 800, a: p.a });
    txt(s, x + 50, y, { size: 50, w: 700, align: 'left', a: p.a });
  });
  let p = pop(t, w(0), null); txt('every 0.01 m² of CdA', 540, 322 + p.dy, { size: 54, w: 700, f: F.U, a: p.a, ls: -2 });
  let q = popS(t, w(3), null, 0.7); txt('8.5 W saved', 540, 436 + q.dy, { size: 100, w: 800, f: F.U, c: C.pu, a: q.a, s: q.s, ls: -3 });
  p = pop(t, w(3) + 0.25, null); txt('at 40 km/h', 540, 498 + p.dy, { size: 40, w: 700, c: C.muted, a: p.a });
  ctx.fillStyle = C.line2; ctx.fillRect(250, 1322 + io.dy, 580, 5);
  frontRider(540, 1322 + io.dy, 0.94, { back: 0, elbows: 0, head: 0 }, C.bg, 0.30);
  frontRider(540, 1322 + io.dy, 0.94, P, C.pu, 1);
  ctx.restore();
}

function sEnd(t, a) {
  const io = actIO(t, a), c = i => cs('end', i), out = c(2) - 0.15, fo = { size: 66, w: 700, f: F.U, ls: -2 };
  ctx.save(); ctx.globalAlpha = io.a;
  // „New bike“ a „Extra training“ se přeškrtnou, zůstane „Less of you“
  [['New bike', 350, c(0)], ['Extra training', 446, c(1)]].forEach(([s, y, tin]) => {
    const p = pop(t, tin, out), k = tw(t, tin + 0.22, 0.4), wd = width(s, fo);
    txt(s, 540, y + p.dy, Object.assign({ a: p.a, c: mix(RGB.ink, RGB.muted, k) }, fo));
    if (k > 0 && p.a > 0) { ctx.save(); ctx.globalAlpha *= p.a; ctx.strokeStyle = C.pu; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(540 - wd / 2 - 14, y - 23 + p.dy); ctx.lineTo(540 - wd / 2 - 14 + (wd + 28) * k, y - 23 + p.dy); ctx.stroke(); ctx.restore(); }
  });
  let p = popS(t, c(2), null, 0.7); txt('Less of you', 540, 400 + p.dy, { size: 100, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -3 });
  let q = pop(t, c(3), null); txt('in the wind', 540, 490 + q.dy, { size: 62, w: 700, f: F.U, a: q.a, ls: -2 });
  ctx.fillStyle = C.line2; ctx.fillRect(250, 1322 + io.dy, 580, 5);
  frontRider(540, 1322 + io.dy, 0.94, { back: 0, elbows: 0, head: 0 }, C.bg, 0.30);
  frontRider(540, 1322 + io.dy, 0.94, { back: 1, elbows: 1, head: 1 }, C.pu, 1);
  ctx.restore();
}

// Akt (id ze script.json) → funkce scény. Každý akt musí mít scénu i hodnotu AMBIENT.
const SCENES = { hook: sHook, air: sAir, fixes: sFixes, end: sEnd };
const AMBIENT = { hook: 0.34, air: 0.22, fixes: 0.16, end: 0.16 };
// Která simulovaná proudění video používá a kdy běží.
const FLOWS = {
  rider: { count: 3400, from: () => ACT.air.start, to: () => ACT.air.end },
};
