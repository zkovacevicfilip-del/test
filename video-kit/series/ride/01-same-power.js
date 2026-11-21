// Formát „ride“: dva časovkáři (3D, MakeHuman) na stejném kole, štítky s čísly, titulky nahoře. Náš hlas (Liamovi došly kredity).
const ride = function (t) {
  // pohled kamery, silnice a dva jezdci (popis musí být uvnitř funkce, do scenes.js se přenáší jen ona)
  const VIEW = { cam: { pos: [330, 900, 1500], look: [20, 110, -330], fov: 40 }, road: { lanes: [-300], z0: -1050, z1: 480 },
    riders: { A: { kit: 'purple', over: { helmet: '#E4E3DE' }, z: 200 }, B: { kit: 'purple', z: -760 } } };
  const T = r => TR(r), tPose = T('she:1'), tRace = T('speeds:0'), tGap = T('hour:0'), tCta = T('cta:0');
  const e = ease('power2.inOut'), k = e(clamp((t - tRace) / Math.max(1, tCta - tRace)));
  // jezdec B (vzadu, fialová helma) po přechodu do aero nástavců ujíždí, jezdec A (vpředu, bílá helma) sedí vzpřímeně na základním řídítku
  const xB = 60 + 130 * k, xA = 50 - 10 * k, poseB = tw(t, tPose, 1.1, E.io), dist = t * 430, ctaK = tw(t, tCta, 0.8, E.quint);
  const st = { dist, a: 1 - ctaK * 0.62, riders: { A: { x: xA, pose: 0, crank: t * 9.4 + 1.3, wheel: dist / 71 }, B: { x: xB, pose: poseB, crank: t * 9.4, wheel: dist / 71 } } };
  // proudnice mezi silnicí a jezdci
  scene3d(VIEW, st, () => { air3d('B', t, 620, lerp(1, 0.3, poseB), poseB, 0.95 * (1 - ctaK)); air3d('A', t, 620, 1, 0, 0.95 * (1 - ctaK)); });
  // štítky nad helmou: výkon, poloha, rychlost
  const tag = (id, pose, s, at, out, c, size) => tag3d(id, pose, s, t, at, out, { c, size, side: id === 'A' ? 'left' : null });
  tag('B', poseB, '250 W', T('hook:2'), T('he:0'), 'pu', 42); tag('A', 0, '250 W', T('hook:2'), T('he:0'), null, 42);
  tag('A', 0, 'CdA 0.30', T('he:0'), T('speeds:0') - 0.1); tag('B', poseB, 'CdA 0.23', T('she:0'), T('speeds:0') - 0.1, 'pu');
  tag('A', 0, '37.8 km/h', T('speeds:0'), T('cost:0') - 0.1, null, 46); tag('B', poseB, '41.1 km/h', T('speeds:2'), tCta - 0.1, 'pu', 46);
  tag('A', 0, '314 W needed', T('cost:1'), tCta - 0.1, null, 42);
  statAt(t, T('he:0'), T('speeds:0') - 0.15, 'DRAG AREA (CdA)', '0.30 → 0.23', C.ink);
  statAt(t, tGap, T('cost:0') - 0.15, 'AFTER ONE HOUR', '+3.3 km');
  statAt(t, T('cost:1'), tCta - 0.15, 'EXTRA POWER, JUST FOR SITTING UP', '+64 W · 26%', C.ink);
  ctaEnd(t, T('cta:0'), T('cta:3'), 'Follow for more free speed');
};
module.exports = {
  title: 'ride-same-power',
  about: 'Dva časovkáři se stejnými 250 W na stejném časovkářském kole: jeden sedí vzpřímeně s rukama na základním řídítku (CdA 0,30), druhý v aero nástavcích s lokty na opěrkách (CdA 0,23). Ten v nástavcích jede o 3,3 km/h rychleji, vzpřímený by na stejnou rychlost potřeboval o 64 W (26 %) víc.',
  style: { captions: 'top' },
  voice: 'ours',
  acts: [['hook', 'hook'], ['stance', 'he', 'she'], ['race', 'speeds', 'hour'], ['cost', 'cost'], ['cta', 'cta']],
  lines: {
    hook: { say: 'Same bike. Same two hundred fifty watts. So why does one rider just ride away?',
      chunks: ['Same bike.', 'Same', ['250 watts.', 'TWO'], 'So why does', 'one rider', 'just ride away?'] },
    he: { say: "He's sitting up, hands on the base bar.",
      chunks: [["He's sitting up,", "HE'S|HES|SITTING"], 'hands on the base bar.'] },
    she: { say: 'The other one drops onto the aero bars, elbows on the pads.',
      chunks: ['The other one drops', ['onto the aero bars,', 'ONTO|ON'], 'elbows on the pads.'] },
    speeds: { say: 'Thirty-eight versus forty-one kilometers per hour.',
      chunks: [['38', 'THIRTY'], 'versus', ['41 km/h.', 'FORTY']] },
    hour: { say: 'After one hour, the gap is over three kilometers.',
      chunks: ['After one hour,', 'the gap is', ['over 3 km.', 'OVER']] },
    cost: { say: "To keep up, he'd need sixty-four extra watts. A quarter more power, just for sitting up.",
      chunks: ['To keep up,', ["he'd need", "HE'D|HED|HE"], ['64 extra watts.', 'SIXTY'], 'A quarter more power,', 'just for sitting up.'] },
    cta: { say: 'Send this to the friend who never uses his aero bars. And follow for more free speed.',
      chunks: ['Send this', 'to the friend who never', ['uses his aero bars.', 'USES'], 'And follow', 'for more free speed.'] }
  },
  scenes: { hook: { type: 'free', amb: 0.12, draw: ride }, stance: { type: 'free', amb: 0.12, draw: ride }, race: { type: 'free', amb: 0.12, draw: ride }, cost: { type: 'free', amb: 0.12, draw: ride }, cta: { type: 'free', amb: 0.12, draw: ride } },
  facts: P => [
    ['250 W, CdA 0,30 (vzpřímeně, ruce na základním řídítku), km/h („38“)', P.kmh(250, { cda: 0.30 }), 37.8, 0.05],
    ['250 W, CdA 0,23 (aero nástavce, lokty na opěrkách), km/h („41“)', P.kmh(250, { cda: 0.23 }), 41.1, 0.05],
    ['náskok po hodině, km („over three“)', P.kmh(250, { cda: 0.23 }) - P.kmh(250, { cda: 0.30 }), 3.3, 0.05],
    ['watty navíc pro CdA 0,30 při 41,1 km/h („64“)', P.watts(P.kmh(250, { cda: 0.23 }), { cda: 0.30 }) - 250, 64, 1],
    ['o kolik procent víc výkonu („a quarter“)', (P.watts(P.kmh(250, { cda: 0.23 }), { cda: 0.30 }) / 250 - 1) * 100, 26, 0.5]
  ],
  sources: 'CdA 0,30 (vzpřímeně na základním řídítku časovkářského kola) a 0,23 (v aero nástavcích) leží v rozsahu z přehledu Crouch a kol. 2017 (časovkářské polohy asi 0,20 až 0,25).'
};
