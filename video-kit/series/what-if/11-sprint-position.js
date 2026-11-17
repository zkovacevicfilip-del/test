module.exports = {
  title: 'what-if-sprint-position',
  about: 'Dva sprinteři se stejnými 1000 W: nižší pozice dá o 3 km/h víc a na 200 metrech asi 10 metrů náskoku.',
  acts: [['hook', 'hook'], ['race', 'two', 'high', 'low', 'gap'], ['tip', 'why', 'tip']],
  lines: {
    hook: { say: 'What if the sprint is decided by your elbows, not your legs?', captions: false,
      chunks: ['What if', 'the sprint', 'is decided by', 'your elbows,', 'not your legs?'] },
    two: { say: 'Two sprinters. Both push one thousand watts.',
      chunks: ['Two sprinters.', 'Both push', ['1,000 watts.', 'ONE|A']] },
    high: { say: 'One sprints upright and wide: fifty-nine kilometers per hour.',
      chunks: ['One sprints', 'upright and wide:', ['59 km/h.', 'FIFTY']] },
    low: { say: 'The other gets low over the bars: sixty-two!',
      chunks: ['The other', 'gets low', 'over the bars:', ['62!', 'SIXTY']] },
    gap: { say: "Over the last two hundred meters, that's a ten meter gap. Five bike lengths!",
      chunks: ['Over the last', ['200 meters,', 'TWO'], ["that's a 10 meter gap.", "THAT'S"], ['5 bike lengths!', 'FIVE']] },
    why: { say: 'At sixty kilometers per hour, over ninety percent of that power fights the air.',
      chunks: [['At 60 km/h,', 'AT'], ['over 90%', 'OVER'], 'of that power', 'fights the air.'] },
    tip: { say: 'Same legs, same watts. So when you sprint: chest low, elbows in, eyes up.',
      chunks: ['Same legs,', 'same watts.', 'So when you sprint:', 'chest low,', 'elbows in,', 'eyes up.'] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'the sprint', i: 1 }, { t: 'is decided by', i: 2 }, { t: 'your elbows,', i: 3, big: true, size: 120 }, { t: 'not your legs?', i: 4 }] },
    race: { type: 'race', amb: 0.13,
      heads: [{ at: 'two:2', big: '1,000 W', c: 'ink', sub: 'both sprinters', subAt: 'two:1' }, { at: 'low:3', big: '+3 km/h', sub: 'same watts · lower position' }, { at: 'gap:2', big: '10 m', sub: 'ahead after 200 m' }],
      lanes: [{ label: [['Upright', 'c'], ['  ·  CdA 0.35', 'muted']], v: 58.9, show: '# km/h', showAt: 'high:2', at: 'two:0', labAt: 'high:0', c: 'ink' }, { label: [['Low', 'c'], ['  ·  CdA 0.30', 'muted']], v: 61.9, show: '# km/h', showAt: 'low:3', at: 'two:0+0.12', labAt: 'low:0', c: 'pu' }],
      start: 'low:3', end: 'gap:2', finish: '200 m', finishAt: 'gap:0', gap: { text: '10 m behind' } },
    tip: { type: 'rider', amb: 0.16, pose: { back: 'tip:3', elbows: 'tip:4' },
      heads: [{ at: 'why:0', label: 'AT 60 KM/H', big: '90%+', bigAt: 'why:1', sub: 'of that power fights the air', subAt: 'why:2' }, { at: 'tip:0', title: 'Same legs', big: 'same watts', bigAt: 'tip:1', c: 'ink', out: 'tip:2+0.2' }],
      checks: { items: [{ text: 'Chest low', at: 'tip:3' }, { text: 'Elbows in', at: 'tip:4' }, { text: 'Eyes up', at: 'tip:5' }] } }
  },
  facts: P => [
    ['1000 W, CdA 0,35, km/h', P.kmh(1000, { cda: 0.35 }), 58.9, 0.05],
    ['1000 W, CdA 0,30, km/h', P.kmh(1000, { cda: 0.30 }), 61.9, 0.05],
    ['rozdíl rychlostí, km/h', P.kmh(1000, { cda: 0.30 }) - P.kmh(1000, { cda: 0.35 }), 3, 0.1],
    ['náskok na 200 m při ustálených rychlostech, m', 200 * (1 - P.speed(1000, { cda: 0.35 }) / P.speed(1000, { cda: 0.30 })), 10, 0.3],
    ['podíl vzduchu při 60 km/h, CdA 0,35, % (ve videu „over 90 %“)', P.airShare(60, { cda: 0.35 }) * 100, 94.7, 0.5]
  ],
  sources: 'Náskok je spočítaný z ustálených rychlostí, zrychlování se nepočítá. Délka kola je asi 1,7 až 2 m, 10 m je tedy asi 5 délek.'
};
