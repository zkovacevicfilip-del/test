module.exports = {
  title: 'what-if-double-power',
  about: 'Dvojnásobný výkon nedá dvojnásobnou rychlost, jen asi o 29 % víc. Na dvojnásobnou rychlost je potřeba 7× víc wattů.',
  acts: [['hook', 'hook'], ['bars', 'no', 'five', 'pct'], ['cube', 'cube'], ['tip', 'tip']],
  lines: {
    hook: { say: 'What if you doubled your power? Would you go twice as fast?', captions: false,
      chunks: ['What if', 'you doubled', 'your power?', 'Would you go', 'twice as fast?'] },
    no: { say: 'Not even close. Two hundred fifty watts gives you forty kilometers per hour.',
      chunks: ['Not even close.', ['250 watts', 'TWO'], 'gives you', ['40 km/h.', 'FORTY']] },
    five: { say: 'Five hundred watts? Only fifty-one and a half.',
      chunks: [['500 watts?', 'FIVE'], ['Only 51.5.', 'ONLY']] },
    pct: { say: 'Double the power: not even thirty percent more speed.',
      chunks: ['Double the power:', ['not even 30%', 'NOT'], 'more speed.'] },
    cube: { say: "Because the power to push air grows with speed, cubed. To really double your speed, you'd need seven times the power!",
      chunks: ['Because the power', 'to push air', 'grows with speed,', 'cubed.', 'To really double', 'your speed,', ["you'd need 7×", "YOU'D"], 'the power!'] },
    tip: { say: 'So stop chasing watts alone. Cutting your drag is the cheaper way to go faster.',
      chunks: ['So stop chasing', 'watts alone.', 'Cutting your drag', 'is the cheaper way', 'to go faster.'] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'you doubled', i: 1 }, { t: 'your power?', i: 2, big: true, size: 120 }, { t: 'Twice as fast?', i: 3, size: 60, gap: 30 }] },
    bars: { type: 'bars', amb: 0.2,
      heads: [{ at: 'no:0', title: 'Twice as fast?', sub: 'not even close' }, { at: 'pct:1', big: '+29%', sub: 'more speed for 2× the power' }],
      bars: [{ label: '250 W', value: 40.0, show: '# km/h', dec: 1, at: 'no:1', numAt: 'no:3', c: 'ink' }, { label: '500 W', value: 51.5, show: '# km/h', dec: 1, at: 'five:0', numAt: 'five:1', c: 'pu' }] },
    cube: { type: 'curve', amb: 0.2, pow: 3, at: 'cube:2-0.15',
      heads: [{ at: 'cube:0', title: 'Power to push air', big: 'speed³', bigAt: 'cube:3' }, { at: 'cube:4', title: 'To double your speed', big: '7× power', bigAt: 'cube:6' }],
      points: [{ k: 0.5, at: 'cube:4', pill: '1×', xl: '1× speed' }, { k: 1, at: 'cube:6', pill: '7×', c: 'pu', xl: '2× speed', dx: -96, dy: -4 }] },
    tip: { type: 'rider', amb: 0.16, pose: { back: 'tip:2', elbows: 'tip:2+0.3', head: 'tip:2+0.15' },
      heads: [{ at: 'tip:0', title: 'Stop chasing', big: 'watts alone', bigAt: 'tip:1', c: 'ink' }, { at: 'tip:2', title: 'Cheaper speed', big: 'Cut your drag' }] }
  },
  // styl 6 (vybraný autorem 17. 11. 2026) a úvodní nápis watt+IF místo what+IF
  style: { hook: 'watt', camera: 'drift', text: 'reveal', overlay: 'wipe', bg: 'paths' },
  facts: P => [
    ['250 W, CdA 0,25, km/h', P.kmh(250), 40.0, 0.05],
    ['500 W, km/h', P.kmh(500), 51.5, 0.05],
    ['o kolik procent rychleji', (P.kmh(500) / P.kmh(250) - 1) * 100, 29, 0.5],
    ['kolikrát víc wattů na dvojnásobnou rychlost', P.watts(2 * P.kmh(250)) / 250, 7, 0.15]
  ]
};
