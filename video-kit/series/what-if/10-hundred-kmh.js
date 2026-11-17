module.exports = {
  title: 'what-if-hundred-kmh',
  about: 'Na 100 km/h po rovině by silniční kolo potřebovalo asi 3 400 W. Rekord vozidla na lidský pohon je přesto 144 km/h, díky kapotáži.',
  acts: [['hook', 'hook'], ['need', 'need'], ['record', 'record', 'how'], ['tip', 'cube', 'tip']],
  lines: {
    hook: { say: 'What if you wanted to ride one hundred kilometers per hour on a flat road?', captions: false,
      chunks: ['What if', 'you wanted to ride', ['100 km/h', 'ONE'], 'on a flat road?'] },
    need: { say: "On a road bike, you'd need about three thousand four hundred watts. No human can hold that.",
      chunks: ['On a road bike,', ["you'd need", "YOU'D"], ['about 3,400 watts.', 'ABOUT'], 'No human', 'can hold that.'] },
    record: { say: 'But the human-powered record is one hundred forty-four kilometers per hour!',
      chunks: ['But the', ['human-powered record', 'HUMAN|HUMAN-POWERED'], ['is 144 km/h!', 'IS']] },
    how: { say: 'Same kind of legs. The trick? A smooth shell around the rider, shaped like a teardrop.',
      chunks: ['Same kind of legs.', 'The trick?', 'A smooth shell', 'around the rider,', 'shaped like', 'a teardrop.'] },
    cube: { say: 'Because at speed, almost all your power goes into pushing air.',
      chunks: ['Because at speed,', 'almost all', 'your power', 'goes into', 'pushing air.'] },
    tip: { say: "You can't ride in a shell. But the lesson is the same: shape beats power.",
      chunks: ["You can't ride", 'in a shell.', 'But the lesson', 'is the same:', 'shape beats power.'] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'you wanted to ride', i: 1 }, { t: '100 km/h', i: 2, big: true, size: 180 }, { t: 'on a flat road?', i: 3, size: 54, c: 'muted', gap: 20 }] },
    need: { type: 'bars', amb: 0.2,
      heads: [{ at: 'need:0', label: 'ROAD BIKE · FLAT ROAD', big: '3,400 W', bigAt: 'need:2', sub: 'no human can hold that', subAt: 'need:3' }],
      bars: [{ label: '40 km/h', value: 249, show: '250 W', at: 'need:0', c: 'ink' }, { label: '100 km/h', value: 3403, show: '# W', at: 'need:1', numAt: 'need:2', c: 'pu' }] },
    record: { type: 'flow', amb: 0.2, panels: [{ flow: 'drop', cy: 960, h: 441 }],
      heads: [{ at: 'record:1', title: 'Human-powered record', big: '144 km/h', bigAt: 'record:2' }, { at: 'how:1', title: 'The trick', big: 'a smooth shell', bigAt: 'how:2' }],
      pills: [{ text: 'shaped like a teardrop', x: 540, y: 1250, at: 'how:4', c: 'ink' }] },
    tip: { type: 'rider', amb: 0.16, pose: { back: 'tip:4', elbows: 'tip:4+0.3', head: 'tip:4+0.15' },
      heads: [{ at: 'cube:0', title: 'At speed', big: "it's all air", bigAt: 'cube:1' }, { at: 'tip:2', title: 'Shape', big: 'beats power', bigAt: 'tip:4' }] }
  },
  facts: P => [
    ['100 km/h po rovině, CdA 0,25, W', P.watts(100), 3400, 10],
    ['40 km/h, CdA 0,25, W', P.watts(40), 250, 1.5]
  ],
  sources: 'Rekord vozidla na lidský pohon: 144,17 km/h, Todd Reichert, Aerovelo Eta (plně kapotované lehokolo), Battle Mountain, 17. 9. 2016 (IHPVA).'
};
