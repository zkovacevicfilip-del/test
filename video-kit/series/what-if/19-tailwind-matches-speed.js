module.exports = {
  title: 'what-if-tailwind-matches-speed',
  about: 'Kdyby vítr v zádech foukal stejně rychle, jako jedeš, odpor vzduchu zmizí: místo 188 W stačí 34 W.',
  acts: [['hook', 'hook'], ['still', 'still'], ['watts', 'watts', 'now', 'share'], ['tip', 'tip']],
  lines: {
    hook: { say: 'What if the wind behind you blew exactly as fast as you ride?', captions: false,
      chunks: ['What if', 'the wind behind you', 'blew exactly', 'as fast', 'as you ride?'] },
    still: { say: 'Then the air around you stands still. No drag at all.',
      chunks: ['Then the air', 'around you', 'stands still.', 'No drag', 'at all.'] },
    watts: { say: "At thirty-six kilometers per hour, you'd normally need one hundred eighty-eight watts.",
      chunks: [['At 36 km/h,', 'AT'], ["you'd normally need", "YOU'D"], ['188 watts.', 'ONE|A']] },
    now: { say: 'Now? Just thirty-four. Only your tires are left.',
      chunks: ['Now?', ['Just 34.', 'JUST'], 'Only your tires', 'are left.'] },
    share: { say: "That's how much of your effort is air: more than eighty percent, gone.",
      chunks: ["That's how much", 'of your effort', 'is air:', ['more than 80%,', 'MORE'], 'gone.'] },
    tip: { say: "You can't order a tailwind. But every bit you shrink your shape is a small tailwind you carry with you.",
      chunks: ["You can't order", 'a tailwind.', 'But every bit', 'you shrink your shape', 'is a small tailwind', 'you carry with you.'] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'the wind behind you', i: 1 }, { t: 'blew exactly', i: 2 }, { t: 'as fast as you ride?', i: 3, big: true, size: 90 }] },
    still: { type: 'text', amb: 0.36, cy: 880,
      items: [{ t: 'The air around you', at: 'still:0', size: 60 }, { t: 'stands still', at: 'still:2', big: true, size: 130 }, { t: 'No drag at all.', at: 'still:3', size: 60, c: 'muted', gap: 30 }] },
    watts: { type: 'bars', amb: 0.2,
      heads: [{ at: 'watts:0', label: 'RIDING AT 36 KM/H', big: '188 W', bigAt: 'watts:2', c: 'ink' }, { at: 'now:1', big: '34 W', sub: 'only your tires are left', subAt: 'now:2' }, { at: 'share:3', big: '−82%', sub: 'that was all air' }],
      bars: [{ label: 'No wind', value: 188, show: '# W', at: 'watts:0', numAt: 'watts:2', c: 'ink' }, { label: 'Tailwind 36 km/h', value: 34, show: '# W', at: 'now:0', numAt: 'now:1', c: 'pu' }] },
    tip: { type: 'rider', amb: 0.16, pose: { back: 'tip:3', elbows: 'tip:3+0.3', head: 'tip:3+0.15' },
      heads: [{ at: 'tip:0', title: "Can't order a tailwind" }, { at: 'tip:3', title: 'Shrink your shape', big: 'carry a tailwind', bigAt: 'tip:4' }] }
  },
  facts: P => [
    ['36 km/h bez větru, CdA 0,25, W', P.watts(36), 188, 0.5],
    ['36 km/h s větrem v zádech 36 km/h, W', P.watts(36, { wind: -10 }), 34, 0.5],
    ['o kolik procent méně', (1 - P.watts(36, { wind: -10 }) / P.watts(36)) * 100, 82, 0.5]
  ]
};
