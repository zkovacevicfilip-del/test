// ---------- JÍZDA: 3D jezdci na kole, silnice, proudnice a titulky nahoře ----------
// Formát „ride“ (podle vzorových reels, ale vlastní 3D postavy v naší paletě): časovkáři z modelu člověka MakeHuman
// se šlapáním a točícími se koly (engine/rider3d.mjs, three.js), štítky s čísly přichycené k jezdcům, silnice nebo svah, proudnice vzduchu kolem těla
// a titulky nahoře se zvýrazněným slovem. Souřadnice jezdce: počátek na zemi mezi koly, 1 jednotka = 1 px (asi 210 na metr).

// kostra jezdce v dané poloze (z engine/rider3d.mjs, časovkářské polohy) v souřadnicích plátna (y dolů):
// kyčel, rameno, hlava; slouží pro proudnice (kde je tělo). Poloha 0 = vzpřímeně na základním řídítku,
// 1 = v aero nástavcích, 2 = nejnižší (sjezd, hlava dole).
function riderBones(pose) {
  const b = window.RIDE3D.bones(pose || 0), f = p => [p[0], -p[1]];
  return { hip: f(b.hip), sh: f(b.sh), hc: f(b.hc) };
}
// venkovní vzhled (STYLE.look: 'day', 'golden', 'overcast'): skutečná krajina, bílé titulky s černým obrysem a žlutým
// zvýrazněním, bílé a žluté štítky, bílé proudnice (podle vzorového videa od autora z 21. 11. 2026)
const OUTDOOR = () => (typeof STYLE !== 'undefined' && STYLE.look) || null;
const YEL = '#FFD23F', DARK = '#17191B';
// texty ve venkovním stylu (bílá a žlutá); se style.ui = 'classic' zůstane krajina realistická, ale texty jsou jako
// v původní šabloně What if (barvy C, nadpisy nahoře, titulky dole), autor 22. 11. 2026
const CLASSIC = () => typeof STYLE !== 'undefined' && STYLE.ui === 'classic';
const TXTOUT = () => !!OUTDOOR() && !CLASSIC();
// ---------- 3D scéna ----------
// cfg: { cam: { pos: [x, y, z], look: [x, y, z], fov }, road: { lanes: [z…], z0, z1 }, riders: { A: { kit, over, z } }, rim }
// jedna scéna na celé video (vytvoří se při prvním snímku); between() = kreslení mezi silnicí a jezdci; state: { dist, slope (stupně), riders: { A: { x, pose, crank, wheel, dir } } }
const R3 = { st: null };
function scene3d(cfg, state, between) {
  const K = window.RIDE3D; if (!K) throw new Error('3D jezdci se nenačetli (engine/three-boot.mjs)');
  if (!R3.st) {
    const look = cfg.look || OUTDOOR();
    const st = K.makeStage(1080, 1920, { fov: cfg.cam.fov || 40, rim: cfg.rim, shadow: cfg.shadow, look });
    st.cam.position.set(...cfg.cam.pos); st.cam.lookAt(...cfg.cam.look);
    const road = K.makeRoad(Object.assign({ outdoor: !!look }, cfg.road || {})); st.world.add(road.group);
    if (look) { R3.env = K.makeOutdoor(cfg.road || {}, st.look); st.world.add(R3.env.group); }
    const riders = {}; for (const id in cfg.riders) { const r = cfg.riders[id], m = K.makeRider(r.kit || 'white', r.over); m.root.position.z = r.z || 0; st.world.add(m.root); riders[id] = m; }
    R3.st = st; R3.road = road; R3.riders = riders;
  }
  const st = R3.st; R3.road.update(state.dist || 0); if (R3.env) R3.env.update(state.dist || 0); st.world.rotation.z = (state.slope || 0) * Math.PI / 180;
  for (const id in R3.riders) { const m = R3.riders[id], s = state.riders[id] || {}; m.root.visible = s.hide !== true; m.root.position.x = s.x || 0; m.root.rotation.y = s.dir < 0 ? Math.PI : 0; m.update(s); }
  // 3D obraz 1:1 na obrazovku (scény se kreslí ve zvětšení ZOOM kolem 540, 905, proto zpětný přepočet)
  const X = 540 - 540 / ZOOM, Y = 905 - 905 / ZOOM, put = () => ctx.drawImage(st.canvas, X, Y, 1080 / ZOOM, 1920 / ZOOM);
  // dva průchody: silnice (se stíny jezdců), pak proudnice (between), pak jezdci, aby proudnice byly nad silnicí a za jezdci
  st.world.updateMatrixWorld(true); st.render(2); put(); if (between) between(); st.render(0); put();
  // ztlumení (state.a < 1): tmavá vrstva přes celou scénu, jezdci neprůhlední
  if (state.a != null && state.a < 1) { ctx.save(); ctx.globalAlpha = 1 - state.a; ctx.fillStyle = C.bg; ctx.fillRect(X, Y, 1080 / ZOOM, 1920 / ZOOM); ctx.restore(); }
}
// bod jezdce (v jeho souřadnicích, y nahoru) → bod ve scéně (pro štítky a proudnice)
function at3d(id, p) {
  const st = R3.st, m = R3.riders[id]; if (!st) return [540, 905];
  st.world.updateMatrixWorld(true); const v = new window.RIDE3D.THREE.Vector3(p[0], p[1], p[2] || 0).applyMatrix4(m.root.matrixWorld).project(st.cam);
  const sx = (v.x + 1) / 2 * 1080, sy = (1 - v.y) / 2 * 1920; return [540 + (sx - 540) / ZOOM, 905 + (sy - 905) / ZOOM];
}
// měřítko jezdce ve scéně (px na jednotku) podle průmětu 100 jednotek podél kola
function scale3d(id) { const a = at3d(id, [0, 0]), b = at3d(id, [100, 0]); return Math.hypot(b[0] - a[0], b[1] - a[1]) / 100; }
// štítek nad helmou 3D jezdce
// side 'left': štítek vlevo nad hlavou se šikmou čárkou (když přímo nad hlavou překáží jiný jezdec)
function tag3d(id, pose, text, t, at, out, o) {
  o = o || {}; const top = R3.riders[id].top(), p = at3d(id, [R3.riders[id].head().x, top + 14]);
  // u pravého okraje štítek posunout dovnitř obrazu (viditelná část scény je x 90 až 990)
  const pw = width(text, { size: o.size || 36, w: 800, f: F.I, ls: 0 }) + 52, px = Math.min(p[0], 990 - pw / 2 - 14);
  if (o.side !== 'left') { tagAt(text, px, p[1] - 40, Object.assign({ t, at, out, line: 34 }, o)); return; }
  const q = popS(t, at, out); if (q.a <= 0) return;
  const hd = R3.riders[id].head(), h = at3d(id, [hd.x, top - 6]), x = h[0] - 120, y = h[1] - 70;
  ctx.save(); ctx.globalAlpha *= q.a; ctx.strokeStyle = o.c === 'pu' ? C.pu : C.line2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 40, y + 24); ctx.lineTo(h[0] - 8, h[1] - 6); ctx.stroke(); ctx.restore();
  pill(text, x, y, { a: q.a, s: q.s, size: o.size || 36, ls: 0, bg: o.c === 'pu' ? C.pu : C.surf, c: C.ink });
}
// proudnice kolem 3D jezdce (2D za ním, natočené podle průmětu)
function air3d(id, t, rel, wake, pose, a, dir) {
  const g = at3d(id, [0, 0]), sc = scale3d(id); ctx.save();
  if (dir < 0) { ctx.translate(g[0], 0); ctx.scale(-1, 1); ctx.translate(-g[0], 0); }   // jezdec jede doleva: proudnice zrcadlově
  drawAir(g[0], g[1], sc, t, rel, wake, pose, a); ctx.restore();
}

// proudnice kolem jezdce (v jeho souřadnicích): hustý „větrný tunel“ jako ve vzoru, čáry obtékají tělo,
// za zády se vlní (wake 0–1 = míra víření), rel = rychlost vzduchu proti jezdci (px/s); a = průhlednost
function drawAir(x, ground, sc, t, rel, wake, pose, a) {
  const B = riderBones(pose), hip = B.hip, sh = B.sh;
  const cx = (hip[0] + sh[0]) / 2 + 24, cy = (hip[1] + sh[1]) / 2 - 6, rx = 118, ry = 34 + Math.abs(sh[1] - hip[1]) * 0.55, top = B.hc[1] - 40;
  ctx.save(); ctx.translate(x, ground); ctx.scale(sc, sc); ctx.globalAlpha *= a == null ? 1 : a; ctx.lineCap = 'round';
  const N = 30, X0 = 620 / sc, X1 = -620 / sc;
  for (let j = 0; j < N; j++) {
    const y0 = top - 30 + j * ((-30 - (top - 30)) / (N - 1)), h = hash(j * 7.31 + 1.7), h2 = hash(j * 3.17 + 9.1);
    const dash = 60 + h * 160, gap = 40 + h2 * 120, off = ((t * rel * (0.9 + h * 0.25) + h2 * 900) % (dash + gap) + (dash + gap)) % (dash + gap);
    ctx.beginPath();
    for (let xx = X0, s = 0; xx >= X1; xx -= 12, s++) {
      const dx = (xx - cx) / rx, dy = (y0 - cy) / ry, r2 = dx * dx + dy * dy;
      let yy = y0;
      if (r2 < 5) { const push = Math.exp(-r2 * 0.85) * ry * 0.9; yy += (y0 < cy ? -push : push * 0.6) * (xx > cx - 30 ? 1 : 0.55); }
      if (xx < cx - 50) { const w = clamp((cx - 50 - xx) / 170) * wake * Math.exp(-((y0 - cy) * (y0 - cy)) / (ry * ry * 2.6)); yy += w * (12 + 10 * h) * Math.sin(xx / (34 + 16 * h2) + t * (6 + 3 * h) + j * 1.9) + w * 6 * Math.sin(xx / 13 + t * 11 + j); }
      if (s === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    // okraje pásma slábnou (nahoře, dole i k okrajům obrazu), ať proudnice nevypadají jako obdélník
    const edge = Math.min(1, j / 5, (N - 1 - j) / 4), hi = h2 > 0.82, al = (hi ? 0.35 : 0.2 + 0.5 * h) * (0.25 + 0.75 * edge);
    const rgb = OUTDOOR() ? (hi ? '255,255,255' : '246,248,252') : hi ? '228,227,222' : '139,61,255', gr = ctx.createLinearGradient(X1, 0, X0, 0);
    gr.addColorStop(0, `rgba(${rgb},0)`); gr.addColorStop(0.18, `rgba(${rgb},${al})`); gr.addColorStop(0.82, `rgba(${rgb},${al})`); gr.addColorStop(1, `rgba(${rgb},0)`);
    ctx.setLineDash([dash, gap]); ctx.lineDashOffset = off; ctx.lineWidth = hi ? 3.2 : 2 + h * 1.4; ctx.strokeStyle = gr; ctx.stroke();
  }
  ctx.restore();
}

// velké číslo s jednotkou (jako „40 KM/H“ ve vzoru), x = levý okraj, y = účaří
function bigNum(t, at, out, num, unit, x, y, o) {
  o = o || {}; const p = popS(t, at, out); if (p.a <= 0) return;
  const f = { size: o.size || 76, w: 800, f: F.U, ls: -2 }, w = width(num, f);
  ctx.save(); ctx.globalAlpha *= p.a; ctx.translate(x, y); ctx.scale(p.s, p.s);
  txt(num, 0, 0, Object.assign({ align: 'left', c: o.c || C.ink }, f));
  txt(unit, w + 12, 0, { align: 'left', size: Math.round(f.size * 0.42), w: 800, f: F.U, c: o.uc || C.ink, ls: 1 });
  if (o.sub) txt(o.sub, 0, Math.round(f.size * 0.5), { align: 'left', size: 26, w: 700, c: C.muted, ls: 2 });
  ctx.restore();
}

// štítek přichycený k jezdci: pilulka s tenkou čárou dolů
function tagAt(text, x, y, o) {
  const p = o.at != null ? popS(o.t, o.at, o.out == null ? null : o.out) : { a: 1, s: 1 };
  if (p.a <= 0) return;
  const out = TXTOUT(), hl = o.c === 'pu';
  ctx.save(); ctx.globalAlpha *= p.a; ctx.strokeStyle = out ? '#ffffff' : hl ? C.pu : C.line2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y + 26); ctx.lineTo(x, y + (o.line || 60)); ctx.stroke(); ctx.restore();
  if (out) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4; }
  pill(text, x, y, { a: p.a, s: p.s, size: o.size || 36, ls: 0, bg: out ? (hl ? YEL : '#F7F7F4') : hl ? C.pu : C.surf, c: out ? DARK : C.ink });
  if (out) ctx.restore();
}

// titulky nahoře: aktuální úsek 2 až 5 slov, právě vyslovené slovo v rámečku (časy slov uvnitř úseku podle délky slov)
function topCaptions(t) {
  for (const key in L) for (const c of L[key].chunks) if (t >= c.start && t < c.end) {
    const words = c.text.split(' '), fo = { size: 62, w: 800, f: F.I }, ws = words.map(w => width(w, fo)), sp = width(' ', fo);
    const lens = words.map(w => Math.max(2, w.length)), tot = lens.reduce((a, b) => a + b, 0), dur = Math.max(0.2, Math.min(c.end, L[key].end) - c.start);
    let acc = 0, cur = 0; for (let i = 0; i < words.length; i++) { if (t - c.start >= dur * acc / tot) cur = i; acc += lens[i]; }
    // zalomení do nejvýš dvou řádků po 820 px
    const rows = [[]]; let rw = 0; words.forEach((w, i) => { const add = (rows[rows.length - 1].length ? sp : 0) + ws[i]; if (rw + add > 820 && rows[rows.length - 1].length) { rows.push([]); rw = 0; } rows[rows.length - 1].push(i); rw += (rows[rows.length - 1].length > 1 ? sp : 0) + ws[i]; });
    const k = tw(t, c.start, 0.25), y0 = 330 - (rows.length - 1) * 40 + (1 - k) * 14;
    ctx.save(); ctx.globalAlpha = clamp((t - c.start) / 0.08);
    rows.forEach((r, ri) => {
      const w = r.reduce((s, i, j) => s + ws[i] + (j ? sp : 0), 0); let x = 540 - w / 2; const y = y0 + ri * 80;
      r.forEach(i => {
        if (TXTOUT()) {   // bílý text s černým obrysem, právě vyslovené slovo žluté
          ctx.save(); ctx.font = font(fo); ctx.textAlign = 'left'; ctx.lineJoin = 'round'; ctx.lineWidth = 12; ctx.strokeStyle = 'rgba(12,13,15,0.92)'; ctx.globalAlpha *= i <= cur ? 1 : 0.85;
          ctx.strokeText(words[i], x, y); ctx.fillStyle = i === cur ? YEL : '#ffffff'; ctx.fillText(words[i], x, y); ctx.restore();
        } else {
          if (i === cur) { ctx.save(); ctx.fillStyle = 'rgba(139,61,255,0.22)'; ctx.strokeStyle = C.pu; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x - 12, y - 56, ws[i] + 24, 74, 14); ctx.fill(); ctx.stroke(); ctx.restore(); }
          txt(words[i], x, y, Object.assign({ align: 'left', c: i === cur ? C.ink : (i < cur ? C.ink : C.muted), a: i <= cur ? 1 : 0.7 }, fo));
        }
        x += ws[i] + sp;
      });
    });
    ctx.restore(); return;
  }
}

// velký údaj dole (pásmo y 1380 až 1560): popisek verzálkami a číslo
function statAt(t, at, out, label, value, color) {
  const p = popS(t, at, out), q = pop(t, at, out); if (p.a <= 0) return;
  const o2 = TXTOUT(); if (o2) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4; }
  txt(label, 540, 1408 + q.dy, { size: 30, w: 800, c: o2 ? '#ffffff' : C.muted, ls: 4, a: q.a });
  const vo = Object.assign(fit(value, { size: 104, w: 800, f: F.U, ls: -3 }, 780), { c: o2 ? (color === C.ink ? '#ffffff' : YEL) : color || C.pu, a: p.a, s: p.s });
  // se stylem textu (Kokonut UI: slot = číslice se protočí jako válečky, marker, reveal…) číslo naskočí efektem z blocks.js
  if (typeof STYLE !== 'undefined' && STYLE.text) fxText(value, 540, 1520 + p.dy, Object.assign({}, vo, { s: 1 }), at, 'big', t); else txt(value, 540, 1520 + p.dy, vo);
  if (o2) ctx.restore();
}

// konec videa: papírová vlaštovka (pošli kamarádovi) a výzva ke sledování
function ctaEnd(t, at, at2, text) {
  const p = popS(t, at, null), q = popS(t, at2, null); if (p.a <= 0) return;
  const o3 = TXTOUT();
  ctx.save(); ctx.globalAlpha *= p.a; ctx.translate(540, 1480); ctx.scale(p.s, p.s); ctx.fillStyle = o3 ? YEL : C.pu; ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(70, -50); ctx.lineTo(30, 60); ctx.lineTo(10, 18); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(10, 18); ctx.lineTo(70, -50); ctx.lineTo(18, 34); ctx.closePath(); ctx.fill(); ctx.restore();
  if (q.a > 0) pill(text, 540, 1610, { a: q.a, s: q.s, size: 40, ls: 0, bg: o3 ? YEL : C.pu, c: o3 ? DARK : C.ink });
}

// úvodní nápis (styl hook 'watt'): velké „watt“ bílé a „IF“ žluté nad jezdcem, vyskočí a na konci háčku zmizí
function hookTitle(t, at, out) {
  const p = popS(t, at, out); if (p.a <= 0) return;
  const w1 = hookWord(), fo = { size: 150, w: 800, f: F.U, ls: -4 }, a = width(w1, fo), b = width('IF', fo), x0 = 540 - (a + b) / 2, y = 640;
  ctx.save(); ctx.globalAlpha *= p.a; ctx.translate(540, y - 50); ctx.scale(p.s, p.s); ctx.translate(-540, -(y - 50));
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 6;
  txt(w1, x0, y, Object.assign({ align: 'left', c: '#ffffff' }, fo)); txt('IF', x0 + a, y, Object.assign({ align: 'left', c: YEL }, fo));
  ctx.restore();
}
// barometr (Kokonut UI styl ciferníku): ručička z tlakové výše (vpravo) do níže (vlevo), číslo v hPa se protočí
function barometer(t, at, out, from, to, tMove, x = 540, y = 600) {
  const p = popS(t, at, out); if (p.a <= 0) return;
  const k = ease('power3.inOut')(clamp((t - tMove) / 1.4)), v = lerp(from, to, k), ang = Math.PI * (1.15 + 0.7 * (v - 970) / 80), R = 130;
  ctx.save(); ctx.globalAlpha *= p.a; ctx.translate(x, y); ctx.scale(p.s, p.s);
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 22; ctx.fillStyle = 'rgba(247,247,244,0.94)'; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  ctx.lineWidth = 10; ctx.strokeStyle = '#d64b3c'; ctx.beginPath(); ctx.arc(0, 0, R - 22, Math.PI * 1.15, Math.PI * 1.5); ctx.stroke();
  ctx.strokeStyle = '#3b8fd6'; ctx.beginPath(); ctx.arc(0, 0, R - 22, Math.PI * 1.5, Math.PI * 1.85); ctx.stroke();
  for (let i = 0; i <= 8; i++) { const a2 = Math.PI * (1.15 + 0.7 * i / 8); ctx.strokeStyle = '#17191B'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(Math.cos(a2) * (R - 36), Math.sin(a2) * (R - 36)); ctx.lineTo(Math.cos(a2) * (R - 48), Math.sin(a2) * (R - 48)); ctx.stroke(); }
  txt('LOW', -62, 12, { size: 22, w: 800, c: '#d64b3c' }); txt('HIGH', 62, 12, { size: 22, w: 800, c: '#3b8fd6' });
  ctx.strokeStyle = '#17191B'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang) * (R - 40), Math.sin(ang) * (R - 40)); ctx.stroke();
  ctx.fillStyle = '#17191B'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, 7); ctx.fill();
  txt(Math.round(v) + ' hPa', 0, 78, { size: 34, w: 800, f: F.U, c: '#17191B' });
  ctx.restore();
}

// texty původní šablony přes realistickou krajinu (style.ui = 'classic'): úvodní sloupec whatIF (o.hook = { line, cy, items }
// jako scéna typu hook) a nadpisy nahoře (o.heads jako heads u bloků). Jemný tmavý stín, aby šly číst i na světlé obloze.
function classicUI(t, a, o) {
  // tmavý přechod přes horní část obrazu (jako tmavé pozadí šablony), dolů do ztracena nad helmou; viditelná část scény je y 151 až 1751
  const g = ctx.createLinearGradient(0, 151, 0, 760); g.addColorStop(0, 'rgba(12,13,15,0.62)'); g.addColorStop(0.55, 'rgba(12,13,15,0.3)'); g.addColorStop(1, 'rgba(12,13,15,0)');
  ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, 760); ctx.restore();
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 3;
  if (o.hook && a && a.id === 'hook') { const ex = tw(t, a.end - 0.36, 0.36); ctx.save(); ctx.globalAlpha *= 1 - ex; ctx.translate(0, -70 * ex); stack(t, o.hook, 0, null); ctx.restore(); }
  if (o.heads) heads(t, o.heads, 0);
  ctx.restore();
}
