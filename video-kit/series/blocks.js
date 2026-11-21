// ---------- BLOKY: hotové scény pro série krátkých videí ----------
// Tenhle kód se při výrobě vkládá do scenes.js každého videa série (dělá to series/make.js) a kreslí pomůckami motoru.
// Video se pak nepíše jako kód, ale jako popis (soubor ve složce series/<série>/): každý akt má typ scény
// (hook, text, bars, rows, race, rider, flow, curve), nadpisy (heads) a časy zapsané odkazem na titulek:
//   'veta:2' = začátek 3. titulku věty, 'veta' = začátek věty, 'veta$' = konec věty, k tomu volitelně '+0.3' / '-0.2'.
const TR = r => {
  const m = /^([A-Za-z0-9_]+)(?::(\d+))?(\$)?([+-]\d*\.?\d+)?$/.exec(r);
  if (!m || !L[m[1]]) throw new Error('bloky: neznámý čas "' + r + '"');
  if (m[2] != null && !L[m[1]].chunks[+m[2]]) throw new Error('bloky: věta ' + m[1] + ' nemá titulek číslo ' + m[2]);
  return (m[2] != null ? cs(m[1], +m[2]) : m[3] ? L[m[1]].end : L[m[1]].start) + (m[4] ? +m[4] : 0);
};
const COL = n => ({ pu: C.pu, muted: C.muted, bg: C.bg, ink: C.ink })[n || 'ink'];
const num = (v, d) => { const s = Math.abs(v).toFixed(d || 0).split('.'); s[0] = s[0].replace(/\B(?=(\d{3})+$)/g, ','); return (v < 0 ? '−' : '') + s.join('.'); };
// zmenší písmo, když je text širší než max
const fit = (s, o, max) => { const w = width(s, o); return w > max ? Object.assign({}, o, { size: Math.floor(o.size * max / w), ls: (o.ls || 0) * max / w }) : o; };
// text s počítadlem: '#' se nahradí číslem, které doběhne z c[0] na c[1] (c[2] = počet desetinných míst)
const live = (tpl, c, t, at) => c ? tpl.replace('#', num(lerp(c[0], c[1], tw(t, at, 0.9, E.quint)), c[2])) : tpl;
const fin = (tpl, c) => c ? tpl.replace('#', num(c[1], c[2])) : tpl;
const left = (parts, x, y, o) => { const w = parts.reduce((s, p) => s + width(p[0], o), 0); rich(parts, x + w / 2, y, o); };

// úvodní „what IF“ ve stylu loga: bílé „what“, fialové „IF“
// úvodní slovo: „what“, nebo „watt“ (slovní hříčka s názvem aplikace), když to popis videa zapne: style.hook = 'watt'
const hookWord = () => ((typeof STYLE === 'object' && STYLE && STYLE.hook === 'watt') ? 'watt' : 'what');
function whatIf(t, tin, y, size) { const p = popS(t, tin, null, 0.7); rich([[hookWord(), C.ink], ['IF', C.pu]], 540, y, { size: size || 170, w: 800, f: F.U, a: p.a, s: p.s, ls: -5 }); }

// ---------- sloupec textů na střed (hook a textové akty) ----------
// items: { whatIf } | { t, i | at, dt, size, c, big, plain, gap, count }
function stack(t, s, dy, outT) {
  const its = s.items.map(it => {
    const base = it.whatIf ? { size: 170, w: 800, f: F.U, ls: -5 } : it.big ? { size: it.size || 200, w: 800, f: F.U, ls: -6 } : it.plain ? { size: it.size || 52, w: 700 } : { size: it.size || 64, w: 700, f: F.U, ls: -2 };
    return { it, fo: fit(it.whatIf ? hookWord() + 'IF' : fin(it.t, it.count), base, it.whatIf || it.big ? 780 : 860) };
  });
  let H = 0;
  its.forEach((x, k) => { x.cap = x.fo.size * 0.74; x.gap = k < its.length - 1 ? Math.max(40, 0.34 * Math.max(x.fo.size, its[k + 1].fo.size)) + (x.it.gap || 0) : 0; H += x.cap + x.gap; });
  let y = (s.cy || 890) - H / 2;
  its.forEach(x => {
    const it = x.it, at = (it.at ? TR(it.at) : cs(s.line, it.i)) + (it.dt || 0); y += x.cap; const yy = y + dy; y += x.gap;
    if (it.whatIf) whatIf(t, at, yy, x.fo.size);
    else if (it.big) { const p = STY().text ? { a: clamp((t - at) / 0.05), s: 1, dy: 0 } : popS(t, at, outT, 0.7); fxText(live(it.t, it.count, t, at), 540, yy + p.dy, Object.assign({}, x.fo, { c: COL(it.c || 'pu'), a: p.a, s: p.s }), at, 'big', t); }
    else { const p = STY().text ? { a: clamp((t - at) / 0.05), dy: 0 } : pop(t, at, outT); fxText(it.t, 540, yy + p.dy, Object.assign({}, x.fo, { c: COL(it.c), a: p.a }), at, 'title', t); }
  });
}

// ---------- nadpisy nahoře (pásmo y 300 až 520), střídají se v čase ----------
// { at, out, label, big, count, size, c, title, sub, subAt, subC, bigAt }
const headStart = h => Math.min(TR(h.at), h.subAt ? TR(h.subAt) : 1e9, h.bigAt ? TR(h.bigAt) : 1e9);
function heads(t, list, dy) {
  (list || []).forEach((h, i) => {
    const at = TR(h.at), out = h.out ? TR(h.out) : (list[i + 1] ? headStart(list[i + 1]) - 0.15 : null);
    if (out != null && t > out + 0.5) return;
    if (h.label) { const q = pop(t, at, out); txt(h.label, 540, 306 + q.dy + dy, Object.assign(fit(h.label, { size: 32, w: 800, ls: 4 }, 860), { c: C.muted, a: q.a })); }
    if (h.title) {
      const two = !!h.big, fo = fit(h.title, { size: h.tsize || (two ? 60 : 74), w: 700, f: F.U, ls: -2 }, 860), p = pop(t, at, out);
      fxText(h.title, 540, (two ? 350 : h.sub ? 392 : 430) + (STY().text ? (p.o ? p.dy : 0) : p.dy) + dy, Object.assign({}, fo, { c: COL(h.tc), a: p.a }), at, 'title', t);
    }
    if (h.big) {
      const bAt = h.bigAt ? TR(h.bigAt) : at, fo = fit(fin(h.big, h.count), { size: h.size || (h.title ? 116 : 150), w: 800, f: F.U, ls: -4 }, 780), p = popS(t, bAt, out, 0.7);
      fxText(live(h.big, h.count, t, bAt), 540, (h.title ? 482 : h.label ? 452 : h.sub ? 392 : 430) + p.dy + dy, Object.assign({}, fo, { c: COL(h.c || 'pu'), a: p.a, s: STY().text ? (p.dy ? p.s : 1) : p.s }), bAt, 'big', t);
    }
    if (h.sub) { const sAt = h.subAt ? TR(h.subAt) : (h.bigAt ? TR(h.bigAt) : at) + 0.2, q = pop(t, sAt, out); fxText(h.sub, 540, (h.label ? 516 : 470) + q.dy + dy, Object.assign(fit(h.sub, { size: 46, w: 700 }, 860), { c: COL(h.subC || 'muted'), a: q.a }), sAt, 'sub', t); }
  });
}

// ---------- štítky ----------
// { text, x, y, at, out, size, c: 'pu' | 'ink', line: [x1, y1, x2, y2] }
function pills(t, list, dy) {
  (list || []).forEach(p => {
    const q = popS(t, TR(p.at), p.out ? TR(p.out) : null); if (q.a <= 0) return;
    if (p.line) { ctx.save(); ctx.globalAlpha *= q.a; ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.line[0], p.line[1] + dy); ctx.lineTo(p.line[2], p.line[3] + dy); ctx.stroke(); ctx.restore(); }
    pill(p.text, p.x, p.y + dy + q.dy, { a: q.a, s: q.s, size: p.size || 38, ls: 1, bg: p.c === 'ink' ? C.ink : C.pu, c: p.c === 'ink' ? C.bg : C.ink });
  });
}

// ---------- sloupce: { bars: [{ label, value, show, dec, at, numAt, c, cap }], max } ----------
function vBars(t, v, dy) {
  const base = 1270 + dy, HM = v.h || 540, n = v.bars.length, xs = n === 2 ? [330, 750] : n === 3 ? [240, 540, 840] : [205, 428, 652, 875], bw = n === 2 ? 210 : n === 3 ? 180 : 150;
  const max = v.max || Math.max.apply(null, v.bars.map(b => b.value)), t0 = Math.min.apply(null, v.bars.map(b => TR(b.at))), ga = clamp((t - (t0 - 0.15)) / 0.2);
  if (ga <= 0) return;
  ctx.save(); ctx.globalAlpha *= ga; ctx.fillStyle = C.line2; ctx.fillRect(140, base, 800, 5); ctx.restore();
  v.bars.forEach((b, i) => {
    const tin = TR(b.at), tnum = b.numAt ? TR(b.numAt) : tin + 0.25, k = tw(t, tin, 1.1, E.quint), h = Math.max(4, HM * b.value / max * k), col = COL(b.c || (i === n - 1 ? 'pu' : 'ink')), la = pop(t, tin, null), nn = popS(t, tnum, null), x = xs[i];
    ctx.save(); ctx.globalAlpha *= clamp((t - tin) / 0.15); ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x - bw / 2, base - h, bw, h, [20, 20, 0, 0]); ctx.fill(); ctx.restore();
    txt(b.label, x, base + 60 + la.dy * 0.4, Object.assign(fit(b.label, { size: 42, w: 800 }, n === 2 ? 400 : 280), { c: col, a: la.a }));
    if (b.cap) txt(b.cap, x, base + 100 + la.dy * 0.4, Object.assign(fit(b.cap, { size: 28, w: 800, ls: 2 }, n === 2 ? 400 : 280), { c: C.muted, a: la.a }));
    const c = b.show.indexOf('#') >= 0 ? [0, b.value, b.dec || 0] : null, fo = fit(fin(b.show, c), { size: n === 2 ? 70 : 54, w: 800, f: F.U, ls: -2 }, n === 2 ? 400 : 290);
    txt(live(b.show, c, t, tnum), x, base - h - 26, Object.assign({}, fo, { c: col, a: nn.a, s: nn.s }));
  });
}

// ---------- řádky s pruhem: { rows: [{ label, note, value, left, lc, leftCap, right, rightCap, at, leftAt, rightAt, c }], max } ----------
function vRows(t, v, dy) {
  const n = v.rows.length, ys = n === 2 ? [700, 1030] : [610, 850, 1090], big = n === 2 ? 84 : 66, off = n === 2 ? 166 : 136;
  const max = v.max || Math.max.apply(null, v.rows.map(r => r.value));
  v.rows.forEach((r, i) => {
    const tin = TR(r.at), tL = r.leftAt ? TR(r.leftAt) : tin + 0.3, en = pop(t, tin, null); if (en.a <= 0) return;
    const kb = tw(t, tL, 1.0, E.quint), nl = popS(t, tL, null), nr = r.right ? popS(t, r.rightAt ? TR(r.rightAt) : tL + 0.3, null) : null, col = COL(r.c || (i === n - 1 ? 'pu' : 'ink')), y = ys[i] + dy + en.dy * 0.6;
    txt(r.label, 110, y, Object.assign(fit(r.label, { size: 46, w: 700 }, r.note ? 520 : 860), { align: 'left', a: en.a }));
    if (r.note) txt(r.note, 970, y, { size: 38, w: 700, align: 'right', c: C.muted, a: en.a });
    ctx.save(); ctx.globalAlpha *= en.a; ctx.fillStyle = C.line2; ctx.beginPath(); ctx.roundRect(110, y + 30, 860, 28, 14); ctx.fill();
    if (nl.a > 0) { ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(110, y + 30, Math.max(28, 860 * r.value / max * kb), 28, 14); ctx.fill(); }
    ctx.restore();
    txt(live(r.left, r.lc, t, tL), 110, y + off, Object.assign(fit(fin(r.left, r.lc), { size: big, w: 800, f: F.U, ls: -3 }, r.right ? 480 : 860), { c: col, align: 'left', a: nl.a }));
    if (r.leftCap) txt(r.leftCap, 114, y + off + 42, { size: 27, w: 800, c: C.muted, ls: 3, align: 'left', a: nl.a });
    if (r.right) { txt(r.right, 970, y + off, Object.assign(fit(r.right, { size: big, w: 800, f: F.U, ls: -3 }, 360), { c: col, align: 'right', a: nr.a })); if (r.rightCap) txt(r.rightCap, 968, y + off + 42, { size: 27, w: 800, c: C.muted, ls: 3, align: 'right', a: nr.a }); }
  });
}

// ---------- závod: { lanes: [{ label, v, p, show, cnt, c, at, labAt }], start, end, finish, finishAt, speedAt, gap: { text, at, lane }, tilt } ----------
function vRace(t, v, dy) {
  const n = v.lanes.length, ys = n === 2 ? [800, 1110] : [710, 950, 1190], X0 = 130, X1 = 950, T0 = TR(v.start), T1 = TR(v.end), q = E.io(clamp((t - T0) / (T1 - T0)));
  const pv = l => l.p != null ? l.p : l.v, pmax = Math.max.apply(null, v.lanes.map(pv)), xOf = pr => X0 + (X1 - X0 - 150) * pr + 150, tS = v.speedAt ? TR(v.speedAt) : T0;
  ctx.save();
  if (v.tilt) { ctx.translate(540, 955 + dy); ctx.rotate(-v.tilt * Math.PI / 180); ctx.translate(-540, -(955 + dy)); }
  const fa = tw(t, TR(v.finishAt || v.lanes[0].at), 0.6);
  if (v.finish !== false) { ctx.save(); ctx.globalAlpha *= fa; ctx.strokeStyle = C.muted; ctx.lineWidth = 4; ctx.setLineDash([12, 12]); ctx.beginPath(); ctx.moveTo(X1, ys[0] - 150 + dy); ctx.lineTo(X1, ys[n - 1] + 108 + dy); ctx.stroke(); ctx.restore(); }
  if (v.finish) txt(v.finish, X1, ys[n - 1] + 150 + dy, { size: 32, w: 800, c: C.muted, a: fa, align: 'right', ls: 1 });
  v.lanes.forEach((l, i) => {
    const y = ys[i] + dy, e = pop(t, TR(l.at), null), x = xOf(q * pv(l) / pmax), col = COL(l.c || (i === n - 1 ? 'pu' : 'ink'));
    ctx.save(); ctx.globalAlpha *= e.a; ctx.translate(0, e.dy);
    ctx.lineCap = 'round'; ctx.strokeStyle = C.line2; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(X1, y); ctx.stroke();
    ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(Math.max(X0 + 1, x - 20), y); ctx.stroke();
    const la = pop(t, l.labAt ? TR(l.labAt) : TR(l.at) + 0.15, null), parts = (Array.isArray(l.label) ? l.label : [[l.label, 'c']]).map(p => [p[0], p[1] === 'c' ? col : COL(p[1])]);
    left(parts, X0, y + 70 + la.dy, { size: 42, w: 800, a: la.a });
    if (l.show) { const ts = l.showAt ? TR(l.showAt) : tS, va = pop(t, ts, null), c = l.cnt || (l.show.indexOf('#') >= 0 ? [l.v * 0.75, l.v, 1] : null); txt(live(l.show, c, t, ts), X1 - 26, y + 70 + va.dy, { size: 42, w: 800, align: 'right', c: col, a: va.a }); }
    const sc = 0.44; ctx.drawImage(riderImg, x - 429 * sc, y - 4 - 414 * sc, 512 * sc, 512 * sc);
    ctx.restore();
  });
  if (v.gap) {
    const g = popS(t, v.gap.at ? TR(v.gap.at) : T1 + 0.1, null), li = v.gap.lane || 0, xs = xOf(pv(v.lanes[li]) / pmax), y = ys[li] + dy;
    if (g.a > 0) { ctx.save(); ctx.globalAlpha *= g.a; ctx.strokeStyle = C.pu; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(xs + 6, y - 140); ctx.lineTo(X1 - 6, y - 140); ctx.moveTo(xs + 6, y - 154); ctx.lineTo(xs + 6, y - 126); ctx.moveTo(X1 - 6, y - 154); ctx.lineTo(X1 - 6, y - 126); ctx.stroke(); ctx.restore(); pill(v.gap.text, Math.min(X1 - 150, Math.max(xs + 40, (xs + X1) / 2)), y - 206, { a: g.a, s: g.s, size: 36, ls: 0 }); }
  }
  ctx.restore();
}

// ---------- jezdec zepředu: { pose: { back, elbows, head }, ghost, fillAt, scale, checks: { items: [{ text, at }], out, numbered } } ----------
// póza: číslo (pevná hodnota 0 až 1), 'čas' (v ten okamžik se složí), nebo ['čas', z, do]
function vRider(t, v, dy) {
  const g = 1322 + dy, sc = v.scale || 0.94, P = {};
  ['back', 'elbows', 'head'].forEach(k => { const s = v.pose && v.pose[k]; P[k] = s == null ? 0 : typeof s === 'number' ? s : Array.isArray(s) ? lerp(s[1], s[2], tw(t, TR(s[0]), 1.0)) : tw(t, TR(s), 1.0); });
  ctx.fillStyle = C.line2; ctx.fillRect(250, g, 580, 5);
  if (v.ghost !== false) frontRider(540, g, sc, { back: 0, elbows: 0, head: 0 }, C.bg, 0.30);
  frontRider(540, g, sc, P, v.fillAt ? mix(RGB.surf, RGB.pu, tw(t, TR(v.fillAt), 0.8)) : C.pu, 1);
  if (v.checks) v.checks.items.forEach((it, i) => {
    const p = pop(t, TR(it.at), v.checks.out ? TR(v.checks.out) : null), y = (v.checks.y || 320) + i * 78 + p.dy + dy, x = (v.checks.x || 280) - (1 - p.k) * 70;
    ctx.save(); ctx.globalAlpha *= p.a; ctx.fillStyle = C.pu; ctx.beginPath(); ctx.arc(x, y - 17, 26, 0, 7); ctx.fill();
    if (!v.checks.numbered) { ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x - 10, y - 17); ctx.lineTo(x - 2, y - 8); ctx.lineTo(x + 11, y - 26); ctx.stroke(); }
    ctx.restore();
    if (v.checks.numbered) txt(String(i + 1), x, y - 5, { size: 34, w: 800, a: p.a });
    txt(it.text, x + 50, y, { size: 50, w: 700, align: 'left', a: p.a });
  });
}

// ---------- proudění: { panels: 'rider' | 'shapes' | [{ flow, cy, h, label, mark }], boxes: [{ x, y, w, h, at, out }], arrows: [{ x0, x1, y, at, out, label }] } ----------
const PANELS = { rider: [{ flow: 'rider', cy: 970, h: 700 }], shapes: [{ flow: 'cyl', cy: 672, h: 441, label: 'BLUNT' }, { flow: 'drop', cy: 1152, h: 441, label: 'SMOOTH' }] };
const panelsOf = v => typeof v.panels === 'string' ? PANELS[v.panels] : v.panels;
function vFlow(t, v, dy) {
  panelsOf(v).forEach(p => {
    const a = p.at ? clamp((t - TR(p.at)) / 0.4) : 1; if (a <= 0) return;
    panel(FLOW[p.flow], p.cy + dy, p.h, a);
    if (p.label) txt(p.label, 112, p.cy - p.h / 2 + 70 + dy, { size: 32, w: 800, align: 'left', c: C.muted, ls: 5, a });
  });
  (v.boxes || []).forEach(b => { const k = tw(t, TR(b.at), 0.7), o = b.out ? 1 - tw(t, TR(b.out), 0.3) : 1; if (k * o < 0.01) return; ctx.save(); ctx.globalAlpha *= clamp(k * 2) * o; ctx.strokeStyle = C.pu; ctx.lineWidth = 4; ctx.setLineDash([14, 12]); ctx.beginPath(); ctx.roundRect(b.x + b.w * (1 - k), b.y + dy, b.w * k, b.h, 34); ctx.stroke(); ctx.restore(); });
  (v.arrows || []).forEach(r => {
    const k = tw(t, TR(r.at), 0.7), a = clamp((t - TR(r.at)) / 0.15) * (r.out ? 1 - tw(t, TR(r.out), 0.3) : 1); if (a <= 0) return;
    const x1 = lerp(r.x0 + 20, r.x1, k), y = r.y + dy;
    ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = C.pu; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(r.x0, y); ctx.lineTo(x1, y);
    const d = r.x1 > r.x0 ? 1 : -1; ctx.moveTo(x1 - 34 * d, y - 30); ctx.lineTo(x1, y); ctx.lineTo(x1 - 34 * d, y + 30); ctx.stroke(); ctx.restore();
    if (r.label) pill(r.label, r.lx || (Math.min(r.x0, r.x1) - 110), y, { a, size: 38, ls: 3 });
  });
}

// ---------- křivka y = x^pow: { pow, at, xlab, ylab, points: [{ k, at, pill, c, xl, dx, dy }] } ----------
function vCurve(t, v, dy) {
  const X0 = 180, X1 = 900, Y0 = 1270 + dy, HH = 590, pw = v.pow || 3, pt = k => [lerp(X0, X1, k), Y0 - HH * Math.pow(k, pw)];
  ctx.strokeStyle = C.line2; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(X0, Y0 - HH - 40); ctx.lineTo(X0, Y0); ctx.lineTo(X1 + 50, Y0); ctx.stroke();
  txt(v.ylab || 'POWER', X0 + 24, Y0 - HH - 14, { size: 30, w: 800, c: C.muted, ls: 4, align: 'left' });
  txt(v.xlab || 'SPEED', X0, Y0 + 52, { size: 30, w: 800, c: C.muted, ls: 4, align: 'left' });
  const g = tw(t, TR(v.at), 1.5, E.quint);
  if (g > 0.001) { ctx.strokeStyle = C.pu; ctx.lineWidth = 10; ctx.beginPath(); for (let i = 0; i <= 80; i++) { const s = pt(g * i / 80); if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]); } ctx.stroke(); }
  (v.points || []).forEach(p => {
    const m = popS(t, TR(p.at), null), s = pt(p.k), d = tw(t, TR(p.at), 0.6), pu = p.c === 'pu'; if (m.a <= 0) return;
    ctx.save(); ctx.globalAlpha *= m.a; ctx.strokeStyle = C.muted; ctx.lineWidth = 4; ctx.setLineDash([10, 12]); ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(s[0], lerp(s[1], Y0, d)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = pu ? C.pu : C.ink; ctx.beginPath(); ctx.arc(s[0], s[1], 17 * m.s, 0, 7); ctx.fill(); ctx.restore();
    pill(p.pill, s[0] + (p.dx || 0), s[1] + (p.dy == null ? -66 : p.dy), { a: m.a, s: m.s, size: 44, bg: pu ? C.pu : C.ink, c: pu ? C.ink : C.bg, ls: 0 });
    if (p.xl) txt(p.xl, s[0], Y0 + 52, { size: 32, w: 800, c: pu ? C.ink : C.muted, a: m.a, align: p.k > 0.9 ? 'right' : 'center' });
  });
}

const VIS = { bars: vBars, rows: vRows, race: vRace, rider: vRider, flow: vFlow, curve: vCurve, text: (t, v, dy, a) => stack(t, v, dy, null), none: () => {} };

// popis aktu → funkce scény
function makeScene(s) {
  // „free“: scéna si kreslí sama celý čas aktu (souvislá jízda přes víc aktů, bez náběhu a odchodu aktu)
  if (s.type === 'free') return function (t, a) { s.draw(t, a); };
  if (s.type === 'hook') return function (t, a) { const ex = tw(t, a.end - 0.36, 0.36); ctx.save(); ctx.globalAlpha = 1 - ex; ctx.translate(0, -70 * ex); stack(t, s, 0, null); ctx.restore(); };
  return function (t, a) {
    const io = actIO(t, a); ctx.save(); ctx.globalAlpha = io.a;
    VIS[s.type](t, s, io.dy, a); if (s.draw) s.draw(t, a, io.dy); heads(t, s.heads, io.dy); pills(t, s.pills, io.dy);
    ctx.restore();
  };
}
// která simulovaná proudění video potřebuje a kdy běží (od prvního do posledního aktu, který je používá)
function makeFlows(V) {
  const use = {}, out = {};
  for (const id in V) if (V[id].type === 'flow') panelsOf(V[id]).forEach(p => (use[p.flow] = use[p.flow] || []).push(id));
  for (const n in use) { const ids = use[n]; out[n] = { count: n === 'rider' ? 3400 : 3000, from: () => ACT[ids[0]].start, to: () => ACT[ids[ids.length - 1]].end }; }
  return out;
}

// ---------- STYL (nepovinný): kamera z GSAP, efekty textu a pozadí podle Kokonut UI ----------
// V popisu videa: style: { hook: 'watt' (úvodní nápis watt+IF místo what+IF), camera: 'whip' | 'punch' | 'drift' | 'flip', text: 'words' | 'marker' | 'slot' | 'reveal' | 'flap' | 'glitch',
//   sub: 'typing', bg: 'dots' | 'halftone' | 'paths', overlay: 'wipe' }.
// GSAP (engine/vendor/gsap.min.js) tu slouží jako stroj na náběhy a časové osy: časové osy jsou pozastavené
// a pro každý snímek se jen posunou na čas t (seek), takže vykreslení po částech dá vždy stejný obraz.
const STY = () => (typeof STYLE === 'object' && STYLE) || {};
const ease = name => (typeof gsap !== 'undefined' ? gsap.parseEase(name) : E.expo);
// deterministická „náhoda“ ze zadaného čísla (bez skutečné náhody, kvůli renderu po částech)
const hash = n => { let x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// text s efektem podle stylu; kind = 'big' (hlavní číslo nebo slovo), 'title', 'sub'; at = čas, kdy text naskočí
function fxText(s, x, y, o, at, kind, t) {
  const st = STY(), mode = kind === 'sub' ? st.sub : st.text, dt = t - at;
  if (!mode || dt < 0 || (kind === 'sub' && mode !== 'typing') || (mode === 'typing' && kind === 'big') || (mode === 'flap' && kind !== 'big')) return txt(s, x, y, o);
  ctx.save(); ctx.font = font(o); ctx.letterSpacing = (o.ls || 0) + 'px'; const full = ctx.measureText(s).width; ctx.restore();
  const sc = o.s || 1, x0 = (o.align === 'left' ? x : o.align === 'right' ? x - full : x - full / 2);
  const base = Object.assign({}, o, { align: 'left', s: 1 });
  ctx.save();
  if (sc !== 1) { ctx.translate(x, y - o.size * 0.35); ctx.scale(sc, sc); ctx.translate(-x, -(y - o.size * 0.35)); }
  // kinetická slova (GSAP back.out): každé slovo vyskočí zdola s malým natočením, 70 ms po předchozím
  const kinetic = (b) => {
    const words = s.split(' '), e = ease('back.out(2.2)'); let cx = x0;
    words.forEach((w, i) => {
      const ww = width(w + (i < words.length - 1 ? ' ' : ''), o), lt = dt - i * 0.07, k = e(clamp(lt / 0.45)), a = clamp(lt / 0.12);
      if (a > 0) { ctx.save(); ctx.translate(cx, y + (1 - k) * 60); ctx.rotate((1 - k) * -0.12); ctx.scale(0.7 + 0.3 * k, 0.7 + 0.3 * k); txt(w, 0, 0, Object.assign({}, b, { a: (o.a == null ? 1 : o.a) * a })); ctx.restore(); }
      cx += ww;
    });
  };
  if (mode === 'words' && kind !== 'sub') kinetic(base);
  else if (mode === 'marker' && kind !== 'sub') {
    // zvýrazňovač (Kokonut Marker Text): pod velkým číslem nebo slovem se zleva natáhne fialový pruh, text na něm je křídový
    if (kind === 'big') {
      const k = ease('power3.out')(clamp((dt - 0.1) / 0.45)), pad = o.size * 0.16;
      if (k > 0) { ctx.save(); ctx.globalAlpha *= o.a == null ? 1 : o.a; ctx.fillStyle = C.pu; ctx.beginPath(); ctx.roundRect(x0 - pad, y - o.size * 0.84, (full + 2 * pad) * k, o.size * 1.04, o.size * 0.14); ctx.fill(); ctx.restore(); }
      kinetic(Object.assign({}, base, { c: C.ink }));
    } else kinetic(base);
  } else if (mode === 'slot' && kind !== 'sub') {
    // počítadlo (Kokonut Dynamic Text): číslice se protočí zdola jako válečky automatu, každá o 50 ms později (GSAP expo.out)
    if (kind === 'big') {
      const chars = [...s], lh = o.size * 1.05;
      chars.forEach((c, i) => {
        const cx = x0 + width(s.slice(0, i), o), cw = width(c, o) + 2, lt = dt - i * 0.05, e = ease('expo.out')(clamp(lt / 0.75)), a = (o.a == null ? 1 : o.a) * clamp(lt / 0.08);
        if (a <= 0) return;
        if (/[0-9]/.test(c)) {
          const steps = 10 + +c, pos = steps * e;
          ctx.save(); ctx.beginPath(); ctx.rect(cx - 2, y - o.size * 0.9, cw + 4, o.size * 1.18); ctx.clip();
          for (let k = Math.floor(pos) - 1; k <= Math.floor(pos) + 1; k++) if (k >= 0 && k <= steps) txt(String(k % 10), cx, y + (k - pos) * lh, Object.assign({}, base, { a, ls: 0 }));
          ctx.restore();
        } else txt(c, cx, y + (1 - e) * o.size * 0.5, Object.assign({}, base, { a, ls: 0 }));
      });
    } else kinetic(base);
  } else if (mode === 'reveal' && kind !== 'sub') {
    // odkrytí zpod linky: každé slovo vyjede zdola zpoza neviditelné hrany, 60 ms po předchozím (GSAP expo.out)
    const words = s.split(' '); let cx = x0;
    words.forEach((w, i) => {
      const ww = width(w + (i < words.length - 1 ? ' ' : ''), o), wo = width(w, o), lt = dt - i * 0.06, k = ease('expo.out')(clamp(lt / 0.6));
      if (lt > 0) { ctx.save(); ctx.beginPath(); ctx.rect(cx - o.size * 0.1, y - o.size * 1.0, wo + o.size * 0.2, o.size * 1.3); ctx.clip(); txt(w, cx, y + (1 - k) * o.size * 1.25, base); ctx.restore(); }
      cx += ww;
    });
  } else if (mode === 'typing') {
    // psaní po písmenech (Kokonut Typing Text) s fialovým kurzorem, 34 znaků za sekundu
    const n = Math.min(s.length, Math.floor(dt * 34)), part = s.slice(0, n), pw = width(part, o);
    txt(part, x0, y, base);
    if (n < s.length || Math.floor(dt * 2.5) % 2 === 0 && dt < s.length / 34 + 1.2) { ctx.save(); ctx.globalAlpha *= o.a == null ? 1 : o.a; ctx.fillStyle = C.pu; ctx.fillRect(x0 + pw + 4, y - o.size * 0.78, Math.max(4, o.size * 0.09), o.size * 0.92); ctx.restore(); }
  } else if (mode === 'flap') {
    // letištní tabule (Kokonut Split Flap Text): každé písmeno ve vlastní dlaždici se přetáčí k cíli.
    // Pro video zrychlené: nejvýš 8 lístků na písmeno po 30 ms, posun mezi písmeny 30 ms; dlaždice se vejdou do 820 px.
    const CH = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:.-/&!?', chars = [...s];
    let fo = Object.assign({}, o, { ls: 0, s: 1 });
    const layout = f => { const pad = f.size * 0.14, sp = f.size * 0.28; return chars.map(c => c === ' ' ? { w: sp, tile: false } : { w: width(c, f) + 2 * pad, tile: true }); };
    let L = layout(fo), tot = L.reduce((q, r) => q + r.w, 0) + (chars.length - 1) * fo.size * 0.05;
    if (tot > 820) { fo.size = Math.floor(fo.size * 820 / tot); L = layout(fo); tot = L.reduce((q, r) => q + r.w, 0) + (chars.length - 1) * fo.size * 0.05; }
    let cx = o.align === 'left' ? x : o.align === 'right' ? x - tot : x - tot / 2;
    chars.forEach((c, i) => {
      const up = c.toUpperCase(), ti = CH.indexOf(up), lt = dt - i * 0.03, from = Math.max(0, (ti < 0 ? 8 : ti) - 8), flips = Math.floor(lt / 0.03);
      const shown = lt < 0 ? ' ' : (ti < 0 ? (flips >= 8 ? c : CH[(from + flips) % CH.length]) : (from + flips >= ti ? c : CH[from + flips]));
      const a = (o.a == null ? 1 : o.a) * clamp(lt / 0.06 + 0.001);
      if (L[i].tile && a > 0) {
        ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = C.surf; ctx.strokeStyle = C.line2; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(cx, y - fo.size * 0.86, L[i].w, fo.size * 1.1, fo.size * 0.1); ctx.fill(); ctx.stroke();
        ctx.fillStyle = C.bg; ctx.fillRect(cx, y - fo.size * 0.32, L[i].w, Math.max(2, fo.size * 0.025)); ctx.restore();
        txt(shown, cx + L[i].w / 2, y, Object.assign({}, fo, { align: 'center', a }));
      }
      cx += L[i].w + fo.size * 0.05;
    });
  } else if (mode === 'glitch' && kind !== 'sub') {
    // signál s poruchou (Kokonut Glitch Text): při naskočení 6 snímků po 55 ms rozsekané do pruhů s posunem
    // a dvojitým obrysem; barvy kanálů z naší palety (fialová a křídová místo červené a azurové)
    const fr = Math.floor(dt / 0.055);
    if (fr >= 6) txt(s, x0, y, base);
    else {
      const bands = 4, top = y - o.size * 0.86, h = o.size * 1.1, seed = Math.round(at * 100) + fr * 7;
      for (let b = 0; b < bands; b++) {
        const y0 = top + h * b / bands, sh = (hash(seed + b) - 0.5) * o.size * 0.36 * (hash(seed + b + 50) < 0.3 ? 0 : 1);
        ctx.save(); ctx.beginPath(); ctx.rect(x0 - o.size, y0, full + 2 * o.size, h / bands + 1); ctx.clip();
        txt(s, x0 + sh - 4, y, Object.assign({}, base, { c: C.pu, a: (o.a == null ? 1 : o.a) * 0.9 }));
        txt(s, x0 + sh + 3, y, Object.assign({}, base, { c: C.muted, a: (o.a == null ? 1 : o.a) * 0.6 }));
        txt(s, x0 + sh, y, base); ctx.restore();
      }
    }
  } else txt(s, x, y, o);
  ctx.restore();
}

// pozadí: tečkové pole (Kokonut Dot Field) nebo polotón (Kokonut Halftone), jemně v pohybu, hustota podle síly pozadí aktu
function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi, s = v => v * v * (3 - 2 * v);
  const h = (a, b, c) => hash(a * 157 + b * 113 + c * 271);
  let r = 0; for (let dz = 0; dz < 2; dz++) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++)
    r += h(xi + dx, yi + dy, zi + dz) * (dx ? s(xf) : 1 - s(xf)) * (dy ? s(yf) : 1 - s(yf)) * (dz ? s(zf) : 1 - s(zf));
  return r;
}
function makeBackground(st) {
  return function (t, amb) {
    const k = clamp(amb / 0.34) * 0.9 + 0.1;
    if (st.bg === 'dots') {
      for (let y = 18; y < H; y += 36) for (let x = 18; x < W; x += 36) {
        const n = noise3(x / 240, y / 240, t * 0.35), wave = 0.5 + 0.5 * Math.sin(y / 140 - t * 1.6 + x / 400), v = clamp((n - 0.35) * 2.2) * 0.75 + wave * 0.25;
        ctx.globalAlpha = (0.05 + 0.32 * v) * k; ctx.fillStyle = v > 0.72 ? C.pu : C.ink; ctx.beginPath(); ctx.arc(x, y, 1.6 + 1.6 * v, 0, 7); ctx.fill();
      }
    } else if (st.bg === 'paths') {
      // plující čáry (Kokonut Background Paths): 28 vlnovek přes celou výšku, každá se pomalu vlní jinou fází
      ctx.lineWidth = 1.6;
      for (let j = 0; j < 28; j++) {
        const y0 = 80 + j * 66; ctx.beginPath();
        for (let x = -20; x <= W + 20; x += 20) { const yy = y0 + 60 * Math.sin(x / 260 + t * 0.35 + j * 0.7) + 26 * Math.sin(x / 115 - t * 0.5 + j); if (x < 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); }
        ctx.globalAlpha = (j % 7 === 3 ? 0.22 : 0.09) * k; ctx.strokeStyle = j % 7 === 3 ? C.pu : C.ink; ctx.stroke();
      }
    } else if (st.bg === 'halftone') {
      const step = 26;
      for (let y = 0; y < H + step; y += step) for (let x = (y / step % 2) * step / 2; x < W + step; x += step) {
        const d1 = Math.hypot(x - 540 - 260 * Math.sin(t * 0.35), y - 620 - 180 * Math.cos(t * 0.27)), d2 = Math.hypot(x - 300 - 200 * Math.cos(t * 0.21), y - 1400);
        const v = clamp(1 - Math.min(d1 / 620, d2 / 520));
        if (v < 0.04) continue;
        ctx.globalAlpha = 0.28 * k; ctx.fillStyle = v > 0.6 ? C.pu : C.line2; ctx.beginPath(); ctx.arc(x, y, step * 0.46 * Math.sqrt(v), 0, 7); ctx.fill();
      }
    }
  };
}

// kamera z GSAP: pozastavená časová osa nad obyčejným objektem {x, y, s, r}, pro snímek se posune na čas t
function makeCamera(st, V) {
  let tl = null; const cam = { x: 0, y: 0, s: 1, r: 0, sx: 1 };
  const build = () => {
    tl = gsap.timeline({ paused: true });
    TL.acts.forEach((a, i) => {
      if (st.camera === 'whip' && i > 0) {
        // švihnutí do nového aktu: ze strany (střídavě), s pootočením, doběh expo.out
        const d = i % 2 ? 1 : -1;
        tl.fromTo(cam, { x: 260 * d, r: 0.035 * d }, { x: 0, r: 0, duration: 0.5, ease: 'expo.out', immediateRender: false }, a.start);
      }
      if (st.camera === 'flip' && i > 0) {
        // nový akt se otočí jako karta: scéna se roztáhne z úzkého proužku, s malým překmitem (GSAP back.out)
        tl.fromTo(cam, { sx: 0.03 }, { sx: 1, duration: 0.55, ease: 'back.out(1.4)', immediateRender: false }, a.start);
      }
      if (st.camera === 'whip' || st.camera === 'drift' || st.camera === 'flip') {
        // pomalé přiblížení během aktu (push-in)
        tl.fromTo(cam, { s: 1 }, { s: st.camera === 'drift' ? 1.012 : 1.018, duration: Math.max(0.5, a.end - a.start), ease: 'power1.inOut', immediateRender: false }, a.start);
      }
      if (st.camera === 'drift') tl.fromTo(cam, { y: 14 }, { y: -14, duration: Math.max(0.5, a.end - a.start), ease: 'sine.inOut', immediateRender: false }, a.start);
    });
    if (st.camera === 'punch') {
      // „úder“ kamery ve chvíli, kdy naskočí velké číslo nebo slovo: přiblížení a pružný návrat (elastic.out)
      const hits = [];
      for (const id in V) { (V[id].heads || []).forEach(h => { if (h.big) hits.push(TR(h.bigAt || h.at)); }); (V[id].items || []).forEach(it => { if (it.big) hits.push(it.at ? TR(it.at) : cs(V[id].line, it.i)); }); }
      hits.sort((p, q) => p - q).forEach((h, i) => { if (i && h - hits[i - 1] < 0.6) return; tl.fromTo(cam, { s: 1.015, r: (i % 2 ? 1 : -1) * 0.004 }, { s: 1, r: 0, duration: 0.8, ease: 'elastic.out(1, 0.45)', immediateRender: false }, h); });
    }
  };
  return function (t) { if (!tl) build(); tl.seek(t, false); return cam; };
}

// překryv: fialový pruh přes celý obraz přejede zleva doprava a zakryje střih mezi akty (GSAP power3.inOut)
function makeOverlay(st) {
  return function (t) {
    if (st.overlay !== 'wipe') return;
    const e = ease('power3.inOut');
    TL.acts.forEach((a, i) => {
      if (!i) return; const u = (t - (a.start - 0.32)) / 0.64; if (u <= 0 || u >= 1) return;
      const left = -W + 2 * W * e(u);
      const out = typeof OUTDOOR === 'function' && OUTDOOR();   // venkovní vzhled formátu ride: žlutý pruh
      ctx.fillStyle = out ? '#FFD23F' : C.pu; ctx.fillRect(left, 0, W, H); ctx.fillStyle = out ? '#17191B' : C.ink; ctx.fillRect(left + W - 4, 0, 14, H);
    });
  };
}
