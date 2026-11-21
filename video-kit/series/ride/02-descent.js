// Formát „ride“: jeden časovkář (3D, MakeHuman) sjíždí bez šlapání, nejdřív vzpřímeně na základním řídítku, pak skrčeně
// v nástavcích. Náš hlas (Liamovi došly kredity). Autor 21. 11. 2026: ve videu jen jeden jezdec.
const ride = function (t) {
  // pohled kamery, silnice se sklonem a jezdec (popis musí být uvnitř funkce, do scenes.js se přenáší jen ona)
  const VIEW = { cam: { pos: [300, 380, 1250], look: [0, 175, -60], fov: 40 }, road: { lanes: [-260], z0: -700, z1: 900 }, riders: { A: { kit: 'purple', z: 60 } } };
  const T = r => TR(r), tStop = T('hook:0') + 0.9, tDown = T('setup:0'), tCta = T('cta:0');
  // šlapání do konce první věty, pak kliky vodorovně a jen se jede
  const stop = Math.PI * Math.ceil(9.4 * tStop / Math.PI), crank = Math.min(t * 9.4, stop);
  const slope = -8 * tw(t, tDown, 1.2, E.io);   // náklon silnice v obraze (6 % = 3,4°, pro názornost víc)
  const pose = 2 * tw(t, T('tuck:0'), 1.0, E.io), low = pose / 2, ctaK = tw(t, tCta + 0.6, 0.8, E.quint);
  const dist = t * 430 + 300 * tw(t, tDown, 3, E.io) * (t - tDown) + 160 * tw(t, T('tuck:0'), 2, E.io) * (t - T('tuck:0'));
  const st = { dist, slope, a: 1 - ctaK * 0.62, riders: { A: { x: 0, pose, crank, wheel: dist / 71 } } };
  scene3d(VIEW, st, () => air3d('A', t, 620 + 300 * tw(t, tDown, 2, E.io) + 140 * low, lerp(1, 0.35, low), pose, 0.95 * (1 - ctaK)));
  const tag = (s, at, out, c, size) => tag3d('A', pose, s, t, at, out, { c, size });
  tag('0 W', T('hook:0'), T('setup:0'), 'pu', 44);
  tag('CdA 0.36', T('he:0'), T('he:2') - 0.1); tag('52.5 km/h', T('he:2'), T('tuck:0') - 0.1, null, 46);
  tag('CdA 0.21', T('tuck:0'), T('tuck:2') - 0.1, 'pu'); tag('68.7 km/h', T('tuck:2'), tCta - 0.1, 'pu', 46);
  statAt(t, T('setup:0'), T('he:0') - 0.15, 'DESCENT, NO PEDALING', '−6 % · 3 km', C.ink);
  statAt(t, T('tuck:2'), T('result:0') - 0.15, 'SITTING UP → TUCKED', '52 → 69 km/h', C.ink);
  statAt(t, T('result:0'), T('why:0') - 0.15, 'ON 3 KM, FOR FREE', '49 s faster');
  statAt(t, T('why:0'), tCta - 0.15, 'SAME GRAVITY, DIFFERENT AIR', '0.36 vs 0.21', C.ink);
  ctaEnd(t, T('cta:1'), T('cta:2'), 'Follow for more free speed');
};
module.exports = {
  title: 'ride-descent',
  about: 'Jeden časovkář sjíždí 6 % na 3 km bez šlapání. Vzpřímeně na základním řídítku (CdA 0,36) 52,5 km/h, skrčeně v aero nástavcích (CdA 0,21) 68,7 km/h. Skrčeně je dole asi o 49 s dřív.',
  style: { captions: 'top', look: 'golden' },
  voice: 'ours',
  acts: [['hook', 'hook'], ['setup', 'setup'], ['stance', 'he', 'tuck'], ['result', 'result'], ['why', 'why'], ['cta', 'cta']],
  lines: {
    hook: { say: 'Zero watts, six percent downhill. How much faster is he, just by tucking?',
      chunks: [['0 watts,', 'ZERO'], ['6% downhill.', 'SIX'], 'How much faster is he,', 'just by tucking?'] },
    setup: { say: 'A six percent descent, three kilometers long.',
      chunks: [['A 6% descent,', 'A|SIX'], ['3 km long.', 'THREE']] },
    he: { say: 'Sitting up, he tops out at fifty-two kilometers per hour.',
      chunks: ['Sitting up,', 'he tops out', ['at 52 km/h.', 'AT|FIFTY']] },
    tuck: { say: 'Tucked on the aero bars, he hits sixty-nine.',
      chunks: [['Tucked on', 'TUCK|TUCKED'], 'the aero bars,', ['he hits 69.', 'HE']] },
    result: { say: 'Over those three kilometers, that is almost fifty seconds faster. For free.',
      chunks: ['Over those', ['3 km,', 'THREE'], 'that is almost', ['50 seconds faster.', 'FIFTY'], 'For free.'] },
    why: { say: 'Gravity pulls the same. The air decides how fast you go.',
      chunks: ['Gravity pulls', 'the same.', 'The air decides', 'how fast you go.'] },
    cta: { say: 'Tuck only where the road is clear. Send this to your descending buddy, and follow for more.',
      chunks: [['Tuck only where', 'TALK|TUCK'], 'the road is clear.', 'Send this to your', 'descending buddy,', 'and follow for more.'] }
  },
  scenes: { hook: { type: 'free', amb: 0.12, draw: ride }, setup: { type: 'free', amb: 0.12, draw: ride }, stance: { type: 'free', amb: 0.12, draw: ride }, result: { type: 'free', amb: 0.12, draw: ride }, why: { type: 'free', amb: 0.12, draw: ride }, cta: { type: 'free', amb: 0.12, draw: ride } },
  facts: P => [
    ['sjezd 6 %, 0 W, CdA 0,36 (vzpřímeně), km/h („52“)', P.kmh(0, { cda: 0.36, grade: -0.06 }), 52.5, 0.05],
    ['sjezd 6 %, 0 W, CdA 0,21 (skrčeně v nástavcích), km/h („69“)', P.kmh(0, { cda: 0.21, grade: -0.06 }), 68.7, 0.05],
    ['rozdíl na 3 km, s („almost fifty“, „49 s“)', 3000 / P.speed(0, { cda: 0.36, grade: -0.06 }) - 3000 / P.speed(0, { cda: 0.21, grade: -0.06 }), 49, 0.5]
  ],
  sources: 'Ustálená rychlost bez šlapání (gravitace = odpor vzduchu + valení), rozjezd na začátku zanedbán. CdA 0,36 (vzpřímeně na základním řídítku) a 0,21 (nízko v nástavcích, hlava dole) leží v rozsahu z přehledu Crouch a kol. 2017. 48,6 s zaokrouhleno na „almost fifty“ a „49 s“.'
};
