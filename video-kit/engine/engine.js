'use strict';
// MOTOR pro vysvětlovací aero videa: 1080 × 1920, 30 fps. Vše se kreslí do jednoho canvasu,
// snímek po snímku (deterministicky), aby šlo video vyrenderovat po částech.
// TENTO SOUBOR PRO NOVÉ VIDEO NEMĚŇ. Mění se jen ../script.json a ../scenes.js.
const W = 1080, H = 1920, FPS = 30;
const C = { bg: '#17191B', ink: '#E4E3DE', pu: '#8B3DFF', muted: '#9A9A98', surf: '#232526', line: '#353738', line2: '#454647' };
const RGB = { ink: [228, 227, 222], pu: [139, 61, 255], bg: [23, 25, 27], surf: [35, 37, 38], muted: [154, 154, 152] };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const mix = (a, b, k) => `rgb(${Math.round(lerp(a[0], b[0], k))},${Math.round(lerp(a[1], b[1], k))},${Math.round(lerp(a[2], b[2], k))})`;
// Pohyb: rychlý nástup, pomalé dorovnání (žádný lineární pohyb)
const E = {
  expo: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
  quint: t => 1 - Math.pow(1 - t, 5),
  back: t => { const c1 = 1.45, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
};
const tw = (t, s, d, e = E.expo) => e(clamp((t - s) / d));
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

let TL, ACT = {}, L, cv, ctx, tmp, tctx, riderImg, logoImg, FLOW = {}, lastFrame = -999;
const F = { U: 'Unbounded', I: 'Inter' };

// ---------- text ----------
function font(o) { return `${o.w || 700} ${o.size}px ${o.f || F.I}`; }
function txt(s, x, y, o) {
  ctx.save(); ctx.font = font(o); ctx.letterSpacing = (o.ls || 0) + 'px'; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'alphabetic';
  ctx.globalAlpha *= o.a == null ? 1 : o.a; ctx.fillStyle = o.c || C.ink;
  if (o.s != null && o.s !== 1) { ctx.translate(x, y - o.size * 0.35); ctx.scale(o.s, o.s); ctx.translate(-x, -(y - o.size * 0.35)); }
  // hlídač přetečení: text, který je vidět a sahá mimo obraz, se zapíše do window.OVER
  // při swipe (window.CAM.x > 0) texty nového aktu přijíždějí zprava zvenku obrazu, to není přetečení
  if (ctx.globalAlpha > 0.6 && !(window.CAM && window.CAM.x > 0)) { const m = ctx.getTransform(), w = ctx.measureText(s).width, al = o.align || 'center', l = al === 'left' ? x : al === 'right' ? x - w : x - w / 2, X0 = m.a * l + m.c * y + m.e, X1 = m.a * (l + w) + m.c * y + m.e; if (X0 < 10 || X1 > W - 10) window.OVER[s] = lastFrame + 1; }
  ctx.fillText(s, x, y); ctx.restore();
}
function width(s, o) { ctx.save(); ctx.font = font(o); ctx.letterSpacing = (o.ls || 0) + 'px'; const w = ctx.measureText(s).width; ctx.restore(); return w; }
// víc barev v jednom řádku, zarovnáno na střed
function rich(parts, x, y, o) {
  const ws = parts.map(p => width(p[0], o)), tot = ws.reduce((a, b) => a + b, 0); let cx = x - tot / 2;
  ctx.save(); if (o.s != null && o.s !== 1) { ctx.translate(x, y - o.size * 0.35); ctx.scale(o.s, o.s); ctx.translate(-x, -(y - o.size * 0.35)); }
  parts.forEach((p, i) => { txt(p[0], cx, y, Object.assign({}, o, { align: 'left', c: p[1], s: 1 })); cx += ws[i]; }); ctx.restore();
}
// vstup zdola s dorovnáním + odchod nahoru
function pop(t, tin, tout, d = 0.55) { const k = tw(t, tin, d), o = tout == null ? 0 : tw(t, tout, 0.34); return { a: clamp((t - tin) / 0.16) * (1 - o), dy: (1 - k) * 46 - o * 40, k, o }; }
function popS(t, tin, tout, d = 0.6) { const k = tw(t, tin, d, E.back), o = tout == null ? 0 : tw(t, tout, 0.34); return { a: clamp((t - tin) / 0.14) * (1 - o), s: lerp(0.62, 1, k) * (1 - 0.12 * o), dy: -o * 40 }; }
function pill(s, x, y, o) {
  const fo = { size: o.size || 38, w: 800, f: F.I, ls: o.ls || 1 }, w = width(s, fo) + 52, h = fo.size + 30;
  ctx.save(); ctx.globalAlpha *= o.a == null ? 1 : o.a; ctx.translate(x, y); ctx.scale(o.s || 1, o.s || 1);
  ctx.fillStyle = o.bg || C.pu; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, h / 2); ctx.fill();
  txt(s, 0, fo.size * 0.36, Object.assign(fo, { c: o.c || C.ink })); ctx.restore(); return w;
}
function arrow(x, y, len, col, a) { ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.moveTo(x + len - 16, y - 14); ctx.lineTo(x + len, y); ctx.lineTo(x + len - 16, y + 14); ctx.stroke(); ctx.restore(); }

// ---------- proudění: částice unášené simulovaným rychlostním polem ----------
class Flow {
  constructor(meta, fields, mask, o) {
    Object.assign(this, { m: meta, f: fields, mask, nx: meta.nx, ny: meta.ny, px: 3, count: o.count, seed: o.seed, analytic: o.analytic || null, fade: o.fade || 0.085, lw: o.lw || 2.1 });
    this.c = document.createElement('canvas'); this.c.width = this.nx * 3; this.c.height = this.ny * 3; this.g = this.c.getContext('2d');
    this.NB = 10; this.cols = []; for (let i = 0; i < this.NB; i++) { const k = i / (this.NB - 1); this.cols.push([mix(RGB.pu, RGB.ink, k), lerp(0.95, 0.5, k)]); }
    this.reset();
  }
  reset() {
    this.r = rng(this.seed); const n = this.count; this.x = new Float32Array(n); this.y = new Float32Array(n); this.age = new Int16Array(n); this.life = new Int16Array(n);
    for (let i = 0; i < n; i++) this.spawn(i, true); this.g.clearRect(0, 0, this.c.width, this.c.height);
  }
  solid(x, y) { if (!this.mask) return false; const i = x | 0, j = y | 0; return i >= 0 && j >= 0 && i < this.nx && j < this.ny && this.mask[j * this.nx + i] === 1; }
  spawn(i, init) { let x, y, k = 0; do { x = this.r() * (this.nx - 1); y = this.r() * (this.ny - 1); } while (this.solid(x, y) && ++k < 20); this.x[i] = x; this.y[i] = y; this.life[i] = 45 + this.r() * 75; this.age[i] = init ? this.r() * this.life[i] : 0; }
  vel(fi, x, y, out) {
    if (this.analytic) return this.analytic(fi, x, y, out);
    const nx = this.nx, ny = this.ny, i = Math.min(nx - 2, Math.max(0, x | 0)), j = Math.min(ny - 2, Math.max(0, y | 0)), a = clamp(x - i), b = clamp(y - j);
    const o = ((fi * ny + j) * nx + i) * 2, o2 = o + nx * 2, f = this.f;
    out[0] = ((f[o] * (1 - a) + f[o + 2] * a) * (1 - b) + (f[o2] * (1 - a) + f[o2 + 2] * a) * b) / this.m.q;
    out[1] = ((f[o + 1] * (1 - a) + f[o + 3] * a) * (1 - b) + (f[o2 + 1] * (1 - a) + f[o2 + 3] * a) * b) / this.m.q;
  }
  step(k) {
    const fi = this.analytic ? k : k % this.m.loop, g = this.g, px = this.px, dt = this.m.stride / 2, U = this.m.U, v = [0, 0];
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = `rgba(0,0,0,${this.fade})`; g.fillRect(0, 0, this.c.width, this.c.height); g.globalCompositeOperation = 'source-over';
    const paths = []; for (let b = 0; b < this.NB; b++) paths.push(new Path2D());
    for (let i = 0; i < this.count; i++) {
      const x0 = this.x[i], y0 = this.y[i]; let x = x0, y = y0, sp = 0;
      for (let s = 0; s < 2; s++) { this.vel(fi, x, y, v); x += v[0] * dt; y += v[1] * dt; sp = Math.hypot(v[0], v[1]); }
      if (++this.age[i] > this.life[i] || x < 0 || x > this.nx - 1 || y < 0 || y > this.ny - 1 || this.solid(x, y)) { this.spawn(i, false); continue; }
      this.x[i] = x; this.y[i] = y;
      const s = clamp((sp / U - 0.30) / 0.55), b = Math.min(this.NB - 1, (s * s * (3 - 2 * s) * this.NB) | 0), fadeIn = Math.min(1, this.age[i] / 6);
      if (fadeIn < 1 && this.r() > fadeIn) continue;
      paths[b].moveTo(x0 * px, y0 * px); paths[b].lineTo(x * px, y * px);
    }
    g.lineWidth = this.lw; g.lineCap = 'round';
    for (let b = 0; b < this.NB; b++) { g.strokeStyle = this.cols[b][0]; g.globalAlpha = this.cols[b][1]; g.stroke(paths[b]); }
    g.globalAlpha = 1;
  }
}
function drawShape(g, fl, cropY) {
  const sh = fl.m.shape; g.save(); g.translate(0, -cropY); g.lineJoin = 'round';
  if (sh.type === 'circle') { g.beginPath(); g.arc(sh.cx * 3, sh.cy * 3, sh.r * 3 - 3, 0, 7); g.fillStyle = C.bg; g.fill(); g.lineWidth = 8; g.strokeStyle = C.ink; g.stroke(); }
  else if (sh.type === 'naca') {
    const up = [], dn = [];
    for (let i = 0; i <= 60; i++) { const xs = (1 - Math.cos(Math.PI * i / 60)) / 2, yt = 5 * sh.t * sh.c * (0.2969 * Math.sqrt(xs) - 0.1260 * xs - 0.3516 * xs * xs + 0.2843 * xs ** 3 - 0.1036 * xs ** 4); up.push([(sh.x0 + xs * sh.c) * 3, (sh.cy - yt) * 3]); dn.push([(sh.x0 + xs * sh.c) * 3, (sh.cy + yt) * 3]); }
    g.beginPath(); up.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); dn.reverse().forEach(p => g.lineTo(p[0], p[1])); g.closePath();
    g.fillStyle = C.bg; g.fill(); g.lineWidth = 8; g.strokeStyle = C.ink; g.stroke();
  } else if (sh.type === 'rider') { g.translate((sh.OX + 512 * sh.K) * 3, sh.OY * 3); g.scale(-3 * sh.K, 3 * sh.K); g.drawImage(riderImg, 0, 0, 512, 512); }
  g.restore();
}
// panel s prouděním: výřez na střed, měkké okraje nahoře a dole
function panel(fl, cy, h, alpha, extra) {
  if (alpha <= 0.003) return; const full = fl.ny * 3; h = Math.min(h, full); const cropY = (full - h) / 2;
  tctx.clearRect(0, 0, W, full); tctx.globalCompositeOperation = 'source-over'; tctx.globalAlpha = 1;
  tctx.drawImage(fl.c, 0, cropY, W, h, 0, 0, W, h); drawShape(tctx, fl, cropY); if (extra) extra(tctx, cropY);
  const gr = tctx.createLinearGradient(0, 0, 0, h), e = 46 / h; gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(e, 'rgba(0,0,0,1)'); gr.addColorStop(1 - e, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  tctx.globalCompositeOperation = 'destination-in'; tctx.fillStyle = gr; tctx.fillRect(0, 0, W, h); tctx.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.globalAlpha *= alpha; ctx.drawImage(tmp, 0, 0, W, h, 0, cy - h / 2, W, h); ctx.restore();
}

// ---------- jezdec zepředu (čelní plocha) ----------
const fr = document.createElement('canvas'); fr.width = 720; fr.height = 900; const fg = fr.getContext('2d');
function frontRider(cx, ground, s, p, fill, alpha) {
  // časovkář zepředu: helma, ramena, lokty na nástavcích (předloktí míří k sobě), řídítka, přední kolo, nohy
  const shY = -640 + 82 * p.back, shW = 148 - 18 * p.elbows, elW = 112 - 62 * p.elbows, elY = shY + 158 - 16 * p.back, hdY = shY - 62 + 64 * p.head, hry = 86 - 8 * p.head, hx = 15, hy = elY - 40;
  const caps = [[-56, -430, -80, -80, 36], [56, -430, 84, -215, 36], [84, -215, 78, -150, 30], [-(shW - 24), shY + 16, -elW, elY, 30], [shW - 24, shY + 16, elW, elY, 30],
    [-elW, elY, -hx, hy, 25], [elW, elY, hx, hy, 25], [-112, -392, 112, -392, 9]];
  const torso = [[-(shW - 20), shY + 20], [shW - 20, shY + 20], [78, -440], [-78, -440]];
  fg.setTransform(1, 0, 0, 1, 0, 0); fg.clearRect(0, 0, 720, 900); fg.translate(360, 870); fg.lineCap = 'round'; fg.lineJoin = 'round';
  for (const pass of [0, 1]) {
    const ex = pass ? 0 : 16; fg.strokeStyle = fg.fillStyle = pass ? fill : C.ink;
    fg.beginPath(); fg.roundRect(-17 - ex / 2, -330 - ex / 2, 34 + ex, 330 + ex, 17 + ex / 2); fg.fill();
    for (const c of caps) { fg.lineWidth = 2 * c[4] + ex; fg.beginPath(); fg.moveTo(c[0], c[1]); fg.lineTo(c[2], c[3]); fg.stroke(); }
    fg.lineWidth = 40 + ex; fg.beginPath(); torso.forEach((q, i) => i ? fg.lineTo(q[0], q[1]) : fg.moveTo(q[0], q[1])); fg.closePath(); fg.stroke(); fg.fill();
    fg.beginPath(); fg.ellipse(0, hdY, 76 + ex / 2, hry + ex / 2, 0, 0, 7); fg.fill();
  }
  // jemné vnitřní linky: předloktí na nástavcích a spodní hrana helmy
  fg.strokeStyle = 'rgba(23,25,27,0.42)'; fg.lineWidth = 7;
  for (const sg of [-1, 1]) { fg.beginPath(); fg.moveTo(sg * (elW - 4), elY - 22); fg.lineTo(sg * (hx + 4), hy - 20); fg.moveTo(sg * (hx + 2), hy + 16); fg.lineTo(sg * (hx + 2), -400); fg.stroke(); }
  fg.beginPath(); fg.ellipse(0, hdY, 76, hry, 0, 0.18 * Math.PI, 0.82 * Math.PI); fg.stroke();
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(cx, ground); ctx.scale(s, s); ctx.drawImage(fr, -360, -870); ctx.restore();
}

// ---------- pomůcky pro scény ----------
const cs = (key, i) => L[key].chunks[i].start;   // čas začátku i-tého titulku věty
const actIO = (t, a) => { const en = tw(t, a.start, 0.6), ex = tw(t, a.end - 0.36, 0.36); return { en, ex, a: clamp((t - a.start) / 0.2) * (1 - ex), dy: (1 - en) * 60 - ex * 50 }; };

function captions(t) {
  for (const key in L) {
    if (L[key].captions === false) continue;
    for (const c of L[key].chunks) if (t >= c.start && t < c.end) {
      const k = tw(t, c.start, 0.22), fo = { size: 58, w: 800, f: F.I }, w = width(c.text, fo) + 60, y = 1468 + (1 - k) * 16;
      ctx.save(); ctx.globalAlpha = clamp((t - c.start) / 0.07); ctx.fillStyle = 'rgba(23,25,27,0.78)'; ctx.beginPath(); ctx.roundRect(540 - w / 2, y - 62, w, 88, 22); ctx.fill();
      txt(c.text, 540, y, fo); ctx.restore(); return;
    }
  }
}

// ---------- krok simulace částic a vykreslení snímku ----------
const LEAD = 1.3, ZOOM = 1.2;
window.OVER = {};
function layerFrame(t, start) { return Math.round((t - (start - LEAD)) * FPS); }
function stepAll(f) {
  const t = f / FPS; FLOW.amb.step(f);
  for (const n in FLOWS) { const s = FLOWS[n].from(), e = FLOWS[n].to(); if (t >= s - LEAD && t <= e) FLOW[n].step(layerFrame(t, s)); }
}
// přesné přehrání od začátku: části renderované zvlášť na sebe navazují beze švu
window.prepare = f0 => { Object.values(FLOW).forEach(fl => fl.reset()); for (let f = 0; f < f0; f++) stepAll(f); lastFrame = f0 - 1; };
window.renderFrame = f => {
  // dopředu se jen dopočítají kroky částic; zpět (nebo na začátku) se přehraje od nuly
  if (f <= lastFrame || lastFrame < -1) window.prepare(f); else for (let k = lastFrame + 1; k < f; k++) stepAll(k);
  stepAll(f); lastFrame = f; const t = f / FPS;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  let amb = 0; for (const a of TL.acts) if (t >= a.start && t < a.end) { const en = clamp((t - a.start) / 0.5), prev = TL.acts[TL.acts.indexOf(a) - 1]; amb = lerp(prev ? AMBIENT[prev.id] : AMBIENT[a.id], AMBIENT[a.id], en); }
  if (amb > 0.003 && typeof BACKGROUND !== 'function') { ctx.globalAlpha = amb; ctx.drawImage(FLOW.amb.c, 0, 0); ctx.globalAlpha = 1; }
  // vlastní pozadí scén (nepovinné): BACKGROUND(t, síla) místo jemného proudu vzduchu
  if (typeof BACKGROUND === 'function') { ctx.save(); BACKGROUND(t, amb); ctx.restore(); ctx.globalAlpha = 1; }
  // zvětšení celé scény, aby vyplnila výšku obrazovky 9:16
  ctx.save(); ctx.translate(540, 905); ctx.scale(ZOOM, ZOOM); ctx.translate(-540, -905);
  // kamera (nepovinné): CAMERA(t) vrací {x, y, s, r}; pohybuje scénou, titulky zůstávají v klidu
  ctx.save();
  if (typeof CAMERA === 'function') { const c = CAMERA(t) || {}; ctx.translate(540 + (c.x || 0), 905 + (c.y || 0)); ctx.rotate(c.r || 0); ctx.scale((c.s || 1) * (c.sx == null ? 1 : c.sx), (c.s || 1) * (c.sy == null ? 1 : c.sy)); ctx.translate(-540, -905); }
  for (const a of TL.acts) if (t >= a.start && t < a.end) {
    // swipe (kamera vrací swipe a x > 0): vlevo vedle nového aktu se ještě kreslí celý předchozí akt (o viditelnou šířku 900),
    // aby odjíždějící obraz vypadal přesně jako před přechodem
    const c = typeof CAMERA === 'function' ? CAMERA(t) || {} : {}, pa = TL.acts[TL.acts.indexOf(a) - 1];
    if (c.swipe && c.x > 0 && pa) { ctx.save(); ctx.translate(-900, 0); SCENES[pa.id](t, pa); ctx.restore(); }
    SCENES[a.id](t, a);
  }
  ctx.restore();
  // titulky: vlastní podoba (nepovinné), jinak dole na tmavém podkladu
  if (typeof CAPTIONS === 'function') CAPTIONS(t); else captions(t);
  ctx.restore();
  // překryv přes celý obraz (nepovinné): OVERLAY(t), třeba stírací přechod mezi akty
  if (typeof OVERLAY === 'function') { ctx.save(); OVERLAY(t); ctx.restore(); ctx.globalAlpha = 1; }
  const vg = ctx.createRadialGradient(540, 900, 520, 540, 960, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.42)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  return true;
};
window.frameJPEG = f => { window.renderFrame(f); return cv.toDataURL('image/jpeg', 0.94); };

async function bin(u, T) { return new T(await (await fetch(u)).arrayBuffer()); }
function img(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
window.setup = async () => {
  // 3D jezdci (formát ride): počkat na načtení modelu člověka; stránka bez 3D nic nečeká
  if (window.RIDE3D_READY) await window.RIDE3D_READY;
  cv = document.getElementById('c'); ctx = cv.getContext('2d'); tmp = document.createElement('canvas'); tmp.width = W; tmp.height = 760; tctx = tmp.getContext('2d');
  TL = await (await fetch('../work/timeline.json')).json(); L = TL.lines; TL.acts.forEach(a => ACT[a.id] = a);
  for (const a of TL.acts) { if (!SCENES[a.id]) throw new Error('scenes.js: chybí scéna pro akt "' + a.id + '"'); if (AMBIENT[a.id] == null) throw new Error('scenes.js: chybí AMBIENT pro akt "' + a.id + '"'); }
  await Promise.all(['700 80px Unbounded', '800 80px Unbounded', '600 40px Inter', '700 40px Inter', '800 40px Inter'].map(f => document.fonts.load(f, 'Aa09% ×½…−·~²')));
  const art = await (await fetch('../work/rider-art.svg.txt')).text();
  riderImg = await img('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1024" height="1024">${art}</svg>`));
  logoImg = await img('../work/icon-512.png');
  for (const n in FLOWS) { const m = await (await fetch(`../work/sim/${n}.json`)).json(); FLOW[n] = new Flow(m, await bin(`../work/sim/${n}.bin`, Int8Array), await bin(`../work/sim/${n}-mask.bin`, Uint8Array), { count: FLOWS[n].count || 3000, seed: 11 + n.length }); }
  const U = 0.1; FLOW.amb = new Flow({ nx: 360, ny: 640, U, q: 1, stride: 46, loop: 1e9 }, null, null, { count: 620, seed: 5, fade: 0.045, lw: 1.7, analytic: (k, x, y, o) => { o[0] = U * (0.86 + 0.1 * Math.sin(y / 61 + k * 0.012)); o[1] = U * 0.085 * Math.sin(x / 47 + y / 83 + k * 0.021); } });
  window.TOTAL = TL.frames; return TL.frames;
};
