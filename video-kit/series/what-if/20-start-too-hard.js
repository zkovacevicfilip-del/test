module.exports = {
  title: 'what-if-start-too-hard',
  about: 'Stejný průměrný výkon, ale nerovnoměrně: jezdec, který začne na 300 W a spadne na 200 W, ujede za hodinu o 211 m méně.',
  acts: [['hook', 'hook'], ['race', 'setup', 'a', 'result'], ['why', 'why', 'tip']],
  lines: {
    hook: { say: 'What if starting too hard costs you, even when your average power is the same?', captions: false,
      chunks: ['What if', 'starting too hard', ['costs you,', 'COSTS|COST'], 'even when your', 'average power', 'is the same?'] },
    setup: { say: 'Two riders, one hour, both average two hundred fifty watts.',
      chunks: ['Two riders,', 'one hour,', 'both average', ['250 watts.', 'TWO']] },
    a: { say: 'One holds it steady. The other rides three hundred for half an hour, then fades to two hundred.',
      chunks: ['One holds it', 'steady.', 'The other rides', ['300 for half an hour,', 'THREE'], 'then fades', ['to 200.', 'TO']] },
    result: { say: 'The steady rider finishes over two hundred meters ahead!',
      chunks: ['The steady rider', 'finishes', ['over 200 meters', 'OVER'], 'ahead!'] },
    why: { say: 'Because going faster costs more than going slower saves. The air punishes every surge.',
      chunks: ['Because going faster', ['costs more', 'COSTS|COST'], 'than going slower', 'saves.', 'The air punishes', 'every surge.'] },
    tip: { say: 'So on flat roads, pace it evenly. Smooth power is free speed.',
      chunks: ['So on flat roads,', 'pace it evenly.', 'Smooth power', 'is free speed.'] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'starting too hard', i: 1 }, { t: 'costs you,', i: 2, big: true, size: 130 }, { t: 'even at the same', i: 3, size: 50, c: 'muted' }, { t: 'average power?', i: 4, size: 50, c: 'muted' }] },
    race: { type: 'race', amb: 0.13,
      heads: [{ at: 'setup:3', big: '250 W', c: 'ink', sub: 'average power · both riders', subAt: 'setup:2' }, { at: 'result:2', big: '211 m', sub: 'ahead after one hour' }],
      lanes: [{ label: [['Fades', 'c'], ['  ·  300 → 200 W', 'muted']], p: 39.83, show: '39.8 km', showAt: 'result:2', at: 'setup:0', labAt: 'a:2', c: 'ink' }, { label: [['Steady', 'c'], ['  ·  250 W', 'muted']], p: 40.04, show: '40.0 km', showAt: 'result:2', at: 'setup:0+0.12', labAt: 'a:0', c: 'pu' }],
      start: 'a:3', end: 'result:2', finish: '1 hour', finishAt: 'setup:1', gap: { text: '211 m behind' } },
    why: { type: 'curve', amb: 0.2, pow: 3, at: 'why:0',
      heads: [{ at: 'why:0', title: 'Surges cost more', sub: 'than easing off saves', subAt: 'why:2' }, { at: 'tip:1', title: 'Pace it evenly', big: 'free speed', bigAt: 'tip:3' }] }
  },
  facts: P => [
    ['hodina na 250 W, CdA 0,25, km', P.speed(250) * 3.6, 40.0, 0.05],
    ['půl hodiny na 300 W a půl hodiny na 200 W, km', (P.speed(300) + P.speed(200)) * 1.8, 39.8, 0.04],
    ['rozdíl, m', P.speed(250) * 3600 - (P.speed(300) + P.speed(200)) * 1800, 211, 1]
  ],
  sources: 'Čistá fyzika ustálené jízdy po rovině: nepočítá se zrychlování ani únava (ta by rozdíl ještě zvětšila).'
};
