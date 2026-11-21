// Realistický formát „ride“ (od 22. 11. 2026): jeden jezdec v krajině za zlaté hodinky, hlas Liam, pohybová grafika
// z GSAP (švih kamery do aktů) a Kokonut UI (číslice jako válečky automatu, stírací přechod), úvodní nápis wattIF.
const ride = function (t) {
  // pohled kamery, silnice a jezdec (popis musí být uvnitř funkce, do scenes.js se přenáší jen ona)
  const VIEW = { cam: { pos: [300, 380, 1250], look: [0, 175, -60], fov: 40 }, road: { lanes: [-260], z0: -700, z1: 900 }, riders: { A: { kit: 'purple', z: 60 } } };
  const T = r => TR(r), tLow = T('low:0'), tTip = T('tip:3');
  // vzpřímený sprint → nízko nad řídítky („gets low“), na konci rada „chest low“ zase nízko; ruce pořád na základním řídítku
  const pose = 1.6 * tw(t, tLow, 0.8, E.io) - 1.6 * tw(t, T('why:0'), 0.8, E.io) + 1.6 * tw(t, tTip, 0.8, E.io), low = clamp(pose / 1.6);
  const dist = t * lerp(780, 830, low);
  const st = { dist, riders: { A: { x: 0, pose, grip: 'base', crank: t * 11.5, wheel: dist / 71 } } };
  scene3d(VIEW, st, () => air3d('A', t, lerp(1100, 1180, low), lerp(1, 0.45, low), pose, 0.95));
  const tag = (s, at, out, c, size) => tag3d('A', pose, s, t, at, out, { c, size });
  hookTitle(t, T('hook:0'), T('hook:3'));
  tag('1000 W', T('two:1'), T('high:0') - 0.1, 'pu', 46);
  tag('CdA 0.35', T('high:0'), T('high:2') - 0.1); tag('58.9 km/h', T('high:2'), T('low:0') - 0.1, null, 46);
  tag('CdA 0.30', T('low:1'), T('low:3') - 0.1, 'pu'); tag('61.9 km/h', T('low:3'), T('why:0') - 0.1, 'pu', 46);
  statAt(t, T('low:3'), T('gap:0') - 0.15, 'SAME 1000 W, JUST LOWER', '+3 km/h');
  statAt(t, T('gap:2'), T('why:0') - 0.15, 'ON THE LAST 200 m', '10 m');
  statAt(t, T('why:1'), T('tip:0') - 0.15, 'OF THE POWER FIGHTS THE AIR', '95 %', C.ink);
  ctaEnd(t, T('tip:3'), T('tip:5'), 'Follow for more free speed');
};
module.exports = {
  title: 'what-if-sprint-position',
  about: 'Jeden sprinter se stejnými 1000 W: vzpřímeně a široko 58,9 km/h, nízko nad řídítky 61,9 km/h. Na posledních 200 metrech je to asi 10 metrů náskoku.',
  style: { captions: 'top', look: 'golden', camera: 'whip', text: 'slot', overlay: 'wipe', hook: 'watt' },
  acts: [['hook', 'hook'], ['race', 'two', 'high', 'low', 'gap'], ['tip', 'why', 'tip']],
  lines: {
    hook: { say: 'What if the sprint is decided by your elbows, not your legs?',
      chunks: ['What if', 'the sprint', 'is decided by', 'your elbows,', 'not your legs?'] },
    two: { say: 'Same rider, same one thousand watts.',
      chunks: ['Same rider,', ['same 1,000 watts.', 'SAME']] },
    high: { say: 'Sprinting upright and wide: fifty-nine kilometers per hour.',
      chunks: ['Sprinting', 'upright and wide:', ['59 km/h.', 'FIFTY']] },
    low: { say: 'Now chest low, elbows in, over the bars: sixty-two!',
      chunks: [['Now chest low,', 'NOW'], 'elbows in,', 'over the bars:', ['62!', 'SIXTY']] },
    gap: { say: "Over the last two hundred meters, that's a ten meter gap. Five bike lengths!",
      chunks: ['Over the last', ['200 meters,', 'TWO'], ["that's a 10 meter gap.", "THAT'S"], ['5 bike lengths!', 'FIVE']] },
    why: { say: 'At sixty kilometers per hour, over ninety percent of that power fights the air.',
      chunks: [['At 60 km/h,', 'AT'], ['over 90%', 'OVER'], 'of that power', 'fights the air.'] },
    tip: { say: 'Same legs, same watts. So when you sprint: chest low, elbows in, eyes up.',
      chunks: ['Same legs,', 'same watts.', 'So when you sprint:', 'chest low,', 'elbows in,', 'eyes up.'] }
  },
  scenes: { hook: { type: 'free', amb: 0.12, draw: ride }, race: { type: 'free', amb: 0.12, draw: ride }, tip: { type: 'free', amb: 0.12, draw: ride } },
  facts: P => [
    ['1000 W, CdA 0,35 (vzpřímeně, široko), km/h', P.kmh(1000, { cda: 0.35 }), 58.9, 0.05],
    ['1000 W, CdA 0,30 (nízko, lokty u těla), km/h', P.kmh(1000, { cda: 0.30 }), 61.9, 0.05],
    ['rozdíl rychlostí, km/h', P.kmh(1000, { cda: 0.30 }) - P.kmh(1000, { cda: 0.35 }), 3, 0.1],
    ['náskok na 200 m při ustálených rychlostech, m', 200 * (1 - P.speed(1000, { cda: 0.35 }) / P.speed(1000, { cda: 0.30 })), 10, 0.3],
    ['podíl vzduchu při 60 km/h, CdA 0,35, % (ve videu „over 90 %“, na obrazovce 95 %)', P.airShare(60, { cda: 0.35 }) * 100, 94.7, 0.5]
  ],
  sources: 'Náskok je spočítaný z ustálených rychlostí, zrychlování se nepočítá. Délka kola je asi 1,7 až 2 m, 10 m je tedy asi 5 délek. Jezdec je na časovkářském kole s rukama na základním řídítku (jiné kolo model zatím nemá).'
};
