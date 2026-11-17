module.exports = {
  title: 'what-if-perfect-bike',
  about: 'I kolo s nulovým odporem by pomohlo jen částečně: asi 70 % odporu dělá jezdec. Pozice je důležitější než kolo.',
  acts: [['hook', 'hook'], ['gain', 'gain'], ['split', 'but', 'real', 'you'], ['tip', 'tip']],
  lines: {
    hook: { say: 'What if you bought a bike with zero drag? The perfect aero bike.', captions: false,
      chunks: ['What if', 'you bought a bike', 'with zero drag?', 'The perfect', ['aero bike.', 'AERO|ARROW']] },
    gain: { say: "You'd go from thirty-eight to just over forty-two kilometers per hour. Nice!",
      chunks: [["You'd go", "YOU'D"], ['from 38', 'FROM'], ['to just over 42 km/h.', 'TO'], 'Nice!'] },
    but: { say: "But that bike doesn't exist. And even if it did: about seventy percent of the drag isn't the bike. It's you.",
      chunks: ['But that bike', "doesn't exist.", 'And even if it did:', ['about 70%', 'ABOUT'], 'of the drag', "isn't the bike.", ["It's you.", "IT'S|ITS"]] },
    real: { say: "A real aero bike only trims a slice of the bike's thirty percent.",
      chunks: ['A real', ['aero bike', 'AERO|ARROW'], 'only trims a slice', ["of the bike's 30%.", 'OF']] },
    you: { say: "Your position works on the big seventy. And it's free.",
      chunks: ['Your position', 'works on', ['the big 70.', 'THE'], ["And it's free.", 'AND']] },
    tip: { say: 'So fix the rider first. Then go shopping.',
      chunks: ['So fix the rider', 'first.', 'Then go shopping.'] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'you bought a bike', i: 1 }, { t: 'with zero drag?', i: 2, big: true, size: 100 }, { t: 'The perfect aero bike.', i: 3, size: 50, c: 'muted' }] },
    gain: { type: 'bars', amb: 0.2, max: 50,
      heads: [{ at: 'gain:0', label: 'SAME 250 W', big: '+4.5 km/h', bigAt: 'gain:2', sub: 'with a bike that has no drag at all', subAt: 'gain:3' }],
      bars: [{ label: 'Your bike', value: 37.8, show: '# km/h', dec: 1, at: 'gain:1', c: 'ink' }, { label: 'Zero-drag bike', value: 42.3, show: '# km/h', dec: 1, at: 'gain:2', c: 'pu' }] },
    split: { type: 'rows', amb: 0.2, max: 100,
      heads: [{ at: 'but:0', title: "It doesn't exist" }, { at: 'but:5', title: 'Most of the drag', big: 'is you', bigAt: 'but:6' }, { at: 'real:0', title: 'A real aero bike', sub: "trims a slice of the bike's 30%", subAt: 'real:2' }, { at: 'you:0', title: 'Your position', big: 'works on the 70%', bigAt: 'you:2' }],
      rows: [{ label: 'The bike', value: 30, left: '~30%', leftCap: 'OF THE DRAG', at: 'but:3', leftAt: 'but:4+0.3', c: 'ink' }, { label: 'You', value: 70, left: '~70%', leftCap: 'OF THE DRAG', at: 'but:3', leftAt: 'but:3+0.2', c: 'pu' }] },
    tip: { type: 'rider', amb: 0.16, pose: { back: 'tip:0', elbows: 'tip:0+0.3', head: 'tip:0+0.15' },
      heads: [{ at: 'tip:0', title: 'Fix the rider', big: 'first', bigAt: 'tip:1' }, { at: 'tip:2', title: 'Then go shopping' }] }
  },
  facts: P => [
    ['250 W, CdA 0,30 (jezdec + kolo), km/h', P.kmh(250, { cda: 0.30 }), 37.8, 0.05],
    ['250 W, CdA 0,21 (jen jezdec, 70 %), km/h', P.kmh(250, { cda: 0.21 }), 42.3, 0.05],
    ['rozdíl, km/h', P.kmh(250, { cda: 0.21 }) - P.kmh(250, { cda: 0.30 }), 4.5, 0.06]
  ],
  sources: 'Podíl jezdce na odporu jezdce s kolem asi 70 % (Kyle a Burke 1984; novější zdroje uvádějí 60 až 80 %).'
};
