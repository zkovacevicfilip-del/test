// Realistický formát „ride“ s texty původní šablony What if (autor 22. 11. 2026): jeden jezdec v krajině za zlaté hodinky,
// ujíždějící asfalt, hlas Liam, nápis whatIF, nadpisy nahoře, titulky dole, plynulý průlet 3D kamery mezi akty, sytější barvy krajiny a nahoře bez malých popisků.
// Na konci „pošli kamarádovi a sleduj“ (karty přes krajinu, karta profilu wattIF).
const ride = function (t, a) {
  // pohled kamery, silnice a jezdec (popis musí být uvnitř funkce, do scenes.js se přenáší jen ona)
  const VIEW = { cam: { pos: [300, 380, 1250], look: [0, 175, -60], fov: 40 }, road: { lanes: [-260], z0: -700, z1: 900 }, riders: { A: { kit: 'purple', z: 60 } } };
  const T = r => TR(r);
  // kopec (8 %, v obraze 7°): při „climb“, rovina při „On the flat“, kopec při „Uphill“, rovina při radě, kopec při „Mountain race?“
  const ks = [[T('climb:0'), 1], [T('why:0'), -1], [T('why:4'), 1], [T('tip:0'), -1], [T('tip:3'), 1]];
  const hill = x => clamp(ks.reduce((s, k) => s + k[1] * tw(x, k[0], 1.0, E.io), 0));
  // ujetá dráha = součet rychlosti (rovina 40 km/h, kopec asi 15 km/h), ať asfalt při změně necukne dozadu
  let dist = 0; for (let x = 0; x < t; x += 0.05) dist += lerp(530, 190, hill(x)) * Math.min(0.05, t - x);
  const h = hill(t), pose = 0.85 * (1 - h);   // na rovině nízko a kompaktně, do kopce vzpřímeně; ruce pořád na základním řídítku
  const st = { dist, slope: 7 * h, riders: { A: { x: 0, pose, grip: 'base', crank: t * lerp(9.4, 8.6, h), wheel: dist / 71 } } };
  scene3d(VIEW, st, () => air3d('A', t, lerp(760, 300, h), lerp(0.4, 0.7, h), pose, 0.9));
  const tag = (s, at, out, c, size) => tag3d('A', pose, s, t, at, out, { c, size });
  tag('250 W · −5 kg', T('flat:0'), T('same$'), 'pu');
  // texty z původního videa (nadpisy scén rows, text a rider)
  classicUI(t, a, {
    hook: { line: 'hook', cy: 440, items: [{ whatIf: true, i: 0, size: 140 }, { t: 'you lost', i: 1, size: 56 }, { t: '5 kilos?', i: 2, big: true, size: 120, gap: 18 }, { t: 'How much faster?', i: 3, size: 56 }] },
    heads: {
      compare: [{ at: 'flat:0', label: 'FLAT · 40 KM', big: '12 s', bigAt: 'flat:2', c: 'ink', sub: 'faster with −5 kg', subAt: 'flat:2' }, { at: 'climb:0', label: 'CLIMB 8% · 10 KM', big: '2:40', bigAt: 'climb:2', sub: 'faster with −5 kg', subAt: 'climb:2' }, { at: 'same:2', big: '13×', sub: 'the gain on the climb' }],
      why: [{ at: 'why:0', title: 'On the flat', big: 'you fight air', bigAt: 'why:1', c: 'ink' }, { at: 'why:4', title: 'Uphill', big: 'you fight gravity', bigAt: 'why:5' }],
      tip: [{ at: 'tip:1', title: 'Flat race?', big: 'Position', bigAt: 'tip:2' }, { at: 'tip:3', title: 'Mountain race?', big: 'The scale', bigAt: 'tip:4', c: 'ink' }]
    }
  });
  ctaCards(t, { share: T('cta:0'), pick: T('cta:1'), tap: T('cta:2') + 0.5, follow: T('cta:4'), ftap: T('cta:5') });
};
module.exports = {
  title: 'what-if-five-kilos',
  about: 'O 5 kg méně: na rovině 12 s na 40 km, na 8% stoupání 2:40 na 10 km. Váha rozhoduje jen do kopce.',
  style: { look: 'golden', ui: 'classic', camera: 'orbit', lean: 1, grade: { sat: 1.5, con: 1.12 } },
  acts: [['hook', 'hook'], ['compare', 'flat', 'climb', 'same'], ['why', 'why'], ['tip', 'tip'], ['cta', 'cta']],
  lines: {
    hook: { say: 'What if you lost five kilos? How much faster would you really be?', captions: false,
      chunks: ['What if', 'you lost', ['5 kilos?', 'FIVE'], 'How much faster', 'would you really be?'] },
    flat: { say: "On a flat forty kilometer ride: twelve seconds. That's all.",
      chunks: ['On a flat', ['40 km ride:', 'FORTY'], ['12 seconds.', 'TWELVE'], ["That's all.", "THAT'S"]] },
    climb: { say: 'On a ten kilometer climb at eight percent: two minutes and forty seconds!',
      chunks: [['On a 10 km climb', 'ON'], ['at 8%:', 'AT'], ['2 minutes', 'TWO'], ['and 40 seconds!', 'AND|FORTY']] },
    same: { say: 'Same rider, same power. Thirteen times the gain.',
      chunks: ['Same rider,', 'same power.', ['13 times', 'THIRTEEN'], 'the gain.'] },
    why: { say: "On the flat you fight air, and air doesn't care what you weigh. Uphill you fight gravity, and gravity cares a lot.",
      chunks: ['On the flat', 'you fight air,', "and air doesn't care", 'what you weigh.', 'Uphill', 'you fight gravity,', 'and gravity', 'cares a lot.'] },
    tip: { say: 'So pick your battle. Flat race? Work on your position. Mountain race? Then the scale matters.',
      chunks: ['So pick your battle.', 'Flat race?', 'Work on your position.', 'Mountain race?', 'Then the scale', 'matters.'] },
    cta: { say: 'Send this to the friend who diets for flat races. And follow for more free speed.',
      chunks: ['Send this', 'to the friend', 'who diets', 'for flat races.', ['And follow', 'AND'], 'for more free speed.'] }
  },
  scenes: { hook: { type: 'free', amb: 0.12, draw: ride }, compare: { type: 'free', amb: 0.12, draw: ride }, why: { type: 'free', amb: 0.12, draw: ride }, tip: { type: 'free', amb: 0.12, draw: ride }, cta: { type: 'free', amb: 0.12, draw: ride } },
  facts: P => [
    ['o 5 kg méně, rovina 40 km při 250 W, s', P.time(250, 40) - P.time(250, 40, { m: 79 }), 12, 0.5],
    ['o 5 kg méně, 8% stoupání 10 km při 250 W, s', P.time(250, 10, { grade: 0.08 }) - P.time(250, 10, { grade: 0.08, m: 79 }), 160, 1],
    ['kolikrát větší zisk do kopce', (P.time(250, 10, { grade: 0.08 }) - P.time(250, 10, { grade: 0.08, m: 79 })) / (P.time(250, 40) - P.time(250, 40, { m: 79 })), 13, 0.5]
  ]
};
