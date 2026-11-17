module.exports = {
  title: 'what-if-five-kilos',
  about: 'O 5 kg méně: na rovině 12 s na 40 km, na 8% stoupání 2:40 na 10 km. Váha rozhoduje jen do kopce.',
  acts: [['hook', 'hook'], ['compare', 'flat', 'climb', 'same'], ['why', 'why'], ['tip', 'tip']],
  lines: {
    hook: { say: 'What if you lost five kilos? How much faster would you really be?', captions: false,
      chunks: ['What if', 'you lost', ['5 kilos?', 'FIVE'], 'How much faster', 'would you really be?'] },
    flat: { say: "On a flat forty kilometer ride: twelve seconds. That's all.",
      chunks: ['On a flat', ['40 km ride:', 'FORTY'], ['12 seconds.', 'TWELVE'], ["That's all.", "THAT'S"]] },
    climb: { say: 'On a ten kilometer climb at eight percent: two minutes and forty seconds!',
      chunks: [['On a 10 km climb', 'ON'], ['at 8%:', 'AT'], ['2 minutes', 'TWO'], ['and 40 seconds!', 'AND|FORTY']] },
    same: { say: 'Same rider, same power. Thirteen times the gain.',
      chunks: ['Same rider,', 'same power.', ['13 times', 'THIRTEEN'], 'the gain.'] },
    why: { say: "On the flat you fight air, and air doesn't care what you weigh. Uphill you fight gravity, and gravity cares a lot.",
      chunks: ['On the flat', 'you fight air,', "and air doesn't care", 'what you weigh.', 'Uphill', 'you fight gravity,', 'and gravity', 'cares a lot.'] },
    tip: { say: 'So pick your battle. Flat race? Work on your position. Mountain race? Then the scale matters.',
      chunks: ['So pick your battle.', 'Flat race?', 'Work on your position.', 'Mountain race?', 'Then the scale', 'matters.'] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'you lost', i: 1 }, { t: '5 kilos?', i: 2, big: true, size: 190 }, { t: 'How much faster?', i: 3, size: 54, c: 'muted', gap: 20 }] },
    compare: { type: 'rows', amb: 0.2,
      heads: [{ at: 'flat:0', label: 'SAME 250 W', big: '−5 kg', c: 'ink' }, { at: 'same:2', big: '13×', sub: 'the gain on the climb' }],
      rows: [{ label: 'Flat · 40 km', value: 12, left: '12 s', leftCap: 'FASTER WITH −5 KG', at: 'flat:0', leftAt: 'flat:2', c: 'ink' }, { label: 'Climb 8% · 10 km', value: 160, left: '2:40', leftCap: 'FASTER WITH −5 KG', at: 'climb:0', leftAt: 'climb:2', c: 'pu' }] },
    why: { type: 'text', amb: 0.3, cy: 880,
      items: [{ t: 'On the flat', at: 'why:0', plain: true, c: 'muted' }, { t: 'you fight air', at: 'why:1', big: true, size: 110, c: 'ink', gap: 50 }, { t: 'Uphill', at: 'why:4', plain: true, c: 'muted' }, { t: 'you fight gravity', at: 'why:5', big: true, size: 96 }] },
    tip: { type: 'rider', amb: 0.16, pose: { back: 'tip:2', elbows: 'tip:2+0.3', head: 'tip:2+0.15' },
      heads: [{ at: 'tip:1', title: 'Flat race?', big: 'Position', bigAt: 'tip:2' }, { at: 'tip:3', title: 'Mountain race?', big: 'The scale', bigAt: 'tip:4', c: 'ink' }] }
  },
  facts: P => [
    ['o 5 kg méně, rovina 40 km při 250 W, s', P.time(250, 40) - P.time(250, 40, { m: 79 }), 12, 0.5],
    ['o 5 kg méně, 8% stoupání 10 km při 250 W, s', P.time(250, 10, { grade: 0.08 }) - P.time(250, 10, { grade: 0.08, m: 79 }), 160, 1],
    ['kolikrát větší zisk do kopce', (P.time(250, 10, { grade: 0.08 }) - P.time(250, 10, { grade: 0.08, m: 79 })) / (P.time(250, 40) - P.time(250, 40, { m: 79 })), 13, 0.5]
  ]
};
