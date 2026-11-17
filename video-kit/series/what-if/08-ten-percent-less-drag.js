module.exports = {
  title: 'what-if-ten-percent-less-drag',
  about: 'O 10 % menší odpor nedá o 10 % vyšší rychlost, jen asi o 3,5 %. Na 40 km to jsou ale skoro 2 minuty.',
  acts: [['hook', 'hook'], ['pct', 'no', 'why'], ['time', 'but', 'watts'], ['tip', 'tip', 'tip2']],
  lines: {
    hook: { say: 'What if you cut your drag by ten percent? Do you get ten percent faster?', captions: false,
      chunks: ['What if', 'you cut your drag', ['by 10%?', 'BY'], 'Do you get', ['10% faster?', 'TEN']] },
    no: { say: 'No. You only get about three and a half percent.',
      chunks: ['No.', 'You only get', ['about 3.5%.', 'ABOUT']] },
    why: { say: 'Speed follows the cube root of power over drag. Sounds disappointing?',
      chunks: ['Speed follows', 'the cube root', 'of power over drag.', 'Sounds disappointing?'] },
    but: { say: "It isn't! Over forty kilometers, that's almost two minutes.",
      chunks: ["It isn't!", ['Over 40 km,', 'OVER'], ["that's almost", "THAT'S"], ['2 minutes.', 'TWO']] },
    watts: { say: "To gain that with your legs, you'd need twenty-four more watts.",
      chunks: ['To gain that', 'with your legs,', ["you'd need", "YOU'D"], ['24 more watts.', 'TWENTY']] },
    tip: { say: 'Ten percent less drag can be one position change. Twenty-four watts can take months of training.',
      chunks: [['10% less drag', 'TEN'], 'can be one', 'position change.', ['24 watts', 'TWENTY'], 'can take', 'months of training.'] },
    tip2: { say: 'And it pays back on every single ride.',
      chunks: ['And it pays back', 'on every', 'single ride.'] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'you cut your drag', i: 1 }, { t: 'by 10%?', i: 2, big: true, size: 170 }, { t: '10% faster?', i: 4, size: 70, gap: 20 }] },
    pct: { type: 'bars', amb: 0.2,
      heads: [{ at: 'no:0', title: '10% faster?', big: 'No', c: 'ink' }, { at: 'why:0', title: 'Speed follows', big: 'the cube root', bigAt: 'why:1' }],
      bars: [{ label: 'Drag', value: 10, show: '−10%', at: 'no:0', c: 'ink' }, { label: 'Speed', value: 3.4, show: '+3.4%', at: 'no:1', numAt: 'no:2', c: 'pu' }] },
    time: { type: 'race', amb: 0.13,
      heads: [{ at: 'but:1', big: '40 km', c: 'ink', sub: 'same rider · same 250 W' }, { at: 'but:3', big: '1:57', sub: 'faster over 40 km' }, { at: 'watts:0', title: 'To match it with your legs', big: '+24 W', bigAt: 'watts:3' }],
      lanes: [{ label: 'Before', v: 40.04, show: '40.0 km/h', at: 'but:0', c: 'ink' }, { label: '10% less drag', v: 41.39, show: '41.4 km/h', at: 'but:0+0.12', c: 'pu' }],
      start: 'but:1', end: 'but:3+0.3', finish: '40 km', gap: { text: '1:57 behind' } },
    tip: { type: 'rider', amb: 0.16, pose: { back: 'tip:1', elbows: 'tip:1+0.3', head: 'tip:1+0.15' },
      heads: [{ at: 'tip:0', title: '10% less drag', big: 'one position change', bigAt: 'tip:1' }, { at: 'tip:3', title: '24 watts', big: 'months of training', bigAt: 'tip:4', c: 'ink' }, { at: 'tip2:0', title: 'And it pays back', big: 'every ride', bigAt: 'tip2:1' }] }
  },
  facts: P => [
    ['250 W, CdA 0,25, km/h', P.kmh(250), 40.0, 0.05],
    ['250 W, CdA 0,225 (o 10 % méně), km/h', P.kmh(250, { cda: 0.225 }), 41.4, 0.05],
    ['o kolik procent rychleji', (P.kmh(250, { cda: 0.225 }) / P.kmh(250) - 1) * 100, 3.4, 0.06],
    ['rozdíl času na 40 km, s', P.time(250, 40) - P.time(250, 40, { cda: 0.225 }), 117, 1],
    ['watty navíc pro stejnou rychlost bez změny odporu', P.watts(P.kmh(250, { cda: 0.225 })) - 250, 24, 0.6]
  ]
};
