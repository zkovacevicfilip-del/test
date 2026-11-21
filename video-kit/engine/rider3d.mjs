// 3D časovkář (three.js): realistické tělo člověka z MakeHuman (CC0, models/cyclist.*) s kostrou, nastavené do polohy
// na kole (šlapání, ruce na řídítkách), kombinéza, aero helma, časovkářské kolo (diskové zadní kolo, aero nástavce).
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
  { hip: [-40, 205], torso: 5, hands: [127, 186], hz: 5, head: [31, 5], tilt: 0.36 }
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

// ---------- materiály a kolo ----------
export const KITS = {
  white: { suit: '#EDECE8', suit2: '#16171A', accent: '#8B3DFF', skin: '#D7A47F', sock: '#F2F2EF', glove: '#16171A', helmet: '#F2F2EF', shoes: '#F2F2EF' },
  purple: { suit: '#7B33F0', suit2: '#16171A', accent: '#E4E3DE', skin: '#DDB094', sock: '#F2F2EF', glove: '#16171A', helmet: '#3557D6', shoes: '#E4E3DE' },
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
// časovkářská helma podle Rudy Project The Wing (bez loga): hladká „bublina“ s nejvyšším bodem vpředu, záda klesají
// do krátké zakulacené špičky dole vzadu, spodní hrana s tmavým lemem stoupá dozadu, bílý pruh přes temeno,
// přední štěrbina, velké zrcadlové hledí se schůdkem v horní hraně (viz visorMesh). Pole se počítá jednou.
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
const smax = (a, b, k) => -smin(-a, -b, k);
const HSHELL = ellipsoid([-1, 4, 0], [34, 24.5, 21.8], -0.05);   // vnější tvar helmy (hledí leží těsně na něm)
const hEdge = x => -15 + 0.2 * Math.max(0, -x);                  // spodní hrana: u uší nízko, dozadu stoupá
function helmetMesh(main, stripe) {
  const n = 108, box = [-44, -24, -27, 38, 34, 27], mat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.22, metalness: 0.45, clearcoat: 1, clearcoatRoughness: 0.04 });
  const mc = new MarchingCubes(n, mat, false, true, 120000); mc.isolation = 0;
  const sx = (box[3] - box[0]) / n, sy = (box[4] - box[1]) / n, sz = (box[5] - box[2]) / n, col = c => new THREE.Color(c).convertSRGBToLinear();
  const cMain = col(main), cDark = col('#101114'), cStripe = col(stripe);
  const tail = roundCone([-16, 2, 0], [-38, -7, 0], 15, 3), cavity = ellipsoid([33, -10, 0], [16, 14, 17]), slot = ellipsoid([29, 15, 0], [3, 1.6, 6.5]);
  for (let k = 0; k < n; k++) for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = box[0] + i * sx, y = box[1] + j * sy, z = box[2] + k * sz, q = k * n * n + j * n + i;
    let d = smin(HSHELL(x, y, z), tail(x, y, z), 10);   // bublina a krátká špička vzadu dole
    d = smax(d, hEdge(x) - y, 2.5);                      // spodní hrana
    d = smax(d, -cavity(x, y, z), 2.5);                  // otvor pro obličej (zakryje ho hledí)
    d = smax(d, -slot(x, y, z) + 0.7, 1);                // přední štěrbina
    mc.field[q] = -d;
    const az = Math.abs(z), c = y < hEdge(x) + 1.6 || slot(x, y, z) < 1 ? cDark : (az > 2 && az < 5.2 && y > 8) ? cStripe : cMain;
    mc.palette[q * 3] = c.r; mc.palette[q * 3 + 1] = c.g; mc.palette[q * 3 + 2] = c.b;
  }
  mc.update(); mc.scale.set((box[3] - box[0]) / 2, (box[4] - box[1]) / 2, (box[5] - box[2]) / 2); mc.position.set((box[0] + box[3]) / 2, (box[1] + box[4]) / 2, (box[2] + box[5]) / 2);
  mc.castShadow = true; return mc;
}
// hledí: tenká skořepina těsně na helmě; horní hrana vpředu výš a za schůdkem níž, zadní hrana daleko na boku,
// dole sahá kousek pod lem helmy
function visorMesh(material) {
  const n = 96, box = [-20, -22, -26, 40, 12, 26], mc = new MarchingCubes(n, material, false, false, 90000); mc.isolation = 0;
  const sx = (box[3] - box[0]) / n, sy = (box[4] - box[1]) / n, sz = (box[5] - box[2]) / n;
  const E = ellipsoid([-1, 4, 0], [34.9, 25.3, 22.6], -0.05);
  for (let k = 0; k < n; k++) for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = box[0] + i * sx, y = box[1] + j * sy, z = box[2] + k * sz;
    const step = 2 - 7 * (1 - clamp((x - 2) / 4));            // horní hrana: vpředu +2, za schůdkem −5
    let d = Math.abs(E(x, y, z)) - 0.9;
    d = smax(d, y - step, 1.2); d = smax(d, -15 - y, 1.2); d = smax(d, -13 + 0.35 * (y + 6) - x, 1.5);
    mc.field[k * n * n + j * n + i] = -d;
  }
  mc.update(); mc.scale.set((box[3] - box[0]) / 2, (box[4] - box[1]) / 2, (box[5] - box[2]) / 2); mc.position.set((box[0] + box[3]) / 2, (box[1] + box[4]) / 2, (box[2] + box[5]) / 2);
  return mc;
}

export function makeRider(kitName, over) {
  const K = Object.assign({}, KITS[kitName] || KITS.white, over || {}), root = new THREE.Group();
  const mat = {
    body: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.48, sheen: 0.55, sheenRoughness: 0.45, sheenColor: new THREE.Color('#ffffff'), clearcoat: 0.15, clearcoatRoughness: 0.6 }),
    carbon: M('#121316', { roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08 }), carbon2: M('#1c1d21', { roughness: 0.55, clearcoat: 0.6 }),
    accent: M('#8B3DFF', { roughness: 0.35, clearcoat: 0.8, emissive: new THREE.Color('#2a0f66'), emissiveIntensity: 0.5 }), white: M('#E4E3DE', { roughness: 0.4, clearcoat: 0.6 }),
    tire: M('#18191b', { roughness: 0.85 }), metal: M('#c3c6cc', { roughness: 0.22, metalness: 1 }), pad: M('#0e0f11', { roughness: 0.7 }),
    helmet: M(K.helmet, { roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05 }), visor: M('#8a6cff', { roughness: 0.04, metalness: 0.55, clearcoat: 1, iridescence: 1, iridescenceIOR: 2.1, iridescenceThicknessMinimum: 380, iridescenceThicknessMaximum: 760, emissive: new THREE.Color('#3b2a9e'), emissiveIntensity: 0.35, envMapIntensity: 2.2 }),
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
  // ---- tělo (MakeHuman); řídítka se mu přizpůsobí: opěrky pod lokty a nástavce pod rukama v poloze 1, základní řídítko pod rukama v poloze 0 ----
  const H = makeHuman(K); root.add(H.group);
  const fit = H.fit(root), padX = fit.pad[0], padY = fit.pad[1];
  const stemF = [BIKE.htTop[0] + 6, BIKE.htTop[1] + 1];
  T(BIKE.htTop, stemF, 14, 12);
  for (const s of [1, -1]) {
    const g = fit.grip;
    add(tubeAlong([[stemF[0] - 4, stemF[1], 0], [stemF[0] + 2, stemF[1] + 1, 10 * s], [g[0] - 8, g[1] - 4, 19 * s], [g[0] + 2, g[1] - 5, 21 * s], [g[0] + 8, g[1] - 12, 21 * s]], 3.4, mat.carbon));
    // nástavec vede pod předloktím a konec ohnutý nahoru prochází sevřenou pěstí (kousek před zápěstím, blíž ke středu)
    const tz = Math.max(3, fit.tip[2] - 2), fx = fit.tip[0] + 12; add(tubeAlong([[padX - 8, padY - 3, 9 * s], [padX + 20, padY - 2, 8 * s], [fx - 22, fit.tip[1] - 8, tz * s], [fx - 6, fit.tip[1] - 7, tz * s], [fx + 1, fit.tip[1] - 3, tz * s], [fx + 2, fit.tip[1] + 2, tz * s]], 2.8, mat.carbon2));
    T([padX, stemF[1], 9 * s], [padX, padY - 4, 9 * s], 8, 8, mat.carbon2);
    const pd = add(new THREE.Mesh(new THREE.CapsuleGeometry(1, 16, 6, 16), mat.pad)); pd.geometry.scale(7, 1, 6); pd.rotation.z = Math.PI / 2; pd.position.set(padX - 2, padY, 10 * s);
  }
  // převodník (velký, krytý), kliky, pedály
  const ring = add(new THREE.Mesh(new THREE.CylinderGeometry(28, 28, 2.5, 64).rotateX(Math.PI / 2), mat.carbon)); ring.position.copy(v3(BIKE.bb, 12));
  const ringEdge = add(new THREE.Mesh(new THREE.TorusGeometry(28, 1.3, 8, 96), mat.metal)); ringEdge.position.copy(v3(BIKE.bb, 12));
  const cranks = [1, -1].map(s => { const c = new THREE.Group(); c.position.copy(v3(BIKE.bb, 15 * s)); bike.add(c); const arm = add(new THREE.Mesh(new THREE.BoxGeometry(BIKE.crank + 6, 7, 3.5), mat.carbon), c); arm.position.x = BIKE.crank / 2;
    const ped = add(new THREE.Mesh(new THREE.BoxGeometry(18, 3.5, 14), mat.carbon2), c); ped.position.set(BIKE.crank, 0, 6 * s); return c; });
  // ---- helma, boty ----
  const helmet = new THREE.Group(); root.add(helmet);
  const light = ['#e4e3de', '#f2f2ef'].includes(K.helmet.toLowerCase());
  helmet.add(helmetMesh(K.helmet, light ? '#3557D6' : '#F2F2EF'));
  // hledí: kouřově šedé, zrcadlové, obepíná obličej od okraje helmy po polovinu nosu
  helmet.add(visorMesh(mat.visor));
  // tretry: protáhlá bota, podrážka, fialový pásek (sedí na kosti chodidla)
  const shoes = ['R', 'L'].map(() => { const g = new THREE.Group(); root.add(g);
    const b = add(new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), mat.shoe), g); b.scale.set(27, 9, 7.2); b.position.set(13, -3, 0);
    const so = add(new THREE.Mesh(new THREE.BoxGeometry(50, 3, 12), mat.sole), g); so.position.set(13, -11, 0);
    const st = add(new THREE.Mesh(new THREE.TorusGeometry(7.6, 1.3, 8, 24, Math.PI), mat.accent), g); st.position.set(16, -3, 0); st.rotation.y = Math.PI / 2; return g; });

  function update(o) {
    const pose = o.pose || 0, cr = o.crank || 0;
    rear.rotation.z = -(o.wheel || 0); spinF.rotation.z = -(o.wheel || 0);
    cranks[0].rotation.z = -cr; cranks[1].rotation.z = -(cr + Math.PI);   // šlapání po směru hodin (kolo jede doprava)
    cranks.forEach(c => c.children[1].rotation.z = -c.rotation.z);   // pedály drží vodorovně
    const head = H.pose(root, pose, cr);
    helmet.position.copy(head.center); helmet.quaternion.copy(head.q);
    head.feet.forEach((f, i) => { shoes[i].position.copy(f.pos); shoes[i].quaternion.copy(f.q); });
  }
  update({ pose: 0 });
  // top: nejvyšší bod helmy nad zemí (po posledním update), head: střed helmy
  return { root, update, top: () => helmet.position.y + 26, head: () => helmet.position.clone() };
}

// ---------- člověk z MakeHuman ----------
let HUMAN = null;
// načte models/cyclist.json a cyclist.bin (jednou na stránku); makeRider potřebuje, aby bylo hotové
export async function loadHuman(base = new URL('./models/', import.meta.url)) {
  if (HUMAN) return HUMAN;
  const meta = await (await fetch(new URL('cyclist.json', base))).json(), buf = await (await fetch(new URL('cyclist.bin', base))).arrayBuffer();
  const n = meta.vertices, t = meta.triangles, pos = new Float32Array(buf, 0, n * 3), si = new Uint8Array(buf, n * 12, n * 4), sw = new Float32Array(buf, n * 16, n * 4);
  const cloth = new Uint8Array(buf, n * 32, n * 4), idx = meta.index16 ? new Uint16Array(buf, n * 36, t * 3) : new Uint32Array(buf, n * 36, t * 3);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
  g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals();
  HUMAN = { meta, geometry: g, cloth }; return HUMAN;
}
const SC = 21.3, GRIP = [96, 150], HELM = [8, 5];   // měřítko; kam sahá ruka v poloze 0; střed helmy nad kostí hlavy (nahoru, dopředu)   // 1 dm modelu → jednotky scény (postava 1,75 m ≈ 1,78 m s botami)
const toModel = v => new THREE.Vector3(-v.z, v.y, v.x);   // směr ze souřadnic jezdce do modelu (model hledí k +z)
function makeHuman(K) {
  if (!HUMAN) throw new Error('model člověka není načtený (loadHuman)');
  const meta = HUMAN.meta, col = c => new THREE.Color(c).convertSRGBToLinear();
  // barva každého bodu: kůže, přes ni kraťasy, kombinéza, ramena a ponožky podle vah kostí (ostrý, ale hladký přechod)
  const n = meta.vertices, cw = HUMAN.cloth, cols = new Float32Array(n * 3), sk = col(K.skin), layers = [[1, col(K.suit2)], [0, col(K.suit)], [2, col(K.accent)], [3, col('#1d1e22')]];
  const sm = w => { const x = clamp((w / 255 - 0.38) / 0.24); return x * x * (3 - 2 * x); };
  for (let i = 0; i < n; i++) { const c = sk.clone(); for (const [k, lc] of layers) c.lerp(lc, sm(cw[i * 4 + k])); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
  const geo = new THREE.BufferGeometry(); for (const a of ['position', 'normal', 'skinIndex', 'skinWeight']) geo.setAttribute(a, HUMAN.geometry.getAttribute(a));
  geo.setIndex(HUMAN.geometry.index); geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const mat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.5, sheen: 0.45, sheenRoughness: 0.45, sheenColor: new THREE.Color('#8c8a96') });
  const mesh = new THREE.SkinnedMesh(geo, mat); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
  const bones = meta.bones.map(b => { const x = new THREE.Bone(); x.name = b.name; return x; }), by = {}, rest = {};
  meta.bones.forEach((b, i) => {
    const p = b.parent >= 0 ? meta.bones[b.parent].head : [0, 0, 0]; bones[i].position.set(b.head[0] - p[0], b.head[1] - p[1], b.head[2] - p[2]);
    if (b.parent >= 0) bones[b.parent].add(bones[i]); by[b.name] = bones[i];
    rest[b.name] = new THREE.Vector3(b.tail[0] - b.head[0], b.tail[1] - b.head[1], b.tail[2] - b.head[2]).normalize();
  });
  const group = new THREE.Group(); group.rotation.y = Math.PI / 2; group.scale.setScalar(SC); group.add(mesh); mesh.add(bones[0]);
  group.updateMatrixWorld(true); mesh.bind(new THREE.Skeleton(bones));
  const R = n => new THREE.Vector3(...meta.bones.find(b => b.name === n).head);
  const hip0 = R('upperleg01.L').add(R('upperleg01.R')).multiplyScalar(0.5), root0 = R('root');
  const len = (a, b) => R(a).distanceTo(R(b)) * SC;
  const LA = [len('upperarm01.R', 'lowerarm01.R'), len('lowerarm01.R', 'wrist.R')], LL = [len('upperleg01.R', 'lowerleg01.R'), len('lowerleg01.R', 'foot.R')];
  const wq = bone => { const q = new THREE.Quaternion(); for (let b = bone.parent; b && b.isBone; b = b.parent) q.premultiply(b.quaternion); return q; };
  // natočí kost tak, aby mířila směrem d (v souřadnicích jezdce); twist co nejmenší
  const aim = (n, d) => { const b = by[n], qw = new THREE.Quaternion().setFromUnitVectors(rest[n], toModel(d).normalize()); b.quaternion.copy(wq(b).invert().multiply(qw)); };
  const pitch = a => new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
  const deg = Math.PI / 180;
  // dvoukloubová úloha ve 3D: koleno/loket mezi A a C, ohyb směrem k pole
  const ik3 = (A, C, l1, l2, pole) => {
    const AC = C.clone().sub(A), d = Math.min(AC.length(), l1 + l2 - 0.5), n = AC.normalize(), a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    const p = pole.clone().sub(n.clone().multiplyScalar(pole.dot(n))).normalize(); return A.clone().add(n.multiplyScalar(a)).add(p.multiplyScalar(h));
  };
  const wpos = (riderRoot, n) => riderRoot.worldToLocal(by[n].getWorldPosition(new THREE.Vector3()));
  function pose(riderRoot, p, crank) {
    const P = poseAt(p), tr = P.torso * deg;
    for (const b of bones) b.quaternion.identity();
    // pánev a záda: pánev překlopená dopředu, záda mírně kulatá (níž strměji), ramena svěšená
    aim('root', pitch(tr + 0.45 * (Math.PI / 2 - tr)));
    const Qr = by.root.quaternion, hipM = new THREE.Vector3(-0, P.hip[1], P.hip[0]).divideScalar(SC);
    by.root.position.copy(hipM.sub(hip0.clone().sub(root0).applyQuaternion(Qr)));
    [['spine05', 22], ['spine04', 12], ['spine03', 5], ['spine02', 0], ['spine01', -8]].forEach(([n, o]) => aim(n, pitch(tr + o * deg)));
    // krk: vzpřímeně se zvedá, v časovkářské poloze pokračuje skoro v linii zad (hlava nízko, blízko rukou)
    const nk = p <= 1 ? lerp(30, 9, clamp(p)) : lerp(9, 2, clamp(p - 1));
    ['neck01', 'neck02', 'neck03'].forEach((n, i) => aim(n, pitch(tr + (nk + i * 4) * deg)));
    // hlava hledí dopředu; v časovkářské poloze skloněná (oči koukají zpod hledí), helma leží ocasem na zádech
    const fa = -(5 + 60 * P.tilt) * deg, fwd = toModel(pitch(fa)).normalize(), up = toModel(pitch(fa + Math.PI / 2)).normalize(), right = new THREE.Vector3().crossVectors(up, fwd);
    const qh = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, fwd)); by.head.quaternion.copy(wq(by.head).invert().multiply(qh));
    riderRoot.updateMatrixWorld(true);
    // paže: v poloze 0 ruce na základním řídítku (dvoukloubová úloha), od polohy 1 lokty skoro svisle pod rameny
    // a předloktí dopředu po nástavcích; mezi tím plynulý přechod
    const kTT = clamp(p), arms = {};
    for (const [s, sz] of [['R', 1], ['L', -1]]) {
      const S = wpos(riderRoot, 'upperarm01.' + s), G = new THREE.Vector3(GRIP[0], GRIP[1], 21 * sz);
      const reach = Math.min(S.distanceTo(G), LA[0] + LA[1] - 1), W0 = S.clone().add(G.clone().sub(S).normalize().multiplyScalar(reach));
      const E0 = ik3(S, W0, LA[0], LA[1], new THREE.Vector3(-0.2, -1, 0.5 * sz));
      const E1 = S.clone().add(new THREE.Vector3(0.12, -1, -0.16 * sz).normalize().multiplyScalar(LA[0])), W1 = E1.clone().add(new THREE.Vector3(1, 0.22, -0.13 * sz).normalize().multiplyScalar(LA[1]));   // předloktí mírně nahoru, ruce u sebe
      const E = E0.clone().lerp(E1, kTT), W = W0.clone().lerp(W1, kTT); arms[s] = { E, W };
      aim('upperarm01.' + s, E.clone().sub(S)); aim('upperarm02.' + s, E.clone().sub(S));
      riderRoot.updateMatrixWorld(true);
      const E2 = wpos(riderRoot, 'lowerarm01.' + s), fd = W.clone().sub(E2).normalize();
      aim('lowerarm01.' + s, fd); aim('lowerarm02.' + s, fd);
      // zápěstí: na základním řídítku dlaň dolů, v nástavcích dlaně k sobě (palce nahoru), prsty sevřené kolem konce nástavce
      const palm = toModel(new THREE.Vector3(0, -1, 0).lerp(new THREE.Vector3(0, -0.2, -sz), kTT).normalize()), f1 = toModel(fd.clone().add(new THREE.Vector3(0, -0.08, 0))).normalize();
      const f0 = rest['wrist.' + s], n0 = new THREE.Vector3(s === 'R' ? 1 : -1, 0, 0); n0.sub(f0.clone().multiplyScalar(n0.dot(f0))).normalize();
      const n1 = palm.clone().sub(f1.clone().multiplyScalar(palm.dot(f1))).normalize();
      const M0 = new THREE.Matrix4().makeBasis(f0, n0, f0.clone().cross(n0)), M1 = new THREE.Matrix4().makeBasis(f1, n1, f1.clone().cross(n1));
      const qw = new THREE.Quaternion().setFromRotationMatrix(M1.multiply(M0.transpose())); by['wrist.' + s].quaternion.copy(wq(by['wrist.' + s]).invert().multiply(qw));
      const ha = Math.atan2(fd.y, fd.x);
      // prsty: na řídítku se ohýbají dolů kolem vodorovné trubky, v nástavcích dovnitř kolem svislého konce (pěst)
      for (let f = 2; f <= 5; f++) [55, 115, 165].forEach((c, j) => { const a = c * deg, down = new THREE.Vector3(Math.cos(ha - a * 0.75), Math.sin(ha - a * 0.75), -0.08 * sz), side = new THREE.Vector3(Math.cos(a), -0.1 - 0.05 * f, -sz * Math.sin(a));
        aim(`finger${f}-${j + 1}.${s}`, down.lerp(side, kTT)); });
      [15, 35, 55].forEach((c, j) => { const a = c * deg, down = new THREE.Vector3(Math.cos(ha - a), Math.sin(ha - a), -0.5 * sz), up = new THREE.Vector3(0.75, 0.25 - 0.15 * j, -0.6 * sz);   // palec přes prsty
        aim(`finger1-${j + 1}.${s}`, down.lerp(up, kTT)); });
    }
    // nohy: kyčel → koleno → kotník nad pedálem (pravá noha = klika na straně převodníku, blíž k divákovi)
    riderRoot.updateMatrixWorld(true);
    for (const [s, sz, a] of [['R', 1, crank], ['L', -1, crank + Math.PI]]) {
      const Hh = wpos(riderRoot, 'upperleg01.' + s), ped = [BIKE.bb[0] + BIKE.crank * Math.cos(a), BIKE.bb[1] - BIKE.crank * Math.sin(a)];
      const ank = new THREE.Vector3(ped[0] - 17, ped[1] + 13, Hh.z), K2 = ik3(Hh, ank, LL[0], LL[1], new THREE.Vector3(1, 0.25, 0.12 * sz));
      aim('upperleg01.' + s, K2.clone().sub(Hh)); aim('upperleg02.' + s, K2.clone().sub(Hh));
      riderRoot.updateMatrixWorld(true);
      const K3 = wpos(riderRoot, 'lowerleg01.' + s); aim('lowerleg01.' + s, ank.clone().sub(K3)); aim('lowerleg02.' + s, ank.clone().sub(K3));
      aim('foot.' + s, pitch(-0.32 + 0.18 * Math.sin(a))); aim('toe1-1.' + s, pitch(-0.2)); aim('toe2-1.' + s, pitch(-0.2));
    }
    riderRoot.updateMatrixWorld(true);
    // střed hlavy a natočení pro helmu
    const hp = wpos(riderRoot, 'head'), hf = pitch(fa), hu = pitch(fa + Math.PI / 2);
    const center = hp.clone().add(hu.clone().multiplyScalar(HELM[0])).add(hf.clone().multiplyScalar(HELM[1]));
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(hf, hu, new THREE.Vector3().crossVectors(hf, hu)));
    // boty: kotník a směr chodidla
    const feet = ['R', 'L'].map(s => { const fp = wpos(riderRoot, 'foot.' + s), tp = wpos(riderRoot, 'toe2-1.' + s), d = tp.clone().sub(fp).setZ(0).normalize(), u = new THREE.Vector3(-d.y, d.x, 0);
      return { pos: fp, q: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(d, u, new THREE.Vector3().crossVectors(d, u))) }; });
    last = arms;
    return { center, q, feet };
  }
  let last = null;
  // poloha loktů a rukou v polohách 1 a 0 → kam dát opěrky, nástavce a základní řídítko
  function fit(riderRoot) { pose(riderRoot, 1, 0); const t1 = last.R; pose(riderRoot, 0, 0); const t0 = last.R;
    return { pad: [t1.E.x, t1.E.y - 9], tip: [t1.W.x, t1.W.y, Math.abs(t1.W.z)], grip: [t0.W.x, t0.W.y] }; }
  return { group, pose, by, fit };
}

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
