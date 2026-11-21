// Formát „ride“: dva časovkáři (3D, MakeHuman) sjíždějí bez šlapání, vzpřímeně na základním řídítku a skrčeně v nástavcích. Náš hlas (Liamovi došly kredity).
const ride = function (t) {
  // pohled kamery, silnice se sklonem a dva jezdci (popis musí být uvnitř funkce, do scenes.js se přenáší jen ona)
  const VIEW = { cam: { pos: [330, 900, 1500], look: [20, 110, -330], fov: 40 }, road: { lanes: [-300], z0: -1050, z1: 480 },
    riders: { A: { kit: 'purple', over: { helmet: '#E4E3DE' }, z: 200 }, B: { kit: 'purple', z: -760 } } };
  const T = r => TR(r), tStop = T('hook:0') + 0.9, tDown = T('setup:0'), tSlope = T('setup:0'), tCta = T('cta:0');
  // šlapání do konce první věty, pak kliky vodorovně a jen se jede
  const stop = Math.PI * Math.ceil(9.4 * tStop / Math.PI), crank = Math.min(t * 9.4, stop);
  const e = ease('power2.inOut'), k = e(clamp((t - T('he:0')) / Math.max(1, T('result:1') - T('he:0'))));
  const slope = -8 * tw(t, tSlope, 1.2, E.io);   // náklon silnice v obraze (6 % = 3,4°, pro názornost víc)
  const poseB = 2 * tw(t, T('she:0'), 1.0, E.io), ctaK = tw(t, tCta, 0.8, E.quint);
  const xA = 40 - 40 * k, xB = 40 + 110 * k, dist = t * 430 + 300 * tw(t, tDown, 3, E.io) * (t - tDown);
  const st = { dist, slope, a: 1 - ctaK * 0.62, riders: { A: { x: xA, pose: 0, crank, wheel: dist / 71 }, B: { x: xB, pose: poseB, crank: crank + 0.0, wheel: dist / 71 } } };
  scene3d(VIEW, st, () => {
    const wB = lerp(1, 0.35, poseB / 2), sp = 620 + 300 * tw(t, tDown, 2, E.io);
    air3d('B', t, sp * 1.1, wB, poseB, 0.95 * (1 - ctaK)); air3d('A', t, sp, 1, 0, 0.95 * (1 - ctaK));
  });
  const tag = (id, pose, s, at, out, c, size) => tag3d(id, pose, s, t, at, out, { c, size, side: id === 'A' ? 'left' : null });
  tag('B', poseB, '0 W', T('hook:1'), T('setup:0'), 'pu', 42); tag('A', 0, '0 W', T('hook:1'), T('setup:0'), null, 42);
  tag('A', 0, 'CdA 0.36', T('he:0'), T('she:0') - 0.1); tag('A', 0, '52.5 km/h', T('he:1'), tCta - 0.1, null, 46);
  tag('B', poseB, 'CdA 0.21', T('she:0'), T('she:3') - 0.1, 'pu'); tag('B', poseB, '68.7 km/h', T('she:3'), tCta - 0.1, 'pu', 46);
  statAt(t, T('setup:0'), T('he:0') - 0.15, 'DESCENT, NO PEDALING', '−6 % · 3 km', C.ink);
  statAt(t, T('result:0'), T('why:0') - 0.15, 'AT THE BOTTOM', '+700 m · 49 s');
  statAt(t, T('why:0'), tCta - 0.15, 'SAME GRAVITY, DIFFERENT AIR', '0.36 vs 0.21', C.ink);
  ctaEnd(t, T('cta:1'), T('cta:2'), 'Follow for more free speed');
};
module.exports = {
  title: 'ride-descent',
  about: 'Dva časovkáři, stejná váha, sjezd 6 % na 3 km bez šlapání. Vzpřímeně na základním řídítku (CdA 0,36) 52,5 km/h, skrčeně v aero nástavcích (CdA 0,21) 68,7 km/h. Dole je skrčený o 49 s a asi 700 m napřed.',
  style: { captions: 'top' },
  voice: 'ours',
  acts: [['hook', 'hook'], ['setup', 'setup'], ['stance', 'he', 'she'], ['result', 'result'], ['why', 'why'], ['cta', 'cta']],
  lines: {
    hook: { say: 'Two riders stop pedaling at the top. Same weight. Who gets down first?',
      chunks: ['Two riders', 'stop pedaling', 'at the top.', ['Same weight.', 'SAM|SAME'], 'Who gets down first?'] },
    setup: { say: 'A six percent descent, three kilometers long.',
      chunks: [['A 6% descent,', 'A|SIX'], ['3 km long.', 'THREE']] },
    he: { say: 'Sitting up, he tops out at fifty-two kilometers per hour.',
      chunks: ['Sitting up,', 'he tops out', ['at 52 km/h.', 'AT|FIFTY']] },
    she: { say: 'Tucked on the aero bars, the other one hits sixty-nine.',
      chunks: [['Tucked on', 'TUCK|TUCKED'], 'the aero bars,', 'the other one', ['hits 69.', 'HITS|HIT']] },
    result: { say: 'At the bottom, the low rider is seven hundred meters ahead. Almost fifty seconds, for free.',
      chunks: [['At the bottom,', 'AT|THE'], 'the low rider is', ['700 m ahead.', 'SEVEN'], ['Almost 50 seconds,', 'ALMOST'], 'for free.'] },
    why: { say: 'Gravity pulls both the same. The air decides who is faster.',
      chunks: ['Gravity pulls', 'both the same.', 'The air decides', 'who is faster.'] },
    cta: { say: 'Tuck only where the road is clear. Send this to your descending buddy, and follow for more.',
      chunks: [['Tuck only where', 'TALK|TUCK'], 'the road is clear.', 'Send this to your', 'descending buddy,', 'and follow for more.'] }
  },
  scenes: { hook: { type: 'free', amb: 0.12, draw: ride }, setup: { type: 'free', amb: 0.12, draw: ride }, stance: { type: 'free', amb: 0.12, draw: ride }, result: { type: 'free', amb: 0.12, draw: ride }, why: { type: 'free', amb: 0.12, draw: ride }, cta: { type: 'free', amb: 0.12, draw: ride } },
  facts: P => [
    ['sjezd 6 %, 0 W, CdA 0,36 (vzpřímeně), km/h („52“)', P.kmh(0, { cda: 0.36, grade: -0.06 }), 52.5, 0.05],
    ['sjezd 6 %, 0 W, CdA 0,21 (skrčeně v nástavcích), km/h („69“)', P.kmh(0, { cda: 0.21, grade: -0.06 }), 68.7, 0.05],
    ['rozdíl na 3 km, s („almost fifty“, „49 s“)', 3000 / P.speed(0, { cda: 0.36, grade: -0.06 }) - 3000 / P.speed(0, { cda: 0.21, grade: -0.06 }), 49, 0.5],
    ['náskok v cíli, m („700 m“)', 3000 - P.speed(0, { cda: 0.36, grade: -0.06 }) * 3000 / P.speed(0, { cda: 0.21, grade: -0.06 }), 709, 15]
  ],
  sources: 'Ustálená rychlost bez šlapání (gravitace = odpor vzduchu + valení), rozjezd na začátku zanedbán. CdA 0,36 (vzpřímeně na základním řídítku) a 0,21 (nízko v nástavcích, hlava dole) leží v rozsahu z přehledu Crouch a kol. 2017. Náskok 709 m zaokrouhlen na „700 m“, 48,6 s na „almost fifty“ a „49 s“.'
};
