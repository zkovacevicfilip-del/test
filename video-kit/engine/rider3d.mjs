// 3D jezdec na kole (three.js): tělo z hladkých tvarů, kolo, šlapání a poloha 0–2. Používá formát „ride“ (series/ride.js).
// Souřadnice jako ve 2D (ride.js, y dolů), převádí se na 3D: v(x, y, z) = (x, −y, z). 1 jednotka = 1 px při měřítku 1.
import * as THREE from './vendor/three.module.js';

const RG = { rear: [-105, -71], front: [105, -71], bb: [-12, -60], seat: [-52, -186], saddle: [-62, -210],
  headTop: [72, -190], headBot: [82, -150], hoods: [100, -199], drops: [101, -168], wheelR: 71, crank: 36 };
const POSE = [{ torso: 48, hands: RG.hoods, head: [30, -30] }, { torso: 30, hands: [97, -197], head: [36, -20] }, { torso: 16, hands: RG.drops, head: [38, -12] }];
const lerp = (a, b, k) => a + (b - a) * k, clamp = v => Math.max(0, Math.min(1, v));
function poseAt(p) { const i = Math.max(0, Math.min(1, Math.floor(p))), k = clamp(p - i), a = POSE[i], b = POSE[Math.min(2, i + 1)];
  return { torso: lerp(a.torso, b.torso, k), hands: [lerp(a.hands[0], b.hands[0], k), lerp(a.hands[1], b.hands[1], k)], head: [lerp(a.head[0], b.head[0], k), lerp(a.head[1], b.head[1], k)] }; }
function ik(A, B, l1, l2, pick) {
  const dx = B[0] - A[0], dy = B[1] - A[1], d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.5), a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const ux = dx / Math.hypot(dx, dy), uy = dy / Math.hypot(dx, dy), px = A[0] + a * ux, py = A[1] + a * uy, c1 = [px - h * uy, py + h * ux], c2 = [px + h * uy, py - h * ux];
  return pick(c1, c2) ? c1 : c2;
}
const v = (p, z = 0) => new THREE.Vector3(p[0], -p[1], z);
const Y = new THREE.Vector3(0, 1, 0);

// hladký tvar podél osy Y od 0 do len: poloměr podle profilu, zaoblené konce; sx/sz = zploštění průřezu
function shape(len, prof, sx = 1, sz = 1, caps = [true, true]) {
  const pts = [], r0 = prof(0), r1 = prof(1);
  if (caps[0]) for (let k = 0; k < 8; k++) { const a = -Math.PI / 2 + k * Math.PI / 16; pts.push(new THREE.Vector2(Math.max(0.01, r0 * Math.cos(a)), r0 * Math.sin(a))); }
  for (let k = 0; k <= 24; k++) { const u = k / 24; pts.push(new THREE.Vector2(prof(u), u * len)); }
  if (caps[1]) for (let k = 1; k <= 8; k++) { const a = k * Math.PI / 16; pts.push(new THREE.Vector2(Math.max(0.01, r1 * Math.cos(a)), len + r1 * Math.sin(a))); }
  const g = new THREE.LatheGeometry(pts, 40); g.scale(sx, 1, sz); g.computeVertexNormals(); return g;
}
// trup: průřez elipsa s hloubkou d(u) a šířkou w(u), záda vyklenutá o hunch (lokální −X = záda)
function torsoGeo(len, d, w, hunch) {
  const g = shape(len, () => 1, 1, 1, [true, true]), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const u = clamp(y / len), ext = y < 0 ? -y : y > len ? y - len : 0;
    const k = ext ? Math.sqrt(Math.max(0, 1 - ext * ext)) : 1;
    x = x * d(u); z = z * w(u); const yy = y < 0 ? -ext * d(0) * 0.9 : y > len ? len + ext * d(1) * 0.9 : y;
    p.setXYZ(i, x - hunch * Math.sin(Math.PI * u), yy, z);
  }
  g.computeVertexNormals(); return g;
}
function place(m, a, b) { m.position.copy(a); m.quaternion.setFromUnitVectors(Y, b.clone().sub(a).normalize()); }
function tube(a, b, r, mat, sx = 1) { const l = a.distanceTo(b), g = new THREE.CylinderGeometry(r, r, l, 20); g.translate(0, l / 2, 0); g.scale(sx, 1, 1); const m = new THREE.Mesh(g, mat); place(m, a, b); m.castShadow = true; return m; }

export const KITS = {
  white: { jersey: '#EDECE8', panel: '#8B3DFF', shorts: '#16171A', helmet: '#F2F2EF', shoes: '#F2F2EF', frame: '#26282C', skin: '#C9946F', rim: '#141518' },
  purple: { jersey: '#7B33F0', panel: '#E4E3DE', shorts: '#16171A', helmet: '#8B3DFF', shoes: '#E4E3DE', frame: '#E4E3DE', skin: '#C9946F', rim: '#141518' },
  black: { jersey: '#1E2024', panel: '#8B3DFF', shorts: '#121315', helmet: '#1E2024', shoes: '#1E2024', frame: '#2C2E33', skin: '#B9876A', rim: '#101113' }
};

export function makeRider(kitName, over) {
  const K = Object.assign({}, KITS[kitName] || KITS.white, over || {}), root = new THREE.Group();
  const M = (c, o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color: c, roughness: 0.55, metalness: 0 }, o));
  const mat = {
    skin: M(K.skin, { roughness: 0.62, sheen: 0.3, sheenColor: new THREE.Color('#ffd9c4') }), jersey: M(K.jersey, { roughness: 0.5, sheen: 0.6, sheenRoughness: 0.5, sheenColor: new THREE.Color('#ffffff') }),
    panel: M(K.panel, { roughness: 0.45 }), shorts: M(K.shorts, { roughness: 0.42, sheen: 0.5, sheenColor: new THREE.Color('#555') }),
    helmet: M(K.helmet, { roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.15 }), visor: M('#0d0e10', { roughness: 0.08, metalness: 0.7, clearcoat: 1, iridescence: 0.6, iridescenceIOR: 1.6 }),
    shoes: M(K.shoes, { roughness: 0.3, clearcoat: 0.6 }), sock: M('#F2F2EF', { roughness: 0.8 }), glove: M('#16171A', { roughness: 0.6 }),
    frame: M(K.frame, { roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 }), rim: M(K.rim, { roughness: 0.35, clearcoat: 0.8 }), tire: M('#1b1c1e', { roughness: 0.9 }),
    metal: M('#b9bcc2', { roughness: 0.25, metalness: 1 }), accent: M('#8B3DFF', { roughness: 0.35, emissive: new THREE.Color('#3a1580'), emissiveIntensity: 0.4 }), saddle: M('#141518', { roughness: 0.5 })
  };
  const add = m => { m.castShadow = true; m.receiveShadow = true; root.add(m); return m; };
  // ---- kolo ----
  const bike = new THREE.Group(); root.add(bike);
  const wheels = [RG.rear, RG.front].map(c => {
    const w = new THREE.Group(); w.position.copy(v(c));
    const R = RG.wheelR, tire = new THREE.Mesh(new THREE.TorusGeometry(R - 3.5, 4, 16, 96), mat.tire);
    const rimG = new THREE.LatheGeometry([new THREE.Vector2(R - 16, -3.2), new THREE.Vector2(R - 7, -4.6), new THREE.Vector2(R - 6, 0), new THREE.Vector2(R - 7, 4.6), new THREE.Vector2(R - 16, 3.2), new THREE.Vector2(R - 16.5, 0)], 96);
    rimG.rotateX(Math.PI / 2); const rim = new THREE.Mesh(rimG, mat.rim);
    const deco = new THREE.Mesh(new THREE.TorusGeometry(R - 11, 1.2, 6, 48, 1.1), mat.accent); deco.position.z = 4.7;
    const deco2 = deco.clone(); deco2.rotation.z = Math.PI; const deco3 = deco.clone(); deco3.position.z = -4.7; const deco4 = deco2.clone(); deco4.position.z = -4.7;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 22, 20), mat.metal); hub.rotation.x = Math.PI / 2;
    const spin = new THREE.Group(); spin.add(rim, deco, deco2, deco3, deco4, hub);
    for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, z = i % 2 ? 9 : -9, s = tube(new THREE.Vector3(0, 0, z), new THREE.Vector3(Math.cos(a) * (R - 16), Math.sin(a) * (R - 16), z * 0.2), 0.7, mat.metal); spin.add(s); }
    w.add(tire, spin); tire.castShadow = true; rim.castShadow = true; bike.add(w); return spin;
  });
  const fr = (a, b, r, sx) => bike.add(tube(v(a), v(b), r, mat.frame, sx));
  fr(RG.bb, RG.seat, 6, 1.6); fr(RG.seat, RG.headTop, 5.5, 1.5); fr(RG.bb, RG.headBot, 7, 1.4); fr(RG.headTop, RG.headBot, 7.5, 1.3);
  for (const z of [-7, 7]) { bike.add(tube(v(RG.rear, z), v(RG.bb, z * 0.4), 3.6, mat.frame)); bike.add(tube(v(RG.rear, z), v(RG.seat, z * 0.2), 3.2, mat.frame)); bike.add(tube(v(RG.headBot, z * 0.3), v(RG.front, z), 4, mat.frame)); }
  bike.add(tube(v(RG.seat), v([RG.saddle[0] + 4, RG.saddle[1] + 6]), 3.6, mat.metal));
  const sad = new THREE.Mesh(shape(44, u => 6 + 4 * Math.sin(Math.PI * u) - 3 * u, 1, 1.4), mat.saddle); sad.rotation.z = -Math.PI / 2 + 0.04; sad.position.copy(v([RG.saddle[0] - 22, RG.saddle[1] + 2])); sad.position.x += 0; bike.add(sad); sad.castShadow = true;
  // řídítka: představec a dva oblouky dolů (drop bar) po stranách
  const stemEnd = v([96, -200]); bike.add(tube(v(RG.headTop), stemEnd, 3.6, mat.frame));
  const barMat = mat.frame;
  bike.add(tube(new THREE.Vector3(stemEnd.x, stemEnd.y, -21), new THREE.Vector3(stemEnd.x, stemEnd.y, 21), 3, barMat));
  for (const z of [-21, 21]) {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(96, 200, z), new THREE.Vector3(106, 199, z), new THREE.Vector3(112, 186, z), new THREE.Vector3(107, 172, z), new THREE.Vector3(94, 166, z)].map(p => new THREE.Vector3(p.x, p.y, p.z)));
    const b = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 3, 10), barMat); b.castShadow = true; bike.add(b);
    const hood = new THREE.Mesh(shape(14, u => 4.5 - u, 1, 1), mat.saddle); place(hood, new THREE.Vector3(97, 200, z), new THREE.Vector3(110, 199, z)); bike.add(hood);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(24, 2.2, 10, 64), mat.metal); ring.position.copy(v(RG.bb, 10)); bike.add(ring);
  const bbm = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 26, 20), mat.frame); bbm.rotation.x = Math.PI / 2; bbm.position.copy(v(RG.bb)); bike.add(bbm);
  const crankL = new THREE.Mesh(new THREE.BoxGeometry(RG.crank, 6, 4), mat.metal), crankR = crankL.clone(); crankL.geometry.translate(RG.crank / 2, 0, 0);
  crankL.position.copy(v(RG.bb, 14)); crankR.position.copy(v(RG.bb, -14)); bike.add(crankL, crankR);
  // ---- jezdec ----
  const body = new THREE.Group(); root.add(body);
  const legGeo = { thigh: shape(100, u => lerp(14, 9.5, u) + 2.2 * Math.sin(Math.PI * Math.min(1, u * 1.3))), shank: shape(94, u => lerp(10.5, 6, u) + 3.2 * Math.exp(-((u - 0.28) ** 2) / 0.03)) };
  const legs = [0, 1].map(i => {
    const z = i ? 20 : -20, thigh = add(new THREE.Mesh(legGeo.thigh, mat.shorts)), knee = add(new THREE.Mesh(shape(26, u => lerp(10, 9.5, u)), mat.skin));
    const shank = add(new THREE.Mesh(legGeo.shank, mat.skin)), sock = add(new THREE.Mesh(shape(16, () => 6.6, 1, 1, [false, false]), mat.sock));
    const shoe = add(new THREE.Mesh(shape(36, u => 6.5 + 2 * Math.sin(Math.PI * u) - 2.5 * u, 1, 1.15), mat.shoes));
    return { z, thigh, knee, shank, sock, shoe };
  });
  const torso = add(new THREE.Mesh(torsoGeo(124, u => 19 + 4 * Math.sin(Math.PI * clamp((u - 0.15) / 0.85)), u => 25 + 9 * clamp((u - 0.35) / 0.5) - 6 * clamp((u - 0.9) / 0.1), 9), mat.jersey));
  const pelvis = add(new THREE.Mesh(torsoGeo(40, u => 19 + 2 * u, u => 24 + u, 0), mat.shorts));
  const stripe = add(new THREE.Mesh(shape(96, () => 3.2, 1, 1), mat.panel));
  const neck = add(new THREE.Mesh(shape(26, u => lerp(10, 9, u)), mat.skin));
  const head = new THREE.Group(); body.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(19, 40, 30), mat.skin); skull.scale.set(1.08, 1.05, 0.95); skull.castShadow = true;
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(23.5, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.55), mat.helmet); helmet.scale.set(1.3, 1, 1.02); helmet.position.set(-7, 1, 0); helmet.rotation.z = 0.1; helmet.castShadow = true;
  const vents = new THREE.Mesh(new THREE.TorusGeometry(17, 1.2, 6, 40, Math.PI * 0.8), mat.accent); vents.position.set(-6, 10, 0); vents.rotation.set(Math.PI / 2, 0, 0.25);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(20.5, 32, 12, -0.95, 1.9, Math.PI * 0.42, Math.PI * 0.16), mat.visor); visor.rotation.y = Math.PI / 2; visor.position.set(2, 0, 0);
  const ear = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 10), mat.skin); ear.position.set(-3, -1, 18);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 10), mat.skin); nose.scale.set(1.3, 1, 0.9); nose.position.set(19, -6, 0);
  head.add(skull, helmet, vents, visor, ear, nose);
  const armGeo = { up: shape(68, u => lerp(9, 7.5, u) + 1.4 * Math.sin(Math.PI * u)), fore: shape(64, u => lerp(8.5, 5.5, u) + 1.4 * Math.exp(-((u - 0.25) ** 2) / 0.04)) };
  const arms = [0, 1].map(i => {
    const z = i ? 36 : -36, up = add(new THREE.Mesh(armGeo.up, mat.skin)), sleeve = add(new THREE.Mesh(shape(32, u => lerp(11, 9.6, u), 1, 1, [true, false]), mat.jersey));
    const fore = add(new THREE.Mesh(armGeo.fore, mat.skin)), hand = add(new THREE.Mesh(new THREE.SphereGeometry(7.5, 16, 12), mat.glove)), elbow = add(new THREE.Mesh(new THREE.SphereGeometry(8, 16, 12), mat.skin));
    return { z, up, sleeve, fore, hand, elbow };
  });
  body.children.forEach(c => { c.castShadow = true; });

  function update(o) {
    const P = poseAt(o.pose || 0), th = o.crank || 0, tr = P.torso * Math.PI / 180;
    wheels.forEach(w => { w.rotation.z = -(o.wheel || 0); });
    crankL.rotation.z = -th; crankR.rotation.z = -(th + Math.PI);
    const hip = [RG.saddle[0] + 4, RG.saddle[1] - 14], sh = [hip[0] + 128 * Math.cos(tr), hip[1] - 128 * Math.sin(tr)], hc = [sh[0] + P.head[0], sh[1] + P.head[1]];
    const ped = a => [RG.bb[0] + RG.crank * Math.cos(a), RG.bb[1] + RG.crank * Math.sin(a)];
    legs.forEach((L, i) => {
      const a = th + (i ? 0 : Math.PI), p = ped(a), ank = [p[0] - 4, p[1] - 14], kn = ik(hip, ank, 100, 94, (c1, c2) => c1[0] > c2[0]);
      const H = v(hip, L.z * 0.8), Kn = v(kn, L.z), A = v(ank, L.z + (L.z > 0 ? 4 : -4)), Pd = v([p[0] + 22, p[1] + 1], L.z + (L.z > 0 ? 6 : -6));
      place(L.thigh, H, Kn); place(L.knee, H.clone().lerp(Kn, 0.78), Kn); L.knee.position.copy(H.clone().lerp(Kn, 0.74)); place(L.knee, L.knee.position.clone(), Kn);
      place(L.shank, Kn, A); place(L.sock, A.clone().lerp(Kn, 0.2), A); place(L.shoe, v([ank[0] - 8, ank[1] + 2], A.z), Pd);
    });
    const H = v(hip), S = v(sh); place(torso, H, S); place(pelvis, v([hip[0] - 12 * Math.cos(tr), hip[1] + 12 * Math.sin(tr)]), H.clone().lerp(S, 0.2));
    const nb = [Math.sin(tr), Math.cos(tr)]; // ke zádům (nahoru)
    place(stripe, v([hip[0] + 12 * Math.cos(tr) - nb[0] * 0, hip[1] - 12 * Math.sin(tr)], 37), v([sh[0] - 14 * Math.cos(tr), sh[1] + 14 * Math.sin(tr)], 37));
    place(neck, v([lerp(sh[0], hc[0], 0.05), lerp(sh[1], hc[1], 0.05)]), v([lerp(sh[0], hc[0], 0.75), lerp(sh[1], hc[1], 0.75)]));
    head.position.copy(v(hc)); head.rotation.z = 0.2 + (P.torso - 30) * 0.004;
    arms.forEach(A => {
      const sh3 = [sh[0] - 4, sh[1] + 2], hd = P.hands, el = ik(sh3, hd, 68, 64, (c1, c2) => c1[1] > c2[1]);
      const S3 = v(sh3, A.z), E = v(el, A.z + (A.z > 0 ? 6 : -6)), Hd = v(hd, A.z > 0 ? 22 : -22);
      place(A.up, S3, E); place(A.sleeve, S3, E); place(A.fore, E, Hd); A.hand.position.copy(Hd); A.elbow.position.copy(E);
    });
  }
  update({ pose: 0 });
  return { root, update };
}

// scéna: světla (bílé hlavní, fialové zadní) a stín; vrací vykreslovač do vlastního průhledného plátna
export function makeStage(w, h, opts = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(opts.pr || 1); renderer.setSize(w, h, false); renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = opts.exposure || 1.05; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene(), world = new THREE.Group(); scene.add(world);
  scene.add(new THREE.HemisphereLight(0xcfc8ff, 0x17191b, 0.9));
  const sb = opts.shadow || 900, key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(260, 700, 520); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -sb, right: sb, top: sb, bottom: -sb, near: 10, far: 3000 }); key.shadow.radius = 4; key.shadow.bias = -0.0005; scene.add(key);
  const rim = new THREE.DirectionalLight(0x8b3dff, opts.rim || 3.2); rim.position.set(-500, 320, -420); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0x9f6bff, (opts.rim || 3.2) * 0.5); rim2.position.set(-300, 120, 500); scene.add(rim2);
  const fill = new THREE.DirectionalLight(0xffffff, 0.6); fill.position.set(400, 100, 300); scene.add(fill);
  scene.traverse(o => { if (o.isLight) o.layers.enableAll(); });   // světla platí pro všechny vrstvy
  const cam = new THREE.PerspectiveCamera(opts.fov || 40, w / h, 10, 9000);
  return { THREE, renderer, scene, world, cam, canvas: renderer.domElement, render(layer) { cam.layers.set(layer || 0); renderer.render(scene, cam); } };
}

// silnice: tmavý asfalt v pásu z0–z1 (napříč), bílé okraje a přerušované čáry mezi pruhy, které ujíždějí podle vzdálenosti
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
