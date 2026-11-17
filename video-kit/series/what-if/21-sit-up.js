module.exports = {
  title: 'what-if-sit-up',
  about: 'Vzpřímit se na 10 % trasy (třeba kvůli pití) stojí na 40 km asi 40 sekund: plocha odporu vyskočí o 40 %.',
  acts: [['hook', 'hook'], ['cost', 'setup', 'cost'], ['why', 'why', 'adds', 'tip']],
  lines: {
    hook: { say: 'What if sitting up for a drink costs you more than you think?', captions: false,
      chunks: ['What if', 'sitting up', 'for a drink', ['costs you more', 'COSTS|COST'], 'than you think?'] },
    setup: { say: 'A forty kilometer ride. You stay low, except for ten percent of the way.',
      chunks: [['A 40 km ride.', 'A|FORTY'], 'You stay low,', ['except for 10%', 'EXCEPT'], 'of the way.'] },
    cost: { say: 'Just those four kilometers sitting up cost you forty seconds!',
      chunks: [['Just those 4 km', 'JUST'], 'sitting up', ['cost you', 'COST|COSTS'], ['40 seconds!', 'FORTY']] },
    why: { say: 'Because the moment you sit up, your drag area jumps by forty percent.',
      chunks: ['Because the moment', 'you sit up,', 'your drag area', ['jumps by 40%.', 'JUMPS']] },
    adds: { say: 'Every stretch, every look around: it all adds up.',
      chunks: ['Every stretch,', 'every look around:', 'it all adds up.'] },
    tip: { say: "So drink in the tuck if you can. And sit up where it's slow: on climbs, not on fast flats.",
      chunks: ['So drink in the tuck', 'if you can.', 'And sit up', ["where it's slow:", 'WHERE'], 'on climbs,', 'not on fast flats.'] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'sitting up', i: 1 }, { t: 'for a drink', i: 2 }, { t: 'costs you more', i: 3, big: true, size: 100 }, { t: 'than you think?', i: 4, size: 54, c: 'muted' }] },
    cost: { type: 'rider', amb: 0.16, ghost: false, pose: { back: ['cost:1', 1, 0], elbows: ['cost:1', 1, 0], head: ['cost:1', 1, 0] },
      heads: [{ at: 'setup:0', label: '40 KM · 250 W', big: '10%', bigAt: 'setup:2', c: 'ink', sub: 'of the ride sitting up', subAt: 'setup:3' }, { at: 'cost:3', big: '40 s', sub: 'lost' }] },
    why: { type: 'rows', amb: 0.2, max: 0.4,
      heads: [{ at: 'why:0', title: 'The moment you sit up' }, { at: 'adds:0', title: 'It all', big: 'adds up', bigAt: 'adds:2' }, { at: 'tip:0', title: 'Drink in the tuck', sub: "sit up where it's slow: on climbs", subAt: 'tip:2' }],
      rows: [{ label: 'In the tuck', value: 0.25, left: '0.25 m²', leftCap: 'DRAG AREA', at: 'why:0', leftAt: 'why:2', c: 'ink' }, { label: 'Sitting up', value: 0.35, left: '0.35 m²', leftCap: 'DRAG AREA', at: 'why:1', leftAt: 'why:3', c: 'pu', right: '+40%' }] }
  },
  facts: P => [
    ['ztráta na 4 km vzpřímeně (CdA 0,35 místo 0,25) při 250 W, s', P.time(250, 4, { cda: 0.35 }) - P.time(250, 4), 40, 0.5],
    ['o kolik procent větší plocha odporu', (0.35 / 0.25 - 1) * 100, 40, 0.01]
  ],
  sources: 'CdA 0,25 (nízká pozice) a 0,35 (vzpřímeně s rukama nahoře) jsou typické hodnoty v rozsahu z přehledu Crouch a kol. 2017.'
};
