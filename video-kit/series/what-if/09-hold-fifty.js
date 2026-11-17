module.exports = {
  title: 'what-if-hold-fifty',
  about: 'Kolik wattů stojí 50 km/h podle pozice: 543 W na brzdových pákách, 461 W nízko, 378 W v časovkářské pozici.',
  acts: [['hook', 'hook'], ['need', 'up', 'low', 'tt', 'same'], ['tip', 'tip']],
  lines: {
    hook: { say: 'What if you wanted to hold fifty kilometers per hour, all on your own?', captions: false,
      chunks: ['What if', 'you wanted to hold', ['50 km/h,', 'FIFTY'], 'all on your own?'] },
    up: { say: "Sitting on the hoods, you'd need about five hundred forty watts. Far beyond most riders.",
      chunks: ['Sitting on the hoods,', ["you'd need", "YOU'D"], ['about 540 watts.', 'ABOUT'], 'Far beyond', 'most riders.'] },
    low: { say: 'Get low and narrow: four hundred sixty.',
      chunks: ['Get low', 'and narrow:', ['460.', 'FOUR']] },
    tt: { say: 'In a real time trial tuck: three hundred eighty watts.',
      chunks: ['In a real', 'time trial tuck:', ['380 watts.', 'THREE']] },
    same: { say: 'Same speed. Over one hundred sixty watts less, just from your shape!',
      chunks: ['Same speed.', ['Over 160 watts less,', 'OVER'], 'just from', 'your shape!'] },
    tip: { say: "That's why time trial positions look so extreme. Every bit of drag you remove is power you don't need.",
      chunks: ["That's why", 'time trial positions', 'look so extreme.', 'Every bit of drag', 'you remove', 'is power', "you don't need."] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'you wanted to hold', i: 1 }, { t: '50 km/h', i: 2, big: true, size: 190 }, { t: 'all on your own?', i: 3, size: 54, c: 'muted', gap: 20 }] },
    need: { type: 'bars', amb: 0.2,
      heads: [{ at: 'up:0', label: 'POWER TO HOLD', big: '50 km/h', c: 'ink' }, { at: 'same:1', big: '−165 W', sub: 'same speed · just your shape', subAt: 'same:2' }],
      bars: [{ label: 'Hoods', cap: 'CdA 0.30', value: 543, show: '# W', at: 'up:0', numAt: 'up:2', c: 'ink' }, { label: 'Low', cap: 'CdA 0.25', value: 461, show: '# W', at: 'low:0', numAt: 'low:2', c: 'ink' }, { label: 'TT tuck', cap: 'CdA 0.20', value: 378, show: '# W', at: 'tt:0', numAt: 'tt:2', c: 'pu' }] },
    tip: { type: 'rider', amb: 0.16, pose: { back: 'tip:1', elbows: 'tip:1+0.3', head: 'tip:1+0.15' },
      heads: [{ at: 'tip:1', title: 'Looks extreme', sub: 'for a reason', subAt: 'tip:2' }, { at: 'tip:3', title: 'Less drag', big: 'less power needed', bigAt: 'tip:5' }] }
  },
  facts: P => [
    ['50 km/h, CdA 0,30, W', P.watts(50, { cda: 0.30 }), 543, 0.6],
    ['50 km/h, CdA 0,25, W', P.watts(50, { cda: 0.25 }), 461, 0.6],
    ['50 km/h, CdA 0,20, W', P.watts(50, { cda: 0.20 }), 378, 0.6],
    ['rozdíl mezi CdA 0,30 a 0,20, W', P.watts(50, { cda: 0.30 }) - P.watts(50, { cda: 0.20 }), 165, 1]
  ],
  sources: 'CdA 0,30 / 0,25 / 0,20 jsou typické hodnoty pro jízdu na brzdových pákách, nízkou silniční pozici a časovkářskou pozici (přehled Crouch a kol. 2017 uvádí rozsah zhruba 0,2 až 0,4 m²).'
};
