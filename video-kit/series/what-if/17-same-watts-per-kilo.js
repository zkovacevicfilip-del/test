module.exports = {
  title: 'what-if-same-watts-per-kilo',
  about: 'Dva jezdci se stejnými W/kg: do kopce jsou skoro stejně rychlí, na rovině je těžší o 1,8 km/h rychlejší.',
  acts: [['hook', 'hook'], ['setup', 'setup', 'climb'], ['flat', 'flat'], ['why', 'why', 'tip']],
  lines: {
    hook: { say: 'What if two riders have exactly the same watts per kilo? Who wins?', captions: false,
      chunks: ['What if', 'two riders have', 'exactly the same', 'watts per kilo?', 'Who wins?'] },
    setup: { say: 'Both push four watts per kilo. One weighs sixty kilos, the other ninety.',
      chunks: ['Both push', ['4 watts per kilo.', 'FOUR'], 'One weighs', ['60 kilos,', 'SIXTY'], ['the other 90.', 'THE']] },
    climb: { say: "On a steep climb, they're almost level.",
      chunks: ['On a steep climb,', ["they're almost level.", "THEY'RE|THEIR|THERE"]] },
    flat: { say: 'But on the flat, the big rider is almost two kilometers per hour faster. Nearly three minutes ahead after forty kilometers!',
      chunks: ['But on the flat,', 'the big rider', ['is almost 2 km/h', 'IS'], 'faster.', ['Nearly 3 minutes', 'NEARLY'], 'ahead', ['after 40 km!', 'AFTER']] },
    why: { say: "Because on the flat, total watts fight the air. And drag doesn't grow as fast as body weight.",
      chunks: ['Because on the flat,', 'total watts', 'fight the air.', "And drag doesn't grow", 'as fast as', 'body weight.'] },
    tip: { say: 'So on flat roads, forget watts per kilo. Think watts per drag area.',
      chunks: ['So on flat roads,', 'forget', 'watts per kilo.', 'Think watts', 'per drag area.'] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'two riders have', i: 1 }, { t: 'the same W/kg?', i: 2, big: true, size: 110 }, { t: 'Who wins?', i: 4, size: 80, gap: 20 }] },
    setup: { type: 'rows', amb: 0.2, max: 17,
      heads: [{ at: 'setup:1', big: '4 W/kg', c: 'ink', sub: 'both riders', subAt: 'setup:0' }, { at: 'climb:0', title: 'Steep climb', big: 'almost level', bigAt: 'climb:1' }],
      rows: [{ label: '60 kg rider', note: '240 W', value: 14.4, left: '14.4 km/h', leftCap: 'ON AN 8% CLIMB', at: 'setup:3', leftAt: 'climb:1', c: 'ink' }, { label: '90 kg rider', note: '360 W', value: 15.0, left: '15.0 km/h', leftCap: 'ON AN 8% CLIMB', at: 'setup:4', leftAt: 'climb:1+0.15', c: 'pu' }] },
    flat: { type: 'race', amb: 0.13,
      heads: [{ at: 'flat:0', title: 'On the flat' }, { at: 'flat:2', big: '+1.8 km/h', sub: 'for the bigger rider' }, { at: 'flat:4', big: '2:43', sub: 'ahead after 40 km' }],
      lanes: [{ label: [['60 kg', 'c'], ['  ·  240 W  ·  CdA 0.26', 'muted']], v: 39.4, show: '# km/h', at: 'flat:0', c: 'ink' }, { label: [['90 kg', 'c'], ['  ·  360 W  ·  CdA 0.34', 'muted']], v: 41.2, show: '# km/h', at: 'flat:0+0.12', c: 'pu' }],
      start: 'flat:1', end: 'flat:4+0.3', finish: '40 km', gap: { text: '2:43 behind' } },
    why: { type: 'rider', amb: 0.16, pose: { back: 'tip:3', elbows: 'tip:3+0.3', head: 'tip:3+0.15' },
      heads: [{ at: 'why:1', title: 'Total watts', big: 'fight the air', bigAt: 'why:2' }, { at: 'tip:1', title: 'Forget W/kg', big: 'watts ÷ CdA', bigAt: 'tip:3' }] }
  },
  facts: P => [
    ['60kg jezdec (68 kg s kolem), 240 W, CdA 0,26, rovina, km/h', P.kmh(240, { m: 68, cda: 0.26 }), 39.4, 0.05],
    ['90kg jezdec (98 kg s kolem), 360 W, CdA 0,34, rovina, km/h', P.kmh(360, { m: 98, cda: 0.34 }), 41.2, 0.05],
    ['rozdíl na rovině, km/h', P.kmh(360, { m: 98, cda: 0.34 }) - P.kmh(240, { m: 68, cda: 0.26 }), 1.8, 0.06],
    ['rozdíl času na 40 km, s', P.time(240, 40, { m: 68, cda: 0.26 }) - P.time(360, 40, { m: 98, cda: 0.34 }), 163, 1],
    ['60kg jezdec na 8% stoupání, km/h', P.kmh(240, { m: 68, cda: 0.26, grade: 0.08 }), 14.4, 0.05],
    ['90kg jezdec na 8% stoupání, km/h', P.kmh(360, { m: 98, cda: 0.34, grade: 0.08 }), 15.0, 0.05]
  ],
  sources: 'Předpoklad: plocha odporu roste s hmotností těla pomaleji než hmotnost (přibližně s mocninou 2/3): 0,26 m² pro 60 kg odpovídá asi 0,34 m² pro 90 kg. Kolo váží 8 kg u obou.'
};
