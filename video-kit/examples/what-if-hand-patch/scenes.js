'use strict';
// SCÉNY krátkého videa „What if a hand-sized patch of air costs you 8 watts“ (asi 26 s). Hook: „What if…“ + překvapivě malá věc s konkrétním číslem.
// Čísla: tools/physics.py 250 0.25 0.24 (84 kg s kolem, rovina): 0,01 m² CdA = 8,5 W při 40 km/h a 46 s na 40 km.
// Čtverec 10 × 10 cm má plochu 0,01 m²; u tupého tvaru (Cd kolem 1) je to přibližně i 0,01 m² CdA, proto „about“.
// Jezdec zepředu je kreslený v měřítku asi 660 px na metr, čtverec 10 cm má tedy 66 px.

// úvodní „what IF“ ve stylu loga aplikace: bílé „what“, fialové „IF“
function whatIf(t, tin, y) { const p = popS(t, tin, null, 0.7); rich([['what', C.ink], ['IF', C.pu]], 540, y, { size: 170, w: 800, f: F.U, a: p.a, s: p.s, ls: -5 }); }

const SQ = 66;
// fialový čtverec 10 × 10 cm se středem v (x, y); s = měřítko nástupu, a = průhlednost
function patch(x, y, s, a) {
  if (a <= 0) return; const h = SQ * s / 2;
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgba(139,61,255,0.78)'; ctx.strokeStyle = C.ink; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(x - h, y - h, 2 * h, 2 * h, 7); ctx.fill(); ctx.stroke(); ctx.restore();
}

function sHook(t, a) {
  const ex = tw(t, a.end - 0.36, 0.36), c = i => cs('hook', i);
  ctx.save(); ctx.globalAlpha = 1 - ex; ctx.translate(0, -70 * ex);
  whatIf(t, c(0), 520);
  let p = pop(t, c(1), null); txt('a patch of air', 540, 700 + p.dy, { size: 72, w: 700, f: F.U, a: p.a, ls: -2 });
  p = pop(t, c(2), null); txt('the size of your hand', 540, 786 + p.dy, { size: 52, w: 700, f: F.U, a: p.a, ls: -2 });
  const sq = popS(t, c(2) + 0.2, null); patch(540, 900, 1.5 * sq.s, sq.a);
  p = pop(t, c(3), null); txt('costs you', 540, 1040 + p.dy, { size: 56, w: 700, f: F.U, c: C.muted, a: p.a, ls: -2 });
  p = popS(t, c(4), null, 0.7); txt('8 watts?', 540, 1220, { size: 150, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -5 });
  ctx.restore();
}

function sSquare(t, a) {
  const io = actIO(t, a), q = i => cs('square', i), c = i => cs('cost', i), G = 1322 + io.dy;
  const h1 = q(4) - 0.15, h2 = c(2) - 0.15, h3 = c(4) - 0.15;
  ctx.save(); ctx.globalAlpha = io.a;
  // nadpis: 10 × 10 cm → 0.01 m² → 8.5 W → 45 s
  let p = popS(t, q(1), h1, 0.7); txt('10 × 10 cm', 540, 400 + p.dy, { size: 112, w: 800, f: F.U, a: p.a, s: p.s, ls: -4 });
  let s = pop(t, q(2), h1); txt('a square facing the wind', 540, 480 + s.dy, { size: 48, w: 700, c: C.muted, a: s.a });
  p = popS(t, q(4), h2, 0.7); txt('0.01 m²', 540, 400 + p.dy, { size: 140, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -4 });
  s = pop(t, q(5), h2); txt('of drag area · CdA', 540, 480 + s.dy, { size: 48, w: 700, a: s.a });
  p = popS(t, c(2), h3, 0.7); txt('8.5 W', 540, 420 + p.dy, { size: 190, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -6 });
  s = pop(t, c(2) + 0.2, h3); txt('at 40 km/h', 540, 500 + s.dy, { size: 48, w: 700, a: s.a });
  p = popS(t, c(4), null, 0.7); txt('45 s', 540, 420 + p.dy, { size: 190, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -6 });
  s = pop(t, c(4) + 0.25, null); txt('over 40 km', 540, 500 + s.dy, { size: 48, w: 700, a: s.a });
  // jezdec a jeden čtverec vedle něj ve stejném měřítku
  ctx.fillStyle = C.line2; ctx.fillRect(250, G, 580, 5);
  frontRider(540, G, 0.94, { back: 0, elbows: 0, head: 0 }, C.surf, 1);
  const sq = popS(t, q(1), null), pulse = 1 + 0.22 * Math.sin(Math.PI * clamp((t - c(5)) / 0.6)), X = 836, Y = 900 + io.dy;
  patch(X, Y, sq.s * pulse, sq.a);
  if (sq.a > 0) {
    // kóty 10 cm a štítek
    ctx.save(); ctx.globalAlpha *= sq.a; ctx.strokeStyle = C.muted; ctx.lineWidth = 3; ctx.lineCap = 'round'; const y = Y + 56;
    ctx.beginPath(); ctx.moveTo(X - 33, y); ctx.lineTo(X + 33, y); ctx.moveTo(X - 33, y - 9); ctx.lineTo(X - 33, y + 9); ctx.moveTo(X + 33, y - 9); ctx.lineTo(X + 33, y + 9); ctx.stroke(); ctx.restore();
    txt('10 cm', X, Y + 104, { size: 34, w: 800, c: C.muted, a: sq.a });
  }
  const pl = popS(t, c(5), null); if (pl.a > 0) pill('one little square', 806, 1076 + io.dy + pl.dy, { a: pl.a, s: pl.s, size: 32, ls: 0 });
  ctx.restore();
}

function sBody(t, a) {
  const io = actIO(t, a), b = i => cs('body', i), p3 = i => cs('tip', i), G = 1322 + io.dy, h1 = p3(0) - 0.15;
  const tk = { back: tw(t, p3(0), 1.0), elbows: tw(t, p3(0) + 0.15, 1.0), head: tw(t, p3(0) + 0.3, 1.0) }, gone = 1 - tw(t, p3(0), 0.45);
  ctx.save(); ctx.globalAlpha = io.a;
  // nadpis: elbows · head · shoulders → Tuck them in
  const fo = { size: 46, w: 700, f: F.U, ls: -1 }, words = ['elbows', 'head', 'shoulders'], ws = words.map(s => width(s, fo)), gap = 54; let x = 540 - (ws[0] + ws[1] + ws[2] + 2 * gap) / 2;
  words.forEach((s, i) => { const p = pop(t, b(i + 1), h1); txt(s, x, 392 + p.dy, Object.assign({ align: 'left', a: p.a }, fo)); x += ws[i] + gap; });
  let q = pop(t, b(4), h1); rich([['each one = ', C.muted], ['a few squares', C.pu]], 540, 478 + q.dy, { size: 50, w: 700, a: q.a });
  let p = popS(t, p3(0), null, 0.7); txt('Tuck them in', 540, 392 + p.dy, { size: 96, w: 800, f: F.U, c: C.pu, a: p.a, s: p.s, ls: -3 });
  q = pop(t, p3(1), null); txt('and keep them in', 540, 476 + q.dy, { size: 52, w: 700, a: q.a });
  const pl = popS(t, p3(2), null); if (pl.a > 0) pill('free speed', 836, 880 + io.dy + pl.dy, { a: pl.a, s: pl.s, size: 42, bg: C.ink, c: C.bg, ls: 0 });
  // jezdec a čtverce na částech těla, které trčí do větru
  ctx.fillStyle = C.line2; ctx.fillRect(250, G, 580, 5);
  frontRider(540, G, 0.94, { back: 0, elbows: 0, head: 0 }, C.bg, 0.30 * clamp((t - p3(0)) / 0.2));
  frontRider(540, G, 0.94, tk, mix(RGB.surf, RGB.pu, tw(t, p3(0), 0.9)), 1);
  const R = (xr, yr) => [540 + 0.94 * xr, G + 0.94 * yr];
  const groups = [
    [b(1), [[-152, -500], [-152, -428], [152, -500], [152, -428]]],                  // lokty
    [b(2), [[-36, -738], [36, -738], [-36, -666], [36, -666]]],                      // hlava
    [b(3), [[-170, -640], [-100, -640], [100, -640], [170, -640]]],                  // ramena
  ];
  groups.forEach(([tin, pts]) => pts.forEach(([xr, yr], i) => { const e = popS(t, tin + i * 0.07, null), xy = R(xr, yr); patch(xy[0], xy[1], e.s, e.a * gone); }));
  ctx.restore();
}

// Akt (id ze script.json) → funkce scény. Každý akt musí mít scénu i hodnotu AMBIENT.
const SCENES = { hook: sHook, square: sSquare, body: sBody };
const AMBIENT = { hook: 0.34, square: 0.16, body: 0.16 };
// Tohle video nepoužívá žádné simulované proudění, jen jemný proud v pozadí.
const FLOWS = {};
