module.exports = {
  title: 'what-if-cold-air',
  about: 'Studený vzduch je hustší: v zimě je jezdec při stejném výkonu pomalejší, i když má stejné nohy.',
  acts: [['hook', 'hook'], ['dense', 'dense', 'watts'], ['race', 'race'], ['tip', 'blame', 'tip']],
  lines: {
    hook: { say: 'What if winter makes you slower, even when your legs are just as strong?', captions: false,
      chunks: ['What if', 'winter', 'makes you slower,', 'even when your legs', 'are just as strong?'] },
    dense: { say: "Cold air is thicker. At zero degrees, it's eleven percent denser than on a thirty degree summer day.",
      chunks: ['Cold air', 'is thicker.', ['At 0 °C,', 'AT'], ["it's 11% denser", "IT'S"], ['than on a 30 °C', 'THAN'], 'summer day.'] },
    watts: { say: 'Holding forty kilometers per hour costs you over twenty extra watts.',
      chunks: [['Holding 40 km/h', 'HOLDING'], ['costs you', 'COSTS|COST'], ['over 20', 'OVER'], 'extra watts.'] },
    race: { say: 'Same power, forty kilometers: the winter ride takes about two minutes longer!',
      chunks: ['Same power,', ['40 kilometers:', 'FORTY'], 'the winter ride', 'takes about', ['2 minutes longer!', 'TWO']] },
    blame: { say: "So don't blame your fitness in January. Blame the air!",
      chunks: ["So don't blame", 'your fitness', 'in January.', 'Blame the air!'] },
    tip: { say: 'And in thick air, a low position is worth even more.',
      chunks: ['And in thick air,', 'a low position', 'is worth', 'even more.'] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'winter', i: 1, big: true, size: 190 }, { t: 'makes you slower,', i: 2 }, { t: 'even when your legs', i: 3, size: 50, c: 'muted' }, { t: 'are just as strong?', i: 4, size: 50, c: 'muted' }] },
    dense: { type: 'bars', amb: 0.2, max: 1.4,
      heads: [{ at: 'dense:0', title: 'Cold air', big: 'is thicker', bigAt: 'dense:1' }, { at: 'dense:3', big: '+11%', sub: 'denser at 0 °C than at 30 °C' }, { at: 'watts:2', big: '+23 W', sub: 'to hold 40 km/h', subAt: 'watts:0' }],
      bars: [{ label: '30 °C', cap: 'KG PER M³', value: 1.164, show: '1.16', at: 'dense:2', numAt: 'dense:4', c: 'ink' }, { label: '0 °C', cap: 'KG PER M³', value: 1.292, show: '1.29', at: 'dense:2+0.1', numAt: 'dense:3', c: 'pu' }] },
    race: { type: 'race', amb: 0.13,
      heads: [{ at: 'race:0', big: '250 W', c: 'ink', sub: 'same rider · same power' }, { at: 'race:4', big: '2 min', sub: 'slower over 40 km' }],
      lanes: [{ label: 'Winter · 0 °C', v: 39.2, show: '# km/h', at: 'race:0', c: 'ink' }, { label: 'Summer · 30 °C', v: 40.5, show: '# km/h', at: 'race:0+0.12', c: 'pu' }],
      start: 'race:2', end: 'race:4+0.3', finish: '40 km', gap: { text: '2 min behind' } },
    tip: { type: 'rider', amb: 0.16, pose: { back: 'tip:1', elbows: 'tip:1+0.3', head: 'tip:1+0.15' },
      heads: [{ at: 'blame:0', title: 'Not your fitness', big: 'Blame the air', bigAt: 'blame:3' }, { at: 'tip:0', title: 'In thick air', big: 'low is worth more', bigAt: 'tip:1' }] }
  },
  facts: P => [
    ['hustota při 0 °C, kg/m³', P.rho({ temp: 0 }), 1.29, 0.005],
    ['hustota při 30 °C, kg/m³', P.rho({ temp: 30 }), 1.16, 0.005],
    ['o kolik procent hustší', (P.rho({ temp: 0 }) / P.rho({ temp: 30 }) - 1) * 100, 11, 0.2],
    ['watty navíc na 40 km/h', P.watts(40, { temp: 0 }) - P.watts(40, { temp: 30 }), 23, 0.6],
    ['250 W při 0 °C, km/h', P.kmh(250, { temp: 0 }), 39.2, 0.05],
    ['250 W při 30 °C, km/h', P.kmh(250, { temp: 30 }), 40.5, 0.05],
    ['rozdíl času na 40 km, s', P.time(250, 40, { temp: 0 }) - P.time(250, 40, { temp: 30 }), 120, 2]
  ]
};
