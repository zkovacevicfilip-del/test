module.exports = {
  title: 'what-if-no-air',
  about: 'Kdyby nebyl vzduch: 250 W by stačilo na 266 km/h. Ukazuje, kolik výkonu bere vzduch.',
  acts: [['hook', 'hook'], ['speed', 'fast', 'legs', 'only'], ['split', 'split', 'tip']],
  lines: {
    hook: { say: 'What if there was no air? How fast could you ride?', captions: false,
      chunks: ['What if', 'there was', 'no air?', 'How fast', 'could you ride?'] },
    fast: { say: 'With the same two hundred fifty watts that give you forty kilometers per hour today, you would hit two hundred sixty-six!',
      chunks: ['With the same', ['250 watts', 'TWO'], 'that give you', ['40 km/h today,', 'FORTY'], 'you would hit', ['266!', 'TWO']] },
    legs: { say: "Your legs wouldn't change. Only the air would.",
      chunks: ["Your legs", "wouldn't change.", 'Only the air would.'] },
    only: { say: 'The only thing left to fight is your tires.',
      chunks: ['The only thing', 'left to fight', 'is your tires.'] },
    split: { say: 'Because at forty, rolling takes about thirty-eight watts. The air takes over two hundred!',
      chunks: [['Because at 40,', 'BECAUSE'], 'rolling takes', ['about 38 watts.', 'ABOUT'], 'The air takes', ['over 200!', 'OVER']] },
    tip: { say: "You can't remove the air. But you can hide from it: get low, get narrow.",
      chunks: ["You can't remove", 'the air.', 'But you can', 'hide from it:', 'get low,', 'get narrow.'] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'there was', i: 1 }, { t: 'no air?', i: 2, big: true, size: 190 }, { t: 'How fast could you ride?', i: 3, size: 46, c: 'muted', gap: 30 }] },
    speed: { type: 'bars', amb: 0.2,
      heads: [{ at: 'fast:1', big: '250 W', c: 'ink', sub: 'same rider · flat road', subAt: 'fast:0' }, { at: 'fast:5', big: '6.6× faster', sub: 'with no air to push' }, { at: 'legs:0', title: 'Same legs', sub: 'only the air is gone' }, { at: 'only:0', title: 'Only your tires', sub: 'left to fight' }],
      bars: [{ label: 'With air', value: 40, show: '40 km/h', at: 'fast:3' }, { label: 'No air', value: 266, show: '# km/h', at: 'fast:5' }] },
    split: { type: 'rows', amb: 0.2,
      heads: [{ at: 'split:0', label: 'RIDING AT 40 KM/H', big: '250 W', c: 'ink' }, { at: 'tip:0', title: "Can't remove it", big: 'Hide from it', bigAt: 'tip:2' }],
      rows: [{ label: 'Rolling resistance', value: 38, left: '# W', lc: [0, 38, 0], at: 'split:1', leftAt: 'split:2', c: 'ink' }, { label: 'Air', value: 212, left: '# W', lc: [0, 212, 0], at: 'split:3', leftAt: 'split:4', c: 'pu', right: '85%', rightCap: 'OF YOUR POWER' }] }
  },
  facts: P => [
    ['250 W bez vzduchu (jen valivý odpor), km/h', P.kmh(250, { rho: 0 }), 266, 0.5],
    ['250 W se vzduchem, CdA 0,25, km/h', P.kmh(250), 40, 0.1],
    ['kolikrát rychleji bez vzduchu', P.kmh(250, { rho: 0 }) / P.kmh(250), 6.6, 0.06],
    ['valivý odpor při 40 km/h, W', P.watts(40, { rho: 0 }), 38, 0.5],
    ['odpor vzduchu při 40 km/h, W', P.watts(40) - P.watts(40, { rho: 0 }), 212, 0.5],
    ['podíl vzduchu při 40 km/h, %', P.airShare(40) * 100, 85, 0.6]
  ]
};
