'use strict';
// SCÉNY krátkého videa „What if a headwind multiplies your drag“ (asi 26 s). Hook: „What if…“ + mezera ve zvědavosti.
// Čísla: stejný model jako tools/physics.py (84 kg s kolem, CdA 0,30, rovina), navíc protivítr:
// odpor = 0,5 · ρ · CdA · (rychlost + vítr)². Při 30 km/h a protivětru 20 km/h obtéká vzduch 50 km/h,
// odpor je (50/30)² = 2,8×, výkon 135 → 326 W. Se 135 W jede jezdec jen 19,2 km/h.
// Nižší pozice (CdA 0,30 → 0,25) ušetří v bezvětří 18 W, v tomhle protivětru 50 W (2,8×).

// úvodní „what IF“ ve stylu loga aplikace: bílé „what“, fialové „IF“
function whatIf(t, tin, y) { const p = popS(t, tin, null, 0.7); rich([['what', C.ink], ['IF', C.pu]], 540, y, { size: 170, w: 800, f: F.U, a: p.a, s: p.s, ls: -5 }); }

function sHook(t, a) {
  const ex = tw(t, a.end - 0.36, 0.36), c = i => cs('hook', i);
  ctx.save(); ctx.globalAlpha = 1 - ex; ctx.translate(0, -70 * ex);
  whatIf(t, c(0), 560);
  let p = pop(t, c(1), null); txt('a headwind', 540, 740 + p.dy, { size: 84, w: 700, f: F.U, a: p.a, ls: -2 });
  p = pop(t, c(2), null); txt("doesn't add", 540, 880 + p.dy, { size: 56, w: 700, f: F.U, c: C.muted, a: p.a, ls: -2 });
  p = pop(t, c(3), null); txt('to your drag…', 540, 956 + p.dy, { size: 56, w: 700, f: F.U, c: C.muted, a: p.a, ls: -2 });
  p = pop(t, c(4), null); txt('it', 540, 1096 + p.dy, { size: 66, w: 700, f: F.U, a: p.a, ls: -2 });
  p = popS(t, c(4) + 0.14, null, 0.7); txt('multiplies', 540, 1236, { size: 122, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -4 });
  p = pop(t, c(4) + 0.5, null); txt('it?', 540, 1336 + p.dy, { size: 66, w: 700, f: F.U, a: p.a, ls: -2 });
  ctx.restore();
}

function sWind(t, a) {
  const io = actIO(t, a), r = i => cs('air', i), d = i => cs('drag', i);
  ctx.save(); ctx.globalAlpha = io.a;
  panel(FLOW.rider, 1052 + io.dy, 640, 1);
  // 30 km/h → + 20 km/h protivítr → 50 km/h → 2,8× odpor
  let p = popS(t, r(0), r(3) - 0.15); txt('30 km/h', 540, 450 + p.dy, { size: 150, w: 800, f: F.U, a: p.a, s: p.s, ls: -4 });
  let q = pop(t, r(0) + 0.2, r(3) - 0.15); txt('your speed on the road', 540, 530 + q.dy, { size: 46, w: 700, c: C.muted, a: q.a });
  const pl = popS(t, r(1), d(3) - 0.2); if (pl.a > 0) pill('+ 20 km/h headwind', 540, 626 + pl.dy, { a: pl.a, s: pl.s, size: 40, ls: 0 });
  p = popS(t, r(3), d(3) - 0.15, 0.7); txt('50 km/h', 540, 450 + p.dy, { size: 150, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -4 });
  q = pop(t, r(3) + 0.2, d(1) - 0.15); txt('is how fast the air hits you', 540, 530 + q.dy, { size: 46, w: 700, a: q.a });
  q = pop(t, d(1), d(3) - 0.15); txt('drag grows with air speed²', 540, 530 + q.dy, { size: 46, w: 700, a: q.a });
  p = popS(t, d(3), null, 0.7); txt('2.8×', 540, 470 + p.dy, { size: 220, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -7 });
  q = pop(t, d(3) + 0.25, null); txt('the drag · same road speed', 540, 556 + q.dy, { size: 46, w: 700, a: q.a });
  ctx.restore();
}

function sCost(t, a) {
  const io = actIO(t, a), w = i => cs('watts', i), r = i => cs('crawl', i), base = 1290 + io.dy, HM = 590;
  const sw = w(3) + 0.5, h2 = r(0) - 0.2;
  ctx.save(); ctx.globalAlpha = io.a;
  // nadpis: stejná rychlost → 2,4× výkon → stejný výkon → 19 km/h
  let p = pop(t, w(0), sw - 0.2); txt('Same speed', 540, 390 + p.dy, { size: 80, w: 700, f: F.U, a: p.a, ls: -2 });
  let q = pop(t, w(0) + 0.2, sw - 0.2); txt('30 km/h · power you need', 540, 466 + q.dy, { size: 46, w: 700, c: C.muted, a: q.a });
  p = popS(t, sw, h2, 0.7); txt('2.4×', 540, 410 + p.dy, { size: 190, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -6 });
  q = pop(t, sw + 0.25, h2); txt('the power, just to hold 30', 540, 486 + q.dy, { size: 46, w: 700, a: q.a });
  q = pop(t, r(0), null); txt('Same 135 watts instead?', 540, 312 + q.dy, { size: 46, w: 700, c: C.muted, a: q.a });
  p = popS(t, r(3), null, 0.7); txt('19 km/h', 540, 470 + p.dy, { size: 150, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -4 });
  // dva sloupce: bezvětří a protivítr
  const ga = clamp((t - (w(0) - 0.15)) / 0.2);
  if (ga > 0) {
    ctx.save(); ctx.globalAlpha *= ga; ctx.fillStyle = C.line2; ctx.fillRect(170, base, 740, 5); ctx.restore();
    [[330, 135, w(1), w(1), C.ink, 'no wind'], [750, 326, w(2), w(3), C.pu, 'headwind']].forEach(([x, watts, tin, tnum, col, label]) => {
      const k = tw(t, tin, 1.1, E.quint), h = Math.max(4, HM * watts / 326 * k), la = pop(t, tin, null), n = popS(t, tnum, null);
      ctx.save(); ctx.globalAlpha *= clamp((t - tin) / 0.15); ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x - 105, base - h, 210, h, [20, 20, 0, 0]); ctx.fill(); ctx.restore();
      txt(label, x, base + 62 + la.dy * 0.4, { size: 46, w: 800, c: col, a: la.a });
      txt(Math.round(watts * tw(t, tnum, 0.8, E.quint)) + ' W', x, base - h - 26, { size: 70, w: 800, f: F.U, c: col, a: n.a, s: n.s, ls: -2 });
    });
  }
  ctx.restore();
}

function sTip(t, a) {
  const io = actIO(t, a), c = i => cs('tip', i), h2 = c(2) - 0.15;
  const P = { back: tw(t, c(1), 1.0), elbows: tw(t, c(1) + 0.3, 1.0), head: tw(t, c(1) + 0.15, 1.0) };
  ctx.save(); ctx.globalAlpha = io.a;
  let q = pop(t, c(0), h2); txt('In a headwind', 540, 350 + q.dy, { size: 66, w: 700, f: F.U, a: q.a, ls: -2 });
  let p = popS(t, c(1), h2, 0.7); txt('get low', 540, 486 + p.dy, { size: 130, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -4 });
  q = pop(t, c(2), null); txt('every bit of aero is worth', 540, 340 + q.dy, { size: 48, w: 700, c: C.muted, a: q.a });
  p = popS(t, c(4), null, 0.7); txt('~3× more', 540, 470 + p.dy, { size: 124, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -4 });
  q = pop(t, c(4) + 0.3, null); rich([['calm air: 18 W saved', C.muted], ['  ·  ', C.muted], ['headwind: 50 W', C.ink]], 540, 548 + q.dy, { size: 34, w: 700, a: q.a });
  ctx.fillStyle = C.line2; ctx.fillRect(250, 1322 + io.dy, 580, 5);
  frontRider(540, 1322 + io.dy, 0.94, { back: 0, elbows: 0, head: 0 }, C.bg, 0.30);
  frontRider(540, 1322 + io.dy, 0.94, P, C.pu, 1);
  ctx.restore();
}

// Akt (id ze script.json) → funkce scény. Každý akt musí mít scénu i hodnotu AMBIENT.
const SCENES = { hook: sHook, wind: sWind, cost: sCost, tip: sTip };
const AMBIENT = { hook: 0.34, wind: 0.22, cost: 0.2, tip: 0.16 };
// Která simulovaná proudění video používá a kdy běží.
const FLOWS = {
  rider: { count: 3400, from: () => ACT.wind.start, to: () => ACT.wind.end },
};
