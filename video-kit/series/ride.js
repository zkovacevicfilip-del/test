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
  const st = R3.st, cm = window.CAM || {};
  // kamera styl 'orbit': 3D kamera objede bod pohledu kolem svislé osy o úhel cm.o (plynulý pohyb do strany)
  if (cfg.cam.fov && st.cam.fov !== cfg.cam.fov) { st.cam.fov = cfg.cam.fov; st.cam.updateProjectionMatrix(); }
  { const P = cfg.cam.pos, Lk = cfg.cam.look, o = cm.o || 0, dx = P[0] - Lk[0], dz = P[2] - Lk[2], co = Math.cos(o), so = Math.sin(o);
    st.cam.position.set(Lk[0] + dx * co + dz * so, P[1], Lk[2] - dx * so + dz * co); st.cam.lookAt(...Lk); }
  R3.road.update(state.dist || 0); if (R3.env) R3.env.update(state.dist || 0); st.world.rotation.z = (state.slope || 0) * Math.PI / 180;
  for (const id in R3.riders) { const m = R3.riders[id], s = state.riders[id] || {}; m.root.visible = s.hide !== true; m.root.position.x = s.x || 0; m.root.rotation.y = s.dir < 0 ? Math.PI : 0; m.update(s); }
  // 3D obraz 1:1 na obrazovku (scény se kreslí ve zvětšení ZOOM kolem 540, 905, proto zpětný přepočet)
  // cm.blur (swipe s rozmazáním): rozmazání pohybem, obraz víckrát s posunem
  const X = 540 - 540 / ZOOM, Y = 905 - 905 / ZOOM, Wv = 1080 / ZOOM, Hv = 1920 / ZOOM, b = cm.blur || 0;
  // style.grade (sytější barvy, autor 22. 11. 2026): { sat, con } jako filtr jen na 3D obraz, texty zůstanou beze změny
  const gr = typeof STYLE !== 'undefined' && STYLE.grade;
  const one = x => { if (b < 1) { ctx.drawImage(st.canvas, x, Y, Wv, Hv); return; } const g = ctx.globalAlpha; for (let k = 0; k < 7; k++) { ctx.globalAlpha = g / (k + 1); ctx.drawImage(st.canvas, x + (k / 6 - 0.5) * b, Y, Wv, Hv); } ctx.globalAlpha = g; };
  const put = () => { if (gr) ctx.filter = `saturate(${gr.sat || 1}) contrast(${gr.con || 1})`; one(X); ctx.filter = 'none'; };
  // dva průchody: silnice (se stíny jezdců), pak proudnice (between), pak jezdci, aby proudnice byly nad silnicí a za jezdci
  // video „3 tipy“: plocha jezdce zepředu. state.sil = { id, k: síla 0 až 1, ghost: stav jezdce „předtím“ }: jezdec se nejdřív
  // vykreslí v poloze předtím do zvláštního plátna, pak ve skutečné poloze; ušetřená plocha (předtím minus teď) se vyšrafuje
  const sil = state.sil && state.sil.k > 0.001 ? state.sil : null, cv = () => { const c = document.createElement('canvas'); c.width = st.canvas.width; c.height = st.canvas.height; return c; };
  if (sil) {
    R3.g1 = R3.g1 || cv(); R3.g2 = R3.g2 || cv(); const m = R3.riders[sil.id], g = R3.g1.getContext('2d');
    m.update(Object.assign({}, state.riders[sil.id], sil.ghost)); st.world.updateMatrixWorld(true); st.render(0);
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, R3.g1.width, R3.g1.height); g.drawImage(st.canvas, 0, 0); m.update(state.riders[sil.id]);
  }
  st.world.updateMatrixWorld(true); st.render(2); put(); if (between) between(); st.render(0); put();
  if (sil) {
    const g1 = R3.g1.getContext('2d'), g2 = R3.g2.getContext('2d'), W2 = R3.g1.width, H2 = R3.g1.height;
    g2.globalCompositeOperation = 'source-over'; g2.clearRect(0, 0, W2, H2); g2.drawImage(st.canvas, 0, 0);
    if (!R3.hatch) { const c = document.createElement('canvas'); c.width = c.height = 28; const h = c.getContext('2d'); h.fillStyle = 'rgba(139,61,255,0.55)'; h.fillRect(0, 0, 28, 28);
      h.strokeStyle = 'rgba(236,226,255,0.95)'; h.lineWidth = 6; for (const o of [-28, 0, 28]) { h.beginPath(); h.moveTo(o, 28); h.lineTo(o + 28, 0); h.stroke(); } R3.hatch = g1.createPattern(c, 'repeat'); }
    // bílý obrys polohy předtím: maska posunutá do osmi stran minus maska samotná
    R3.g3 = R3.g3 || cv(); const g3 = R3.g3.getContext('2d');
    g3.globalCompositeOperation = 'source-over'; g3.clearRect(0, 0, W2, H2);
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) g3.drawImage(R3.g1, dx * 5, dy * 5);
    g3.globalCompositeOperation = 'destination-out'; g3.drawImage(R3.g1, 0, 0);
    g3.globalCompositeOperation = 'source-in'; g3.fillStyle = '#ffffff'; g3.fillRect(0, 0, W2, H2);
    g1.globalCompositeOperation = 'destination-out'; g1.drawImage(R3.g2, 0, 0);                    // předtím minus teď
    g1.globalCompositeOperation = 'source-in'; g1.fillStyle = R3.hatch; g1.fillRect(0, 0, W2, H2);
    g2.globalCompositeOperation = 'source-in'; g2.fillStyle = '#8B3DFF'; g2.fillRect(0, 0, W2, H2);   // plocha teď: fialový nádech
    const ga = ctx.globalAlpha; ctx.save(); ctx.globalAlpha = ga * 0.32 * sil.k; ctx.drawImage(R3.g2, X, Y, Wv, Hv); ctx.globalAlpha = ga * sil.k; ctx.drawImage(R3.g1, X, Y, Wv, Hv); ctx.globalAlpha = ga * 0.9 * sil.k; ctx.drawImage(R3.g3, X, Y, Wv, Hv); ctx.restore();
  }
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
  if (typeof STYLE !== 'undefined' && STYLE.lean >= 2) return;   // méně textu: bez štítků u jezdce
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
// jako scéna typu hook) a nadpisy nahoře (o.heads: pro každý akt seznam jako heads u bloků). Jemný tmavý stín, aby šly číst i na světlé obloze.
function classicUI(t, a, o) {
  // tmavý přechod přes horní část obrazu (jako tmavé pozadí šablony), dolů do ztracena nad helmou; viditelná část scény je y 151 až 1751
  const g = ctx.createLinearGradient(0, 151, 0, 760); g.addColorStop(0, 'rgba(12,13,15,0.62)'); g.addColorStop(0.55, 'rgba(12,13,15,0.3)'); g.addColorStop(1, 'rgba(12,13,15,0)');
  ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, 760); ctx.restore();
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 3;
  if (o.hook && a && a.id === 'hook') { const ex = tw(t, a.end - 0.36, 0.36); ctx.save(); ctx.globalAlpha *= 1 - ex; ctx.translate(0, -70 * ex); stack(t, o.hook, 0, null); ctx.restore(); }
  // nadpisy po aktech jako v šabloně (o.heads = { idAktu: [...] }): naskočí a zmizí s aktem (actIO), takže při švihu
  // kamery do dalšího aktu už nejsou vidět (oprava 22. 11. 2026: nadpis se při švihu usekl o okraj obrazu)
  // style.lean (méně textu, autor 22. 11. 2026): 1 = nahoře bez malých popisků a podtitulků (zůstane nadpis a velké číslo),
  // 2 = navíc bez štítků u jezdce (tag3d), 3 = navíc bez titulků dole
  const lean = typeof STYLE !== 'undefined' && STYLE.lean || 0, hs0 = o.heads && a && o.heads[a.id];
  const hs = hs0 && lean ? hs0.map(h => Object.assign({}, h, { label: undefined, sub: undefined })) : hs0;
  if (o.tips) tipsBar(t, o.tips);   // video „3 tipy“: ukazatel postupu nahoře
  if (hs) { const io = actIO(t, a); ctx.save(); ctx.globalAlpha *= io.a; heads(t, hs, io.dy); ctx.restore(); }
  ctx.restore();
}

// ---------- VIDEO „3 TIPY“ (autor 24. 11. 2026) ----------
// ukazatel postupu (varianta 3, autor 24. 11. 2026): tři dílky nahoře, každý se plní během svého tipu, poslední fialový.
// o.at = začátky tipů, o.end = konec posledního tipu (pak ukazatel zmizí, přijdou karty)
function tipsBar(t, o) {
  const at = o.at, n = at.length, end = o.end, fade = 1 - tw(t, end - 0.35, 0.35); if (fade <= 0) return;
  const X0 = 150, X1 = 930, gap = 16, w = (X1 - X0 - gap * (n - 1)) / n, y = 208;
  ctx.save(); ctx.globalAlpha *= fade * clamp(t / 0.4);
  for (let i = 0; i < n; i++) {
    const x = X0 + i * (w + gap), f = clamp((t - at[i]) / ((i + 1 < n ? at[i + 1] : end) - at[i]));
    ctx.fillStyle = 'rgba(228,227,222,0.3)'; ctx.beginPath(); ctx.roundRect(x, y, w, 10, 5); ctx.fill();
    if (f > 0) { ctx.fillStyle = i === n - 1 ? C.pu : C.ink; ctx.beginPath(); ctx.roundRect(x, y, Math.max(10, w * f), 10, 5); ctx.fill(); }
  }
  ctx.restore();
}
// „pop“ při výměně helmy nebo dresu: záblesk, rozpínající se fialový kruh a bílé jiskry kolem bodu p (ve scéně), d = velikost
function popFX(t, at, p, d) {
  const u = (t - at) / 0.7; if (u < 0 || u > 1) return;
  const e = 1 - Math.pow(1 - u, 3);
  ctx.save();
  if (u < 0.25) { const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], d * 1.4); g.addColorStop(0, `rgba(255,255,255,${0.85 * (1 - u / 0.25)})`); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], d * 1.4, 0, 7); ctx.fill(); }
  ctx.globalAlpha *= 1 - u; ctx.strokeStyle = C.pu; ctx.lineWidth = 8 * (1 - u) + 2; ctx.shadowColor = 'rgba(139,61,255,0.9)'; ctx.shadowBlur = 16;
  ctx.beginPath(); ctx.arc(p[0], p[1], d * (0.5 + 1.1 * e), 0, 7); ctx.stroke();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.shadowColor = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + 0.3, r0 = d * (0.7 + 0.9 * e), r1 = r0 + d * 0.35 * (1 - u); ctx.beginPath(); ctx.moveTo(p[0] + Math.cos(a) * r0, p[1] + Math.sin(a) * r0); ctx.lineTo(p[0] + Math.cos(a) * r1, p[1] + Math.sin(a) * r1); ctx.stroke(); }
  ctx.restore();
}
// výměna helmy v čase at → [silniční, časovkářská] pro stav jezdce hs. Helmy se prohodí v jednom snímku (autor 24. 11. 2026:
// „nenechávej mu holou hlavu“), časovkářská jen „poskočí“: naskočí o 18 % větší a rychle se usadí, nikdy není menší než hlava
const helmSwap = (t, at) => { if (t < at) return [1, 0]; const u = clamp((t - at) / 0.35); return [0, 1 + 0.18 * (1 - u) * (1 - u)]; };

// ---------- PRVKY PODLE REFERENCE (RunLive, autor 25. 11. 2026): titulky po slovech, odznak kapitoly, datová karta ----------
// časy slov uvnitř titulku: rozpočítané podle délky slov (titulky mají nejvýš 6 slov, hlas říká čísla slovy, proto ne z ASR)
function chunkWords(c) {
  const ws = c.text.split(/\s+/).filter(Boolean), len = ws.map(w => Math.max(2, w.length)), tot = len.reduce((a, b) => a + b, 0);
  let acc = 0; return ws.map((w, i) => { const s = c.start + (c.end - c.start) * acc / tot; acc += len[i]; return { w, s, e: c.start + (c.end - c.start) * acc / tot }; });
}
const KEYW = w => (w.toUpperCase().replace(/[^A-Z0-9:+−.%-]/g, ''));
// titulky po slovech (STYLE.words = { v, keys: ['SLOVO', …] }): v 1 = věta se staví nahoře, klíčová slova fialově a VELKÁ,
// v 2 = dole po kouscích jako dřív, ale právě řečené slovo ve fialovém rámečku, v 3 = jedno velké slovo dole
function wordCaps(t, o) {
  const keys = new Set((o.keys || []).map(KEYW)), isKey = w => keys.has(KEYW(w)) || /\d/.test(w);
  for (const k in L) {
    const l = L[k]; if (l.captions === false) continue;
    if (o.v === 1) {
      if (t < l.chunks[0].start || t > l.end + 0.35) continue;
      const ws = l.chunks.flatMap(chunkWords).filter(x => t >= x.s), fo = { size: 44, w: 700 }, fk = { size: 44, w: 800 }, lines = [[]]; let lw = 0;
      for (const x of ws) { const tx = isKey(x.w) ? x.w.toUpperCase() : x.w, w = width(tx + ' ', isKey(x.w) ? fk : fo); if (lw + w > 820 && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push({ tx, key: isKey(x.w), s: x.s, w }); lw += w; }
      const show = lines.slice(-2), a = 1 - tw(t, l.end + 0.1, 0.25);
      show.forEach((ln, j) => { const tot = ln.reduce((q, x) => q + x.w, 0); let x0 = 540 - tot / 2; const y = 300 + j * 56;
        ln.forEach(x => { const k2 = tw(t, x.s, 0.18); txt(x.tx, x0, y + (1 - k2) * 10, Object.assign({}, x.key ? fk : fo, { align: 'left', c: x.key ? C.pu : C.ink, a: a * clamp((t - x.s) / 0.08) })); x0 += x.w; }); });
      return;
    }
    for (const c of l.chunks) if (t >= c.start && t < c.end) {
      const ws = chunkWords(c), cur = ws.find(x => t >= x.s && t < x.e) || ws[ws.length - 1];
      if (o.v === 3) { const k2 = tw(t, cur.s, 0.16, E.back), fo = fit(cur.w.toUpperCase(), { size: 96, w: 800, f: F.U, ls: -2 }, 800);
        txt(cur.w.toUpperCase(), 540, 1440, Object.assign({}, fo, { c: isKey(cur.w) ? C.pu : C.ink, s: lerp(0.8, 1, k2) })); return; }
      const fo = { size: 58, w: 800 }, gap = width(' ', fo), tot = ws.reduce((q, x) => q + width(x.w, fo), 0) + gap * (ws.length - 1); let x0 = 540 - tot / 2; const y = 1468;
      ctx.save(); ctx.globalAlpha = clamp((t - c.start) / 0.07); ctx.fillStyle = 'rgba(23,25,27,0.78)'; ctx.beginPath(); ctx.roundRect(540 - tot / 2 - 30, y - 62, tot + 60, 88, 22); ctx.fill();
      ws.forEach(x => { const w = width(x.w, fo); if (x === cur) { ctx.fillStyle = C.pu; ctx.beginPath(); ctx.roundRect(x0 - 8, y - 52, w + 16, 68, 14); ctx.fill(); } txt(x.w, x0, y, Object.assign({}, fo, { align: 'left' })); x0 += w + gap; });
      ctx.restore(); return;
    }
  }
}
// odznak kapitoly (o = { v, at: [začátky tipů], names: [...], dur }): v 1 = plný fialový kruh s číslem, v 2 = svítící obrys,
// v 3 = fialová pilulka „TIP 1“; pod tím název tipu. Naskočí s překmitem a po o.dur zmizí (pak přijde datová karta)
function chapterBadge(t, o) {
  const i = o.at.reduce((k, x, j) => t >= x ? j : k, -1); if (i < 0) return 0;
  const p = popS(t, o.at[i], o.at[i] + (o.dur || 1.9), 0.55); if (p.a <= 0) return 0;
  ctx.save(); ctx.globalAlpha *= p.a; ctx.translate(540, 500 + p.dy); ctx.scale(p.s, p.s); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 3;
  if (o.v === 3) { const lab = 'TIP ' + (i + 1), w = width(lab, { size: 46, w: 800, f: F.U }) + 64; ctx.fillStyle = C.pu; ctx.beginPath(); ctx.roundRect(-w / 2, -80, w, 92, 46); ctx.fill(); txt(lab, 0, -18, { size: 46, w: 800, f: F.U, c: '#ffffff' }); }
  else {
    ctx.shadowColor = 'rgba(139,61,255,0.85)'; ctx.shadowBlur = 40; ctx.beginPath(); ctx.arc(0, -40, 92, 0, 7);
    if (o.v === 1) { ctx.fillStyle = C.pu; ctx.fill(); } else { ctx.lineWidth = 12; ctx.strokeStyle = C.pu; ctx.stroke(); ctx.fillStyle = 'rgba(23,25,27,0.55)'; ctx.fill(); }
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 22; txt(String(i + 1), 0, 4, { size: 128, w: 800, f: F.U, c: '#ffffff' });
  }
  txt(o.names[i], 0, 150, fit(o.names[i], { size: 72, w: 800, f: F.U, ls: -2, c: C.ink }, 820));
  ctx.restore(); return p.a;
}
// ušetřený čas „−m:ss“ ze zaokrouhlených celých sekund (jinak by při počítání krátce vyskočilo „−0:60“)
function clockNeg(s) { const r = Math.round(s); return '−' + Math.floor(r / 60) + ':' + String(r % 60).padStart(2, '0'); }
// datová karta (o = { v, title, items: [{ name, value, show, at, grow }], compare: { at, label }, from, to, hide }): sloupce rostou
// s hlasem (počítadlo hodnoty), aktuální fialově; v 1 = tmavá karta se svislými sloupci, v 2 = vodorovné pruhy, v 3 = bez karty
function dataCard(t, o) {
  const a0 = clamp((t - o.from) / 0.35) * (1 - tw(t, o.to - 0.35, 0.35)) * (1 - (o.hide || 0)); if (a0 <= 0) return;
  const max = Math.max(...o.items.map(x => x.value)), cur = o.items.reduce((k, x, j) => t >= x.at ? j : k, -1), it = cur >= 0 ? o.items[cur] : {};
  // plán týdne u právě probíraného tipu (it.week, video o VO2 max): karta se o kousek prodlouží a řádky jsou hustší
  const wk = o.items.some(x => x.week), hk = it.week ? tw(t, it.weekAt, 0.45, E.io) : 0;
  const X0 = 140, X1 = 940, Y0 = 380, Y1 = 710 + 50 * hk, R0 = wk ? 122 : 140, RG = wk ? 52 : 62;
  ctx.save(); ctx.globalAlpha *= a0;
  if (o.v !== 3) { ctx.fillStyle = 'rgba(23,25,27,0.8)'; ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(X0, Y0, X1 - X0, Y1 - Y0, 28); ctx.fill(); ctx.stroke(); }
  // nadpis karty: název právě probíraného tipu (x.head), pod ním šedě recept tréninku (x.recipe), nebo co karta ukazuje (o.title)
  const hd = it.head; if (hd) txt(hd, 540, Y0 + 48, fit(hd, { size: 34, w: 800, f: F.U, ls: -1, c: C.ink }, 720));
  const sub = it.recipe || o.title; txt(sub, 540, Y0 + (hd ? 84 : 44), fit(sub, { size: 22, w: 700, ls: 3, c: C.muted }, 740));
  // hodnota: čas „−m:ss“ (výchozí), nebo procenta „+7.2%“ (o.fmt = 'pct')
  const fmtv = o.fmt === 'pct' ? (v => '+' + v.toFixed(1) + '%') : clockNeg;
  o.items.forEach((x, j) => {
    if (t < x.at) return; const g = tw(t, x.grow, 0.8, E.quint), v = x.value * g, on = j === cur, col = on ? C.pu : 'rgba(228,227,222,0.55)';
    const la = clamp((t - x.at) / 0.25);
    if (o.v === 2) {
      const y = Y0 + R0 + j * RG, bx = 400, bw = 360 * v / max;
      txt(x.name, X0 + 34, y + 11, fit(x.name, { size: 30, w: 800, align: 'left', c: on ? C.ink : C.muted, a: la }, 220));
      ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.beginPath(); ctx.roundRect(bx, y - 17, 360, 34, 17); ctx.fill();
      if (bw > 1) { ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(bx, y - 17, Math.max(34, bw), 34, 17); ctx.fill(); }
      if (g > 0) txt(fmtv(v), X1 - 30, y + 13, { size: 34, w: 800, f: F.U, align: 'right', c: on ? C.ink : C.muted });
    } else {
      const cx = 300 + j * 240, base = Y1 - 52, h = 150 * v / max;
      txt(x.name, cx, base + 36, { size: 26, w: 800, ls: 2, c: on ? C.ink : C.muted, a: la });
      ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.beginPath(); ctx.roundRect(cx - 62, base - 150, 124, 150, 14); ctx.fill();
      if (h > 1) { ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(cx - 62, base - h, 124, h, 14); ctx.fill(); }
      if (g > 0) txt(fmtv(v), cx, Math.max(Y0 + 136, base - h - 16), { size: 36, w: 800, f: F.U, c: on ? (h > 140 ? '#ffffff' : C.ink) : C.muted });
    }
  });
  // plán týdne: 7 koleček (E lehce, H tvrdě, R volno), naskakují postupně od it.weekAt
  if (hk > 0) {
    const days = 'MTWTFSS', lab = { E: 'EASY', H: 'HARD', R: 'REST' }, y = Y0 + 300, step = (X1 - X0 - 180) / 6;
    it.week.forEach((d, i) => {
      const p = popS(t, it.weekAt + 0.08 * i, null, 0.45); if (p.a <= 0) return; const x = X0 + 90 + i * step;
      ctx.save(); ctx.globalAlpha *= p.a * hk; ctx.translate(x, y); ctx.scale(p.s, p.s);
      ctx.fillStyle = d === 'H' ? C.pu : d === 'E' ? 'rgba(228,227,222,0.22)' : 'rgba(255,255,255,0.05)'; ctx.beginPath(); ctx.arc(0, 0, 23, 0, 7); ctx.fill();
      txt(days[i], 0, 8, { size: 22, w: 800, c: d === 'H' ? '#ffffff' : d === 'E' ? C.ink : C.muted });
      txt(lab[d], 0, 42, { size: 14, w: 800, ls: 1, c: d === 'H' ? C.pu : C.muted });
      ctx.restore();
    });
  }
  // zdroj čísla (it.src) malým písmem dole v kartě, jako v referenci
  if (it.src) txt(it.src, 540, Y1 - 14, fit(it.src, { size: 17, w: 700, ls: 2, c: 'rgba(154,154,152,0.85)' }, 740));
  // porovnání: přerušovaná čára „1 + 2“ u posledního sloupce (víc než první dva dohromady)
  if (o.compare && t >= o.compare.at) {
    const k = tw(t, o.compare.at, 0.5), sum = o.items.slice(0, -1).reduce((q, x) => q + x.value, 0);
    ctx.globalAlpha *= k; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.setLineDash([10, 8]);
    if (o.v === 2) { const y = Y0 + R0 + (o.items.length - 1) * RG, x = 400 + 360 * sum / max; ctx.beginPath(); ctx.moveTo(x, y - 28); ctx.lineTo(x, y + 28); ctx.stroke(); ctx.setLineDash([]); txt(o.compare.label, x, y + 52, { size: 24, w: 800, c: '#ffffff' }); }
    else { const cx = 300 + (o.items.length - 1) * 240, base = Y1 - 52, y = base - 150 * sum / max; ctx.beginPath(); ctx.moveTo(cx - 76, y); ctx.lineTo(cx + 76, y); ctx.stroke(); ctx.setLineDash([]); txt(o.compare.label, cx - 88, y + 9, { size: 26, w: 800, align: 'right', c: '#ffffff' }); }
  }
  ctx.restore();
}

// ---------- KARTA TRÉNINKU A KARTA VÝSLEDKU (video o VO2 max podle reference the.better.run, autor 26. 11. 2026) ----------
// karta tréninku ukáže, jak trénink přesně vypadá: štítky „4 MIN HARD“ / „3 MIN EASY“, počítadlo opakování, bloky.
// o = { v: 1 bloky (jako v referenci) | 2 profil jako ve Zwiftu (souvislé schody, časová osa), from, to, hide, out, title,
//       hard: { label, dur, lvl }, easy: { label, dur, lvl }, reps, sets, at: { hard, easy, reps, line }, line: { label, lvl } }
// Bloky naskakují s hlasem: první tvrdý u at.hard, první lehký u at.easy, ostatní opakování rychle za sebou u at.reps.
function workoutCard(t, o) {
  const outK = o.out != null ? tw(t, o.out, 0.25) : 0;
  const a0 = clamp((t - o.from) / 0.3) * (1 - tw(t, o.to - 0.3, 0.3)) * (1 - (o.hide || 0)) * (1 - outK); if (a0 <= 0) return;
  const X0 = 140, X1 = 940, Y0 = o.y0 || 380, Y1 = Y0 + 360, BX0 = X0 + 40, BX1 = X1 - 40, BY1 = Y1 - (o.v === 2 ? 64 : 40), BH = Y1 - Y0 - 150;
  ctx.save(); ctx.globalAlpha *= a0; const sc = 1 - 0.06 * outK; ctx.translate(540, (Y0 + Y1) / 2); ctx.scale(sc, sc); ctx.translate(-540, -(Y0 + Y1) / 2);
  ctx.fillStyle = 'rgba(23,25,27,0.84)'; ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(X0, Y0, X1 - X0, Y1 - Y0, 28); ctx.fill(); ctx.stroke();
  txt(o.title, 540, Y0 + 48, fit(o.title, { size: 34, w: 800, f: F.U, ls: -1, c: C.ink }, 720));
  // štítky a počítadlo
  const chip = (lab, x, at, on) => { const p = popS(t, at, null, 0.4); if (p.a <= 0) return 0; const w = width(lab, { size: 22, w: 800, ls: 1 }) + 28;
    ctx.save(); ctx.globalAlpha *= p.a; ctx.translate(x + w / 2, Y0 + 88); ctx.scale(p.s, p.s); ctx.fillStyle = on ? C.pu : 'rgba(228,227,222,0.18)'; ctx.beginPath(); ctx.roundRect(-w / 2, -18, w, 36, 18); ctx.fill();
    txt(lab, 0, 8, { size: 22, w: 800, ls: 1, c: on ? '#ffffff' : C.ink }); ctx.restore(); return w; };
  const w1 = chip(o.hard.label, BX0, o.at.hard, true); chip(o.easy.label, BX0 + (w1 || width(o.hard.label, { size: 22, w: 800, ls: 1 }) + 28) + 12, o.at.easy, false);
  // počítadlo: „×13“, s druhou a další sadou „3 × 13“ (od o.at.sets)
  const rp = popS(t, o.at.reps, null, 0.5), sp = o.at.sets != null ? popS(t, o.at.sets, null, 0.5) : null, setsOn = sp && t >= o.at.sets;
  if (rp.a > 0) { const q = setsOn ? sp : rp; ctx.save(); ctx.globalAlpha *= q.a; ctx.translate(BX1, Y0 + 92); ctx.scale(q.s, q.s); txt(setsOn ? o.sets + ' × ' + o.reps : '×' + o.reps, 0, 10, { size: 40, w: 800, f: F.U, align: 'right', c: C.pu }); ctx.restore(); }
  // celý trénink jako řada úseků (sady × opakování × [tvrdě, lehce]), mezi sadami mezera
  const segs = []; for (let s2 = 0; s2 < (o.sets || 1); s2++) { for (let r = 0; r < o.reps; r++) { segs.push({ k: 'h', r, s: s2 }); segs.push({ k: 'e', r, s: s2 }); } if (s2 < (o.sets || 1) - 1) segs.push({ k: 'g', s: s2 }); }
  const dur = x => x.k === 'h' ? o.hard.dur : x.k === 'e' ? o.easy.dur : (o.gap || o.easy.dur * 3), tot = segs.reduce((q, x) => q + dur(x), 0), gapPx = o.v === 2 ? 0 : Math.max(1, Math.min(4, 300 / segs.length));
  const k = (BX1 - BX0 - gapPx * (segs.length - 1)) / tot; let x = BX0;
  segs.forEach((sg, i) => {
    // první opakování s hlasem, zbytek první sady u at.reps, další sady u at.sets (bez at.sets všechno u at.reps)
    const nS = segs.filter(q => q.s === 0).length, later = sg.s > 0 && o.at.sets != null;
    const w = dur(sg) * k, first = sg.s === 0 && sg.r === 0, at = first ? (sg.k === 'h' ? o.at.hard : o.at.easy) : later ? o.at.sets + 0.9 * (i - nS) / Math.max(1, segs.length - nS) : o.at.reps + 0.9 * i / (o.at.sets != null ? nS : segs.length);
    const g = tw(t, at, 0.35, E.quint);
    if (g > 0 && sg.k !== 'g') {
      const lvl = sg.k === 'h' ? o.hard.lvl : o.easy.lvl, h = BH * lvl * g;
      ctx.fillStyle = sg.k === 'h' ? C.pu : 'rgba(228,227,222,0.32)';
      if (o.v === 2) { ctx.fillRect(x, BY1 - h, w + 0.6, h); if (sg.k === 'h') { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x, BY1 - h, w + 0.6, 3); } }
      else { ctx.beginPath(); ctx.roundRect(x, BY1 - h, Math.max(1.5, w), h, Math.min(8, w / 2)); ctx.fill(); }
    } else if (g > 0 && o.v === 2) { ctx.fillStyle = 'rgba(228,227,222,0.18)'; const h = BH * o.easy.lvl * 0.6 * g; ctx.fillRect(x, BY1 - h, w + 0.6, h); }
    x += w + gapPx;
  });
  if (o.v === 2) {   // časová osa profilu
    const la = clamp((t - o.at.reps) / 0.4); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(BX0, BY1 + 1); ctx.lineTo(BX1, BY1 + 1); ctx.stroke();
    const mins = Math.round(tot / 60); txt('0', BX0, BY1 + 34, { size: 20, w: 700, align: 'left', c: C.muted, a: la }); txt(mins + ' MIN', BX1, BY1 + 34, { size: 20, w: 800, align: 'right', c: C.muted, a: la });
  }
  // přerušovaná čára (třeba „VO2 MAX“) v úrovni o.line.lvl
  if (o.line && t >= o.at.line) {
    const lk = tw(t, o.at.line, 0.5), y = BY1 - BH * o.line.lvl; ctx.save(); ctx.globalAlpha *= lk; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.setLineDash([9, 8]);
    ctx.beginPath(); ctx.moveTo(BX0, y); ctx.lineTo(BX0 + (BX1 - BX0) * lk, y); ctx.stroke(); ctx.setLineDash([]); txt(o.line.label, BX1, y - 10, { size: 18, w: 800, ls: 2, align: 'right', c: '#ffffff' }); ctx.restore();
  }
  ctx.restore();
}
// rychlý přechod mezi kapitolami jako v referenci (volba autora 26. 11. 2026): karta se za 0,35 s smrskne do fialové kapky
// přesně v místě a velikosti, ve které pak naskočí odznak další kapitoly (kruh r 92 · 0,62 kolem 540, 460)
function cardMorph(t, t0, y0) {
  // po smrsknutí kapka ještě 0,15 s dosvítí pod odznakem, který mezitím nabíhá (jinak by na chvilku blikla mezera)
  const u0 = (t - t0) / 0.35; if (u0 <= 0 || u0 >= 1.43) return; const u = Math.min(1, u0), fadeK = u0 > 1 ? 1 - (u0 - 1) / 0.43 : 1;
  const e = E.io(u), X0 = 140, X1 = 940, Y0 = y0 || 380, Y1 = Y0 + 360, cx = 540, cy = 460, r = 92 * 0.62;
  const x0 = lerp(X0, cx - r, e), x1 = lerp(X1, cx + r, e), yA = lerp(Y0, cy - r, e), yB = lerp(Y1, cy + r, e), rad = lerp(28, r, e);
  const col = [[23, 139], [25, 61], [27, 255]].map(c => Math.round(lerp(c[0], c[1], e)));
  ctx.save(); ctx.globalAlpha *= fadeK; ctx.fillStyle = `rgba(${col.join(',')},${lerp(0.84, 1, e)})`; ctx.shadowColor = 'rgba(139,61,255,0.6)'; ctx.shadowBlur = 30 * e;
  ctx.beginPath(); ctx.roundRect(x0, yA, x1 - x0, yB - yA, rad); ctx.fill(); ctx.restore();
}
// karta chyby (video o chybách v aero pozici, 28. 11. 2026): nadpis chyby, řádek ŠPATNĚ (šedý křížek, s opravou se přeškrtne
// a ztlumí) a řádek OPRAVA (fialová fajfka). o = { y0, title, from, to, out, hide, wrong: { label, at }, fix: { label, at } }
function mistakeCard(t, o) {
  const outK = o.out != null ? tw(t, o.out, 0.25) : 0;
  const a0 = clamp((t - o.from) / 0.3) * (1 - tw(t, o.to - 0.3, 0.3)) * (1 - (o.hide || 0)) * (1 - outK); if (a0 <= 0) return;
  const X0 = 140, X1 = 940, Y0 = o.y0 || 380, Y1 = Y0 + 300;
  ctx.save(); ctx.globalAlpha *= a0; const sc = 1 - 0.06 * outK; ctx.translate(540, (Y0 + Y1) / 2); ctx.scale(sc, sc); ctx.translate(-540, -(Y0 + Y1) / 2);
  ctx.fillStyle = 'rgba(23,25,27,0.84)'; ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(X0, Y0, X1 - X0, Y1 - Y0, 28); ctx.fill(); ctx.stroke();
  txt(o.title, 540, Y0 + 52, fit(o.title, { size: 36, w: 800, f: F.U, ls: -1, c: C.ink }, 720));
  const fixed = tw(t, o.fix.at, 0.4);
  const row = (y, lab, at, good) => {
    const p = popS(t, at, null, 0.45); if (p.a <= 0) return;
    ctx.save(); ctx.globalAlpha *= p.a * (good ? 1 : 1 - 0.55 * fixed); ctx.translate(X0 + 70, y); ctx.scale(p.s, p.s);
    ctx.fillStyle = good ? C.pu : 'rgba(228,227,222,0.2)'; ctx.beginPath(); ctx.arc(0, 0, 28, 0, 7); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
    if (good) { ctx.moveTo(-12, 1); ctx.lineTo(-3, 10); ctx.lineTo(13, -9); } else { ctx.moveTo(-10, -10); ctx.lineTo(10, 10); ctx.moveTo(10, -10); ctx.lineTo(-10, 10); }
    ctx.stroke();
    const fo = fit(lab, { size: 34, w: 800, align: 'left', c: good ? '#ffffff' : C.ink }, 620); txt(lab, 52, 12, fo);
    if (!good && fixed > 0) { const w = width(lab, fo); ctx.strokeStyle = 'rgba(228,227,222,0.85)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(48, 0); ctx.lineTo(48 + (w + 8) * fixed, 0); ctx.stroke(); }
    ctx.restore();
  };
  row(Y0 + 140, o.wrong.label, o.wrong.at, false); row(Y0 + 230, o.fix.label, o.fix.at, true);
  ctx.restore();
}
// karta výsledku: velké číslo, které se dopočítá (o = { at, out, value, fmt: 'pct' | 'ml', label, sub, src, from })
function resultCard(t, o) {
  const p = popS(t, o.at, o.out, 0.55); if (p.a <= 0) return;
  const X0 = 140, X1 = 940, Y0 = o.y0 || 380, Y1 = Y0 + 360, g = tw(t, o.at + 0.15, 0.9, E.quint), v = o.value * g;
  const num = o.fmt === 'ml' ? '+' + v.toFixed(0) : o.fmt === 'w' ? '+' + v.toFixed(0) + ' W' : '+' + v.toFixed(1) + '%';
  ctx.save(); ctx.globalAlpha *= p.a; ctx.translate(540, (Y0 + Y1) / 2 + p.dy); ctx.scale(p.s, p.s); ctx.translate(-540, -(Y0 + Y1) / 2);
  ctx.fillStyle = 'rgba(23,25,27,0.84)'; ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(X0, Y0, X1 - X0, Y1 - Y0, 28); ctx.fill(); ctx.stroke();
  txt(o.label, 540, Y0 + 62, { size: 28, w: 800, ls: 4, c: C.muted });
  txt(num, 540, Y0 + 190, { size: 150, w: 800, f: F.U, ls: -4, c: C.pu });
  txt(o.sub, 540, Y0 + 262, fit(o.sub, { size: 34, w: 800, c: C.ink }, 720));
  if (o.src) txt(o.src, 540, Y1 - 22, fit(o.src, { size: 18, w: 700, ls: 2, c: 'rgba(154,154,152,0.85)' }, 740));
  ctx.restore();
}

// ---------- VIDEO „NORWEGIAN 4×4“ podle reference the.better.run (autor 26. 11. 2026): stejné grafiky v našich barvách ----------
// viditelnost 0 až 1: naskočí v a (popS s překmitem), zmizí v b; vrací { a, s, dy }
const n44Vis = (t, a, b) => popS(t, a, b == null ? null : b, 0.5);
function n44Box(x0, y0, x1, y1, r) { ctx.fillStyle = 'rgba(23,25,27,0.84)'; ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x0, y0, x1 - x0, y1 - y0, r || 28); ctx.fill(); ctx.stroke(); }
function n44Pop(t, a, b, cx, cy, draw) { const p = n44Vis(t, a, b); if (p.a <= 0) return; ctx.save(); ctx.globalAlpha *= p.a; ctx.translate(cx, cy + p.dy); ctx.scale(p.s, p.s); ctx.translate(-cx, -cy); draw(); ctx.restore(); }
// cyklista jako piktogram (jako běžec v referenci): x, y = spodek kol uprostřed, s = velikost, low 0 vzpřímeně až 1 nízko, crank = úhel kliky
function bikeIcon(x, y, s, col, crank, low) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 10, s / 10); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const rw = [-17, -10], fw = [17, -10], bb = [-2, -10], seat = [-6, -26], bar = [12, -27];
  for (const w of [rw, fw]) { ctx.beginPath(); ctx.arc(w[0], w[1], 10, 0, 7); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(rw[0], rw[1]); ctx.lineTo(bb[0], bb[1]); ctx.lineTo(seat[0], seat[1]); ctx.lineTo(rw[0], rw[1]); ctx.moveTo(bb[0], bb[1]); ctx.lineTo(bar[0] - 2, bar[1] + 3); ctx.lineTo(seat[0], seat[1]); ctx.moveTo(bar[0] - 2, bar[1] + 3); ctx.lineTo(fw[0], fw[1]); ctx.stroke();
  const hip = [seat[0], seat[1] - 3], sh = [lerp(4, 10, low), lerp(-45, -36, low)], head = [sh[0] + lerp(3, 7, low), sh[1] - lerp(7, 4.5, low)];
  ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(hip[0], hip[1]); ctx.lineTo(sh[0], sh[1]); ctx.lineTo(bar[0], bar[1]); ctx.stroke(); ctx.beginPath(); ctx.arc(head[0], head[1], 4.4, 0, 7); ctx.fill();
  for (const ph of [Math.PI, 0]) { const a = crank + ph, p = [bb[0] + 5 * Math.cos(a), bb[1] + 5 * Math.sin(a)], dx = p[0] - hip[0], dy = p[1] - hip[1], D = Math.min(25.5, Math.hypot(dx, dy)), aa = Math.atan2(dy, dx), k = Math.acos(D / 26);
    const knee = [hip[0] + 13 * Math.cos(aa - k), hip[1] + 13 * Math.sin(aa - k)]; ctx.save(); if (ph) ctx.globalAlpha *= 0.5; ctx.beginPath(); ctx.moveTo(hip[0], hip[1]); ctx.lineTo(knee[0], knee[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); ctx.restore(); }
  ctx.restore();
}
// budík (jako tachometr v referenci): o = { a, b, cx, cy, r, label, inner, val (0 až 1), dim }
function n44Gauge(t, o) {
  n44Pop(t, o.a, o.b, o.cx, o.cy, () => {
    const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25, v = clamp(o.val), av = lerp(a0, a1, v), d = 1 - 0.6 * (o.dim || 0);
    ctx.save(); ctx.globalAlpha *= d; ctx.lineCap = 'round';
    ctx.lineWidth = 34; ctx.strokeStyle = 'rgba(228,227,222,0.14)'; ctx.beginPath(); ctx.arc(o.cx, o.cy, o.r, a0, a1); ctx.stroke();
    const g = ctx.createLinearGradient(o.cx - o.r, o.cy, o.cx + o.r, o.cy); g.addColorStop(0, '#5B22C9'); g.addColorStop(1, '#B07CFF');
    ctx.strokeStyle = g; ctx.shadowColor = 'rgba(139,61,255,0.7)'; ctx.shadowBlur = 24; ctx.beginPath(); ctx.arc(o.cx, o.cy, o.r, a0, av); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(228,227,222,0.5)'; ctx.lineWidth = 3;
    for (let i = 0; i <= 10; i++) { const a = lerp(a0, a1, i / 10), r1 = o.r - 30, r2 = o.r - (i % 5 ? 40 : 50); ctx.beginPath(); ctx.moveTo(o.cx + r1 * Math.cos(a), o.cy + r1 * Math.sin(a)); ctx.lineTo(o.cx + r2 * Math.cos(a), o.cy + r2 * Math.sin(a)); ctx.stroke(); }
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(o.cx, o.cy); ctx.lineTo(o.cx + (o.r - 46) * Math.cos(av), o.cy + (o.r - 46) * Math.sin(av)); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(o.cx, o.cy, 14, 0, 7); ctx.fill();
    txt(o.label, o.cx, o.cy - o.r - 36, { size: 24, w: 800, ls: 5, c: C.muted });
    txt(o.inner, o.cx, o.cy + 62, { size: 34, w: 800, f: F.U, ls: 2, c: C.ink });
    ctx.restore();
  });
}
// studie: 4 tréninky v mřížce, 40 postaviček, štítky (o = { a, b, y0, head, tiles: [{ name, sub, at, hl, lvl }], dots: { at, n }, chips: [{ lab, at, hl }] })
function n44Study(t, o) {
  n44Pop(t, o.a, o.b, 540, o.y0 + 200, () => {
    const X0 = 140, X1 = 940, Y0 = o.y0, Y1 = Y0 + 410; n44Box(X0, Y0, X1, Y1);
    txt(o.head, 540, Y0 + 40, { size: 22, w: 800, ls: 4, c: C.muted });
    o.tiles.forEach((tl, i) => {
      const x = 160 + (i % 2) * 390, y = Y0 + 62 + Math.floor(i / 2) * 106, cx = x + 185, cy = y + 48;
      n44Pop(t, tl.at, null, cx, cy, () => {
        ctx.fillStyle = tl.hl ? 'rgba(139,61,255,0.22)' : 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.roundRect(x, y, 370, 96, 18); ctx.fill();
        if (tl.hl) { ctx.strokeStyle = C.pu; ctx.lineWidth = 3; ctx.stroke(); }
        txt(tl.name, x + 20, y + 40, { size: 28, w: 800, f: F.U, align: 'left', c: tl.hl ? '#ffffff' : C.ink });
        txt(tl.sub, x + 20, y + 64, { size: 15, w: 800, ls: 2, align: 'left', c: C.muted });
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.roundRect(x + 20, y + 76, 180, 8, 4); ctx.fill();
        ctx.fillStyle = tl.hl ? C.pu : 'rgba(228,227,222,0.6)'; ctx.beginPath(); ctx.roundRect(x + 20, y + 76, 180 * tl.lvl * tw(t, tl.at + 0.2, 0.6, E.quint), 8, 4); ctx.fill();
        bikeIcon(x + 300, y + 82, 14, tl.hl ? C.pu : C.ink, t * (tl.hl ? 11 : 8), tl.lvl);
      });
    });
    // 40 postaviček (dva řádky po 20), naskakují postupně
    for (let i = 0; i < o.dots.n; i++) {
      const k = clamp((t - o.dots.at - 0.6 * i / o.dots.n) / 0.15); if (k <= 0) continue;
      const x = 180 + (i % 20) * 38, y = Y0 + 296 + Math.floor(i / 20) * 40;
      ctx.save(); ctx.globalAlpha *= k; ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(x, y - 10, 6, 0, 7); ctx.fill(); ctx.beginPath(); ctx.roundRect(x - 8, y - 1, 16, 16, 6); ctx.fill(); ctx.restore();
    }
    let cx = 160; o.chips.forEach(c => { const w = width(c.lab, { size: 18, w: 800, ls: 2 }) + 26, x = cx; cx += w + 10;
      n44Pop(t, c.at, null, x + w / 2, Y1 - 30, () => { ctx.fillStyle = c.hl ? C.pu : 'rgba(228,227,222,0.16)'; ctx.beginPath(); ctx.roundRect(x, Y1 - 48, w, 34, 17); ctx.fill(); txt(c.lab, x + w / 2, Y1 - 25, { size: 18, w: 800, ls: 2, c: c.hl ? '#ffffff' : C.ink }); }); });
  });
}
// výsledky: sloupce změny VO2 max (o = { a, b, y0, head, max, bars: [{ name, val, at, grow, grey }], tag: { lab, at }, src })
function n44Results(t, o) {
  n44Pop(t, o.a, o.b, 540, o.y0 + 200, () => {
    const X0 = 140, X1 = 940, Y0 = o.y0, Y1 = Y0 + 410, PB = Y1 - 76, PT = Y0 + 86, PH = PB - PT; n44Box(X0, Y0, X1, Y1);
    txt(o.head, 540, Y0 + 40, { size: 22, w: 800, ls: 4, c: C.muted });
    for (let g = 0; g <= 8; g += 2) { const y = PB - PH * g / o.max; ctx.strokeStyle = 'rgba(255,255,255,' + (g ? 0.07 : 0.2) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(230, y); ctx.lineTo(910, y); ctx.stroke(); txt(g ? '+' + g + '%' : '0', 214, y + 6, { size: 16, w: 700, align: 'right', c: C.muted }); }
    const last = o.bars.reduce((k, b, j) => t >= b.at ? j : k, -1);
    o.bars.forEach((b, j) => {
      if (t < b.at) return; const cx = 320 + j * 170, g = tw(t, b.grow, 0.9, E.quint), v = b.val * g, h = PH * v / o.max, on = j === last && !b.grey;
      ctx.fillStyle = b.grey ? 'rgba(228,227,222,0.35)' : on ? C.pu : 'rgba(139,61,255,0.55)'; ctx.beginPath(); ctx.roundRect(cx - 50, PB - Math.max(h, 6), 100, Math.max(h, 6), 10); ctx.fill();
      txt(b.name, cx, PB + 30, { size: 16, w: 800, ls: 2, c: on ? C.ink : C.muted, a: clamp((t - b.at) / 0.25) });
      if (!b.grey && g > 0) txt('+' + v.toFixed(1) + '%', cx, PB - h - 16, { size: on ? 40 : 30, w: 800, f: F.U, c: on ? C.ink : 'rgba(228,227,222,0.75)' });
    });
    if (o.tag) n44Pop(t, o.tag.at, null, 405, PB - 50, () => { const w = width(o.tag.lab, { size: 20, w: 800, ls: 2 }) + 30; ctx.fillStyle = 'rgba(228,227,222,0.9)'; ctx.beginPath(); ctx.roundRect(405 - w / 2, PB - 70, w, 38, 19); ctx.fill(); txt(o.tag.lab, 405, PB - 44, { size: 20, w: 800, ls: 2, c: '#17191B' }); });
    if (o.src) txt(o.src, 540, Y1 - 18, { size: 16, w: 700, ls: 2, c: 'rgba(154,154,152,0.85)' });
  });
}
// srdce a dvě sklenice krve na úder (o = { a, b, y0, head, at: { glass, after, pct }, pct, foot, src })
function n44Heart(t, o) {
  n44Pop(t, o.a, o.b, 540, o.y0 + 200, () => {
    const X0 = 140, X1 = 940, Y0 = o.y0, Y1 = Y0 + 410; n44Box(X0, Y0, X1, Y1);
    txt(o.head, 690, Y0 + 50, { size: 22, w: 800, ls: 4, c: C.muted });
    const beat = Math.pow(Math.max(0, Math.sin((t - o.a) * Math.PI * 2 * 1.15)), 6), hx = 330, hy = Y0 + 200, s = 1.25 * (1 + 0.09 * beat);
    ctx.save(); ctx.translate(hx, hy); ctx.scale(s, s); ctx.shadowColor = 'rgba(139,61,255,0.85)'; ctx.shadowBlur = 40 + 30 * beat; ctx.fillStyle = C.pu;
    ctx.beginPath(); ctx.moveTo(0, 60); ctx.bezierCurveTo(-90, 0, -70, -70, 0, -32); ctx.bezierCurveTo(70, -70, 90, 0, 0, 60); ctx.fill(); ctx.restore();
    [['BEFORE', o.at.glass, 0.68, 'rgba(228,227,222,0.6)'], ['AFTER', o.at.after, 0.68 * 1.1, C.pu]].forEach(([lab, at, f, col], j) => {
      const x = 600 + j * 150, y = Y0 + 96, w = 104, h = 210; if (t < at) return; const k = tw(t, at, 0.9, E.quint);
      ctx.save(); ctx.globalAlpha *= clamp((t - at) / 0.2); ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x, y + h * (1 - f * k), w, h * f * k, 10); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h - 10); ctx.quadraticCurveTo(x, y + h, x + 10, y + h); ctx.lineTo(x + w - 10, y + h); ctx.quadraticCurveTo(x + w, y + h, x + w, y + h - 10); ctx.lineTo(x + w, y); ctx.stroke();
      txt(lab, x + w / 2, y + h + 30, { size: 17, w: 800, ls: 2, c: j ? C.pu : C.muted }); ctx.restore();
    });
    n44Pop(t, o.at.pct, null, 802, Y0 + 80, () => txt(o.pct, 802, Y0 + 92, { size: 48, w: 800, f: F.U, c: C.ink }));
    if (o.foot && t >= o.at.after) txt(o.foot, 540, Y1 - 56, { size: 17, w: 800, ls: 2, c: C.muted, a: clamp((t - o.at.after) / 0.4) });
    if (o.src) txt(o.src, 540, Y1 - 20, { size: 16, w: 700, ls: 2, c: 'rgba(154,154,152,0.85)' });
  });
}
// trénink: horní karta (piktogram a stav), graf tepu (rozjetí, 4× tvrdě a lehce, pásmo 90–95 %), plán týdne
// o = { a, b, y0, state: [[čas, 'WARM UP', tvrdě?], …], low (0 až 1), at: { warm, hard, band, easy, reps, week, rest }, week: ['E','H',…] }
function n44Session(t, o) {
  n44Pop(t, o.a, o.b, 540, o.y0 + 200, () => {
    const X0 = 140, X1 = 940, Y0 = o.y0;
    n44Box(X0, Y0, X1, Y0 + 110);
    txt('THE SESSION', X0 + 30, Y0 + 44, { size: 22, w: 800, ls: 4, align: 'left', c: C.muted });
    const st = o.state.reduce((k, s) => t >= s[0] ? s : k, o.state[0]), w = width(st[1], { size: 22, w: 800, ls: 2 }) + 34;
    n44Pop(t, st[0], null, X1 - 30 - w / 2, Y0 + 40, () => { ctx.fillStyle = st[2] ? C.pu : 'rgba(228,227,222,0.2)'; ctx.beginPath(); ctx.roundRect(X1 - 30 - w, Y0 + 20, w, 40, 20); ctx.fill(); txt(st[1], X1 - 30 - w / 2, Y0 + 48, { size: 22, w: 800, ls: 2, c: st[2] ? '#ffffff' : C.ink }); });
    bikeIcon(540, Y0 + 100, 22, st[2] ? C.pu : C.ink, t * lerp(8, 12, o.low), o.low);
    // graf tepu
    const G0 = Y0 + 124, G1 = G0 + 250, PX0 = 190, PX1 = 900, PB = G1 - 34, PT = G0 + 50, PH = PB - PT; n44Box(X0, G0, X1, G1);
    txt('HEART RATE', X0 + 30, G0 + 38, { size: 20, w: 800, ls: 4, align: 'left', c: C.muted });
    const segs = [{ k: 'w', d: 10 }]; for (let i = 0; i < 4; i++) { segs.push({ k: 'h', d: 4, r: i }); segs.push({ k: 'e', d: 3, r: i }); }
    const tot = segs.reduce((q, s2) => q + s2.d, 0), kx = (PX1 - PX0) / tot; let x = PX0;
    const lv = { w: [0.3, 0.55], h: 0.9, e: 0.55 };
    segs.forEach((sg, i) => {
      const at = sg.k === 'w' ? o.at.warm : sg.r === 0 ? (sg.k === 'h' ? o.at.hard : o.at.easy) : o.at.reps + 0.18 * (i - 2), g = tw(t, at, 0.5, E.quint), w2 = sg.d * kx;
      if (g > 0) {
        ctx.fillStyle = sg.k === 'h' ? C.pu : 'rgba(228,227,222,0.22)'; ctx.beginPath();
        if (sg.k === 'w') { ctx.moveTo(x, PB); ctx.lineTo(x, PB - PH * lv.w[0] * g); ctx.lineTo(x + w2, PB - PH * lv.w[1] * g); ctx.lineTo(x + w2, PB); }
        else { const h = PH * (sg.k === 'h' ? lv.h : lv.e) * g; ctx.roundRect(x + 1, PB - h, w2 - 2, h, sg.k === 'h' ? 6 : 3); }
        ctx.fill();
      }
      x += w2;
    });
    txt('10 MIN', PX0 + 10 * kx / 2, PB + 26, { size: 15, w: 800, ls: 1, c: C.muted, a: clamp((t - o.at.warm) / 0.3) });
    if (t >= o.at.band) { const k = tw(t, o.at.band, 0.6), y = PB - PH * 0.93; ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.setLineDash([9, 8]); ctx.beginPath(); ctx.moveTo(PX0, y); ctx.lineTo(PX0 + (PX1 - PX0) * k, y); ctx.stroke(); ctx.setLineDash([]);
      txt('90–95% HR MAX', PX1, y - 10, { size: 17, w: 800, ls: 1, align: 'right', c: '#ffffff', a: k }); ctx.restore(); }
    // plán týdne
    // plán týdne na vlastní tmavé kartě (na světlé krajině by popisky nešly přečíst)
    if (t >= o.at.week) { const days = 'MTWTFSS', step = 104, y = G1 + 52; n44Pop(t, o.at.week - 0.1, null, 540, y + 10, () => n44Box(X0, G1 + 12, X1, G1 + 112, 22));
      o.week.forEach((d, i) => { const at = o.at.week + 0.07 * i, x2 = 228 + i * step; n44Pop(t, at, null, x2, y, () => {
        const on = d === 'H', opt = d === 'h', easyGlow = !on && !opt && o.at.rest != null && t >= o.at.rest;
        ctx.fillStyle = on ? C.pu : opt ? 'rgba(139,61,255,0.45)' : easyGlow ? 'rgba(228,227,222,0.34)' : 'rgba(228,227,222,0.16)'; ctx.beginPath(); ctx.arc(x2, y, 24, 0, 7); ctx.fill();
        txt(days[i], x2, y + 8, { size: 22, w: 800, c: on || opt ? '#ffffff' : C.ink }); txt(on || opt ? 'HARD' : 'EASY', x2, y + 46, { size: 14, w: 800, ls: 1, c: on || opt ? C.pu : C.muted }); }); }); }
  });
}

// ---------- KONEC VIDEA: pošli kamarádovi + sleduj ----------
// Varianta 1 „karty přes krajinu“ (autor 22. 11. 2026 podle vzorového reelu): jezdec jede dál, přes krajinu vyskočí panel
// sdílení (kontakty, zpráva, Send → Sent) a pak karta profilu (Follow → Following). Karta profilu je jediné místo s názvem
// a malým logem aplikace wattIF (výjimka od autora 22. 11. 2026). Kreslí se v souřadnicích obrazovky 1080 × 1920 (bez ZOOM).
// o = { share, pick, tap, follow, ftap }: časy v s (panel, výběr kontaktu, klepnutí na Send, karta profilu, klepnutí na Follow)
const CTA_NAMES = ['Alex', 'Sam', 'Leo', 'Tom'], CTA_COLS = ['#3d3550', '#3A3C3D', '#33403f', '#463d36'], CTA_FIELD = '#2E3031';
function ctaCards(t, o) {
  if (t < o.share - 0.05) return;
  ctx.save(); ctx.translate(540, 905); ctx.scale(1 / ZOOM, 1 / ZOOM); ctx.translate(-540, -905);
  const inn = at => { const k = ease('back.out(1.6)')(clamp((t - at) / 0.5)); return { a: clamp((t - at) / 0.15), s: lerp(0.86, 1, k), dy: (1 - k) * 70 }; };
  const outK = ease('power2.in')(clamp((t - o.follow + 0.25) / 0.3));   // panel sdílení odjede nahoru, než přijde karta profilu
  if (outK < 1) { const p = inn(o.share); ctaGroup(p.a * (1 - outK), p.s, 540, 760, p.dy - 110 * outK, () => ctaShare(t, o)); }
  if (t >= o.follow) { const p = inn(o.follow); ctaGroup(p.a, p.s, 540, 710, p.dy, () => ctaProfile(t, o)); }
  ctx.restore();
}
function ctaGroup(a, s, cx, cy, dy, draw) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.translate(cx, cy + dy); ctx.scale(s, s); ctx.translate(-cx, -cy); draw(); ctx.restore(); }
function ctaCard(x, y, w, h) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 10; ctx.fillStyle = 'rgba(35,37,38,0.97)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, 40); ctx.fill(); ctx.restore(); }
function ctaCheck(x, y, s, col) { ctx.save(); ctx.strokeStyle = col || C.ink; ctx.lineWidth = 6 * s; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x - 12 * s, y); ctx.lineTo(x - 3 * s, y + 9 * s); ctx.lineTo(x + 13 * s, y - 9 * s); ctx.stroke(); ctx.restore(); }
// tlačítko se při klepnutí krátce zmáčkne (k = 0 až 1 během 0,25 s po klepnutí)
function ctaPress(t, at, cx, cy) { const k = 1 - 0.05 * Math.sin(Math.PI * clamp((t - at) / 0.25)); ctx.translate(cx, cy); ctx.scale(k, k); ctx.translate(-cx, -cy); }
// prst: bílá tečka přijede 0,35 s před klepnutím, při klepnutí se zmenší a rozběhne se kruh
function ctaTap(t, at, x, y) {
  const u = (t - at + 0.35) / 0.9; if (u <= 0 || u >= 1) return;
  const a = clamp(u / 0.25) * clamp((1 - u) / 0.3), pr = clamp((t - at) / 0.4), mv = ease('power2.out')(clamp((t - at + 0.35) / 0.35));
  ctx.save(); ctx.globalAlpha *= a;
  if (pr > 0 && pr < 1) { ctx.save(); ctx.globalAlpha *= 1 - pr; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, 34 + 70 * ease('power2.out')(pr), 0, 7); ctx.stroke(); ctx.restore(); }
  const px = x + (1 - mv) * 70, py = y + (1 - mv) * 90, r = 30 - 6 * Math.sin(Math.PI * clamp((t - at + 0.05) / 0.25));
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(px, py, r + 22, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill(); ctx.restore();
}
function ctaShare(t, o) {
  const X = 90, Y = 430; ctaCard(X, Y, 900, 660);
  ctx.fillStyle = C.line2; ctx.beginPath(); ctx.roundRect(X + 405, Y + 22, 90, 10, 5); ctx.fill();
  ctx.fillStyle = CTA_FIELD; ctx.beginPath(); ctx.roundRect(X + 40, Y + 60, 820, 76, 38); ctx.fill();
  ctx.strokeStyle = C.muted; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(X + 92, Y + 96, 14, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(X + 102, Y + 106); ctx.lineTo(X + 116, Y + 120); ctx.stroke();
  txt('Search', X + 132, Y + 108, { size: 34, w: 600, c: C.muted, align: 'left' });
  const pk = ease('back.out(2)')(clamp((t - o.pick) / 0.35));
  CTA_NAMES.forEach((n, i) => {
    const cx = X + 112 + i * 225, cy = Y + 245;
    ctx.fillStyle = CTA_COLS[i]; ctx.beginPath(); ctx.arc(cx, cy, 70, 0, 7); ctx.fill();
    txt(n[0], cx, cy + 19, { size: 54, w: 800 }); txt(n, cx, cy + 116, { size: 30, w: 600 });
    if (i === 0 && pk > 0) {   // vybraný kontakt: fialový kroužek a odškrtnutí
      ctx.save(); ctx.globalAlpha *= clamp(pk * 3); ctx.strokeStyle = C.pu; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(cx, cy, 80, 0, 7); ctx.stroke();
      ctx.translate(cx + 54, cy + 52); ctx.scale(pk, pk); ctx.fillStyle = C.pu; ctx.beginPath(); ctx.arc(0, 0, 26, 0, 7); ctx.fill(); ctaCheck(0, 0, 1); ctx.restore();
    }
  });
  txt('Write a message…', X + 40, Y + 468, { size: 32, w: 600, c: C.muted, align: 'left' }); ctx.fillStyle = C.line2; ctx.fillRect(X + 40, Y + 488, 820, 3);
  const sent = t >= o.tap + 0.15;
  ctx.save(); ctaPress(t, o.tap, X + 450, Y + 576);
  ctx.fillStyle = sent ? CTA_FIELD : C.pu; ctx.beginPath(); ctx.roundRect(X + 40, Y + 528, 820, 96, 48); ctx.fill();
  if (sent) { ctaCheck(X + 376, Y + 576, 1.1); txt('Sent', X + 410, Y + 590, { size: 40, w: 800, align: 'left' }); } else txt('Send', X + 450, Y + 590, { size: 40, w: 800 });
  ctx.restore();
  ctaTap(t, o.tap, X + 610, Y + 576);
}
function ctaProfile(t, o) {
  const X = 90, Y = 520; ctaCard(X, Y, 900, 380);
  ctx.fillStyle = C.bg; ctx.beginPath(); ctx.arc(X + 120, Y + 120, 74, 0, 7); ctx.fill(); ctx.strokeStyle = C.pu; ctx.lineWidth = 5; ctx.stroke();
  rich([['watt', C.ink], ['IF', C.pu]], X + 120, Y + 131, { size: 26, w: 800, f: F.U, ls: -1 });
  left([['watt', C.ink], ['IF', C.pu]], X + 225, Y + 112, { size: 52, w: 800, f: F.U, ls: -2 });
  txt('Cycling aero · free speed', X + 226, Y + 162, { size: 31, w: 600, c: C.muted, align: 'left' });
  const fol = t >= o.ftap + 0.15;
  ctx.save(); ctaPress(t, o.ftap, X + 240, Y + 273);
  ctx.fillStyle = fol ? CTA_FIELD : C.pu; ctx.beginPath(); ctx.roundRect(X + 40, Y + 230, 400, 86, 22); ctx.fill();
  if (fol) { txt('Following', X + 222, Y + 287, { size: 36, w: 800 }); ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(X + 318, Y + 266); ctx.lineTo(X + 328, Y + 276); ctx.lineTo(X + 338, Y + 266); ctx.stroke(); }
  else txt('Follow', X + 240, Y + 287, { size: 36, w: 800 });
  ctx.restore();
  ctx.fillStyle = CTA_FIELD; ctx.beginPath(); ctx.roundRect(X + 460, Y + 230, 400, 86, 22); ctx.fill(); txt('Message', X + 660, Y + 287, { size: 36, w: 800 });
  ctaTap(t, o.ftap, X + 392, Y + 273);
}
// ---------- /KONEC VIDEA ----------
