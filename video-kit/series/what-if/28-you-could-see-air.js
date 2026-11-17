module.exports = {
  title: 'what-if-you-could-see-air',
  about: 'Jak by vypadal vzduch, kdyby byl vidět: hladké proudění vpředu, víry a podtlak za zády. Úplav je většina odporu.',
  acts: [['hook', 'hook'], ['see', 'front', 'behind', 'most'], ['smooth', 'smooth'], ['tip', 'tip']],
  lines: {
    hook: { say: 'What if you could see the air you ride through?', captions: false,
      chunks: ['What if', 'you could see', 'the air', 'you ride through?'] },
    front: { say: "You'd see this. Smooth lines coming at you, splitting around your body.",
      chunks: [["You'd see this.", "YOU'D"], 'Smooth lines', 'coming at you,', 'splitting around', 'your body.'] },
    behind: { say: 'And behind you: chaos. A swirling, low-pressure wake that pulls you back.',
      chunks: ['And behind you:', 'chaos.', 'A swirling,', ['low-pressure wake', 'LOW'], 'that pulls you back.'] },
    most: { say: 'That mess is most of your drag. Not the air you hit: the hole you leave.',
      chunks: ['That mess', 'is most of your drag.', 'Not the air you hit:', 'the hole you leave.'] },
    smooth: { say: 'Now look at a smooth shape. The air closes behind it. Almost no wake.',
      chunks: ['Now look at', 'a smooth shape.', 'The air closes', 'behind it.', 'Almost no wake.'] },
    tip: { say: "You can't see it. But you can shrink it: flat back, head low, elbows in.",
      chunks: ["You can't see it.", 'But you can', 'shrink it:', 'flat back,', 'head low,', 'elbows in.'] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'you could see', i: 1 }, { t: 'the air', i: 2, big: true, size: 200 }, { t: 'you ride through?', i: 3 }] },
    see: { type: 'flow', amb: 0.2, panels: 'rider',
      boxes: [{ x: 738, y: 740, w: 218, h: 420, at: 'behind:1' }],
      pills: [{ text: 'LOW PRESSURE', x: 778, y: 690, at: 'behind:3', size: 36 }],
      heads: [{ at: 'front:0', title: "You'd see this", sub: 'smooth air, splitting around you', subAt: 'front:1' }, { at: 'behind:0', title: 'Behind you', big: 'chaos', bigAt: 'behind:1' }, { at: 'most:0', title: 'The hole you leave', sub: 'is most of your drag', subAt: 'most:1' }] },
    smooth: { type: 'flow', amb: 0.22, panels: 'shapes',
      heads: [{ at: 'smooth:1', title: 'Smooth shape', sub: 'the air closes behind it', subAt: 'smooth:2' }, { at: 'smooth:4', big: 'Almost no wake', size: 84 }] },
    tip: { type: 'rider', amb: 0.16, pose: { back: 'tip:3', head: 'tip:4', elbows: 'tip:5' },
      heads: [{ at: 'tip:0', title: "Can't see it", big: 'Shrink it', bigAt: 'tip:2', out: 'tip:3-0.15' }],
      checks: { items: [{ text: 'Flat back', at: 'tip:3' }, { text: 'Head low', at: 'tip:4' }, { text: 'Elbows in', at: 'tip:5' }] } }
  },
  facts: P => [],
  sources: 'Odpor jezdce je převážně tlakový, tedy z úplavu (přehled Crouch a kol. 2017). Proudění kolem jezdce a válce je simulace (LBM), kapka je idealizovaný model.'
};
