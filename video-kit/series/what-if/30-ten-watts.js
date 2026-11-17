module.exports = {
  title: 'what-if-ten-watts',
  about: 'Kolik je 10 W: na 40 km skoro minuta (52 s). Pravidlo: 1 W je asi 5 s na 40 km. Malá plocha odporu dá 8,5 W zadarmo.',
  acts: [['hook', 'hook'], ['ten', 'calc', 'ten'], ['rule', 'rule', 'aero'], ['tip', 'tip']],
  lines: {
    hook: { say: 'What if ten watts is worth almost a minute?', captions: false,
      chunks: ['What if', ['10 watts', 'TEN'], 'is worth', 'almost a minute?'] },
    calc: { say: 'At two hundred fifty watts, a forty kilometer ride takes just under an hour.',
      chunks: [['At 250 watts,', 'AT'], ['a 40 km ride', 'A|FORTY'], 'takes just under', 'an hour.'] },
    ten: { say: 'Add ten watts, and you finish fifty-two seconds sooner.',
      chunks: [['Add 10 watts,', 'ADD'], 'and you finish', ['52 seconds', 'FIFTY'], 'sooner.'] },
    rule: { say: 'Rule of thumb: every watt is about five seconds over forty kilometers.',
      chunks: ['Rule of thumb:', 'every watt', ['is about 5 seconds', 'IS'], ['over 40 km.', 'OVER']] },
    aero: { say: "Now the trick. You don't have to pedal those watts. A hand-sized patch less drag gives you eight and a half of them, for free.",
      chunks: ['Now the trick.', "You don't have to", 'pedal those watts.', 'A hand-sized patch', 'less drag', ['gives you 8.5', 'GIVES'], 'of them,', 'for free.'] },
    tip: { say: 'So next time you see a tiny aero gain, convert it: watts times five.',
      chunks: ['So next time', 'you see a tiny', ['aero gain,', 'AERO|ARROW'], 'convert it:', ['watts × 5.', 'WATTS']] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: '10 watts', i: 1, big: true, size: 180 }, { t: 'is worth', i: 2 }, { t: 'almost a minute?', i: 3, size: 70 }] },
    ten: { type: 'race', amb: 0.13,
      heads: [{ at: 'calc:0', big: '59:56', bigAt: 'calc:2', c: 'ink', sub: '40 km at 250 W', subAt: 'calc:0' }, { at: 'ten:0', big: '52 s', bigAt: 'ten:2', sub: 'faster with just 10 W more', subAt: 'ten:0' }],
      lanes: [{ label: '250 W', v: 40.04, show: '59:56', showAt: 'calc:2', at: 'calc:0', c: 'ink' }, { label: '260 W', v: 40.63, show: '59:04', showAt: 'ten:2', at: 'ten:0', c: 'pu' }],
      start: 'calc:1', end: 'ten:2+0.3', finish: '40 km', gap: { text: '52 s behind' } },
    rule: { type: 'rows', amb: 0.2,
      heads: [{ at: 'rule:0', label: 'RULE OF THUMB', big: '1 W ~ 5 s', bigAt: 'rule:1', c: 'ink' }, { at: 'aero:0', title: 'The trick', sub: "you don't have to pedal those watts", subAt: 'aero:1' }],
      rows: [{ label: '1 watt more', value: 5.2, left: '~5 s', leftCap: 'OVER 40 KM', at: 'rule:1', leftAt: 'rule:2', c: 'ink' }, { label: 'Hand-sized patch less drag', value: 46, left: '46 s', leftCap: 'OVER 40 KM', at: 'aero:3', leftAt: 'aero:5', c: 'pu', right: '8.5 W', rightCap: 'FOR FREE' }] },
    tip: { type: 'text', amb: 0.3, cy: 880,
      items: [{ t: 'Tiny aero gain?', at: 'tip:1', size: 64 }, { t: 'watts × 5', at: 'tip:4', big: true, size: 150 }, { t: '= seconds over 40 km', at: 'tip:4', dt: 0.3, size: 46, c: 'muted', gap: 10 }] }
  },
  facts: P => [
    ['40 km na 250 W, CdA 0,25, s (59:56)', P.time(250, 40), 3596, 1],
    ['40 km na 260 W, s (59:04)', P.time(260, 40), 3544, 1],
    ['rozdíl, s', P.time(250, 40) - P.time(260, 40), 52, 0.5],
    ['sekund na 1 W', (P.time(250, 40) - P.time(260, 40)) / 10, 5, 0.3],
    ['0,01 m² CdA na 40 km, s', P.time(250, 40) - P.time(250, 40, { cda: 0.24 }), 46, 0.5],
    ['0,01 m² CdA při 40 km/h, W', P.watts(40) - P.watts(40, { cda: 0.24 }), 8.5, 0.06]
  ]
};
