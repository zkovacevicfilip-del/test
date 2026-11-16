'use strict';
// SCÉNY krátkého videa „What if the rider on your wheel makes you faster“ (asi 25 s). Hook: „What if…“ + tvrzení proti intuici.
// Čísla z literatury: Blocken a kol. 2013 (CFD dvou jezdců těsně za sebou, ověřeno ve větrném tunelu):
// jezdec vzadu má o 27 % menší odpor (vzpřímená pozice; v časovkářské asi 14 %), jezdec vpředu o 0,8 až 2,6 %.
// Watty: tools/physics.py (84 kg s kolem, CdA 0,30, 40 km/h): sólo 292 W, s o 27 % menším odporem 223 W, tedy asi 69 W.

// úvodní „what IF“ ve stylu loga aplikace: bílé „what“, fialové „IF“
function whatIf(t, tin, y) { const p = popS(t, tin, null, 0.7); rich([['what', C.ink], ['IF', C.pu]], 540, y, { size: 170, w: 800, f: F.U, a: p.a, s: p.s, ls: -5 }); }

// jezdec z boku čelem doleva (vítr fouká zleva jako v panelu s prouděním); x0 = levý okraj obrázku, zem = spodek kol
function sideRider(x0, ground, sc, alpha) {
  if (alpha <= 0) return; ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x0 + 512 * sc, ground - 414 * sc); ctx.scale(-sc, sc); ctx.drawImage(riderImg, 0, 0, 512, 512); ctx.restore();
}

function sHook(t, a) {
  const ex = tw(t, a.end - 0.36, 0.36), c = i => cs('hook', i);
  ctx.save(); ctx.globalAlpha = 1 - ex; ctx.translate(0, -70 * ex);
  whatIf(t, c(0), 540);
  let p = pop(t, c(1), null); txt('the rider', 540, 720 + p.dy, { size: 80, w: 700, f: F.U, a: p.a, ls: -2 });
  p = pop(t, c(2), null); txt('sitting on your wheel', 540, 806 + p.dy, { size: 52, w: 700, f: F.U, a: p.a, ls: -2 });
  p = pop(t, c(3), null); txt('is actually', 540, 960 + p.dy, { size: 54, w: 700, f: F.U, c: C.muted, a: p.a, ls: -2 });
  p = pop(t, c(4), null); txt('making you', 540, 1060 + p.dy, { size: 70, w: 700, f: F.U, a: p.a, ls: -2 });
  p = popS(t, c(4) + 0.3, null, 0.7); txt('faster?', 540, 1226, { size: 160, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -5 });
  ctx.restore();
}

function sWake(t, a) {
  const io = actIO(t, a), w = i => cs('wake', i), cy = 960 + io.dy, h1 = w(0) - 0.2, h2 = w(3) - 0.15;
  ctx.save(); ctx.globalAlpha = io.a;
  // druhý jezdec vjede zprava těsně za prvního (kreslí se do panelu ve stejném měřítku jako první)
  const jn = tw(t, w(3) - 0.1, 1.1, E.quint), ja = clamp((t - (w(3) - 0.1)) / 0.25);
  panel(FLOW.rider, cy, 720, 1, (g, cropY) => {
    if (ja <= 0) return; const sh = FLOW.rider.m.shape;
    g.save(); g.translate(0, -cropY); g.globalAlpha = ja; g.translate((sh.OX + 512 * sh.K) * 3 + 468 + (1 - jn) * 330, sh.OY * 3); g.scale(-3 * sh.K, 3 * sh.K); g.drawImage(riderImg, 0, 0, 512, 512); g.restore();
  });
  // „Sounds wrong. But it's true!“
  let p = popS(t, L.true.start, h1); txt('Sounds wrong.', 540, 380 + p.dy, { size: 78, w: 800, f: F.U, a: p.a, s: p.s, ls: -3 });
  p = popS(t, cs('true', 1), h1, 0.7); txt("But it's true!", 540, 486 + p.dy, { size: 88, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -3 });
  // úplav za jezdcem
  let q = pop(t, w(0), h2); txt('Behind you', 540, 330 + q.dy, { size: 48, w: 700, c: C.muted, a: q.a });
  p = pop(t, w(1), h2); txt('a low-pressure wake', 540, 420 + p.dy, { size: 64, w: 700, f: F.U, a: p.a, ls: -2 });
  q = pop(t, w(2), h2); rich([['it ', C.ink], ['drags you back', C.pu]], 540, 496 + q.dy, { size: 50, w: 700, a: q.a });
  const wk = tw(t, w(1), 0.7) * (1 - tw(t, w(3) - 0.2, 0.4));
  if (wk > 0.01) { ctx.save(); ctx.globalAlpha *= clamp(wk * 2); ctx.strokeStyle = C.pu; ctx.lineWidth = 4; ctx.setLineDash([14, 12]); ctx.beginPath(); ctx.roundRect(lerp(940, 738, wk), cy - 230, lerp(16, 218, wk), 420, 34); ctx.stroke(); ctx.restore(); }
  // jezdec těsně za tebou úplav zčásti vyplní
  p = pop(t, w(3), null); txt('A rider tucked in close', 540, 400 + p.dy, { size: 58, w: 700, f: F.U, a: p.a, ls: -2 });
  q = pop(t, w(4), null); rich([['fills part of ', C.ink], ['your wake', C.pu]], 540, 478 + q.dy, { size: 52, w: 700, a: q.a });
  ctx.restore();
}

// dva jezdci za sebou + ukazatel odporu pod každým; k = 0 až 1 prohodí jejich pořadí (střídání)
function pairRiders(t, dy, k, aL, aF, drag) {
  const G0 = 1090 + dy, SC = 1.0, XL = 102, XF = 455, lift = Math.sin(Math.PI * k) * 70;
  ctx.fillStyle = C.line2; ctx.fillRect(130, G0 + 6, 820, 5);
  sideRider(lerp(XL, XF, k), G0 + lift, SC, aL); sideRider(lerp(XF, XL, k), G0, SC, aF);
  if (!drag) return;
  drag.forEach(([cx, label, pct, col, tin]) => {
    const e = pop(t, tin, null), kk = tw(t, tin + 0.1, 1.0, E.quint), v = lerp(100, pct, kk), y = G0 + 92 + e.dy * 0.5, W0 = 280;
    if (e.a <= 0) return;
    ctx.save(); ctx.globalAlpha *= e.a; ctx.fillStyle = C.line2; ctx.beginPath(); ctx.roundRect(cx - W0 / 2, y, W0, 22, 11); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(cx - W0 / 2, y, W0 * v / 100, 22, 11); ctx.fill(); ctx.restore();
    txt(label, cx, y - 22, { size: 30, w: 800, c: C.muted, ls: 3, a: e.a });
    txt('drag ' + Math.round(v) + '%', cx, y + 76, { size: 46, w: 800, c: col, a: e.a });
  });
}

function sPair(t, a) {
  const io = actIO(t, a), l = i => cs('lead', i), f = i => cs('follow', i), h1 = f(0) - 0.15, h2 = f(3) - 0.15;
  const sw = tw(t, f(0) - 0.1, 0.5);   // pozornost se přesune z předního jezdce na zadního
  ctx.save(); ctx.globalAlpha = io.a;
  let q = pop(t, l(0), h1); txt('You, in front', 540, 350 + q.dy, { size: 60, w: 700, f: F.U, a: q.a, ls: -2 });
  let p = popS(t, l(1), h1, 0.7); txt('2% less drag', 540, 470 + p.dy, { size: 92, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -3 });
  q = pop(t, f(0), h2); txt('The rider behind', 540, 350 + q.dy, { size: 60, w: 700, f: F.U, a: q.a, ls: -2 });
  p = popS(t, f(1), h2, 0.7); txt('27% less drag', 540, 470 + p.dy, { size: 92, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -3 });
  p = popS(t, f(3), null, 0.7); txt('~70 W', 540, 430 + p.dy, { size: 190, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -6 });
  q = pop(t, f(4), null); txt('saved at 40 km/h', 540, 510 + q.dy, { size: 48, w: 700, a: q.a });
  pairRiders(t, io.dy, 0, lerp(1, 0.45, sw), lerp(0.45, 1, sw), [[363, 'YOU', 98, C.ink, l(1)], [716, 'BEHIND YOU', 73, C.pu, f(1)]]);
  ctx.restore();
}

function sTip(t, a) {
  const io = actIO(t, a), c = i => cs('tip', i), g = i => cs('group', i), h1 = c(1) - 0.15, h2 = g(0) - 0.15;
  const k = E.io(clamp((t - c(1)) / (c(3) + 0.5 - c(1))));
  ctx.save(); ctx.globalAlpha = io.a;
  let q = pop(t, c(0), h1); txt("Don't chase them off", 540, 400 + q.dy, { size: 60, w: 700, f: F.U, a: q.a, ls: -2 });
  let p = popS(t, c(1), h2, 0.7); txt('Take turns', 540, 392 + p.dy, { size: 104, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -3 });
  q = pop(t, c(2), h2); txt('stay close · both go faster', 540, 480 + q.dy, { size: 50, w: 700, a: q.a });
  q = pop(t, g(0), null); txt('A group', 540, 350 + q.dy, { size: 70, w: 700, f: F.U, a: q.a, ls: -2 });
  p = popS(t, g(1), null, 0.7); txt('beats solo', 540, 474 + p.dy, { size: 110, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -3 });
  pairRiders(t, io.dy, k, 1, 1, null);
  const pl = popS(t, c(3), null); if (pl.a > 0) pill('both save energy', 540, 1200 + io.dy + pl.dy, { a: pl.a, s: pl.s, size: 40, bg: C.ink, c: C.bg, ls: 0 });
  ctx.restore();
}

// Akt (id ze script.json) → funkce scény. Každý akt musí mít scénu i hodnotu AMBIENT.
const SCENES = { hook: sHook, wake: sWake, pair: sPair, tip: sTip };
const AMBIENT = { hook: 0.34, wake: 0.2, pair: 0.26, tip: 0.26 };
// Která simulovaná proudění video používá a kdy běží.
const FLOWS = {
  rider: { count: 3400, from: () => ACT.wake.start, to: () => ACT.wake.end },
};
