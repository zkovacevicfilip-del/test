// Realistický formát „ride“ s texty původní šablony What if (autor 22. 11. 2026): jeden jezdec v krajině za zlaté hodinky,
// ujíždějící asfalt, hlas Liam, nápis whatIF, nadpisy nahoře, titulky dole, plynulý průlet 3D kamery mezi akty, sytější barvy krajiny a nahoře bez malých popisků.
// Na konci „pošli kamarádovi a sleduj“ (karty přes krajinu, karta profilu wattIF).
const ride = function (t, a) {
  // pohled kamery, silnice a jezdec (popis musí být uvnitř funkce, do scenes.js se přenáší jen ona)
  const VIEW = { cam: { pos: [300, 380, 1250], look: [0, 175, -60], fov: 40 }, road: { lanes: [-260], z0: -700, z1: 900 }, riders: { A: { kit: 'purple', z: 60 } } };
  const T = r => TR(r);
  // časovkář na aero nástavcích; u „feels harder“ se narovná (dusno), u rady zase dolů
  const pose = 1 - tw(t, T('feel:0'), 0.9, E.io) + tw(t, T('tip:0'), 0.9, E.io), aero = clamp(pose);
  const dist = t * lerp(530, 545, aero), st = { dist, riders: { A: { x: 0, pose, crank: t * 9.4, wheel: dist / 71 } } };
  scene3d(VIEW, st, () => air3d('A', t, lerp(760, 790, aero), lerp(1, 0.35, aero), pose, 0.95));
  const tag = (s, at, out, c, size) => tag3d('A', pose, s, t, at, out, { c, size });
  tag('Dry · 1.164 kg/m³', T('dens:0'), T('dens:2') - 0.1); tag('Humid · 1.146 kg/m³', T('dens:2'), T('dens$'), 'pu');
  tag('250 W · 40.7 km/h', T('race:1'), T('race$'), 'pu');
  // texty z původního videa (nadpisy scén rows, race a rider)
  classicUI(t, a, {
    hook: { line: 'hook', cy: 440, items: [{ whatIf: true, i: 0, size: 140 }, { t: 'humid air', i: 1, size: 56 }, { t: "isn't heavier,", i: 2, size: 56, gap: 18 }, { t: 'but lighter?', i: 4, big: true, size: 110 }] },
    heads: {
      vapor: [{ at: 'true:1', title: 'Water vapor', big: 'is lighter', bigAt: 'true:2' }, { at: 'dens:2', big: '−1.6%', sub: 'less dense when fully humid' }],
      race: [{ at: 'race:0', big: '40 km', c: 'ink', sub: 'same rider · same power', subAt: 'race:1' }, { at: 'race:2', big: '18 s', sub: 'faster in humid air' }],
      feel: [{ at: 'feel:0', title: 'It feels harder', big: 'cooling, not drag', bigAt: 'feel:3' }, { at: 'tip:0', title: 'Small', big: 'but real' }]
    }
  });
  ctaCards(t, { share: T('cta:0'), pick: T('cta:1'), tap: T('cta:2') + 0.5, follow: T('cta:4'), ftap: T('cta:5') });
};
module.exports = {
  title: 'what-if-humid-air',
  about: 'Vlhký vzduch je řidší než suchý (vodní pára je lehčí), i když se v něm jede hůř kvůli chlazení těla.',
  style: { look: 'golden', ui: 'classic', camera: 'orbit', lean: 1, grade: { sat: 1.5, con: 1.12 } },
  acts: [['hook', 'hook'], ['vapor', 'true', 'dens'], ['race', 'race'], ['feel', 'feel', 'tip'], ['cta', 'cta']],
  lines: {
    hook: { say: "What if humid air isn't heavier, like it feels, but lighter?", captions: false,
      chunks: ['What if', 'humid air', "isn't heavier,", 'like it feels,', 'but lighter?'] },
    true: { say: "It's true. Water vapor weighs less than the air it pushes out.",
      chunks: ["It's true.", 'Water vapor', 'weighs less', 'than the air', 'it pushes out.'] },
    dens: { say: 'At thirty degrees, fully humid air is about one and a half percent less dense than dry air.',
      chunks: [['At 30 °C,', 'AT|AH'], 'fully humid air', ['is about 1.5%', 'IS'], 'less dense', 'than dry air.'] },
    race: { say: "Over forty kilometers at the same power, that's eighteen seconds faster.",
      chunks: [['Over 40 km', 'OVER'], 'at the same power,', ["that's 18 seconds", "THAT'S"], 'faster.'] },
    feel: { say: "It feels harder because your body can't cool down. Not because of drag.",
      chunks: ['It feels harder', 'because your body', "can't cool down.", 'Not because', 'of drag.'] },
    tip: { say: 'Small, but real. Your drag depends on the air itself, not just on you.',
      chunks: ['Small, but real.', 'Your drag depends', 'on the air itself,', 'not just on you.'] },
    cta: { say: 'Send this to the friend who blames the humidity. And follow for more free speed.',
      chunks: ['Send this', 'to the friend', 'who blames', 'the humidity.', ['And follow', 'AND'], 'for more free speed.'] }
  },
  scenes: { hook: { type: 'free', amb: 0.12, draw: ride }, vapor: { type: 'free', amb: 0.12, draw: ride }, race: { type: 'free', amb: 0.12, draw: ride }, feel: { type: 'free', amb: 0.12, draw: ride }, cta: { type: 'free', amb: 0.12, draw: ride } },
  facts: P => [
    ['hustota suchého vzduchu při 30 °C, kg/m³', P.rho({ temp: 30 }), 1.164, 0.0006],
    ['hustota plně vlhkého vzduchu při 30 °C, kg/m³', P.rho({ temp: 30, rh: 1 }), 1.146, 0.0006],
    ['o kolik procent řidší', (1 - P.rho({ temp: 30, rh: 1 }) / P.rho({ temp: 30 })) * 100, 1.6, 0.06],
    ['rozdíl času na 40 km při 250 W, s', P.time(250, 40, { temp: 30 }) - P.time(250, 40, { temp: 30, rh: 1 }), 18, 0.5]
  ],
  sources: 'Hustota vlhkého vzduchu: stavová rovnice se směsí suchého vzduchu a vodní páry (tlak nasycených par Magnusovým vzorcem), učebnicová fyzika. Pocit dusna = horší odpařování potu.'
};
