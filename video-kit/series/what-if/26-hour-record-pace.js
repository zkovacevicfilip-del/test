module.exports = {
  title: 'what-if-hour-record-pace',
  about: 'Tempo hodinového rekordu (56,8 km/h) by v dobré silniční pozici stálo asi 660 W. Rekord stojí na malém odporu, ne jen na nohách.',
  acts: [['hook', 'hook'], ['pace', 'rec', 'need'], ['you', 'you', 'gap', 'how'], ['tip', 'tip']],
  lines: {
    hook: { say: 'What if you tried to ride at hour record pace on your own bike?', captions: false,
      chunks: ['What if', 'you tried to ride', 'at hour record pace', 'on your own bike?'] },
    rec: { say: 'The record is fifty-six point eight kilometers in one hour.',
      chunks: ['The record is', ['56.8 km', 'FIFTY'], 'in one hour.'] },
    need: { say: 'In a good road position, holding that speed takes about six hundred sixty watts.',
      chunks: ['In a good', 'road position,', 'holding that speed', ['takes about 660 watts.', 'TAKES']] },
    you: { say: "With two hundred fifty watts, you'd cover forty kilometers.",
      chunks: [['With 250 watts,', 'WITH'], ["you'd cover", "YOU'D"], ['40 kilometers.', 'FORTY']] },
    gap: { say: 'Almost seventeen kilometers short.',
      chunks: [['Almost 17 km', 'ALMOST'], 'short.'] },
    how: { say: "The record isn't just legs. It's a position and a bike built to slice through the air.",
      chunks: ['The record', "isn't just legs.", ["It's a position", "IT'S|ITS"], 'and a bike', 'built to slice', 'through the air.'] },
    tip: { say: 'Power gets you fit. Shape makes you fast.',
      chunks: ['Power', 'gets you fit.', 'Shape', 'makes you fast.'] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'you tried to ride', i: 1 }, { t: 'hour record pace', i: 2, big: true, size: 96 }, { t: 'on your own bike?', i: 3, size: 54, c: 'muted' }] },
    pace: { type: 'bars', amb: 0.2,
      heads: [{ at: 'rec:0', label: 'HOUR RECORD · 2022', big: '56.8 km', bigAt: 'rec:1' }, { at: 'need:0', label: 'IN A GOOD ROAD POSITION', big: '660 W', bigAt: 'need:3' }],
      bars: [{ label: 'You', cap: '40 KM/H', value: 250, show: '250 W', at: 'rec:0', c: 'ink' }, { label: 'Record pace', cap: '56.8 KM/H', value: 659, show: '# W', at: 'need:0', numAt: 'need:3', c: 'pu' }] },
    you: { type: 'race', amb: 0.13,
      heads: [{ at: 'you:0', big: '250 W', c: 'ink', sub: 'your hour' }, { at: 'gap:0', big: '−16.8 km', sub: 'short of the record' }, { at: 'how:0', title: 'Not just legs', big: 'less drag', bigAt: 'how:2' }],
      lanes: [{ label: [['You', 'c'], ['  ·  250 W', 'muted']], p: 40.0, show: '40.0 km', showAt: 'you:2', at: 'you:0', c: 'ink' }, { label: 'Record', p: 56.8, show: '56.8 km', showAt: 'you:2', at: 'you:0+0.12', c: 'pu' }],
      start: 'you:1', end: 'gap:0+0.3', finish: '1 hour', gap: { text: '16.8 km behind', at: 'gap:0' } },
    tip: { type: 'rider', amb: 0.16, pose: { back: 'tip:2', elbows: 'tip:2+0.3', head: 'tip:2+0.15' },
      heads: [{ at: 'tip:0', title: 'Power', big: 'gets you fit', bigAt: 'tip:1', c: 'ink' }, { at: 'tip:2', title: 'Shape', big: 'makes you fast', bigAt: 'tip:3' }] }
  },
  facts: P => [
    ['56,792 km/h v silniční pozici (CdA 0,25), W', P.watts(56.792), 660, 1.5],
    ['hodina na 250 W, km', P.kmh(250), 40.0, 0.05],
    ['kolik chybí do rekordu, km', 56.792 - P.kmh(250), 16.8, 0.06]
  ],
  sources: 'Hodinový rekord UCI: 56,792 km, Filippo Ganna, Grenchen, 8. 10. 2022. Odhad 660 W platí pro silniční pozici na silnici u hladiny moře; rekord se jel na dráze v časovkářské pozici s mnohem menším odporem.'
};
