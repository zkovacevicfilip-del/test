module.exports = {
  title: 'what-if-weather-pressure',
  about: 'Tlak vzduchu podle počasí mění hustotu vzduchu o několik procent: při tlakové níži se jede rychleji.',
  acts: [['hook', 'hook'], ['baro', 'look', 'press'], ['race', 'race', 'equal'], ['tip', 'tip']],
  lines: {
    hook: { say: 'What if the weather forecast could tell you when to go for a personal best?', captions: false,
      chunks: ['What if', 'the weather forecast', 'could tell you', 'when to go for', 'a personal best?'] },
    look: { say: 'Look at the air pressure.',
      chunks: ['Look at', 'the air pressure.'] },
    press: { say: 'On a stormy low-pressure day, the air is four percent thinner than under a sunny high.',
      chunks: ['On a stormy', ['low-pressure day,', 'LOW'], 'the air is', ['4% thinner', 'FOUR'], 'than under', 'a sunny high.'] },
    race: { say: 'Same power over forty kilometers: forty-five seconds faster!',
      chunks: ['Same power', ['over 40 km:', 'OVER'], ['45 seconds', 'FORTY'], 'faster!'] },
    equal: { say: "That's the same as shaving a hand-sized patch off your drag area.",
      chunks: ["That's the same", 'as shaving', 'a hand-sized patch', 'off your drag area.'] },
    tip: { say: 'So before your next time trial, check the barometer. Then fix what you control: your position.',
      chunks: ['So before your next', 'time trial,', 'check the barometer.', 'Then fix', 'what you control:', 'your position.'] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'the weather forecast', i: 1 }, { t: 'could tell you', i: 2 }, { t: 'when to go for', i: 3, size: 50, c: 'muted' }, { t: 'a personal best?', i: 4, big: true, size: 96 }] },
    baro: { type: 'rows', amb: 0.2,
      heads: [{ at: 'look:0', title: 'Air pressure' }, { at: 'press:3', big: '−4%', sub: 'thinner air on a low-pressure day' }],
      rows: [{ label: 'Sunny high', note: '1030 hPa', value: 100, left: '100%', leftCap: 'AIR DENSITY', at: 'look:0', leftAt: 'press:0+0.2', c: 'ink' }, { label: 'Stormy low', note: '990 hPa', value: 96, left: '#%', lc: [100, 96, 0], leftCap: 'AIR DENSITY', at: 'look:1', leftAt: 'press:3', c: 'pu' }] },
    race: { type: 'race', amb: 0.13,
      heads: [{ at: 'race:0', big: '250 W', c: 'ink', sub: 'same rider · same power' }, { at: 'race:2', big: '45 s', sub: 'faster over 40 km' }, { at: 'equal:0', title: 'Same gain as', big: '−0.01 m² CdA', bigAt: 'equal:2' }],
      lanes: [{ label: 'High · 1030 hPa', v: 39.83, show: '39.8 km/h', at: 'race:0', c: 'ink' }, { label: 'Low · 990 hPa', v: 40.34, show: '40.3 km/h', at: 'race:0+0.12', c: 'pu' }],
      start: 'race:1', end: 'race:2+0.5', finish: '40 km', gap: { text: '45 s behind' } },
    tip: { type: 'rider', amb: 0.16, pose: { back: 'tip:5', elbows: 'tip:5+0.3', head: 'tip:5+0.15' },
      heads: [{ at: 'tip:2', title: 'Check the barometer' }, { at: 'tip:3', title: 'Then fix', big: 'your position', bigAt: 'tip:5' }] }
  },
  facts: P => [
    ['hustota při 990 hPa proti 1030 hPa, %', P.rho({ hpa: 990 }) / P.rho({ hpa: 1030 }) * 100, 96, 0.2],
    ['250 W při 1030 hPa, km/h', P.kmh(250, { hpa: 1030 }), 39.8, 0.05],
    ['250 W při 990 hPa, km/h', P.kmh(250, { hpa: 990 }), 40.3, 0.05],
    ['rozdíl času na 40 km, s', P.time(250, 40, { hpa: 1030 }) - P.time(250, 40, { hpa: 990 }), 45, 0.5],
    ['pro srovnání: 0,01 m² CdA na 40 km, s', P.time(250, 40) - P.time(250, 40, { cda: 0.24 }), 45, 1]
  ],
  sources: 'Tlak 990 a 1030 hPa jsou běžné hodnoty tlakové níže a výše u hladiny moře.'
};
