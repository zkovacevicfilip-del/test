module.exports = {
  title: 'what-if-seventeen-minutes',
  about: 'Dlouhý triatlon, 180 km na 200 W: nižší a užší pozice (CdA 0,30 → 0,25) ušetří 17 minut.',
  acts: [['hook', 'hook'], ['race', 'setup', 'a', 'b', 'gap'], ['tip', 'tip']],
  lines: {
    hook: { say: 'What if your position is worth seventeen minutes on race day?', captions: false,
      chunks: ['What if', 'your position', 'is worth', ['17 minutes', 'SEVENTEEN'], 'on race day?'] },
    setup: { say: 'A full-distance triathlon: one hundred eighty kilometers on the bike, at two hundred watts.',
      chunks: [['A full-distance', 'A|FULL'], 'triathlon:', ['180 km', 'ONE|A'], 'on the bike,', ['at 200 watts.', 'AT']] },
    a: { say: 'In a relaxed position, that takes five hours and ten minutes.',
      chunks: ['In a relaxed position,', 'that takes', ['5 hours', 'FIVE'], ['and 10 minutes.', 'AND|TEN']] },
    b: { say: 'Lower and narrower, the same watts get you there in four fifty-three.',
      chunks: ['Lower and narrower,', 'the same watts', 'get you there', ['in 4:53.', 'IN']] },
    gap: { say: 'Seventeen minutes. No extra fitness. No extra pain.',
      chunks: [['17 minutes.', 'SEVENTEEN'], 'No extra fitness.', 'No extra pain.'] },
    tip: { say: 'But only if you can hold that position for five hours. So train it, like you train your legs.',
      chunks: ['But only if', 'you can hold', 'that position', ['for 5 hours.', 'FOR'], 'So train it,', 'like you train', 'your legs.'] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'your position', i: 1 }, { t: 'is worth', i: 2 }, { t: '17 minutes', i: 3, big: true, size: 130 }, { t: 'on race day?', i: 4 }] },
    race: { type: 'race', amb: 0.13,
      heads: [{ at: 'setup:2', big: '200 W', bigAt: 'setup:4', c: 'ink', sub: '180 km on the bike', subAt: 'setup:2' }, { at: 'a:2', big: '5:10', c: 'ink', sub: 'relaxed position' }, { at: 'b:3', big: '4:53', sub: 'lower and narrower' }, { at: 'gap:0', big: '17 min', sub: 'no extra fitness' }],
      lanes: [{ label: [['Relaxed', 'c'], ['  ·  CdA 0.30', 'muted']], v: 34.8, show: '# km/h', at: 'setup:0', labAt: 'a:0', c: 'ink' }, { label: [['Low', 'c'], ['  ·  CdA 0.25', 'muted']], v: 36.8, show: '# km/h', at: 'setup:0+0.12', labAt: 'b:0', c: 'pu' }],
      start: 'a:1', end: 'b:3+0.3', finish: '180 km', finishAt: 'setup:2', gap: { text: '17 min behind', at: 'gap:0' } },
    tip: { type: 'rider', amb: 0.16, pose: { back: 1, elbows: 1, head: 1 },
      heads: [{ at: 'tip:0', title: 'Hold it', big: 'for 5 hours', bigAt: 'tip:3', c: 'ink' }, { at: 'tip:4', title: 'Train your position', sub: 'like you train your legs', subAt: 'tip:5' }] }
  },
  facts: P => [
    ['180 km na 200 W, CdA 0,30, minut (5:10)', P.time(200, 180, { cda: 0.30 }) / 60, 310, 0.5],
    ['180 km na 200 W, CdA 0,25, minut (4:53)', P.time(200, 180, { cda: 0.25 }) / 60, 293, 0.5],
    ['rozdíl, minut', (P.time(200, 180, { cda: 0.30 }) - P.time(200, 180, { cda: 0.25 })) / 60, 17, 0.3],
    ['200 W, CdA 0,30, km/h', P.kmh(200, { cda: 0.30 }), 34.8, 0.05],
    ['200 W, CdA 0,25, km/h', P.kmh(200, { cda: 0.25 }), 36.8, 0.05]
  ],
  sources: 'Rovinatá trať bez větru a zatáček, stálý výkon. Skutečná trať dá jiné časy, rozdíl mezi pozicemi zůstane podobný.'
};
