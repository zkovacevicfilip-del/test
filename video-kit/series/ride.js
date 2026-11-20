// ---------- JÍZDA: animovaný jezdec na kole z boku, silnice, proudnice a titulky nahoře ----------
// Formát „ride“ (podle vzorových reels, ale vlastní 2D kresba v naší paletě): jezdci se točícími se koly a šlapáním,
// štítky s čísly přichycené k jezdcům, silnice nebo svah, proudnice vzduchu kolem těla a titulky nahoře se zvýrazněným slovem.
// Souřadnice jezdce: počátek na zemi uprostřed mezi koly, y nahoru záporné, měřítko 1 = asi 210 px na metr.

const RG = {
  rear: [-105, -71], front: [105, -71], bb: [-12, -60], seat: [-52, -186], saddle: [-62, -210],
  headTop: [72, -190], headBot: [82, -150], hoods: [100, -199], drops: [101, -168], wheelR: 71, crank: 36
};
// poloha: 0 = vzpřímeně (ruce na páčkách, natažené paže), 1 = nízko (ohnuté lokty, nižší záda), 2 = skrčeně ve sjezdu
const POSE = [{ torso: 48, hands: RG.hoods, head: [30, -30] }, { torso: 30, hands: [97, -197], head: [36, -20] }, { torso: 16, hands: RG.drops, head: [38, -12] }];
const lerp2 = (p, q, k) => [lerp(p[0], q[0], k), lerp(p[1], q[1], k)];
function poseAt(p) { const i = Math.max(0, Math.min(1, Math.floor(p))), k = clamp(p - i); const a = POSE[i], b = POSE[Math.min(2, i + 1)]; return { torso: lerp(a.torso, b.torso, k), hands: lerp2(a.hands, b.hands, k), head: lerp2(a.head, b.head, k) }; }
// dvoukloubová úloha (stehno a lýtko, nadloktí a předloktí): kde je koleno nebo loket
function ik(A, B, l1, l2, pick) {
  const dx = B[0] - A[0], dy = B[1] - A[1], d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.5), a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const ux = dx / Math.hypot(dx, dy), uy = dy / Math.hypot(dx, dy), px = A[0] + a * ux, py = A[1] + a * uy;
  const c1 = [px - h * uy, py + h * ux], c2 = [px + h * uy, py - h * ux];
  return pick(c1, c2) ? c1 : c2;
}
function seg(g, p, q, w, col) { g.lineWidth = w; g.strokeStyle = col; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); }
// končetina jako zužující se tvar se zaoblenými konci (šířka w1 u p, w2 u q)
function limb(g, p, q, w1, w2, col) {
  const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  g.fillStyle = col; g.beginPath();
  g.moveTo(p[0] + nx * w1 / 2, p[1] + ny * w1 / 2); g.lineTo(q[0] + nx * w2 / 2, q[1] + ny * w2 / 2);
  g.lineTo(q[0] - nx * w2 / 2, q[1] - ny * w2 / 2); g.lineTo(p[0] - nx * w1 / 2, p[1] - ny * w1 / 2); g.closePath(); g.fill();
  g.beginPath(); g.arc(p[0], p[1], w1 / 2, 0, 7); g.fill(); g.beginPath(); g.arc(q[0], q[1], w2 / 2, 0, 7); g.fill();
}
// kolo s vysokým (aero) ráfkem: plášť, tmavý ráfek, značka na ráfku ukazuje otáčení
function wheel(g, c, ang, acc) {
  const R = RG.wheelR;
  g.save(); g.translate(c[0], c[1]);
  g.fillStyle = '#26282C'; g.beginPath(); g.arc(0, 0, R - 4, 0, 7); g.arc(0, 0, R - 24, 0, 7, true); g.fill();
  g.strokeStyle = C.muted; g.lineWidth = 1.5; g.globalAlpha *= 0.8;
  for (let i = 0; i < 12; i++) { const u = ang + i * Math.PI / 6; g.beginPath(); g.moveTo(Math.cos(u) * 6, Math.sin(u) * 6); g.lineTo(Math.cos(u) * (R - 24), Math.sin(u) * (R - 24)); g.stroke(); }
  g.globalAlpha /= 0.8;
  g.strokeStyle = acc; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, R - 14, ang, ang + 0.9); g.stroke();
  g.beginPath(); g.arc(0, 0, R - 14, ang + Math.PI, ang + Math.PI + 0.9); g.stroke();
  g.strokeStyle = C.ink; g.lineWidth = 7; g.beginPath(); g.arc(0, 0, R - 2, 0, 7); g.stroke();
  g.strokeStyle = C.line2; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, R - 24, 0, 7); g.stroke();
  g.fillStyle = C.ink; g.beginPath(); g.arc(0, 0, 7, 0, 7); g.fill();
  g.restore();
}
// kostra jezdce v dané poloze (bez kreslení): kyčel, rameno, hlava
function riderBones(pose) {
  const P = poseAt(pose || 0), tr = P.torso * Math.PI / 180, hip = [RG.saddle[0] + 4, RG.saddle[1] - 14];
  const sh = [hip[0] + 128 * Math.cos(tr), hip[1] - 128 * Math.sin(tr)];
  return { P, tr, hip, sh, hc: [sh[0] + P.head[0], sh[1] + P.head[1]] };
}
// nejvyšší bod helmy nad zemí (v px při měřítku 1), aby štítky nikdy nezakryly hlavu
function riderTop(pose) { return riderBones(pose).hc[1] - 30; }
// jezdec s kolem: x, zem, měřítko; o: { crank (úhel kliky), wheel (úhel kola), pose (0–2), accent (fialové doplňky), a (průhlednost) }
function drawRider(x, ground, sc, o) {
  const g = ctx, B = riderBones(o.pose), P = B.P, acc = o.accent ? C.pu : '#6E6D6A', skin = C.ink, far = '#8A8985', shorts = '#3E4045';
  g.save(); g.translate(x, ground); g.scale(sc, sc); g.globalAlpha *= o.a == null ? 1 : o.a; g.lineCap = 'round'; g.lineJoin = 'round';
  // stín na silnici
  g.save(); g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(0, 4, 200, 12, 0, 0, 7); g.fill(); g.restore();
  const hip = B.hip, sh = B.sh, hc = B.hc;
  const ped = th => [RG.bb[0] + RG.crank * Math.cos(th), RG.bb[1] + RG.crank * Math.sin(th)];
  const leg = (th, near) => {
    const p = ped(th), ank = [p[0] - 4, p[1] - 14], kn = ik(hip, ank, 100, 94, (c1, c2) => c1[0] > c2[0]);
    const sk = near ? skin : far, sh2 = near ? shorts : '#2F3135';
    limb(g, hip, kn, 36, 25, sh2); limb(g, [lerp(hip[0], kn[0], 0.72), lerp(hip[1], kn[1], 0.72)], kn, 25, 24, sk);
    limb(g, kn, ank, 23, 14, sk);
    limb(g, [ank[0] - 6, ank[1] + 2], [p[0] + 20, p[1] + 2], 15, 11, near ? acc : '#4A4C50');
  };
  const arm = near => {
    const hd = P.hands, el = ik(sh, hd, 68, 64, (c1, c2) => c1[1] > c2[1]), col = near ? skin : far;
    limb(g, sh, el, 22, 17, col); limb(g, el, hd, 16, 12, col);
    g.fillStyle = near ? '#2F3135' : '#26282B'; g.beginPath(); g.arc(hd[0], hd[1], 8, 0, 7); g.fill();
  };
  const th = o.crank || 0;
  // vzadu: vzdálená noha a ruka (tmavší, plné barvy, aby se nepřekrývaly průhledně)
  leg(th + Math.PI, false); arm(false);
  // kolo
  wheel(g, RG.rear, o.wheel || 0, acc); wheel(g, RG.front, o.wheel || 0, acc);
  [[RG.bb, RG.seat], [RG.seat, RG.headTop], [RG.bb, RG.headBot], [RG.rear, RG.bb], [RG.rear, RG.seat], [RG.headTop, RG.headBot], [RG.headBot, RG.front]].forEach(([p, q]) => seg(g, p, q, 9, C.ink));
  seg(g, RG.seat, RG.saddle, 6, C.muted); limb(g, [RG.saddle[0] - 22, RG.saddle[1] + 1], [RG.saddle[0] + 18, RG.saddle[1] + 3], 11, 7, '#2F3135');
  seg(g, RG.headTop, [94, -197], 7, C.muted);
  g.lineWidth = 7; g.strokeStyle = C.muted; g.beginPath(); g.moveTo(94, -197); g.quadraticCurveTo(114, -194, 107, -175); g.quadraticCurveTo(102, -163, 91, -162); g.stroke();
  g.strokeStyle = C.ink; g.lineWidth = 4; g.beginPath(); g.arc(RG.bb[0], RG.bb[1], 25, 0, 7); g.stroke();
  seg(g, ped(th + Math.PI), ped(th), 7, C.muted); g.fillStyle = C.ink; g.beginPath(); g.arc(RG.bb[0], RG.bb[1], 9, 0, 7); g.fill();
  // vpředu: blízká noha, trup (dres), hlava s helmou, blízká ruka
  leg(th, true);
  const ux = Math.cos(B.tr), uy = -Math.sin(B.tr), nb = [uy, -ux];
  g.fillStyle = skin; g.beginPath();
  g.moveTo(hip[0] + nb[0] * 17, hip[1] + nb[1] * 17); g.lineTo(sh[0] + nb[0] * 19, sh[1] + nb[1] * 19);
  g.quadraticCurveTo(sh[0] + ux * 26, sh[1] + uy * 26, sh[0] - nb[0] * 24, sh[1] - nb[1] * 24);
  g.lineTo(hip[0] - nb[0] * 21 + ux * 30, hip[1] - nb[1] * 21 + uy * 30); g.quadraticCurveTo(hip[0] - nb[0] * 22, hip[1] - nb[1] * 22, hip[0] - ux * 16, hip[1] - uy * 16); g.closePath(); g.fill();
  // boční pruh dresu a stín na břiše pro plastičnost
  limb(g, [hip[0] + nb[0] * 8 + ux * 6, hip[1] + nb[1] * 8 + uy * 6], [sh[0] + nb[0] * 10 - ux * 10, sh[1] + nb[1] * 10 - uy * 10], 9, 9, acc);
  g.save(); g.globalAlpha *= 0.18; limb(g, [hip[0] - nb[0] * 13 + ux * 20, hip[1] - nb[1] * 13 + uy * 20], [sh[0] - nb[0] * 15 - ux * 14, sh[1] - nb[1] * 15 - uy * 14], 12, 14, '#000'); g.restore();
  limb(g, sh, [lerp(sh[0], hc[0], 0.6), lerp(sh[1], hc[1], 0.6)], 20, 16, skin);
  g.save(); g.translate(hc[0], hc[1]); g.rotate(-0.2 + (P.torso - 30) * -0.004);
  g.fillStyle = skin; g.beginPath(); g.ellipse(4, 7, 20, 21, 0, 0, 7); g.fill();
  g.fillStyle = '#1E2023'; g.beginPath(); g.roundRect(8, -1, 18, 9, 4); g.fill();
  g.fillStyle = acc; g.beginPath(); g.moveTo(-30, 6); g.quadraticCurveTo(-24, -26, 6, -25); g.quadraticCurveTo(30, -22, 31, -3); g.lineTo(18, -1); g.quadraticCurveTo(0, -6, -30, 6); g.fill();
  g.strokeStyle = 'rgba(23,25,27,0.55)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-14, -16); g.lineTo(-6, -8); g.moveTo(0, -22); g.lineTo(4, -12); g.moveTo(14, -20); g.lineTo(14, -9); g.stroke();
  g.restore();
  arm(true);
  g.restore();
}

// silnice: pás s přerušovanou čarou, posun čáry = ujetá vzdálenost (px)
function drawRoad(y0, x0, x1, dist, a, tilt) {
  ctx.save(); ctx.globalAlpha *= a == null ? 1 : a;
  ctx.fillStyle = C.surf; ctx.fillRect(x0, y0, x1 - x0, 26);
  ctx.strokeStyle = C.line2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
  ctx.strokeStyle = C.muted; ctx.lineWidth = 4; ctx.setLineDash([46, 54]); ctx.lineDashOffset = dist; ctx.beginPath(); ctx.moveTo(x0, y0 + 13); ctx.lineTo(x1, y0 + 13); ctx.stroke();
  ctx.restore();
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
    const rgb = hi ? '228,227,222' : '139,61,255', gr = ctx.createLinearGradient(X1, 0, X0, 0);
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
  ctx.save(); ctx.globalAlpha *= p.a; ctx.strokeStyle = o.c === 'pu' ? C.pu : C.line2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y + 26); ctx.lineTo(x, y + (o.line || 60)); ctx.stroke(); ctx.restore();
  pill(text, x, y, { a: p.a, s: p.s, size: o.size || 36, ls: 0, bg: o.c === 'pu' ? C.pu : C.surf, c: C.ink });
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
        if (i === cur) { ctx.save(); ctx.fillStyle = 'rgba(139,61,255,0.22)'; ctx.strokeStyle = C.pu; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x - 12, y - 56, ws[i] + 24, 74, 14); ctx.fill(); ctx.stroke(); ctx.restore(); }
        txt(words[i], x, y, Object.assign({ align: 'left', c: i === cur ? C.ink : (i < cur ? C.ink : C.muted), a: i <= cur ? 1 : 0.7 }, fo));
        x += ws[i] + sp;
      });
    });
    ctx.restore(); return;
  }
}

// velký údaj dole (pásmo y 1380 až 1560): popisek verzálkami a číslo
function statAt(t, at, out, label, value, color) {
  const p = popS(t, at, out), q = pop(t, at, out); if (p.a <= 0) return;
  txt(label, 540, 1408 + q.dy, { size: 30, w: 800, c: C.muted, ls: 4, a: q.a });
  txt(value, 540, 1520 + p.dy, Object.assign(fit(value, { size: 104, w: 800, f: F.U, ls: -3 }, 780), { c: color || C.pu, a: p.a, s: p.s }));
}
