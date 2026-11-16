'use strict';
// SCÉNY krátkého videa „What if the weaker rider wins“ (asi 26 s). Hook: „What if…“ + výsledek, který nedává smysl, dokud se nevysvětlí.
// Čísla: tools/physics.py (84 kg s kolem, rovina, 40 km): 280 W a CdA 0,32 = 38,6 km/h, 62:09;
// 250 W a CdA 0,25 = 40,0 km/h, 59:56. Rozdíl 2 min 13 s. Výkon na plochu odporu: 280 / 0,32 = 875 W/m², 250 / 0,25 = 1000 W/m².

// úvodní „what IF“ ve stylu loga aplikace: bílé „what“, fialové „IF“
function whatIf(t, tin, y) { const p = popS(t, tin, null, 0.7); rich([['what', C.ink], ['IF', C.pu]], 540, y, { size: 170, w: 800, f: F.U, a: p.a, s: p.s, ls: -5 }); }

function sHook(t, a) {
  const ex = tw(t, a.end - 0.36, 0.36), c = i => cs('hook', i);
  ctx.save(); ctx.globalAlpha = 1 - ex; ctx.translate(0, -70 * ex);
  whatIf(t, c(0), 480);
  let p = pop(t, c(1), null); txt('the weaker rider', 540, 650 + p.dy, { size: 64, w: 700, f: F.U, a: p.a, ls: -2 });
  p = popS(t, c(2), null, 0.7); txt('wins?', 540, 860, { size: 210, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -7 });
  p = pop(t, c(3), null); txt('30 watts less.', 540, 1060 + p.dy, { size: 62, w: 700, f: F.U, a: p.a, ls: -2 });
  p = pop(t, c(4), null); txt('2 minutes ahead.', 540, 1160 + p.dy, { size: 62, w: 700, f: F.U, c: C.pu, a: p.a, ls: -2 });
  ctx.restore();
}

function sRace(t, a) {
  const io = actIO(t, a), s = i => cs('setup', i), r = i => cs('result', i), y1 = 800 + io.dy, y2 = 1110 + io.dy, X0 = 130, X1 = 950;
  const T0 = s(5) + 0.3, T1 = r(3) + 0.2, q = E.io(clamp((t - T0) / (T1 - T0))), pf = q, ps = q * (38.61 / 40.04);
  const hA = s(3) - 0.15, hB = r(0) - 0.15, hC = r(3) - 0.15;
  ctx.save(); ctx.globalAlpha = io.a;
  // nadpis se střídá: 280 W → 250 W → 40 km → 2:13
  let p = popS(t, s(1), hA); txt('280 W', 540, 392 + p.dy, { size: 150, w: 800, f: F.U, a: p.a, s: p.s, ls: -4 });
  let u = pop(t, s(2), hA); txt('rider one · sitting up', 540, 470 + u.dy, { size: 46, w: 700, c: C.muted, a: u.a });
  p = popS(t, s(4), hB); txt('250 W', 540, 392 + p.dy, { size: 150, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -4 });
  u = pop(t, s(3), hB); txt('rider two · low and narrow', 540, 470 + u.dy, { size: 46, w: 700, a: u.a });
  p = popS(t, r(0), hC); txt('40 km', 540, 392 + p.dy, { size: 150, w: 800, f: F.U, a: p.a, s: p.s, ls: -4 });
  u = pop(t, r(1), hC); txt('who gets there first?', 540, 470 + u.dy, { size: 46, w: 700, c: C.muted, a: u.a });
  p = popS(t, r(3), null); txt('2:13', 540, 392 + p.dy, { size: 170, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -5 });
  u = pop(t, r(3) + 0.3, null); txt('ahead · with 30 W less', 540, 470 + u.dy, { size: 46, w: 700, a: u.a });
  // cílová čára
  const fa = tw(t, s(0), 0.6); ctx.save(); ctx.globalAlpha *= fa; ctx.strokeStyle = C.muted; ctx.lineWidth = 4; ctx.setLineDash([12, 12]); ctx.beginPath(); ctx.moveTo(X1, y1 - 150); ctx.lineTo(X1, y2 + 108); ctx.stroke(); ctx.restore();
  txt('40 km', X1, y2 + 150, { size: 32, w: 800, c: C.muted, a: fa, align: 'right', ls: 1 });
  [[y1, ps, '280 W', '0.32', C.ink, 38.6, s(0), s(1)], [y2, pf, '250 W', '0.25', C.pu, 40.0, s(3), s(4)]].forEach(([y, pr, watts, cda, col, v, tin, tlab]) => {
    const e = pop(t, tin, null), x = X0 + (X1 - X0 - 150) * pr + 150;
    ctx.save(); ctx.globalAlpha *= e.a; ctx.translate(0, e.dy);
    ctx.lineCap = 'round'; ctx.strokeStyle = C.line2; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(X1, y); ctx.stroke();
    ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(Math.max(X0 + 1, x - 20), y); ctx.stroke();
    const la = pop(t, tlab, null); rich([[watts, col], ['  ·  CdA ' + cda, C.muted]], X0 + 190, y + 70 + la.dy, { size: 42, w: 800, a: la.a });
    const va = pop(t, T0, null), vv = lerp(30, v, tw(t, T0, 0.9, E.quint)); txt(vv.toFixed(1) + ' km/h', X1 - 26, y + 70 + va.dy, { size: 42, w: 800, align: 'right', c: col, a: va.a });
    const sc = 0.44; ctx.drawImage(riderImg, x - 429 * sc, y - 4 - 414 * sc, 512 * sc, 512 * sc);
    ctx.restore();
  });
  // rozdíl v cíli
  const g = popS(t, T1 + 0.1, null), xs = X0 + (X1 - X0 - 150) * ps + 150;
  if (g.a > 0) { ctx.save(); ctx.globalAlpha *= g.a; ctx.strokeStyle = C.pu; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(xs + 6, y1 - 140); ctx.lineTo(X1 - 6, y1 - 140); ctx.moveTo(xs + 6, y1 - 154); ctx.lineTo(xs + 6, y1 - 126); ctx.moveTo(X1 - 6, y1 - 154); ctx.lineTo(X1 - 6, y1 - 126); ctx.stroke(); ctx.restore(); pill('2:13 behind', X1 - 140, y1 - 206, { a: g.a, s: g.s, size: 36, ls: 0 }); }
  ctx.restore();
}

function sWhy(t, a) {
  const io = actIO(t, a), w = i => cs('why', i), m = i => cs('more', i), c = i => cs('tip', i), dy = io.dy;
  const h1 = w(2) - 0.15, h2 = c(0) - 0.2, h3 = c(2) - 0.15, rows = 1 - tw(t, c(0) - 0.3, 0.3);
  const P = { back: tw(t, c(2), 1.0), elbows: tw(t, c(2) + 0.3, 1.0), head: tw(t, c(2) + 0.15, 1.0) };
  ctx.save(); ctx.globalAlpha = io.a;
  // nadpis: not watts → watts ÷ CdA → +30 W = months → your position, this week
  let q = pop(t, w(0), h1); txt('Speed', 540, 350 + q.dy, { size: 70, w: 700, f: F.U, a: q.a, ls: -2 });
  let p = popS(t, w(1), h1, 0.7); txt("isn't about watts", 540, 462 + p.dy, { size: 76, w: 800, f: F.U, a: p.a, s: p.s, ls: -3 });
  p = popS(t, w(2), h2, 0.7); rich([['watts', C.ink], [' ÷ ', C.muted], ['CdA', C.pu]], 540, 410 + p.dy, { size: 104, w: 800, f: F.U, a: p.a, s: p.s, ls: -3 });
  q = pop(t, w(3), h2); txt('power per drag area', 540, 490 + q.dy, { size: 48, w: 700, c: C.muted, a: q.a });
  p = popS(t, c(1), h3, 0.7); txt('+30 W', 540, 420 + p.dy, { size: 170, w: 800, f: F.U, a: p.a, s: p.s, ls: -5 });
  q = pop(t, c(0), h3); txt('months of training', 540, 500 + q.dy, { size: 48, w: 700, c: C.muted, a: q.a });
  q = pop(t, c(2), null); txt('Or your position', 540, 360 + q.dy, { size: 66, w: 700, f: F.U, a: q.a, ls: -2 });
  p = popS(t, c(4), null, 0.7); txt('this week', 540, 486 + p.dy, { size: 120, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -4 });
  // dva řádky: watty dělené plochou odporu
  if (rows > 0.01) {
    ctx.save(); ctx.globalAlpha *= rows;
    [[760, 'Rider one', '280 W ÷ 0.32', 875, C.ink, w(2) + 0.25], [1010, 'Rider two', '250 W ÷ 0.25', 1000, C.pu, w(3)]].forEach(([y0, name, calc, val, col, tin]) => {
      const e = pop(t, tin, null), k = tw(t, tin + 0.1, 1.0, E.quint), y = y0 + dy + e.dy * 0.6;
      if (e.a <= 0) return;
      txt(name, 110, y, { size: 46, w: 700, align: 'left', a: e.a }); txt(calc, 970, y, { size: 40, w: 700, align: 'right', c: C.muted, a: e.a });
      ctx.save(); ctx.globalAlpha *= e.a; ctx.fillStyle = C.line2; ctx.beginPath(); ctx.roundRect(110, y + 30, 860, 28, 14); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(110, y + 30, Math.max(28, 860 * val / 1000 * k), 28, 14); ctx.fill(); ctx.restore();
      txt(String(Math.round(val * k)), 110, y + 150, { size: 84, w: 800, f: F.U, c: col, align: 'left', a: e.a, ls: -3 });
      txt('W PER M² OF DRAG AREA', 968, y + 140, { size: 26, w: 800, c: C.muted, ls: 3, align: 'right', a: e.a });
    });
    const pl = popS(t, m(1), null); if (pl.a > 0) pill('less power · more speed', 660, 1230 + dy + pl.dy, { a: pl.a, s: pl.s, size: 36, ls: 0 });
    ctx.restore();
  }
  // jezdec, který se skládá do nižší pozice
  const ra = 1 - rows;
  if (ra > 0.01) {
    ctx.save(); ctx.globalAlpha *= ra; ctx.fillStyle = C.line2; ctx.fillRect(250, 1322 + dy, 580, 5);
    frontRider(540, 1322 + dy, 0.94, { back: 0, elbows: 0, head: 0 }, C.bg, 0.30);
    frontRider(540, 1322 + dy, 0.94, P, mix(RGB.surf, RGB.pu, tw(t, c(2), 0.8)), 1); ctx.restore();
  }
  ctx.restore();
}

// Akt (id ze script.json) → funkce scény. Každý akt musí mít scénu i hodnotu AMBIENT.
const SCENES = { hook: sHook, race: sRace, why: sWhy };
const AMBIENT = { hook: 0.34, race: 0.13, why: 0.2 };
// Tohle video nepoužívá žádné simulované proudění, jen jemný proud v pozadí.
const FLOWS = {};
