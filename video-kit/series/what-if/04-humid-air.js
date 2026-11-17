module.exports = {
  title: 'what-if-humid-air',
  about: 'Vlhký vzduch je řidší než suchý (vodní pára je lehčí), i když se v něm jede hůř kvůli chlazení těla.',
  acts: [['hook', 'hook'], ['vapor', 'true', 'dens'], ['race', 'race'], ['feel', 'feel', 'tip']],
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
      chunks: ['Small, but real.', 'Your drag depends', 'on the air itself,', 'not just on you.'] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'humid air', i: 1 }, { t: "isn't heavier,", i: 2 }, { t: 'but lighter?', i: 4, big: true, size: 150 }] },
    vapor: { type: 'rows', amb: 0.2, max: 1.3,
      heads: [{ at: 'true:1', title: 'Water vapor', big: 'is lighter', bigAt: 'true:2' }, { at: 'dens:2', big: '−1.6%', sub: 'less dense when fully humid' }],
      rows: [{ label: 'Dry air · 30 °C', value: 1.164, left: '1.164', leftCap: 'KG PER M³', at: 'true:1', leftAt: 'dens:0+0.2', c: 'ink' }, { label: 'Humid air · 30 °C', value: 1.146, left: '1.146', leftCap: 'KG PER M³', at: 'true:3', leftAt: 'dens:2', c: 'pu' }] },
    race: { type: 'race', amb: 0.13,
      heads: [{ at: 'race:0', big: '40 km', c: 'ink', sub: 'same rider · same power', subAt: 'race:1' }, { at: 'race:2', big: '18 s', sub: 'faster in humid air' }],
      lanes: [{ label: 'Dry air', v: 40.47, show: '40.5 km/h', at: 'race:0', c: 'ink' }, { label: 'Humid air', v: 40.67, show: '40.7 km/h', at: 'race:0+0.12', c: 'pu' }],
      start: 'race:1', end: 'race:2+0.5', finish: '40 km', gap: { text: '18 s behind' } },
    feel: { type: 'rider', amb: 0.16, ghost: false, fillAt: 'feel:0',
      heads: [{ at: 'feel:0', title: 'It feels harder', big: 'cooling, not drag', bigAt: 'feel:3' }, { at: 'tip:0', title: 'Small', big: 'but real' }] }
  },
  facts: P => [
    ['hustota suchého vzduchu při 30 °C, kg/m³', P.rho({ temp: 30 }), 1.164, 0.0006],
    ['hustota plně vlhkého vzduchu při 30 °C, kg/m³', P.rho({ temp: 30, rh: 1 }), 1.146, 0.0006],
    ['o kolik procent řidší', (1 - P.rho({ temp: 30, rh: 1 }) / P.rho({ temp: 30 })) * 100, 1.6, 0.06],
    ['rozdíl času na 40 km při 250 W, s', P.time(250, 40, { temp: 30 }) - P.time(250, 40, { temp: 30, rh: 1 }), 18, 0.5]
  ],
  sources: 'Hustota vlhkého vzduchu: stavová rovnice se směsí suchého vzduchu a vodní páry (tlak nasycených par Magnusovým vzorcem), učebnicová fyzika. Pocit dusna = horší odpařování potu.'
};
