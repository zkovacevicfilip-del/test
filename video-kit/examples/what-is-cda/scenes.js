'use strict';
// SCÉNY příkladového videa „What is CdA“. Pro nové video přepiš tenhle soubor (a ../script.json).
// Každá scéna je funkce (t, a): t = čas videa v sekundách, a = akt {id, start, end} z časové osy.
// Kreslí se pomůckami z engine/engine.js (txt, rich, pop, popS, pill, arrow, panel, frontRider…),
// jejich popis a pravidla jsou v SABLONA.md. Souřadnice jsou v ploše 1080 × 1920 před zvětšením.

function sHook(t, a) {
  const ex = tw(t, a.end - 0.36, 0.36), c0 = cs('hook', 0), c1 = cs('hook', 1), c2 = cs('hook', 2);
  ctx.save(); ctx.globalAlpha = 1 - ex; ctx.translate(0, -70 * ex);
  let p = popS(t, c0, null, 0.7); txt('99%', 540, 690, { size: 250, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -8 });
  p = pop(t, c0 + 0.22, null); txt('of people', 540, 830 + p.dy, { size: 92, w: 700, f: F.U, a: p.a, ls: -2 });
  p = pop(t, c1, null); txt("don't know what", 540, 960 + p.dy, { size: 78, w: 700, f: F.U, a: p.a, ls: -2 });
  p = popS(t, c2, null, 0.7); txt('CdA', 540, 1180, { size: 230, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -6 });
  p = pop(t, c2 + 0.3, null); txt('means…', 540, 1300 + p.dy, { size: 78, w: 700, f: F.U, a: p.a, ls: -2 });
  ctx.restore();
}

function sRider(t, a) {
  const io = actIO(t, a), s0 = cs('air', 1), mv = tw(t, s0 - 0.25, 0.9);
  ctx.save(); ctx.globalAlpha = io.a;
  panel(FLOW.rider, lerp(905, 1052, mv) + io.dy, lerp(750, 640, mv), 1);
  // nadpis: CdA rozhoduje
  let p = popS(t, cs('decides', 1), s0 - 0.3); txt('CdA', 540, 380 + p.dy, { size: 170, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -5 });
  let q = pop(t, cs('decides', 2), s0 - 0.3); txt('decides how fast you go', 540, 468 + q.dy, { size: 52, w: 700, a: q.a });
  // 85 %
  p = popS(t, s0, null, 0.7); const n = Math.round(85 * tw(t, s0, 1.0, E.quint));
  txt(n + '%', 540, 470, { size: 240, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -7 });
  q = pop(t, cs('air', 2) - 0.15, null); txt('of your effort fights the air', 540, 556 + q.dy, { size: 50, w: 700, a: q.a });
  const b = tw(t, cs('air', 3) - 0.2, 1.0), ba = clamp((t - (cs('air', 3) - 0.2)) / 0.2);
  if (ba > 0) {
    ctx.save(); ctx.globalAlpha *= ba; ctx.fillStyle = C.line2; ctx.beginPath(); ctx.roundRect(110, 606, 860, 26, 13); ctx.fill();
    ctx.fillStyle = C.pu; ctx.beginPath(); ctx.roundRect(110, 606, Math.max(26, 860 * 0.85 * b), 26, 13); ctx.fill();
    txt('AIR 85%', 110, 678, { size: 30, w: 800, align: 'left', c: C.pu, ls: 2 }); txt('ROLLING 15%', 970, 678, { size: 30, w: 800, align: 'right', c: C.muted, ls: 2 });
    txt('flat road · 40 km/h', 540, 678, { size: 28, w: 600, c: C.muted }); ctx.restore();
  }
  ctx.restore();
}

function sShapes(t, a) {
  const io = actIO(t, a), m = tw(t, L.smooth.start - 0.2, 0.9), d = tw(t, L.smooth.start - 0.05, 0.85);
  const cyC = lerp(880, 672, m) + io.dy, hC = lerp(621, 441, m), cyD = 1152 + (1 - d) * 300 + io.dy;
  ctx.save(); ctx.globalAlpha = io.a;
  const w3 = cs('smooth', 3), dim = tw(t, w3, 0.6) * (1 - tw(t, L.cd.start - 0.2, 0.3));
  const marker = x => (g, cropY) => { if (dim <= 0) return; const yc = FLOW.cyl.m.shape.cy * 3 - cropY, r = 69 * dim; g.save(); g.globalAlpha = clamp(dim * 2); g.strokeStyle = C.pu; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, yc - r); g.lineTo(x, yc + r); g.moveTo(x - 16, yc - r); g.lineTo(x + 16, yc - r); g.moveTo(x - 16, yc + r); g.lineTo(x + 16, yc + r); g.stroke(); g.restore(); };
  panel(FLOW.cyl, cyC, hC, 1, marker(160));
  panel(FLOW.drop, cyD, 441, clamp(d * 1.4), marker(126));
  // rámeček úplavu a štítek
  const wk = tw(t, cs('blunt', 5), 0.6) * (1 - m), wl = popS(t, cs('blunt', 7), L.smooth.start - 0.25);
  if (wk > 0.01) { ctx.save(); ctx.globalAlpha *= wk; ctx.strokeStyle = C.pu; ctx.lineWidth = 4; ctx.setLineDash([14, 12]); ctx.beginPath(); ctx.roundRect(lerp(700, 372, wk), cyC - 150, lerp(60, 680, wk), 300, 34); ctx.stroke(); ctx.restore(); }
  if (wl.a > 0) pill('WAKE = DRAG', 712, cyC - 205 + wl.dy, { a: wl.a, s: wl.s, size: 42, ls: 2 });
  // nadpisy
  let p = pop(t, cs('blunt', 2), L.smooth.start - 0.3); txt('Blunt shape', 540, 420 + p.dy, { size: 84, w: 700, f: F.U, a: p.a, ls: -2 });
  let q = pop(t, cs('blunt', 3), L.smooth.start - 0.3); txt('tears the airflow apart', 540, 492 + q.dy, { size: 46, w: 600, c: C.muted, a: q.a });
  p = pop(t, L.smooth.start + 0.05, w3 - 0.15); txt('Smooth shape', 540, 352 + p.dy, { size: 84, w: 700, f: F.U, a: p.a, ls: -2 });
  const up = tw(t, cs('smooth', 4), 0.6); p = pop(t, w3, L.cd.start - 0.2);
  txt('Same width', 540, lerp(352, 300, up) + p.dy, { size: lerp(84, 50, up), w: 700, f: F.U, a: p.a, c: mix(RGB.ink, RGB.muted, up), ls: -1 });
  p = popS(t, cs('smooth', 4), L.cd.start - 0.2); txt('10× less drag', 540, 398 + p.dy, { size: 90, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -3 });
  p = pop(t, L.cd.start, cs('cd', 2) - 0.12); txt('How slippery is your shape?', 540, 352 + p.dy, { size: 58, w: 700, a: p.a });
  p = popS(t, cs('cd', 2), null); txt('Cd', 540, 352, { size: 170, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -5 });
  q = pop(t, cs('cd', 3), null); txt('drag coefficient', 540, 418 + q.dy, { size: 50, w: 700, a: q.a });
  // popisky panelů
  const tg = clamp(m * 1.3); txt('BLUNT', 112, cyC - hC / 2 + 70, { size: 32, w: 800, align: 'left', c: C.muted, ls: 5, a: tg }); txt('SMOOTH', 112, cyD - 150, { size: 32, w: 800, align: 'left', c: C.muted, ls: 5, a: clamp(d * 1.3) * tg });
  const badge = (pp, y, val, col) => { ctx.save(); ctx.globalAlpha *= pp.a; ctx.fillStyle = 'rgba(23,25,27,0.86)'; ctx.beginPath(); ctx.roundRect(672, y - 62, 316, 88, 26); ctx.fill(); ctx.restore(); rich([['Cd ', C.muted], [val, col]], 830, y + 2, { size: 54, w: 700, f: F.U, a: pp.a, ls: -2 }); };
  p = pop(t, cs('cd', 2) + 0.15, null); badge(p, cyC - hC / 2 + 104 + p.dy, '~1.2', C.ink);
  q = pop(t, cs('cd', 2) + 0.4, null); badge(q, cyD - 116 + q.dy, '~0.1', C.pu);
  ctx.restore();
}

function sArea(t, a) {
  const io = actIO(t, a), tA = cs('area', 1) - 0.5, fillK = tw(t, cs('area', 1) - 0.1, 0.8), pulse = Math.sin(Math.PI * clamp((t - cs('area', 2)) / 0.7)) * 0.045;
  ctx.save(); ctx.globalAlpha = io.a;
  let p = popS(t, tA, null); txt('A', 540, 392, { size: 230, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s });
  let q = pop(t, cs('area', 1), null); txt('frontal area', 540, 470 + q.dy, { size: 56, w: 700, a: q.a });
  ctx.fillStyle = C.line2; ctx.fillRect(250, 1322 + io.dy, 580, 5);
  frontRider(540, 1322 + io.dy, 0.94 + pulse, { back: 0, elbows: 0, head: 0 }, mix(RGB.surf, RGB.pu, fillK), 1);
  q = popS(t, cs('area', 2), null); if (q.a > 0) { ctx.save(); ctx.globalAlpha *= q.a; ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(735, 700); ctx.lineTo(690, 760); ctx.stroke(); ctx.restore(); pill('what the wind sees', 790, 664, { a: q.a, s: q.s, size: 36, bg: C.ink, c: C.bg, ls: 0 }); }
  ctx.restore();
}

function sEq(t, a) {
  const io = actIO(t, a), p1 = cs('cda', 0), tm = cs('cda', 1) + 0.5, k = tw(t, tm, 0.75), fo = { size: 200, w: 800, f: F.U, ls: -5 }, y = 830 + io.dy;
  ctx.save(); ctx.globalAlpha = io.a;
  const wCd = width('Cd', fo), wA = width('A', fo), wAll = width('CdA', fo), xCd = lerp(290, 540 - wAll / 2 + wCd / 2, k), xA = lerp(800, 540 + wAll / 2 - wA / 2, k), col = mix(RGB.ink, RGB.pu, k), sc = lerp(1, 1.2, k);
  ctx.save(); ctx.translate(540, y - 70); ctx.scale(sc, sc); ctx.translate(-540, -(y - 70));
  let p = popS(t, p1, null); txt('Cd', xCd, y, Object.assign({}, fo, { c: col, a: p.a, s: p.s }));
  p = popS(t, p1 + 0.3, null); txt('A', xA, y, Object.assign({}, fo, { c: col, a: p.a, s: p.s }));
  p = popS(t, p1 + 0.15, null); txt('×', 594, y - 22, { size: 130, w: 700, f: F.U, c: C.muted, a: p.a * (1 - clamp(k * 2.2)), s: p.s * (1 - 0.5 * k) });
  ctx.restore();
  let q = pop(t, p1 + 0.25, tm - 0.1); txt('shape', 290, y + 86 + q.dy, { size: 46, w: 700, c: C.muted, a: q.a });
  q = pop(t, p1 + 0.45, tm - 0.1); txt('size', 800, y + 86 + q.dy, { size: 46, w: 700, c: C.muted, a: q.a });
  q = pop(t, tm + 0.3, null); txt('drag area  ·  m²', 540, y + 112 + q.dy, { size: 50, w: 700, c: C.muted, a: q.a });
  // lower CdA → less drag → more speed
  const fs = { size: 38, w: 800 }, parts = ['lower CdA', 'less drag', 'more speed'], ws = parts.map(s => width(s, fs)), gap = 66, tot = ws.reduce((x, w) => x + w, 0) + 2 * gap; let x = 540 - tot / 2;
  parts.forEach((s, i) => { const r = pop(t, cs('cda', 2 + i), null); txt(s, x, 1150 + r.dy + io.dy, Object.assign({ align: 'left', a: r.a, c: i === 0 ? C.pu : C.ink }, fs)); x += ws[i]; if (i < 2) { const ar = pop(t, cs('cda', 3 + i) - 0.1, null); arrow(x + 14, 1137 + io.dy, gap - 28, C.muted, ar.a); x += gap; } });
  ctx.restore();
}

function sRace(t, a) {
  const io = actIO(t, a), c = i => cs('speed', i), y1 = 800 + io.dy, y2 = 1110 + io.dy, X0 = 130, X1 = 950, T0 = c(2) + 0.1, T1 = c(4) + 0.35;
  const q = E.io(clamp((t - T0) / (T1 - T0))), pf = q, ps = q * (37.85 / 40.08);
  ctx.save(); ctx.globalAlpha = io.a;
  // nadpis se střídá: 250 W → +2.2 km/h → −3.5 min
  let p = popS(t, c(1), c(3) - 0.15); txt('250 W', 540, 392 + p.dy, { size: 150, w: 800, f: F.U, a: p.a, s: p.s, ls: -4 });
  let s = pop(t, c(0), c(3) - 0.15); txt('same rider · same power', 540, 470 + s.dy, { size: 46, w: 700, c: C.muted, a: s.a });
  p = popS(t, c(3), c(4) - 0.15); txt('+2.2 km/h', 540, 392 + p.dy, { size: 128, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -4 });
  s = pop(t, c(3) + 0.15, c(4) - 0.15); txt('just from lower CdA', 540, 470 + s.dy, { size: 46, w: 700, c: C.muted, a: s.a });
  p = popS(t, c(4), null); txt('3.5 min', 540, 392 + p.dy, { size: 150, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -4 });
  s = pop(t, c(5), null); txt('faster over 40 km', 540, 470 + s.dy, { size: 46, w: 700, c: C.muted, a: s.a });
  // cílová čára
  const fa = tw(t, c(2), 0.6); ctx.save(); ctx.globalAlpha *= fa; ctx.strokeStyle = C.muted; ctx.lineWidth = 4; ctx.setLineDash([12, 12]); ctx.beginPath(); ctx.moveTo(X1, y1 - 150); ctx.lineTo(X1, y2 + 108); ctx.stroke(); ctx.restore();
  txt('40 km', X1, y2 + 150, { size: 32, w: 800, c: C.muted, a: fa, align: 'right', ls: 1 });
  [[y1, ps, '0.30', C.ink, RGB.ink, 37.8, 0], [y2, pf, '0.25', C.pu, RGB.pu, 40.1, 0.12]].forEach(([y, pr, cda, col, rgb, v, dl]) => {
    const e = pop(t, c(0) + dl, null), x = X0 + (X1 - X0 - 150) * pr + 150;
    ctx.save(); ctx.globalAlpha *= e.a; ctx.translate(0, e.dy);
    ctx.lineCap = 'round'; ctx.strokeStyle = C.line2; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(X1, y); ctx.stroke();
    ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(Math.max(X0 + 1, x - 20), y); ctx.stroke();
    rich([['CdA ', C.muted], [cda, col]], X0 + 118, y + 70, { size: 46, w: 800 });
    const va = pop(t, c(3) + dl, null), vv = lerp(30, v, tw(t, c(3) + dl, 0.9, E.quint)); txt(vv.toFixed(1) + ' km/h', X1 - 26, y + 70 + va.dy, { size: 46, w: 800, align: 'right', c: col, a: va.a });
    const sc = 0.44; ctx.drawImage(riderImg, x - 429 * sc, y - 4 - 414 * sc, 512 * sc, 512 * sc);
    ctx.restore();
  });
  // rozdíl v cíli
  const g = popS(t, c(4) + 0.5, null), xs = X0 + (X1 - X0 - 150) * ps + 150;
  if (g.a > 0) { ctx.save(); ctx.globalAlpha *= g.a; ctx.strokeStyle = C.pu; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(xs + 6, y1 - 140); ctx.lineTo(X1 - 6, y1 - 140); ctx.moveTo(xs + 6, y1 - 154); ctx.lineTo(xs + 6, y1 - 126); ctx.moveTo(X1 - 6, y1 - 154); ctx.lineTo(X1 - 6, y1 - 126); ctx.stroke(); ctx.restore(); pill('3.5 min behind', X1 - 150, y1 - 206, { a: g.a, s: g.s, size: 36, ls: 0 }); }
  ctx.restore();
}

function sTuck(t, a) {
  const io = actIO(t, a), c = i => cs('tuck', i), out = c(3) - 0.15;
  const P = { back: tw(t, c(0) + 0.1, 1.0), elbows: tw(t, c(1) + 0.1, 1.0), head: tw(t, c(2) + 0.1, 1.0) };
  ctx.save(); ctx.globalAlpha = io.a;
  ['Lower your back', 'Narrow your elbows', 'Tuck your head'].forEach((s, i) => {
    const p = pop(t, c(i), out), y = 300 + i * 78 + p.dy, x = 300 - (1 - p.k) * 70;
    ctx.save(); ctx.globalAlpha *= p.a; ctx.fillStyle = C.pu; ctx.beginPath(); ctx.arc(x, y - 17, 24, 0, 7); ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x - 10, y - 17); ctx.lineTo(x - 2, y - 8); ctx.lineTo(x + 11, y - 26); ctx.stroke(); ctx.restore();
    txt(s, x + 46, y, { size: 50, w: 700, align: 'left', a: p.a });
  });
  let p = pop(t, c(3), null); txt('−0.01 m² of CdA', 540, 322 + p.dy, { size: 62, w: 700, f: F.U, a: p.a, ls: -2 });
  let q = popS(t, c(4), null); txt('~8 W saved', 540, 432 + q.dy, { size: 104, w: 800, f: F.U, c: C.pu, a: q.a, s: q.s, ls: -3 });
  p = pop(t, c(4) + 0.25, null); txt('at 40 km/h', 540, 496 + p.dy, { size: 40, w: 700, c: C.muted, a: p.a });
  ctx.fillStyle = C.line2; ctx.fillRect(250, 1322 + io.dy, 580, 5);
  frontRider(540, 1322 + io.dy, 0.94, { back: 0, elbows: 0, head: 0 }, C.bg, 0.30);
  frontRider(540, 1322 + io.dy, 0.94, P, C.pu, 1);
  ctx.restore();
}

// Akt (id ze script.json) → funkce scény. Každý akt musí mít scénu i hodnotu AMBIENT.
const SCENES = { hook: sHook, rider: sRider, shapes: sShapes, area: sArea, equation: sEq, race: sRace, tuck: sTuck };
// Jak silně je v aktu vidět proud vzduchu v pozadí (0 až 0,5).
const AMBIENT = { hook: 0.34, rider: 0.22, shapes: 0.22, area: 0.16, equation: 0.4, race: 0.13, tuck: 0.16 };
// Která simulovaná proudění video používá a kdy běží (rider, cyl, drop jsou připravená v sim/).
const FLOWS = {
  rider: { count: 3400, from: () => ACT.rider.start, to: () => ACT.rider.end },
  cyl: { count: 3000, from: () => ACT.shapes.start, to: () => ACT.shapes.end },
  drop: { count: 3000, from: () => L.smooth.start, to: () => ACT.shapes.end },
};
