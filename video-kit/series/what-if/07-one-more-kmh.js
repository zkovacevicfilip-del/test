module.exports = {
  title: 'what-if-one-more-kmh',
  about: 'Každý další km/h stojí víc wattů než ten předchozí: při 30 km/h asi 10 W, při 40 asi 17 W, při 50 asi 26 W.',
  acts: [['hook', 'hook'], ['cost', 'thirty', 'forty', 'fifty'], ['why', 'why'], ['tip', 'tip']],
  lines: {
    hook: { say: 'What if you want just one more kilometer per hour? What does it cost?', captions: false,
      chunks: ['What if', 'you want just', ['one more km/h?', 'ONE'], 'What does', 'it cost?'] },
    thirty: { say: 'At thirty, one more costs you about ten watts.',
      chunks: [['At 30,', 'AT'], 'one more', ['costs you', 'COSTS|COST'], ['about 10 watts.', 'ABOUT']] },
    forty: { say: "At forty, it's seventeen watts.",
      chunks: [['At 40,', 'AT'], ["it's 17 watts.", "IT'S|ITS"]] },
    fifty: { say: 'At fifty? Twenty-six watts, for the same tiny gain!',
      chunks: [['At 50?', 'AT'], ['26 watts,', 'TWENTY'], 'for the same', 'tiny gain!'] },
    why: { say: 'Every extra bit of speed costs more than the last one, because the air pushes back harder and harder.',
      chunks: ['Every extra bit', 'of speed', ['costs more', 'COSTS|COST'], 'than the last one,', 'because the air', 'pushes back', 'harder and harder.'] },
    tip: { say: "That's why at high speed, saving drag beats adding power. A hand-sized patch less drag is worth eight and a half watts at forty.",
      chunks: ["That's why", 'at high speed,', 'saving drag', 'beats adding power.', 'A hand-sized patch', 'less drag', ['is worth 8.5 watts', 'IS'], ['at 40.', 'AT']] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'you want just', i: 1 }, { t: '+1 km/h', i: 2, big: true, size: 190 }, { t: 'What does it cost?', i: 3, size: 54, c: 'muted', gap: 20 }] },
    cost: { type: 'bars', amb: 0.2,
      heads: [{ at: 'thirty:0', label: 'THE PRICE OF', big: '+1 km/h', c: 'ink' }],
      bars: [{ label: 'at 30 km/h', value: 10.2, show: '+10 W', at: 'thirty:0', numAt: 'thirty:3', c: 'ink' }, { label: 'at 40 km/h', value: 17.2, show: '+17 W', at: 'forty:0', numAt: 'forty:1', c: 'ink' }, { label: 'at 50 km/h', value: 26.3, show: '+26 W', at: 'fifty:0', numAt: 'fifty:1', c: 'pu' }] },
    why: { type: 'curve', amb: 0.2, pow: 3, at: 'why:0',
      heads: [{ at: 'why:0', title: 'Each km/h costs', big: 'more than the last', bigAt: 'why:2' }] },
    tip: { type: 'rider', amb: 0.16, pose: { back: 'tip:2', elbows: 'tip:2+0.3', head: 'tip:2+0.15' },
      heads: [{ at: 'tip:1', title: 'At high speed', big: 'drag beats power', bigAt: 'tip:2' }, { at: 'tip:4', label: 'A HAND-SIZED PATCH LESS DRAG', big: '8.5 W', bigAt: 'tip:6', sub: 'saved at 40 km/h', subAt: 'tip:7' }] }
  },
  facts: P => [
    ['watty navíc z 30 na 31 km/h (CdA 0,25)', P.watts(31) - P.watts(30), 10, 0.5],
    ['watty navíc ze 40 na 41 km/h', P.watts(41) - P.watts(40), 17, 0.5],
    ['watty navíc z 50 na 51 km/h', P.watts(51) - P.watts(50), 26, 0.5],
    ['0,01 m² CdA při 40 km/h, W', P.watts(40) - P.watts(40, { cda: 0.24 }), 8.5, 0.06]
  ]
};
