'use strict';
// SCÉNY krátkého videa „Why 40 km/h feels brutal“ (asi 30 s). Hook: otázka, na kterou zná odpověď každý jezdec.
// Čísla: tools/physics.py (84 kg s kolem, CdA 0,30, rovina): 30 km/h = 135 W, 40 km/h = 292 W, tedy 2,2×.

function sHook(t, a) {
  const ex = tw(t, a.end - 0.36, 0.36), c = i => cs('hook', i);
  ctx.save(); ctx.globalAlpha = 1 - ex; ctx.translate(0, -70 * ex);
  let p = pop(t, c(0), null); txt('Why does', 540, 520 + p.dy, { size: 84, w: 700, f: F.U, a: p.a, ls: -2 });
  p = popS(t, c(1), null, 0.7); txt('40', 540, 800, { size: 300, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -10 });
  p = pop(t, c(1) + 0.22, null); txt('km/h', 540, 900 + p.dy, { size: 84, w: 700, f: F.U, c: C.pu, a: p.a, ls: -2 });
  p = pop(t, c(2), null); txt('feel twice as hard', 540, 1050 + p.dy, { size: 60, w: 700, f: F.U, a: p.a, ls: -2 });
  p = popS(t, c(3), null, 0.7); txt('as 30?', 540, 1230, { size: 150, w: 800, f: F.U, a: p.a, s: p.s, ls: -5 });
  ctx.restore();
}

function sWatts(t, a) {
  const io = actIO(t, a), w = i => cs('watts', i), base = 1290 + io.dy, HM = 590, out = w(0) - 0.3;
  ctx.save(); ctx.globalAlpha = io.a;
  // „Because it is! … even worse“ velké uprostřed
  let p = popS(t, L.because.start, out); txt('Because', 540, 740 + p.dy, { size: 120, w: 800, f: F.U, a: p.a, s: p.s, ls: -4 });
  p = popS(t, L.because.start + 0.18, out); txt('it is!', 540, 890 + p.dy, { size: 120, w: 800, f: F.U, a: p.a, s: p.s, ls: -4 });
  let q = pop(t, cs('because', 1), out); txt('Actually…', 540, 1030 + q.dy, { size: 54, w: 700, c: C.muted, a: q.a });
  p = popS(t, cs('because', 1) + 0.45, out); txt('even worse.', 540, 1140 + p.dy, { size: 88, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -3 });
  // nadpis nad grafem
  const sw = w(4) + 0.45;
  p = pop(t, w(0), sw - 0.2); txt('Power you need', 540, 390 + p.dy, { size: 76, w: 700, f: F.U, a: p.a, ls: -2 });
  q = pop(t, w(0) + 0.2, sw - 0.2); txt('same rider · flat road', 540, 466 + q.dy, { size: 46, w: 700, c: C.muted, a: q.a });
  p = popS(t, sw, null, 0.7); txt('2.2×', 540, 410 + p.dy, { size: 190, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -6 });
  q = pop(t, sw + 0.25, null); txt('the power for 33% more speed', 540, 486 + q.dy, { size: 46, w: 700, a: q.a });
  // dva sloupce: 30 km/h a 40 km/h
  const ga = clamp((t - (w(0) - 0.15)) / 0.2);
  if (ga > 0) {
    ctx.save(); ctx.globalAlpha *= ga; ctx.fillStyle = C.line2; ctx.fillRect(170, base, 740, 5); ctx.restore();
    [[330, 135, w(0), w(2), C.ink, '30 km/h'], [750, 292, w(3), w(4), C.pu, '40 km/h']].forEach(([x, watts, tin, tnum, col, label]) => {
      const k = tw(t, tin, 1.1, E.quint), h = Math.max(4, HM * watts / 292 * k), la = pop(t, tin, null), n = popS(t, tnum, null);
      ctx.save(); ctx.globalAlpha *= clamp((t - tin) / 0.15); ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x - 105, base - h, 210, h, [20, 20, 0, 0]); ctx.fill(); ctx.restore();
      txt(label, x, base + 62 + la.dy * 0.4, { size: 46, w: 800, c: col, a: la.a });
      txt(Math.round(watts * tw(t, tnum, 0.8, E.quint)) + ' W', x, base - h - 26, { size: 70, w: 800, f: F.U, c: col, a: n.a, s: n.s, ls: -2 });
    });
  }
  ctx.restore();
}

function sCube(t, a) {
  const io = actIO(t, a), c = i => cs('cube', i), X0 = 180, X1 = 900, Y0 = 1290 + io.dy, HH = 620, ph2 = c(4) - 0.2;
  const pt = k => [lerp(X0, X1, k), Y0 - HH * k * k * k];
  ctx.save(); ctx.globalAlpha = io.a;
  // nadpis: speed³ → 2× speed = 8× power
  let q = pop(t, c(0), ph2); txt('power to beat the air', 540, 318 + q.dy, { size: 46, w: 700, c: C.muted, a: q.a });
  let p = popS(t, c(3), ph2, 0.7); txt('speed³', 540, 470 + p.dy, { size: 160, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -5 });
  q = pop(t, c(4), null); txt('2× the speed', 540, 362 + q.dy, { size: 70, w: 700, f: F.U, a: q.a, ls: -2 });
  p = popS(t, c(5), null, 0.7); txt('8× the power', 540, 482 + p.dy, { size: 96, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -3 });
  // osy
  ctx.strokeStyle = C.line2; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(X0, Y0 - HH - 40); ctx.lineTo(X0, Y0); ctx.lineTo(X1 + 50, Y0); ctx.stroke();
  txt('POWER', X0 + 24, Y0 - HH - 14, { size: 30, w: 800, c: C.muted, ls: 4, align: 'left' });
  txt('SPEED', X0, Y0 + 52, { size: 30, w: 800, c: C.muted, ls: 4, align: 'left' });
  // křivka výkonu (třetí mocnina rychlosti)
  const g = tw(t, c(2) - 0.15, 1.5, E.quint);
  if (g > 0.001) {
    ctx.strokeStyle = C.pu; ctx.lineWidth = 10; ctx.beginPath();
    for (let i = 0; i <= 60; i++) { const s = pt(g * i / 60); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); }
    ctx.stroke();
  }
  // body: poloviční a plná rychlost
  [[0.5, c(4) + 0.15, '1×', C.ink, C.bg, 0, -66], [1, c(5), '8×', C.pu, C.ink, -96, -4]].forEach(([k, tin, label, bg, fg, dx, dy]) => {
    const m = popS(t, tin, null), s = pt(k), d = tw(t, tin, 0.6);
    if (m.a <= 0) return;
    ctx.save(); ctx.globalAlpha *= m.a; ctx.strokeStyle = C.muted; ctx.lineWidth = 4; ctx.setLineDash([10, 12]); ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(s[0], lerp(s[1], Y0, d)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(s[0], s[1], 17 * m.s, 0, 7); ctx.fill(); ctx.restore();
    pill(label, s[0] + dx, s[1] + dy, { a: m.a, s: m.s, size: 44, bg, c: fg, ls: 0 });
    txt(k === 1 ? '2× speed' : '1× speed', s[0], Y0 + 52, { size: 32, w: 800, c: k === 1 ? C.ink : C.muted, a: m.a, align: k === 1 ? 'right' : 'center' });
  });
  ctx.restore();
}

function sTip(t, a) {
  const io = actIO(t, a), c = i => cs('tip', i), fo = { size: 80, w: 700, f: F.U, ls: -2 };
  const P = { back: tw(t, c(3), 1.0), elbows: tw(t, c(3) + 0.3, 1.0), head: tw(t, c(3) + 0.15, 1.0) };
  ctx.save(); ctx.globalAlpha = io.a;
  // „Push harder“ se přeškrtne, nahradí ho „Get smaller“
  let p = pop(t, c(0), c(2) - 0.15); txt('Push harder', 540, 410 + p.dy, Object.assign({ a: p.a }, fo));
  const sk = tw(t, c(1), 0.45), wd = width('Push harder', fo);
  if (sk > 0 && p.a > 0) { ctx.save(); ctx.globalAlpha *= p.a; ctx.strokeStyle = C.pu; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(540 - wd / 2 - 16, 382 + p.dy); ctx.lineTo(540 - wd / 2 - 16 + (wd + 32) * sk, 382 + p.dy); ctx.stroke(); ctx.restore(); }
  p = popS(t, c(2), null, 0.7); txt('Get smaller', 540, 400 + p.dy, { size: 94, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -3 });
  let q = pop(t, c(4), null); txt('same watts · more speed', 540, 484 + q.dy, { size: 50, w: 700, a: q.a });
  ctx.fillStyle = C.line2; ctx.fillRect(250, 1322 + io.dy, 580, 5);
  frontRider(540, 1322 + io.dy, 0.94, { back: 0, elbows: 0, head: 0 }, C.bg, 0.30);
  frontRider(540, 1322 + io.dy, 0.94, P, C.pu, 1);
  ctx.restore();
}

// Akt (id ze script.json) → funkce scény. Každý akt musí mít scénu i hodnotu AMBIENT.
const SCENES = { hook: sHook, watts: sWatts, cube: sCube, tip: sTip };
const AMBIENT = { hook: 0.34, watts: 0.2, cube: 0.2, tip: 0.16 };
// Tohle video nepoužívá žádné simulované proudění, jen jemný proud v pozadí.
const FLOWS = {};
