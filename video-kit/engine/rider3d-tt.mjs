// 3D časovkář (three.js): plynulé tělo bez kloubů ze „sochařských“ tvarů (vzdálenostní pole + marching cubes),
// svaly, obličej pod aero helmou, kombinéza, časovkářské kolo (diskové zadní kolo, aero nástavce, loketní opěrky).
// Souřadnice jezdce: počátek na zemi mezi koly, x dopředu, y nahoru, z k divákovi; 1 jednotka ≈ 4,8 mm (210 na metr).
// Poloha: 0 = vzpřímeně, ruce na základním řídítku, 1 = v aero nástavcích, lokty na opěrkách, 2 = nejnižší, hlava dole.
import * as THREE from './vendor/three.module.js';
import { MarchingCubes } from './vendor/MarchingCubes.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const lerp = (a, b, k) => a + (b - a) * k, clamp = v => Math.max(0, Math.min(1, v));
const L2 = (p, q, k) => p.map((v, i) => lerp(v, q[i], k));
// ---------- geometrie kola (časovkářský rám) ----------
export const BIKE = { rear: [-104, 71], front: [106, 71], bb: [-10, 58], seat: [-40, 172], saddle: [-44, 193], htTop: [82, 150], htBot: [90, 112], crank: 36, wheelR: 71 };
// polohy: kyčel, sklon trupu (°), ruce, hlava (posun od ramen), sklon hlavy
const POSES = [
  { hip: [-52, 205], torso: 32, hands: [100, 154], hz: 21, head: [24, 25], tilt: 0.05 },
  { hip: [-44, 205], torso: 11, hands: [130, 177], hz: 7, head: [30, 13], tilt: 0.22 },
  { hip: [-40, 205], torso: 5, hands: [127, 186], hz: 5, head: [31, 5], tilt: 0.32 }
];
export function poseAt(p) {
  const i = Math.max(0, Math.min(1, Math.floor(p))), k = clamp(p - i), a = POSES[i], b = POSES[Math.min(2, i + 1)];
  return { hip: L2(a.hip, b.hip, k), torso: lerp(a.torso, b.torso, k), hands: L2(a.hands, b.hands, k), hz: lerp(a.hz, b.hz, k), head: L2(a.head, b.head, k), tilt: lerp(a.tilt, b.tilt, k) };
}
function ik(A, B, l1, l2, pick) {
  const dx = B[0] - A[0], dy = B[1] - A[1], D = Math.hypot(dx, dy), d = Math.min(D, l1 + l2 - 0.5), a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const ux = dx / D, uy = dy / D, px = A[0] + a * ux, py = A[1] + a * uy, c1 = [px - h * uy, py + h * ux], c2 = [px + h * uy, py - h * ux];
  return pick(c1, c2) ? c1 : c2;
}
// kostra: klouby ve 2D (x, y) pro danou polohu a úhel kliky
export function bones(pose, crank = 0) {
  const P = poseAt(pose), tr = P.torso * Math.PI / 180, u = [Math.cos(tr), Math.sin(tr)], hip = P.hip;
  const sh = [hip[0] + 128 * u[0], hip[1] + 128 * u[1]], hc = [sh[0] + P.head[0], sh[1] + P.head[1]];
  const el = ik(sh, P.hands, 68, 64, (c1, c2) => c1[1] < c2[1]);
  const legs = [0, 1].map(i => { const a = crank + (i ? 0 : Math.PI), p = [BIKE.bb[0] + BIKE.crank * Math.cos(a), BIKE.bb[1] - BIKE.crank * Math.sin(a)], ank = [p[0] - 5, p[1] + 13];
    return { pedal: p, ank, knee: ik(hip, ank, 100, 94, (c1, c2) => c1[0] > c2[0]) }; });
  return { P, u, hip, sh, hc, el, hands: P.hands, legs, top: hc[1] + 24 };
}

// ---------- vzdálenostní pole těla ----------
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
// zaoblený kužel mezi a a b s poloměry r1, r2 (Inigo Quilez)
function roundCone(a, b, r1, r2) {
  const ba = sub(b, a), l2 = dot(ba, ba), rr = r1 - r2, a2 = l2 - rr * rr, il2 = 1 / l2;
  return (x, y, z) => {
    const pa = [x - a[0], y - a[1], z - a[2]], yy = dot(pa, ba), zz = yy - l2;
    const q = [pa[0] * l2 - ba[0] * yy, pa[1] * l2 - ba[1] * yy, pa[2] * l2 - ba[2] * yy], x2 = dot(q, q), y2 = yy * yy * l2, z2 = zz * zz * l2, k = Math.sign(rr) * rr * rr * x2;
    if (Math.sign(zz) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
    if (Math.sign(yy) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
    return (Math.sqrt(x2 * a2 * il2) + yy * rr) * il2 - r1;
  };
}
// elipsoid se středem c, poloosami r, natočený v rovině x-y o úhel ang
function ellipsoid(c, r, ang = 0) {
  const cs = Math.cos(ang), sn = Math.sin(ang);
  return (x, y, z) => { const dx = x - c[0], dy = y - c[1], lx = (dx * cs + dy * sn) / r[0], ly = (-dx * sn + dy * cs) / r[1], lz = (z - c[2]) / r[2];
    const k0 = Math.hypot(lx, ly, lz), k1 = Math.hypot(lx / r[0], ly / r[1], lz / r[2]); return k1 > 0 ? k0 * (k0 - 1) / k1 : -Math.min(...r); };
}

// jedno tělo = jedno pole na mřížce N³ v krabici kolem jezdce; přepočítá se pro každý snímek (šlapání)
const BOX = { x0: -150, x1: 200, y0: 0, y1: 430, z0: -80, z1: 80 }, N = 132;
function makeBody(colors, material) {
  const mc = new MarchingCubes(N, material, false, true, 90000);
  mc.isolation = 0; mc.castShadow = true; mc.receiveShadow = true;
  const sx = (BOX.x1 - BOX.x0) / N, sy = (BOX.y1 - BOX.y0) / N, sz = (BOX.z1 - BOX.z0) / N;
  mc.scale.set((BOX.x1 - BOX.x0) / 2, (BOX.y1 - BOX.y0) / 2, (BOX.z1 - BOX.z0) / 2);
  mc.position.set(BOX.x0 + (BOX.x1 - BOX.x0) / 2, BOX.y0 + (BOX.y1 - BOX.y0) / 2, BOX.z0 + (BOX.z1 - BOX.z0) / 2);
  const D = new Float32Array(N * N * N), col = c => new THREE.Color(c).convertSRGBToLinear(), C = {}; for (const k in colors) C[k] = col(colors[k]);
  // prim: { f: vzdálenost, b: [x0,y0,z0,x1,y1,z1] obal, k: hladké spojení, c: barva, paint: jen barva }
  function build(prims) {
    // normal_cache si knihovna jinak pamatuje z minulé polohy (špatné stínování, šmouhy) → vynulovat
    mc.normal_cache.fill(0); D.fill(60); const F = mc.field, pal = mc.palette, d0 = C.suit;
    for (let q = 0; q < D.length; q++) { pal[q * 3] = d0.r; pal[q * 3 + 1] = d0.g; pal[q * 3 + 2] = d0.b; }
    for (const p of prims) {
      if (p.paint) continue;
      const i0 = Math.max(1, Math.floor((p.b[0] - BOX.x0) / sx)), i1 = Math.min(N - 2, Math.ceil((p.b[3] - BOX.x0) / sx));
      const j0 = Math.max(1, Math.floor((p.b[1] - BOX.y0) / sy)), j1 = Math.min(N - 2, Math.ceil((p.b[4] - BOX.y0) / sy));
      const k0 = Math.max(1, Math.floor((p.b[2] - BOX.z0) / sz)), k1 = Math.min(N - 2, Math.ceil((p.b[5] - BOX.z0) / sz));
      const kk = p.k || 6, c = C[p.c];
      for (let k = k0; k <= k1; k++) { const z = BOX.z0 + k * sz;
        for (let j = j0; j <= j1; j++) { const y = BOX.y0 + j * sy, row = k * N * N + j * N;
          for (let i = i0; i <= i1; i++) {
            const d = p.f(BOX.x0 + i * sx, y, z), q = row + i, o = D[q];
            if (d < o) { pal[q * 3] = c.r; pal[q * 3 + 1] = c.g; pal[q * 3 + 2] = c.b; }
            const h = Math.max(kk - Math.abs(d - o), 0) / kk; D[q] = Math.min(d, o) - h * h * kk * 0.25;
          } } }
    }
    // barvy bez tvaru (pruhy na kombinéze, ponožky): obarví povrch blízko
    for (const p of prims) {
      if (!p.paint) continue; const c = C[p.c];
      const i0 = Math.max(1, Math.floor((p.b[0] - BOX.x0) / sx)), i1 = Math.min(N - 2, Math.ceil((p.b[3] - BOX.x0) / sx));
      const j0 = Math.max(1, Math.floor((p.b[1] - BOX.y0) / sy)), j1 = Math.min(N - 2, Math.ceil((p.b[4] - BOX.y0) / sy));
      const k0 = Math.max(1, Math.floor((p.b[2] - BOX.z0) / sz)), k1 = Math.min(N - 2, Math.ceil((p.b[5] - BOX.z0) / sz));
      for (let k = k0; k <= k1; k++) { const z = BOX.z0 + k * sz; for (let j = j0; j <= j1; j++) { const y = BOX.y0 + j * sy, row = k * N * N + j * N;
        for (let i = i0; i <= i1; i++) { const q = row + i; if (Math.abs(D[q]) < 6 && p.f(BOX.x0 + i * sx, y, z) < 0) { pal[q * 3] = c.r; pal[q * 3 + 1] = c.g; pal[q * 3 + 2] = c.b; } } } }
    }
    for (let q = 0; q < F.length; q++) F[q] = -D[q];   // uvnitř kladné (izoplocha 0)
    mc.update();
  }
  return { mesh: mc, build };
}
// obal (bounding box) pro tvar mezi body s poloměrem r
const bb = (pts, r) => { const b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (const p of pts) for (let i = 0; i < 3; i++) { b[i] = Math.min(b[i], p[i] - r); b[i + 3] = Math.max(b[i + 3], p[i] + r); } return b; };
// obal musí přesahovat tvar víc než hladké spojení (k), jinak na hranici obalu skočí pole a ve stínu vznikne rýha
const cone = (a, b, r1, r2, c, k = 6) => ({ f: roundCone(a, b, r1, r2), b: bb([a, b], Math.max(r1, r2) + k + 6), c, k });
const ell = (c3, r, ang, col, k = 6) => ({ f: ellipsoid(c3, r, ang), b: bb([c3], Math.max(...r) + k + 6), c: col, k });
const paint = (a, b, r, c) => ({ f: roundCone(a, b, r, r), b: bb([a, b], r + 2), c, paint: true });

// seznam tvarů těla pro danou polohu a kliku
function bodyPrims(B) {
  const P = B.P, u = B.u, n = [-u[1], u[0]];   // n = kolmo k trupu, k zádům (nahoru)
  const at = (o, du, dn, z = 0) => [o[0] + u[0] * du + n[0] * dn, o[1] + u[1] * du + n[1] * dn, z], ang = Math.atan2(u[1], u[0]);
  const H = B.hip, S = B.sh, hc = B.hc, list = [];
  // trup: pánev, břicho, hrudník s lopatkami, hýždě
  list.push(ell(at(H, 6, 1), [24, 18, 22], ang, 'suit2', 8), ell(at(H, 50, 1), [34, 17, 21], ang, 'suit', 10), ell(at(H, 94, 2), [34, 20, 26], ang, 'suit', 10));
  list.push(ell(at(H, 102, 9, 12), [20, 9, 12], ang, 'suit', 8), ell(at(H, 102, 9, -12), [20, 9, 12], ang, 'suit', 8));
  list.push(ell(at(H, -4, 3, 10), [15, 15, 12], ang, 'suit2', 8), ell(at(H, -4, 3, -10), [15, 15, 12], ang, 'suit2', 8));
  // ramena, krk, trapéz
  for (const z of [20, -20]) list.push(ell([S[0] - 2, S[1] + 1, z], [12.5, 12, 11], ang, 'accent', 7));
  const nb = at(S, 8, 6), neckTop = [lerp(S[0], hc[0], 0.62), lerp(S[1], hc[1], 0.62) - 4, 0];
  list.push(cone(nb, neckTop, 11, 8.5, 'skin', 7), cone(at(S, -4, 10, 14), nb, 7, 9, 'suit', 8), cone(at(S, -4, 10, -14), nb, 7, 9, 'suit', 8));
  // hlava: lebka, čelist, nos, uši (natočení podle sklonu hlavy)
  const ta = -P.tilt, rot = (dx, dy) => [hc[0] + dx * Math.cos(ta) - dy * Math.sin(ta), hc[1] + dx * Math.sin(ta) + dy * Math.cos(ta)];
  const j = rot(9, -12), nose = rot(21, -3), chin = rot(15, -21);
  list.push(ell([hc[0], hc[1], 0], [20, 21, 17.5], ta, 'skin', 5), ell([j[0], j[1], 0], [14, 10, 13], ta, 'skin', 6), ell([nose[0], nose[1], 0], [6, 3.6, 3.2], ta - 0.5, 'skin', 3), ell([chin[0], chin[1], 0], [7, 5, 8], ta, 'skin', 4));
  for (const z of [17.5, -17.5]) { const e = rot(-1, 0); list.push(ell([e[0], e[1], z], [4.5, 6.5, 2.4], ta, 'skin', 2)); }
  // paže: nadloktí (biceps, triceps), předloktí, rukavice
  for (const s of [1, -1]) {
    const Sz = [S[0] - 3, S[1] - 2, 20 * s], Ez = [B.el[0], B.el[1], (lerp(20, 11, clamp((25 - P.torso) / 15))) * s], Wz = [B.hands[0], B.hands[1], P.hz * s];
    list.push(cone(Sz, Ez, 9.5, 7.2, 'suit', 6), ell(L2(Sz, Ez, 0.45), [20, 7, 7.5], Math.atan2(Ez[1] - Sz[1], Ez[0] - Sz[0]), 'suit', 5));
    list.push(cone(Ez, Wz, 7.4, 5, 'skin', 5), ell(L2(Ez, Wz, 0.28), [16, 6.6, 6.8], Math.atan2(Wz[1] - Ez[1], Wz[0] - Ez[0]), 'skin', 5));
    list.push(ell([Wz[0] + 3, Wz[1] - 1, Wz[2]], [9, 5.5, 6.5], Math.atan2(Wz[1] - Ez[1], Wz[0] - Ez[0]), 'glove', 3));
  }
  // nohy: stehno (čtyřhlavý sval), koleno, lýtko, kotník; ponožka a pruh na kombinéze jen barvou
  B.legs.forEach((Lg, i) => {
    const z = i ? 15 : -15, Hz = [H[0], H[1], z], K = [Lg.knee[0], Lg.knee[1], z + (i ? 2 : -2)], A = [Lg.ank[0], Lg.ank[1], z + (i ? 4 : -4)];
    const th = Math.atan2(K[1] - Hz[1], K[0] - Hz[0]), sh = Math.atan2(A[1] - K[1], A[0] - K[0]);
    const tf = [-Math.sin(th), Math.cos(th)];   // kolmo ke stehnu (nahoru = přední strana)
    // stehno končí kousek nad kolenem, ať se barva kraťasů a kůže nemíchá na koleni
    list.push(cone(Hz, L2(Hz, K, 0.86), 15.5, 10.5, 'suit2', 8), ell([lerp(Hz[0], K[0], 0.52) + tf[0] * 4, lerp(Hz[1], K[1], 0.52) + tf[1] * 4, z], [30, 9.5, 11], th, 'suit2', 7));
    list.push(ell([K[0], K[1], K[2]], [9.5, 9.5, 9.5], 0, 'skin', 5), cone(K, A, 8.6, 4.8, 'skin', 5));
    const sf = [-Math.sin(sh), Math.cos(sh)], cal = [lerp(K[0], A[0], 0.3) - sf[0] * 3.5, lerp(K[1], A[1], 0.3) - sf[1] * 3.5, A[2]];
    list.push(ell(cal, [24, 8, 8], sh, 'skin', 6));
    list.push(cone(L2(K, A, 0.74), [A[0], A[1] - 4, A[2]], 5.6, 5.4, 'sock', 2));
  });
  return list;
}

// ---------- materiály a kolo ----------
export const KITS = {
  white: { suit: '#EDECE8', suit2: '#16171A', accent: '#8B3DFF', skin: '#D7A47F', sock: '#F2F2EF', glove: '#16171A', helmet: '#F2F2EF', shoes: '#F2F2EF' },
  purple: { suit: '#7B33F0', suit2: '#16171A', accent: '#E4E3DE', skin: '#C9946F', sock: '#F2F2EF', glove: '#16171A', helmet: '#8B3DFF', shoes: '#E4E3DE' },
  black: { suit: '#1F2125', suit2: '#121315', accent: '#8B3DFF', skin: '#B9876A', sock: '#1F2125', glove: '#121315', helmet: '#1F2125', shoes: '#1F2125' }
};
const M = (c, o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color: c, roughness: 0.5, metalness: 0 }, o));
const Yax = new THREE.Vector3(0, 1, 0), v3 = (p, z = 0) => new THREE.Vector3(p[0], p[1], p[2] == null ? z : p[2]);
function place(m, a, b) { m.position.copy(a); m.quaternion.setFromUnitVectors(Yax, b.clone().sub(a).normalize()); }
// trubka s aerodynamickým (protáhlým) průřezem: hloubka d v rovině kola, šířka w napříč
function aeroTube(a, b, d, w, mat) {
  const A = v3(a), Bv = v3(b), l = A.distanceTo(Bv), g = new THREE.CapsuleGeometry(1, l, 6, 24); g.translate(0, l / 2, 0); g.scale(d / 2, 1, w / 2);
  const m = new THREE.Mesh(g, mat); place(m, A, Bv); m.castShadow = true; m.receiveShadow = true; return m;
}
function tubeAlong(points, r, mat) { const c = new THREE.CatmullRomCurve3(points.map(p => v3(p))), m = new THREE.Mesh(new THREE.TubeGeometry(c, 40, r, 12), mat); m.castShadow = true; return m; }
// plocha na elipsoidu (poloosy r, střed c): azimut a0–a1 kolem svislé osy (0 = dopředu), výška e0–e1 (radiány)
function ellPatch(c, r, a0, a1, e0, e1) {
  const g = new THREE.BufferGeometry(), pos = [], idx = [], NA = 40, NE = 12;
  for (let i = 0; i <= NE; i++) { const e = lerp(e0, e1, i / NE); for (let j = 0; j <= NA; j++) { const a = lerp(a0, a1, j / NA); pos.push(c[0] + r[0] * Math.cos(e) * Math.cos(a), c[1] + r[1] * Math.sin(e), c[2] + r[2] * Math.cos(e) * Math.sin(a)); } }
  for (let i = 0; i < NE; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, b = a + NA + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  g.setIndex(idx); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
}
// časovkářská helma: kopule + protažený ocas, spojené hladce, dole a vpředu (obličej) odříznuté; počítá se jednou
function helmetMesh(material) {
  const n = 72, box = [-62, -34, -34, 36, 36, 34], mc = new MarchingCubes(n, material, false, false, 40000); mc.isolation = 0;
  const sx = (box[3] - box[0]) / n, sy = (box[4] - box[1]) / n, sz = (box[5] - box[2]) / n;
  const dome = ellipsoid([-1, 4, 0], [24, 22.5, 20.5]), tail = roundCone([-8, 6, 0], [-54, -4, 0], 17.5, 3.5);
  for (let k = 0; k < n; k++) for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = box[0] + i * sx, y = box[1] + j * sy, z = box[2] + k * sz, a = dome(x, y, z), b = tail(x, y, z), kk = 14, h = Math.max(kk - Math.abs(a - b), 0) / kk;
    let d = Math.min(a, b) - h * h * kk * 0.25;
    d = Math.max(d, -(y + 9 - 0.22 * x));               // spodní hrana (vzadu níž, vpředu výš)
    d = Math.max(d, x - 15 - 0.55 * Math.max(0, y));     // čelo: vpředu nad obočím, výš dál dopředu
    mc.field[k * n * n + j * n + i] = -d;
  }
  mc.update(); mc.scale.set((box[3] - box[0]) / 2, (box[4] - box[1]) / 2, (box[5] - box[2]) / 2); mc.position.set((box[0] + box[3]) / 2, (box[1] + box[4]) / 2, (box[2] + box[5]) / 2);
  mc.castShadow = true; return mc;
}

export function makeRider(kitName, over) {
  const K = Object.assign({}, KITS[kitName] || KITS.white, over || {}), root = new THREE.Group();
  const mat = {
    body: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.48, sheen: 0.55, sheenRoughness: 0.45, sheenColor: new THREE.Color('#ffffff'), clearcoat: 0.15, clearcoatRoughness: 0.6 }),
    carbon: M('#121316', { roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08 }), carbon2: M('#1c1d21', { roughness: 0.55, clearcoat: 0.6 }),
    accent: M('#8B3DFF', { roughness: 0.35, clearcoat: 0.8, emissive: new THREE.Color('#2a0f66'), emissiveIntensity: 0.5 }), white: M('#E4E3DE', { roughness: 0.4, clearcoat: 0.6 }),
    tire: M('#18191b', { roughness: 0.85 }), metal: M('#c3c6cc', { roughness: 0.22, metalness: 1 }), pad: M('#0e0f11', { roughness: 0.7 }),
    helmet: M(K.helmet, { roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05 }), visor: M('#0a0b10', { roughness: 0.04, metalness: 0.85, iridescence: 1, iridescenceIOR: 1.8, iridescenceThicknessMinimum: 250, iridescenceThicknessMaximum: 700 }),
    shoe: M(K.shoes, { roughness: 0.28, clearcoat: 0.8 }), sole: M('#121316', { roughness: 0.5 })
  };
  // ---- kolo ----
  const bike = new THREE.Group(); root.add(bike); const add = (m, g = bike) => { m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  const R = BIKE.wheelR;
  // zadní diskové kolo: mírně vypouklá čočka, fialový pruh u obvodu
  const rear = new THREE.Group(); rear.position.copy(v3(BIKE.rear)); bike.add(rear);
  const discG = new THREE.LatheGeometry([0, 0.25, 0.5, 0.75, 0.92, 1].map(s => new THREE.Vector2(Math.max(0.5, s * (R - 6)), 5.5 * (1 - s * s * 0.65))).concat([new THREE.Vector2(R - 6, 2.2), new THREE.Vector2(R - 6, -2.2)]).concat([1, 0.92, 0.75, 0.5, 0.25, 0].map(s => new THREE.Vector2(Math.max(0.5, s * (R - 6)), -5.5 * (1 - s * s * 0.65)))), 96);
  discG.rotateX(Math.PI / 2); const disc = add(new THREE.Mesh(discG, mat.carbon), rear);
  const spinR = new THREE.Group(); rear.add(spinR);
  for (const zz of [5.2, -5.2]) { const ring = new THREE.Mesh(new THREE.RingGeometry(R - 20, R - 16, 96, 1, 0, Math.PI * 1.2), mat.accent); ring.position.z = zz * (zz > 0 ? 1 : 1); if (zz < 0) ring.rotation.y = Math.PI; spinR.add(ring);
    const t = new THREE.Mesh(new THREE.RingGeometry(R - 30, R - 28, 96, 1, Math.PI * 1.3, Math.PI * 0.5), mat.white); t.position.z = zz; if (zz < 0) t.rotation.y = Math.PI; spinR.add(t); }
  add(new THREE.Mesh(new THREE.TorusGeometry(R - 3.5, 3.8, 16, 120), mat.tire), rear);
  // přední kolo: vysoký ráfek 80 mm, málo drátů
  const front = new THREE.Group(); front.position.copy(v3(BIKE.front)); bike.add(front);
  const rimG = new THREE.LatheGeometry([new THREE.Vector2(R - 23, -1.5), new THREE.Vector2(R - 12, -4.2), new THREE.Vector2(R - 6, -4.6), new THREE.Vector2(R - 6, 4.6), new THREE.Vector2(R - 12, 4.2), new THREE.Vector2(R - 23, 1.5)], 120); rimG.rotateX(Math.PI / 2);
  const spinF = new THREE.Group(); front.add(spinF); add(new THREE.Mesh(rimG, mat.carbon), spinF);
  for (const zz of [4.5, -4.5]) { const ring = new THREE.Mesh(new THREE.RingGeometry(R - 19, R - 15, 96, 1, 0, Math.PI * 1.2), mat.accent); ring.position.z = zz; if (zz < 0) ring.rotation.y = Math.PI; spinF.add(ring); }
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, z = i % 2 ? 7 : -7, sp = new THREE.Mesh(new THREE.BoxGeometry(0.9, R - 26, 2.4), mat.carbon2); sp.position.set(Math.cos(a) * (R - 23) / 2, Math.sin(a) * (R - 23) / 2, z * 0.5); sp.rotation.z = a - Math.PI / 2; spinF.add(sp); }
  add(new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 18, 20).rotateX(Math.PI / 2), mat.metal), spinF);
  add(new THREE.Mesh(new THREE.TorusGeometry(R - 3.5, 3.6, 16, 120), mat.tire), front);
  // rám: profilované trubky, spojené v uzlech
  const T = (a, b, d, w, m = mat.carbon) => add(aeroTube(a, b, d, w, m));
  T(BIKE.bb, BIKE.htBot, 30, 13); T(BIKE.bb, BIKE.seat, 24, 12); T([BIKE.seat[0] + 4, BIKE.seat[1] - 2], BIKE.htTop, 18, 11); T(BIKE.htBot, BIKE.htTop, 30, 14);
  for (const z of [-8, 8]) { T([BIKE.rear[0], BIKE.rear[1], z], [BIKE.bb[0], BIKE.bb[1], z * 0.5], 10, 6); T([BIKE.rear[0], BIKE.rear[1], z], [-36, 150, z * 0.3], 9, 6); T([BIKE.htBot[0] + 2, BIKE.htBot[1], z * 0.6], [BIKE.front[0], BIKE.front[1], z], 16, 7); }
  T([BIKE.bb[0] + 6, BIKE.bb[1] + 2], [BIKE.rear[0] + 30, BIKE.rear[1] + 4], 12, 10, mat.carbon2);
  // fialový pruh na spodní trubce a bílý na sedlové
  const dt = add(aeroTube([BIKE.bb[0] + 20, BIKE.bb[1] + 14, 0], [BIKE.htBot[0] - 18, BIKE.htBot[1] - 14, 0], 6, 14.2, mat.accent));
  const st = add(aeroTube([BIKE.bb[0] - 6, BIKE.bb[1] + 40, 0], [BIKE.seat[0] + 2, BIKE.seat[1] - 30, 0], 4, 12.2, mat.white));
  // sedlovka, sedlo (časovkářské, krátká špička)
  T(BIKE.seat, [BIKE.saddle[0] + 2, BIKE.saddle[1] - 6], 16, 10);
  const sad = add(new THREE.Mesh(new THREE.CapsuleGeometry(1, 34, 6, 16), mat.pad)); sad.geometry.scale(4, 1, 7); sad.rotation.z = Math.PI / 2 - 0.04; sad.position.set(BIKE.saddle[0] - 2, BIKE.saddle[1] - 3, 0);
  // řídítka: základní „býčí rohy“, nástavce a loketní opěrky (podle polohy 1)
  const b1 = bones(1), padY = b1.el[1] - 9, padX = b1.el[0];
  const stemF = [BIKE.htTop[0] + 6, BIKE.htTop[1] + 1];
  T(BIKE.htTop, stemF, 14, 12);
  for (const s of [1, -1]) {
    add(tubeAlong([[stemF[0] - 4, stemF[1], 0], [stemF[0] + 2, stemF[1] + 1, 10 * s], [96, 153, 20 * s], [104, 150, 22 * s], [108, 142, 22 * s]], 3.4, mat.carbon));
    add(tubeAlong([[padX - 6, padY - 2, 9 * s], [padX + 20, padY - 1, 8 * s], [118, padY + 1, 7 * s], [128, padY + 3, 7 * s], [134, padY + 10, 7 * s]], 2.8, mat.carbon2));
    T([padX, stemF[1], 9 * s], [padX, padY - 3, 9 * s], 8, 8, mat.carbon2);
    const pd = add(new THREE.Mesh(new THREE.CapsuleGeometry(1, 16, 6, 16), mat.pad)); pd.geometry.scale(7, 1, 6); pd.rotation.z = Math.PI / 2; pd.position.set(padX - 2, padY, 10 * s);
  }
  // převodník (velký, krytý), kliky, pedály
  const ring = add(new THREE.Mesh(new THREE.CylinderGeometry(28, 28, 2.5, 64).rotateX(Math.PI / 2), mat.carbon)); ring.position.copy(v3(BIKE.bb, 12));
  const ringEdge = add(new THREE.Mesh(new THREE.TorusGeometry(28, 1.3, 8, 96), mat.metal)); ringEdge.position.copy(v3(BIKE.bb, 12));
  const cranks = [1, -1].map(s => { const c = new THREE.Group(); c.position.copy(v3(BIKE.bb, 15 * s)); bike.add(c); const arm = add(new THREE.Mesh(new THREE.BoxGeometry(BIKE.crank + 6, 7, 3.5), mat.carbon), c); arm.position.x = BIKE.crank / 2;
    const ped = add(new THREE.Mesh(new THREE.BoxGeometry(18, 3.5, 14), mat.carbon2), c); ped.position.set(BIKE.crank, 0, 6 * s); return c; });
  // ---- tělo, helma, boty ----
  const body = makeBody(K, mat.body); root.add(body.mesh);
  const helmet = new THREE.Group(); root.add(helmet);
  helmet.add(helmetMesh(mat.helmet));
  // hledí přes oči: výseč koule před obličejem, pod okrajem helmy
  const visor = add(new THREE.Mesh(ellPatch([-1, 2, 0], [24.5, 23, 21.5], -1.25, 1.25, -0.42, 0.2), mat.visor), helmet); visor.material.side = THREE.DoubleSide;
  // fialový pruh po helmě
  const hs = add(new THREE.Mesh(new THREE.TorusGeometry(23, 1.4, 8, 64, 2.2), mat.accent), helmet); hs.rotation.set(0, 0, 0.55); hs.position.set(-2, 3, 0);
  const shoes = [0, 1].map(() => { const g = new THREE.Group(); root.add(g);
    const s = add(new THREE.Mesh(new THREE.CapsuleGeometry(1, 22, 6, 16), mat.shoe), g); s.geometry.scale(7.5, 1, 6.2); s.rotation.z = -Math.PI / 2; s.position.set(0, 2, 0);
    const so = add(new THREE.Mesh(new THREE.BoxGeometry(32, 2.5, 11), mat.sole), g); so.position.set(0, -4, 0);
    const strap = add(new THREE.Mesh(new THREE.BoxGeometry(4, 13, 13.2), mat.accent), g); strap.position.set(4, 3, 0); return g; });

  let last = null;
  function update(o) {
    const pose = o.pose || 0, cr = o.crank || 0, Bn = bones(pose, cr);
    rear.rotation.z = -(o.wheel || 0); spinF.rotation.z = -(o.wheel || 0);
    cranks[0].rotation.z = -cr; cranks[1].rotation.z = -(cr + Math.PI);   // šlapání po směru hodin (kolo jede doprava)
    cranks.forEach(c => c.children[1].rotation.z = -c.rotation.z);   // pedály drží vodorovně
    // tělo se přepočítá jen při změně (poloha nebo klika)
    const key = pose.toFixed(3) + '|' + cr.toFixed(3); if (key !== last) { body.build(bodyPrims(Bn)); last = key; }
    helmet.position.set(Bn.hc[0], Bn.hc[1], 0); helmet.rotation.z = -Bn.P.tilt;
    Bn.legs.forEach((Lg, i) => { const g = shoes[i], z = i ? 19 : -19, a = Math.atan2(Lg.pedal[1] - Lg.ank[1] + 6, Lg.pedal[0] + 14 - Lg.ank[0]);
      g.position.set(Lg.pedal[0] + 3, Lg.pedal[1] + 6, z); g.rotation.z = Math.max(-0.5, Math.min(0.4, a * 0.3)); });
  }
  update({ pose: 0 });
  return { root, update, top: pose => bones(pose).top };
}

// scéna: světla, okolí pro odlesky (RoomEnvironment), měkké stíny; vrací vykreslovač do průhledného plátna
export function makeStage(w, h, opts = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(opts.pr || 1); renderer.setSize(w, h, false); renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = opts.exposure || 1.0; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap;
  const scene = new THREE.Scene(), world = new THREE.Group(); scene.add(world);
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = opts.env ?? 0.35;
  scene.add(new THREE.HemisphereLight(0xcfc8ff, 0x17191b, 0.5));
  const sb = opts.shadow || 900, key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(260, 700, 520); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -sb, right: sb, top: sb, bottom: -sb, near: 10, far: 3000 }); key.shadow.radius = 5; key.shadow.blurSamples = 12; key.shadow.bias = -0.0004; scene.add(key);
  const rim = new THREE.DirectionalLight(0x8b3dff, opts.rim || 3.4); rim.position.set(-500, 320, -420); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0x9f6bff, (opts.rim || 3.4) * 0.45); rim2.position.set(-300, 120, 500); scene.add(rim2);
  const fill = new THREE.DirectionalLight(0xffffff, 0.5); fill.position.set(400, 100, 300); scene.add(fill);
  scene.traverse(o => { if (o.isLight) o.layers.enableAll(); });
  const cam = new THREE.PerspectiveCamera(opts.fov || 40, w / h, 10, 9000);
  return { THREE, renderer, scene, world, cam, canvas: renderer.domElement, render(layer) { cam.layers.set(layer || 0); renderer.render(scene, cam); } };
}

// silnice: tmavý asfalt v pásu z0–z1, bílé okraje a přerušované čáry mezi pruhy, které ujíždějí podle vzdálenosti
export function makeRoad(o = {}) {
  const z0 = o.z0 ?? -900, z1 = o.z1 ?? 420, L = o.len || 7000, g = new THREE.Group();
  const asphalt = new THREE.Mesh(new THREE.PlaneGeometry(L, z1 - z0), new THREE.MeshStandardMaterial({ color: '#0f1012', roughness: 1 }));
  asphalt.rotation.x = -Math.PI / 2; asphalt.position.z = (z0 + z1) / 2; asphalt.receiveShadow = true; g.add(asphalt);
  const white = new THREE.MeshStandardMaterial({ color: '#cfcfca', roughness: 0.7 });
  for (const z of [z0 + 30, z1 - 30]) { const e = new THREE.Mesh(new THREE.PlaneGeometry(L, 9), white); e.rotation.x = -Math.PI / 2; e.position.set(0, 0.5, z); e.receiveShadow = true; g.add(e); }
  const P = 260, n = Math.ceil(L / P) + 2, dashes = [];
  for (const z of o.lanes || []) for (let i = 0; i < n; i++) { const d = new THREE.Mesh(new THREE.PlaneGeometry(130, 8), white); d.rotation.x = -Math.PI / 2; d.position.set(0, 0.6, z); d.receiveShadow = true; d.userData.i = i; g.add(d); dashes.push(d); }
  g.traverse(o => o.layers.set(2));   // silnice ve vrstvě 2: kreslí se zvlášť, pod proudnice (viz ride.js)
  return { group: g, update(dist) { for (const d of dashes) d.position.x = ((d.userData.i * P - dist) % (n * P) + n * P) % (n * P) - L / 2; } };
}
