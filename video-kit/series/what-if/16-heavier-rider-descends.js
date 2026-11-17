module.exports = {
  title: 'what-if-heavier-rider-descends',
  about: 'Ve sjezdu bez šlapání je těžší jezdec rychlejší: 60kg jezdec 50 km/h, 90kg jezdec 60 km/h ve stejné pozici.',
  acts: [['hook', 'hook'], ['race', 'setup', 'speeds', 'free'], ['why', 'why', 'tip']],
  lines: {
    hook: { say: 'What if the heavier rider always wins the descent, without doing anything?', captions: false,
      chunks: ['What if', 'the heavier rider', 'always wins', 'the descent,', 'without doing anything?'] },
    setup: { say: 'Two riders coast down a six percent hill, in the same position.',
      chunks: ['Two riders', 'coast down', ['a 6% hill,', 'A|SIX'], 'in the same position.'] },
    speeds: { say: 'The sixty kilo rider tops out at fifty kilometers per hour. The ninety kilo rider: sixty!',
      chunks: [['The 60 kg rider', 'THE'], 'tops out at', ['50 km/h.', 'FIFTY'], ['The 90 kg rider:', 'THE'], ['60!', 'SIXTY']] },
    free: { say: 'Ten kilometers per hour faster, for free.',
      chunks: [['10 km/h faster,', 'TEN'], 'for free.'] },
    why: { say: 'Gravity pulls harder on more mass. But the air only cares about your shape.',
      chunks: ['Gravity pulls harder', 'on more mass.', 'But the air', 'only cares', 'about your shape.'] },
    tip: { say: "So if you're light, your weapon on the descent is your tuck. Get small, where it's safe.",
      chunks: ["So if you're light,", 'your weapon', 'on the descent', 'is your tuck.', 'Get small,', ["where it's safe.", 'WHERE']] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'the heavier rider', i: 1 }, { t: 'always wins', i: 2, big: true, size: 120 }, { t: 'the descent?', i: 3 }] },
    race: { type: 'race', amb: 0.13, tilt: -6, finish: false,
      heads: [{ at: 'setup:2', label: 'NO PEDALING · SAME POSITION', big: '6% descent', c: 'ink' }, { at: 'free:0', big: '+10 km/h', sub: 'for the heavier rider · for free' }],
      lanes: [{ label: '60 kg rider', v: 50.1, show: '# km/h', showAt: 'speeds:2', at: 'setup:0', c: 'ink' }, { label: '90 kg rider', v: 60.1, show: '# km/h', showAt: 'speeds:4', at: 'setup:0+0.12', c: 'pu' }],
      start: 'speeds:1', end: 'free:0+0.6' },
    why: { type: 'rider', amb: 0.16, pose: { back: 'tip:3', elbows: 'tip:3+0.3', head: 'tip:3+0.15' },
      heads: [{ at: 'why:0', title: 'Gravity', big: 'loves mass', bigAt: 'why:1' }, { at: 'why:2', title: 'The air only cares', big: 'about your shape', bigAt: 'why:4' }, { at: 'tip:0', title: 'Light rider?', big: 'Tuck smaller', bigAt: 'tip:3' }] }
  },
  facts: P => [
    ['sjezd 6 % bez šlapání, 60kg jezdec + 8 kg kolo, CdA 0,32, km/h', P.kmh(0, { m: 68, cda: 0.32, grade: -0.06 }), 50, 0.3],
    ['sjezd 6 % bez šlapání, 90kg jezdec + 8 kg kolo, CdA 0,32, km/h', P.kmh(0, { m: 98, cda: 0.32, grade: -0.06 }), 60, 0.3],
    ['rozdíl, km/h', P.kmh(0, { m: 98, cda: 0.32, grade: -0.06 }) - P.kmh(0, { m: 68, cda: 0.32, grade: -0.06 }), 10, 0.2]
  ],
  sources: 'Předpoklad: oba jezdci mají stejnou plochu odporu (CdA 0,32). Těžší jezdec ji mívá o něco větší, rozdíl rychlostí by pak byl menší, ale směr platí.'
};
