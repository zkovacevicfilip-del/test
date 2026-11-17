module.exports = {
  title: 'what-if-slow-tires',
  about: 'Pomalý plášť proti rychlému: 47 W proti 28 W valivého odporu při 40 km/h, na 40 km je to 1:40.',
  acts: [['hook', 'hook'], ['watts', 'crr', 'watts'], ['time', 'time', 'cmp'], ['tip', 'tip']],
  lines: {
    hook: { say: 'What if your tires are quietly stealing nineteen watts from you?', captions: false,
      chunks: ['What if', 'your tires', 'are quietly stealing', ['19 watts', 'NINETEEN'], 'from you?'] },
    crr: { say: 'A slow tire can have two thirds more rolling resistance than a fast one.',
      chunks: ['A slow tire', 'can have', 'two thirds more', 'rolling resistance', 'than a fast one.'] },
    watts: { say: "At forty kilometers per hour, that's twenty-eight watts against forty-seven.",
      chunks: [['At 40 km/h,', 'AT'], ["that's 28 watts", "THAT'S"], ['against 47.', 'AGAINST']] },
    time: { say: 'Over forty kilometers: one minute and forty seconds!',
      chunks: [['Over 40 km:', 'OVER'], ['1 minute', 'ONE|A'], ['and 40 seconds!', 'AND|FORTY']] },
    cmp: { say: "That's like two hand-sized patches of drag, on every ride.",
      chunks: ["That's like", ['2 hand-sized patches', 'TWO'], 'of drag,', 'on every ride.'] },
    tip: { say: "So before you buy aero wheels, check your tires and your pressure. After your position, it's the cheapest speed there is.",
      chunks: ['So before you buy', ['aero wheels,', 'AERO|ARROW'], 'check your tires', 'and your pressure.', 'After your position,', ["it's the cheapest speed", "IT'S|ITS"], 'there is.'] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'your tires', i: 1 }, { t: 'are quietly stealing', i: 2 }, { t: '19 watts', i: 3, big: true, size: 170 }, { t: 'from you?', i: 4 }] },
    watts: { type: 'bars', amb: 0.2, max: 60,
      heads: [{ at: 'crr:0', title: 'Rolling resistance', big: '+67%', bigAt: 'crr:2' }, { at: 'watts:0', label: 'ROLLING RESISTANCE AT 40 KM/H', big: '+19 W', bigAt: 'watts:2' }],
      bars: [{ label: 'Fast tire', cap: 'Crr 0.003', value: 28, show: '# W', at: 'crr:0', numAt: 'watts:1', c: 'ink' }, { label: 'Slow tire', cap: 'Crr 0.005', value: 47, show: '# W', at: 'crr:1', numAt: 'watts:2', c: 'pu' }] },
    time: { type: 'race', amb: 0.13,
      heads: [{ at: 'time:0', big: '250 W', c: 'ink', sub: 'same rider · same power' }, { at: 'time:1', big: '1:40', sub: 'faster over 40 km' }, { at: 'cmp:0', title: 'Like 2 hand-sized', big: 'patches of drag', bigAt: 'cmp:1' }],
      lanes: [{ label: 'Slow tires', v: 39.48, show: '39.5 km/h', at: 'time:0', c: 'ink' }, { label: 'Fast tires', v: 40.60, show: '40.6 km/h', at: 'time:0+0.12', c: 'pu' }],
      start: 'time:0', end: 'time:2+0.3', finish: '40 km', gap: { text: '1:40 behind' } },
    tip: { type: 'rider', amb: 0.16, pose: { back: 'tip:4', elbows: 'tip:4+0.3', head: 'tip:4+0.15' },
      heads: [{ at: 'tip:0', title: 'Before aero wheels', big: 'check your tires', bigAt: 'tip:2', c: 'ink' }, { at: 'tip:4', title: 'After your position', big: 'cheapest speed', bigAt: 'tip:5' }] }
  },
  facts: P => [
    ['valivý odpor při 40 km/h, Crr 0,003, W', P.watts(40, { crr: 0.003, rho: 0 }), 28, 0.5],
    ['valivý odpor při 40 km/h, Crr 0,005, W', P.watts(40, { crr: 0.005, rho: 0 }), 47, 0.5],
    ['rozdíl, W', P.watts(40, { crr: 0.005 }) - P.watts(40, { crr: 0.003 }), 19, 0.5],
    ['o kolik procent větší valivý odpor', (0.005 / 0.003 - 1) * 100, 67, 0.5],
    ['250 W, Crr 0,005, km/h', P.kmh(250, { crr: 0.005 }), 39.5, 0.05],
    ['250 W, Crr 0,003, km/h', P.kmh(250, { crr: 0.003 }), 40.6, 0.05],
    ['rozdíl času na 40 km, s', P.time(250, 40, { crr: 0.005 }) - P.time(250, 40, { crr: 0.003 }), 100, 1]
  ],
  sources: 'Crr 0,003 a 0,005 leží v běžném rozsahu silničních plášťů (rychlé závodní kolem 0,003, odolné tréninkové kolem 0,005 i víc; měření na válci, např. bicyclerollingresistance.com). Skutečný rozdíl závisí na plášti, tlaku a povrchu, proto video říká „can have“.'
};
