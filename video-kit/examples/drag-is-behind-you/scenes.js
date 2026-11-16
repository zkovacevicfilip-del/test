'use strict';
// SCÉNY krátkého videa „What slows you down is behind you“ (asi 30 s). Hook: nečekané tvrzení, které se vysvětlí až dál.
// Čísla jsou učebnicová: tupý tvar × proudnicový tvar stejné šířky asi 10× (Cd ~1,2 × ~0,1),
// tělo jezdce dělá asi 70 % odporu jezdce s kolem (Kyle a Burke 1984; přehled Crouch a kol. 2017).

function sHook(t, a) {
  const ex = tw(t, a.end - 0.36, 0.36), c = i => cs('hook', i);
  ctx.save(); ctx.globalAlpha = 1 - ex; ctx.translate(0, -70 * ex);
  let p = pop(t, c(0), null); txt('What slows you down', 540, 540 + p.dy, { size: 58, w: 700, f: F.U, a: p.a, ls: -2 });
  p = pop(t, c(1), null); txt('on a bike', 540, 624 + p.dy, { size: 58, w: 700, f: F.U, c: C.muted, a: p.a, ls: -2 });
  p = pop(t, c(2), null); txt("isn't in front of you.", 540, 800 + p.dy, { size: 54, w: 700, f: F.U, a: p.a, ls: -2 });
  p = pop(t, c(3), null); txt("It's", 540, 960 + p.dy, { size: 70, w: 700, f: F.U, a: p.a, ls: -2 });
  p = popS(t, c(3) + 0.12, null, 0.7); txt('BEHIND', 540, 1140, { size: 176, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -5 });
  p = pop(t, c(3) + 0.4, null); txt('you.', 540, 1250 + p.dy, { size: 84, w: 700, f: F.U, a: p.a, ls: -2 });
  ctx.restore();
}

function sWake(t, a) {
  const io = actIO(t, a), w = i => cs('wake', i), u = i => cs('pull', i), cy = 960 + io.dy, h2 = L.pull.start - 0.25;
  ctx.save(); ctx.globalAlpha = io.a;
  panel(FLOW.rider, cy, 720, 1);
  // nadpis 1: vzduch se za tělem nespojí
  let p = pop(t, w(0), h2); txt("Air can't close in", 540, 400 + p.dy, { size: 72, w: 700, f: F.U, a: p.a, ls: -2 });
  let q = pop(t, w(1), h2); txt('smoothly behind your body', 540, 472 + q.dy, { size: 46, w: 700, c: C.muted, a: q.a });
  // rámeček úplavu a štítek
  const wk = tw(t, w(2), 0.7);
  if (wk > 0.01) { ctx.save(); ctx.globalAlpha *= clamp(wk * 2); ctx.strokeStyle = C.pu; ctx.lineWidth = 4; ctx.setLineDash([14, 12]); ctx.beginPath(); ctx.roundRect(lerp(940, 738, wk), cy - 230, lerp(16, 218, wk), 420, 34); ctx.stroke(); ctx.restore(); }
  const wl = popS(t, w(4), u(1) - 0.15); if (wl.a > 0) pill('LOW PRESSURE', 778, cy - 280 + wl.dy, { a: wl.a, s: wl.s, size: 36, ls: 2 });
  // nadpis 2: úplav táhne dozadu
  p = pop(t, u(1), null); txt('It pulls you back', 540, 400 + p.dy, { size: 72, w: 700, f: F.U, a: p.a, ls: -2 });
  q = pop(t, u(2), null); rich([["and it's ", C.ink], ['most of your drag', C.pu]], 540, 472 + q.dy, { size: 50, w: 700, a: q.a });
  const ar = tw(t, u(1), 0.7), aa = clamp((t - u(1)) / 0.15);
  if (aa > 0) { const x0 = 720, x1 = lerp(740, 930, ar), y = cy - 280; ctx.save(); ctx.globalAlpha *= aa; ctx.strokeStyle = C.pu; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.moveTo(x1 - 34, y - 30); ctx.lineTo(x1, y); ctx.lineTo(x1 - 34, y + 30); ctx.stroke(); ctx.restore(); pill('DRAG', 610, y, { a: aa, size: 38, ls: 3 }); }
  ctx.restore();
}

function sShapes(t, a) {
  const io = actIO(t, a), c = i => cs('smooth', i), cyC = 672 + io.dy, hC = 441, cyD = 1152 + io.dy, dim = tw(t, c(1), 0.6);
  ctx.save(); ctx.globalAlpha = io.a;
  // fialové svorky: oba tvary jsou stejně široké
  const marker = x => (g, cropY) => { if (dim <= 0) return; const yc = FLOW.cyl.m.shape.cy * 3 - cropY, r = 69 * dim; g.save(); g.globalAlpha = clamp(dim * 2); g.strokeStyle = C.pu; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, yc - r); g.lineTo(x, yc + r); g.moveTo(x - 16, yc - r); g.lineTo(x + 16, yc - r); g.moveTo(x - 16, yc + r); g.lineTo(x + 16, yc + r); g.stroke(); g.restore(); };
  panel(FLOW.cyl, cyC, hC, 1, marker(160));
  panel(FLOW.drop, cyD, 441, 1, marker(126));
  let p = pop(t, c(0), c(2) - 0.15); txt('Smooth shape', 540, 352 + p.dy, { size: 84, w: 700, f: F.U, a: p.a, ls: -2 });
  let q = pop(t, c(2), null); txt('Same width', 540, 300 + q.dy, { size: 50, w: 700, f: F.U, c: C.muted, a: q.a, ls: -1 });
  p = popS(t, c(2), null, 0.7); txt('10× less drag', 540, 398 + p.dy, { size: 90, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -3 });
  txt('BLUNT', 112, cyC - hC / 2 + 70, { size: 32, w: 800, align: 'left', c: C.muted, ls: 5 });
  txt('SMOOTH', 112, cyD - 150, { size: 32, w: 800, align: 'left', c: C.muted, ls: 5 });
  ctx.restore();
}

function sTip(t, a) {
  const io = actIO(t, a), y = i => cs('you', i), c = i => cs('tip', i), h2 = y(4) - 0.15, h3 = L.tip.start - 0.2;
  const P = { back: tw(t, c(1), 1.0), elbows: 0, head: tw(t, c(2), 1.0) };
  ctx.save(); ctx.globalAlpha = io.a;
  // tupý tvar jsi ty → ~70 % odporu
  let q = pop(t, y(1), h2); txt('The blunt shape', 540, 380 + q.dy, { size: 66, w: 700, f: F.U, a: q.a, ls: -2 });
  let p = popS(t, y(2), h2, 0.7); txt('is you', 540, 478 + p.dy, { size: 92, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -3 });
  p = popS(t, y(4), h3, 0.7); txt('~' + Math.round(70 * tw(t, y(4), 0.9, E.quint)) + '%', 540, 420 + p.dy, { size: 190, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -6 });
  q = pop(t, y(5), h3); txt('of the drag is your body', 540, 498 + q.dy, { size: 48, w: 700, a: q.a });
  // co s tím
  q = pop(t, c(0), null); txt('Shrink your wake', 540, 322 + q.dy, { size: 64, w: 700, f: F.U, a: q.a, ls: -2 });
  ['Flatten your back', 'Tuck your head in'].forEach((s, i) => {
    const r = pop(t, c(i + 1), null), yy = 410 + i * 78 + r.dy, x = 290 - (1 - r.k) * 70;
    ctx.save(); ctx.globalAlpha *= r.a; ctx.fillStyle = C.pu; ctx.beginPath(); ctx.arc(x, yy - 17, 24, 0, 7); ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x - 10, yy - 17); ctx.lineTo(x - 2, yy - 8); ctx.lineTo(x + 11, yy - 26); ctx.stroke(); ctx.restore();
    txt(s, x + 46, yy, { size: 50, w: 700, align: 'left', a: r.a });
  });
  ctx.fillStyle = C.line2; ctx.fillRect(250, 1322 + io.dy, 580, 5);
  frontRider(540, 1322 + io.dy, 0.9, { back: 0, elbows: 0, head: 0 }, C.bg, 0.30 * clamp((t - c(1)) / 0.2));
  frontRider(540, 1322 + io.dy, 0.9, P, mix(RGB.surf, RGB.pu, tw(t, y(2), 0.8)), 1);
  ctx.restore();
}

// Akt (id ze script.json) → funkce scény. Každý akt musí mít scénu i hodnotu AMBIENT.
const SCENES = { hook: sHook, wake: sWake, shapes: sShapes, tip: sTip };
const AMBIENT = { hook: 0.34, wake: 0.2, shapes: 0.22, tip: 0.16 };
// Která simulovaná proudění video používá a kdy běží.
const FLOWS = {
  rider: { count: 3400, from: () => ACT.wake.start, to: () => ACT.wake.end },
  cyl: { count: 3000, from: () => ACT.shapes.start, to: () => ACT.shapes.end },
  drop: { count: 3000, from: () => ACT.shapes.start, to: () => ACT.shapes.end },
};
