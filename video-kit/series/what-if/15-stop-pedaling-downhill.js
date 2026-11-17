module.exports = {
  title: 'what-if-stop-pedaling-downhill',
  about: 'Sjezd 6 % bez šlapání: vzpřímeně 50 km/h, ve skrčené pozici 63 km/h. O rychlosti rozhoduje jen tvar.',
  acts: [['hook', 'hook'], ['roll', 'depends', 'tuck'], ['why', 'why', 'tip']],
  lines: {
    hook: { say: 'What if you stopped pedaling on a descent? How fast would you go?', captions: false,
      chunks: ['What if', 'you stopped pedaling', 'on a descent?', 'How fast', 'would you go?'] },
    depends: { say: 'It depends on your shape. On a six percent slope, sitting up, you roll at fifty kilometers per hour.',
      chunks: ['It depends', 'on your shape.', ['On a 6% slope,', 'ON'], 'sitting up,', 'you roll at', ['50 km/h.', 'FIFTY']] },
    tuck: { say: 'Tuck in low, and you reach sixty-three. Thirteen more, without a single pedal stroke!',
      chunks: ['Tuck in low,', 'and you reach', ['63.', 'SIXTY'], ['13 more,', 'THIRTEEN'], 'without a single', 'pedal stroke!'] },
    why: { say: "Gravity pulls you both the same. The air decides who is faster. That's free speed, paid by gravity.",
      chunks: ['Gravity pulls you', 'both the same.', 'The air decides', 'who is faster.', ["That's free speed,", "THAT'S"], 'paid by gravity.'] },
    tip: { say: "Only tuck where it's safe: clear road, hands on the bars, eyes up.",
      chunks: ['Only tuck', ["where it's safe:", 'WHERE'], 'clear road,', 'hands on the bars,', 'eyes up.'] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'you stopped pedaling', i: 1 }, { t: 'on a descent?', i: 2, big: true, size: 110 }, { t: 'How fast would you go?', i: 3, size: 50, c: 'muted', gap: 20 }] },
    roll: { type: 'race', amb: 0.13, tilt: -6, finish: false,
      heads: [{ at: 'depends:0', title: 'It depends', big: 'on your shape', bigAt: 'depends:1' }, { at: 'depends:2', label: '6% DESCENT · NO PEDALING', big: '50 km/h', bigAt: 'depends:5', c: 'ink' }, { at: 'tuck:2', label: 'TUCKED · NO PEDALING', big: '63 km/h' }, { at: 'tuck:3', big: '+13 km/h', sub: 'without a single pedal stroke', subAt: 'tuck:4' }],
      lanes: [{ label: [['Sitting up', 'c'], ['  ·  CdA 0.40', 'muted']], v: 49.8, show: '# km/h', showAt: 'depends:5', at: 'depends:2', c: 'ink' }, { label: [['Tucked', 'c'], ['  ·  CdA 0.25', 'muted']], v: 63.0, show: '# km/h', showAt: 'tuck:2', at: 'depends:2+0.12', c: 'pu' }],
      start: 'depends:4', end: 'tuck:3+0.6' },
    why: { type: 'rider', amb: 0.16, pose: { back: 1, elbows: 1, head: 1 },
      heads: [{ at: 'why:0', title: 'Same gravity', big: 'air decides', bigAt: 'why:2' }, { at: 'why:4', title: 'Free speed', big: 'paid by gravity', bigAt: 'why:5' }, { at: 'tip:0', title: 'Only where safe', sub: 'clear road · hands on bars · eyes up', subAt: 'tip:2' }] }
  },
  facts: P => [
    ['sjezd 6 % bez šlapání, CdA 0,40, km/h', P.kmh(0, { cda: 0.40, grade: -0.06 }), 50, 0.3],
    ['sjezd 6 % bez šlapání, CdA 0,25, km/h', P.kmh(0, { cda: 0.25, grade: -0.06 }), 63, 0.1],
    ['rozdíl, km/h', P.kmh(0, { cda: 0.25, grade: -0.06 }) - P.kmh(0, { cda: 0.40, grade: -0.06 }), 13, 0.3]
  ],
  sources: 'Ustálená rychlost na dlouhém rovném sjezdu 6 % (84 kg s kolem). Video výslovně říká, že skrčená pozice je jen tam, kde je to bezpečné.'
};
