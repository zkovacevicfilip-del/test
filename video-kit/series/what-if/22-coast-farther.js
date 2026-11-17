module.exports = {
  title: 'what-if-coast-farther',
  about: 'Dojezd bez šlapání ze 40 na 20 km/h: vzpřímeně 218 m, ve skrčené pozici 283 m. Tak se dá pozice testovat bez tunelu.',
  acts: [['hook', 'hook'], ['roll', 'up', 'tuck'], ['why', 'why', 'tip']],
  lines: {
    hook: { say: 'What if you stopped pedaling at forty kilometers per hour? How far would you roll?', captions: false,
      chunks: ['What if', 'you stopped pedaling', ['at 40 km/h?', 'AT'], 'How far', 'would you roll?'] },
    up: { say: "Sitting up, you're down to twenty after two hundred eighteen meters.",
      chunks: ['Sitting up,', ["you're down to 20", "YOU'RE|YOUR"], ['after 218 meters.', 'AFTER']] },
    tuck: { say: 'In a tuck, you roll two hundred eighty-three. Sixty-five meters farther, for nothing!',
      chunks: ['In a tuck,', 'you roll', ['283.', 'TWO'], ['65 meters farther,', 'SIXTY'], 'for nothing!'] },
    why: { say: 'The only difference is how much air you have to push out of the way.',
      chunks: ['The only difference', 'is how much air', 'you have to push', 'out of the way.'] },
    tip: { say: 'Try it on a safe, empty road. A coast-down like this is how riders test their position without a wind tunnel.',
      chunks: ['Try it on a safe,', 'empty road.', ['A coast-down', 'A|COAST|COASTDOWN'], 'like this', 'is how riders test', 'their position', 'without a wind tunnel.'] }
  },
  scenes: {
    hook: { type: 'hook', amb: 0.34, line: 'hook', items: [{ whatIf: true, i: 0 }, { t: 'you stopped pedaling', i: 1 }, { t: 'at 40 km/h?', i: 2, big: true, size: 120 }, { t: 'How far would you roll?', i: 3, size: 50, c: 'muted', gap: 20 }] },
    roll: { type: 'race', amb: 0.13, finish: false,
      heads: [{ at: 'up:0', label: 'COASTING FROM 40 TO 20 KM/H', big: '218 m', bigAt: 'up:2', c: 'ink' }, { at: 'tuck:2', label: 'IN A TUCK', big: '283 m' }, { at: 'tuck:3', big: '+65 m', sub: 'farther · for nothing', subAt: 'tuck:4' }],
      lanes: [{ label: [['Sitting up', 'c'], ['  ·  CdA 0.35', 'muted']], p: 218, show: '# m', cnt: [0, 218, 0], showAt: 'up:2', at: 'up:0', c: 'ink' }, { label: [['Tucked', 'c'], ['  ·  CdA 0.25', 'muted']], p: 283, show: '# m', cnt: [0, 283, 0], showAt: 'tuck:2', at: 'up:0+0.12', c: 'pu' }],
      start: 'up:1', end: 'tuck:2+0.4', gap: { text: '65 m behind', at: 'tuck:3' } },
    why: { type: 'rider', amb: 0.16, pose: { back: 1, elbows: 1, head: 1 },
      heads: [{ at: 'why:0', title: 'Only the air', sub: 'you push out of the way', subAt: 'why:1' }, { at: 'tip:2', title: 'Coast-down test', sub: 'a wind tunnel on an empty road', subAt: 'tip:4' }] }
  },
  facts: P => [
    ['dojezd ze 40 na 20 km/h, CdA 0,35, m', P.coast(40, 20, { cda: 0.35 }), 218, 1],
    ['dojezd ze 40 na 20 km/h, CdA 0,25, m', P.coast(40, 20, { cda: 0.25 }), 283, 1],
    ['rozdíl, m', P.coast(40, 20, { cda: 0.25 }) - P.coast(40, 20, { cda: 0.35 }), 65, 1]
  ],
  sources: 'Dojezdová zkouška (coast-down) je zavedená metoda měření odporu jezdce v terénu (přehled Crouch a kol. 2017, kapitola o měření).'
};
