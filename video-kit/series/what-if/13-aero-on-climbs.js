module.exports = {
  title: 'what-if-aero-on-climbs',
  about: 'I do kopce jde část výkonu na vzduch: na 5% stoupání asi 11 %. Kompaktní pozice ušetří 39 s na 10 km.',
  acts: [['hook', 'hook'], ['share', 'myth', 'share'], ['race', 'gain', 'kilo'], ['tip', 'tip']],
  lines: {
    hook: { say: "What if aero still matters when you're climbing at seventeen kilometers per hour?", captions: false,
      chunks: ['What if', ['aero still matters', 'AERO|ARROW'], "when you're climbing", ['at 17 km/h?', 'AT']] },
    myth: { say: "Everyone says: uphill, it's all about weight. Not quite.",
      chunks: ['Everyone says:', 'uphill,', ["it's all about weight.", "IT'S|ITS"], 'Not quite.'] },
    share: { say: 'On a five percent climb at two hundred fifty watts, the air still takes eleven percent of your power.',
      chunks: [['On a 5% climb', 'ON'], ['at 250 watts,', 'AT'], 'the air still takes', ['11%', 'ELEVEN'], 'of your power.'] },
    gain: { say: 'Ride it sitting tall, then again with bent elbows and a flat back: thirty-nine seconds faster over ten kilometers!',
      chunks: ['Ride it', 'sitting tall,', 'then again', 'with bent elbows', 'and a flat back:', ['39 seconds faster', 'THIRTY'], ['over 10 km!', 'OVER']] },
    kilo: { say: "To gain that with weight, you'd have to lose more than two kilos.",
      chunks: ['To gain that', 'with weight,', ["you'd have to lose", "YOU'D"], ['more than 2 kilos.', 'MORE']] },
    tip: { say: "So on steady climbs, don't sit up like a sail. Stay compact.",
      chunks: ['So on steady climbs,', "don't sit up", 'like a sail.', 'Stay compact.'] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'aero still matters', i: 1 }, { t: "when you're climbing", i: 2 }, { t: 'at 17 km/h?', i: 3, big: true, size: 120 }] },
    share: { type: 'rows', amb: 0.2,
      heads: [{ at: 'myth:1', title: 'Uphill = weight?', sub: 'not quite', subAt: 'myth:3' }, { at: 'share:0', label: '5% CLIMB · 250 W', big: '11%', bigAt: 'share:3', sub: 'of your power still fights air', subAt: 'share:4' }],
      rows: [{ label: 'Gravity and rolling', value: 89, left: '#%', lc: [0, 89, 0], at: 'myth:1', leftAt: 'share:2', c: 'ink' }, { label: 'Air', value: 11, left: '#%', lc: [0, 11, 0], at: 'myth:2', leftAt: 'share:3', c: 'pu' }] },
    race: { type: 'race', amb: 0.13, tilt: 5,
      heads: [{ at: 'gain:0', big: '5% climb', c: 'ink', sub: '10 km · same 250 W' }, { at: 'gain:5', big: '39 s', sub: 'faster over 10 km' }, { at: 'kilo:0', title: 'Or lose', big: '2+ kilos', bigAt: 'kilo:3' }],
      lanes: [{ label: [['Sitting tall', 'c'], ['  ·  CdA 0.40', 'muted']], v: 17.51, show: '17.5 km/h', at: 'gain:0', c: 'ink' }, { label: [['Compact', 'c'], ['  ·  CdA 0.32', 'muted']], v: 17.85, show: '17.9 km/h', at: 'gain:2', c: 'pu' }],
      start: 'gain:3', end: 'gain:5+0.3', finish: '10 km', gap: { text: '39 s behind' } },
    tip: { type: 'rider', amb: 0.16, pose: { back: ['tip:3', 0, 0.6], elbows: 'tip:3' },
      heads: [{ at: 'tip:1', title: "Don't sit up", big: 'like a sail', bigAt: 'tip:2', c: 'ink' }, { at: 'tip:3', big: 'Stay compact' }] }
  },
  facts: P => [
    ['250 W na 5% stoupání, CdA 0,40, km/h', P.kmh(250, { cda: 0.40, grade: 0.05 }), 17.5, 0.05],
    ['250 W na 5% stoupání, CdA 0,32, km/h', P.kmh(250, { cda: 0.32, grade: 0.05 }), 17.9, 0.06],
    ['podíl vzduchu na 5% stoupání, CdA 0,40, %', P.airShare(P.kmh(250, { cda: 0.40, grade: 0.05 }), { cda: 0.40, grade: 0.05 }) * 100, 11, 0.5],
    ['rozdíl času na 10 km, s', P.time(250, 10, { cda: 0.40, grade: 0.05 }) - P.time(250, 10, { cda: 0.32, grade: 0.05 }), 39, 0.6],
    ['pro srovnání: 2 kg méně dají jen tolik sekund', P.time(250, 10, { cda: 0.40, grade: 0.05 }) - P.time(250, 10, { cda: 0.40, grade: 0.05, m: 82 }), 35, 0.5]
  ]
};
