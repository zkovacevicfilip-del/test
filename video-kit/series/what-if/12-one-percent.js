module.exports = {
  title: 'what-if-one-percent',
  about: 'Stoupání jen 1 % skoro není vidět, ale při 35 km/h stojí 82 W navíc. Proto někdy „rovina“ nejede.',
  acts: [['hook', 'hook'], ['cost', 'cost', 'from'], ['drop', 'or'], ['tip', 'why', 'tip']],
  lines: {
    hook: { say: 'What if the road tilts up by just one percent? You can barely see it.', captions: false,
      chunks: ['What if', 'the road tilts up', ['by just 1%?', 'BY'], 'You can barely', 'see it.'] },
    cost: { say: 'But at thirty-five kilometers per hour, it costs you eighty-two more watts!',
      chunks: [['But at 35 km/h,', 'BUT'], ['it costs you', 'IT'], ['82 more watts!', 'EIGHTY']] },
    from: { say: 'One hundred seventy-five watts becomes two hundred fifty-seven.',
      chunks: [['175 watts', 'ONE|A'], 'becomes', ['257.', 'TWO']] },
    or: { say: 'Hold two hundred fifty watts instead, and you drop from forty to thirty-four and a half kilometers per hour.',
      chunks: [['Hold 250 watts', 'HOLD'], 'instead,', 'and you drop', ['from 40', 'FROM'], ['to 34.5 km/h.', 'TO']] },
    why: { say: "Lifting your weight uphill is brutal, even on a slope you can't see.",
      chunks: ['Lifting your weight', 'uphill', 'is brutal,', 'even on a slope', "you can't see."] },
    tip: { say: "So when a flat road feels slow for no reason, it's probably not you. It's the road.",
      chunks: ['So when a flat road', 'feels slow', 'for no reason,', ["it's probably", "IT'S|ITS"], 'not you.', ["It's the road.", "IT'S|ITS"]] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'the road tilts up', i: 1 }, { t: 'just 1%?', i: 2, big: true, size: 180 }, { t: 'You can barely see it.', i: 3, size: 50, c: 'muted', gap: 20 }] },
    cost: { type: 'bars', amb: 0.2,
      heads: [{ at: 'cost:0', label: 'AT 35 KM/H', big: '+82 W', bigAt: 'cost:2', sub: 'for a slope you can barely see', subAt: 'from:0' }],
      bars: [{ label: 'Flat', value: 175, show: '# W', at: 'cost:0', numAt: 'from:0', c: 'ink' }, { label: '1% uphill', value: 257, show: '# W', at: 'cost:1', numAt: 'from:2', c: 'pu' }] },
    drop: { type: 'rows', amb: 0.2,
      heads: [{ at: 'or:2', big: '−5.5 km/h', sub: 'same power · 1% uphill' }],
      rows: [{ label: 'Flat road', note: '250 W', value: 40.0, left: '40.0 km/h', at: 'or:0', leftAt: 'or:3', c: 'ink' }, { label: '1% uphill', note: '250 W', value: 34.5, left: '34.5 km/h', at: 'or:1', leftAt: 'or:4', c: 'pu' }] },
    tip: { type: 'text', amb: 0.2, cy: 800,
      items: [{ t: 'Feels slow', at: 'tip:1', size: 84 }, { t: 'for no reason?', at: 'tip:2', size: 56, c: 'muted' }, { t: "It's the road.", at: 'tip:5', big: true, size: 120, gap: 20 }],
      heads: [{ at: 'why:0', title: 'Lifting your weight', big: 'is brutal', bigAt: 'why:2', out: 'tip-0.2' }],
      draw: function (t, a, dy) {
        // silnice ve skutečném sklonu 1 %: skoro není vidět, stejně jako na kole
        const t0 = TR('why:0'), y = 1230 + dy, k = tw(t, t0, 1.2, E.quint), al = clamp((t - t0) / 0.2), sc = 0.5;
        if (al <= 0) return;
        ctx.save(); ctx.globalAlpha *= al; ctx.translate(540, y); ctx.rotate(-Math.atan(0.01));
        ctx.strokeStyle = C.line2; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-410, 0); ctx.lineTo(410, 0); ctx.stroke();
        ctx.drawImage(riderImg, lerp(-380, -60, k) - 429 * sc + 215, -4 - 414 * sc, 512 * sc, 512 * sc); ctx.restore();
        const p = popS(t, TR('why:3'), null); pill('1% slope', 800, y - 100, { a: p.a, s: p.s, size: 36, bg: C.ink, c: C.bg, ls: 0 });
      } }
  },
  facts: P => [
    ['35 km/h po rovině, CdA 0,25, W', P.watts(35), 175, 0.6],
    ['35 km/h do stoupání 1 %, W', P.watts(35, { grade: 0.01 }), 257, 0.6],
    ['rozdíl, W', P.watts(35, { grade: 0.01 }) - P.watts(35), 82, 0.6],
    ['250 W do stoupání 1 %, km/h', P.kmh(250, { grade: 0.01 }), 34.5, 0.06],
    ['pokles rychlosti, km/h', P.kmh(250) - P.kmh(250, { grade: 0.01 }), 5.5, 0.06]
  ]
};
