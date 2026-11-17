module.exports = {
  title: 'what-if-tailwind-pays-back',
  about: 'Jízda tam a zpět ve větru 20 km/h je o 4,5 minuty pomalejší než bez větru: v protivětru strávíš skoro dvakrát víc času.',
  acts: [['hook', 'hook'], ['legs', 'setup', 'out'], ['total', 'total', 'why'], ['tip', 'tip']],
  lines: {
    hook: { say: 'What if the tailwind never gives back what the headwind took?', captions: false,
      chunks: ['What if', 'the tailwind', 'never gives back', 'what the headwind', 'took?'] },
    setup: { say: 'Ride twenty kilometers out into a twenty kilometer per hour wind, then turn around.',
      chunks: [['Ride 20 km out', 'RIDE'], ['into a 20 km/h wind,', 'INTO'], 'then turn around.'] },
    out: { say: 'Out: forty-two minutes. Back: just twenty-two.',
      chunks: [['Out: 42 minutes.', 'OUT'], ['Back: just 22.', 'BACK']] },
    total: { say: "Together, that's four and a half minutes slower than with no wind at all!",
      chunks: ['Together,', ["that's 4½ minutes", "THAT'S"], 'slower than', 'with no wind', 'at all!'] },
    why: { say: 'Because you spend almost twice as long in the headwind as in the tailwind.',
      chunks: ['Because you spend', 'almost twice as long', 'in the headwind', 'as in the tailwind.'] },
    tip: { say: 'So the headwind is where it counts. Get as small as you can, and save sitting up for the way back.',
      chunks: ['So the headwind', 'is where it counts.', 'Get as small', 'as you can,', 'and save sitting up', 'for the way back.'] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'the tailwind', i: 1 }, { t: 'never gives back', i: 2, big: true, size: 100 }, { t: 'what the headwind took?', i: 3, size: 50, c: 'muted' }] },
    legs: { type: 'rows', amb: 0.2, max: 45,
      heads: [{ at: 'setup:0', label: '20 KM OUT · 20 KM BACK · 250 W', big: '20 km/h wind', bigAt: 'setup:1', c: 'ink' }],
      rows: [{ label: 'Out · headwind', note: '28.6 km/h', value: 42, left: '41:59', leftCap: 'FOR 20 KM', at: 'setup:1', leftAt: 'out:0', c: 'ink' }, { label: 'Back · tailwind', note: '53.6 km/h', value: 22.4, left: '22:24', leftCap: 'FOR 20 KM', at: 'setup:2', leftAt: 'out:1', c: 'pu' }] },
    total: { type: 'bars', amb: 0.2, max: 70,
      heads: [{ at: 'total:1', big: '+4:27', sub: 'slower than with no wind', subAt: 'total:2' }, { at: 'why:0', title: 'Twice as long', sub: 'in the headwind as in the tailwind', subAt: 'why:2' }],
      bars: [{ label: 'No wind', cap: '40 KM', value: 59.93, show: '59:56', at: 'total:0', c: 'ink' }, { label: 'With wind', cap: '40 KM', value: 64.38, show: '64:23', at: 'total:0+0.15', numAt: 'total:1', c: 'pu' }] },
    tip: { type: 'rider', amb: 0.16, pose: { back: 'tip:2', elbows: 'tip:2+0.3', head: 'tip:2+0.15' },
      heads: [{ at: 'tip:0', title: 'Headwind', big: 'is where it counts', bigAt: 'tip:1' }, { at: 'tip:2', big: 'Get small', sub: 'sit up on the way back', subAt: 'tip:4' }] }
  },
  facts: P => [
    ['20 km proti větru 20 km/h při 250 W, s (41:59)', P.time(250, 20, { wind: 20 / 3.6 }), 2519, 1.5],
    ['20 km po větru 20 km/h, s (22:24)', P.time(250, 20, { wind: -20 / 3.6 }), 1344, 1.5],
    ['rychlost proti větru, km/h', P.kmh(250, { wind: 20 / 3.6 }), 28.6, 0.05],
    ['rychlost po větru, km/h', P.kmh(250, { wind: -20 / 3.6 }), 53.6, 0.05],
    ['celkem s větrem, s (64:23)', P.time(250, 20, { wind: 20 / 3.6 }) + P.time(250, 20, { wind: -20 / 3.6 }), 3863, 2],
    ['bez větru 40 km, s (59:56)', P.time(250, 40), 3596, 1],
    ['ztráta, s (4:27)', P.time(250, 20, { wind: 20 / 3.6 }) + P.time(250, 20, { wind: -20 / 3.6 }) - P.time(250, 40), 267, 1.5],
    ['poměr času proti větru a po větru', P.time(250, 20, { wind: 20 / 3.6 }) / P.time(250, 20, { wind: -20 / 3.6 }), 1.9, 0.05]
  ]
};
