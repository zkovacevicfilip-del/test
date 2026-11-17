module.exports = {
  title: 'what-if-slow-riders-gain-more',
  about: 'Aerodynamika není jen pro rychlé: stejná změna pozice ušetří na 100 km pomalejšímu jezdci víc času než rychlému.',
  acts: [['hook', 'hook'], ['share', 'myth', 'share'], ['gain', 'gain', 'slow'], ['tip', 'tip', 'tip2']],
  lines: {
    hook: { say: 'What if aero helps slow riders more than fast ones?', captions: false,
      chunks: ['What if', ['aero helps', 'AERO|ARROW'], 'slow riders', 'more than', 'fast ones?'] },
    myth: { say: 'People say aero only matters at race speed. Wrong!',
      chunks: ['People say', ['aero only matters', 'AERO|ARROW'], 'at race speed.', 'Wrong!'] },
    share: { say: 'Even at thirty kilometers per hour, about eighty percent of your effort goes into the air.',
      chunks: [['Even at 30 km/h,', 'EVEN'], ['about 80%', 'ABOUT'], 'of your effort', 'goes into the air.'] },
    gain: { say: 'Take the same position change. Over a hundred kilometers, a three hundred watt rider saves under six minutes.',
      chunks: ['Take the same', 'position change.', ['Over 100 km,', 'OVER'], ['a 300 watt rider', 'A|THREE'], ['saves under 6 minutes.', 'SAVES']] },
    slow: { say: 'A one hundred fifty watt rider saves over seven!',
      chunks: [['A 150 watt rider', 'A|ONE'], ['saves over 7!', 'SAVES']] },
    tip: { say: 'Slower riders spend more time out there. So every bit of drag costs them longer.',
      chunks: ['Slower riders', 'spend more time', 'out there.', 'So every bit of drag', ['costs them longer.', 'COSTS|COST']] },
    tip2: { say: "Aero isn't just for racers. It's for everyone who rides.",
      chunks: [["Aero isn't just", 'AERO|ARROW'], 'for racers.', ["It's for everyone", "IT'S|ITS"], 'who rides.'] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'aero helps', i: 1 }, { t: 'slow riders', i: 2, big: true, size: 120 }, { t: 'more than fast ones?', i: 3 }] },
    share: { type: 'rider', amb: 0.16, ghost: false, fillAt: 'share:1',
      heads: [{ at: 'myth:0', title: 'Only at race speed?', big: 'Wrong', bigAt: 'myth:3' }, { at: 'share:0', label: 'AT 30 KM/H', big: '~80%', bigAt: 'share:1', sub: 'of your effort goes into the air', subAt: 'share:2' }] },
    gain: { type: 'bars', amb: 0.2, max: 9,
      heads: [{ at: 'gain:0', label: 'SAME POSITION CHANGE · 100 KM', big: 'Time saved', bigAt: 'gain:2', c: 'ink' }],
      bars: [{ label: '300 W rider', value: 5.8, show: '# min', dec: 1, at: 'gain:3', numAt: 'gain:4', c: 'ink' }, { label: '150 W rider', value: 7.3, show: '# min', dec: 1, at: 'slow:0', numAt: 'slow:1', c: 'pu' }] },
    tip: { type: 'text', amb: 0.3, cy: 880,
      items: [{ t: 'Slower riders', at: 'tip:0', size: 64 }, { t: 'more time out there', at: 'tip:1', size: 50, c: 'muted' }, { t: 'Aero is for', at: 'tip2:0', size: 64, gap: 40 }, { t: 'everyone', at: 'tip2:2', big: true, size: 150 }] }
  },
  facts: P => [
    ['100 km, 300 W: úspora při změně CdA 0,36 → 0,32, minut', (P.time(300, 100, { cda: 0.36 }) - P.time(300, 100, { cda: 0.32 })) / 60, 5.8, 0.06],
    ['100 km, 150 W: úspora při stejné změně, minut', (P.time(150, 100, { cda: 0.36 }) - P.time(150, 100, { cda: 0.32 })) / 60, 7.3, 0.06],
    ['podíl vzduchu při 30 km/h, CdA 0,36, % (ve videu „about 80 %“)', P.airShare(30, { cda: 0.36 }) * 100, 82, 0.6]
  ]
};
