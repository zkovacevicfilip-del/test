// Realistický formát „ride“ s texty původní šablony What if (autor 22. 11. 2026): jeden jezdec v krajině za zlaté hodinky,
// ujíždějící asfalt, hlas Liam, nápis whatIF, nadpisy nahoře, titulky dole, jemný švih kamery (bez fialového stíracího pruhu).
// Na konci „pošli kamarádovi a sleduj“ (karty přes krajinu, karta profilu wattIF).
const ride = function (t, a) {
  // pohled kamery, silnice a jezdec (popis musí být uvnitř funkce, do scenes.js se přenáší jen ona)
  const VIEW = { cam: { pos: [300, 380, 1250], look: [0, 175, -60], fov: 40 }, road: { lanes: [-260], z0: -700, z1: 900 }, riders: { A: { kit: 'purple', z: 60 } } };
  const T = r => TR(r);
  // jezdec vzpřímeně na silničním řídítku; u „smooth shell“ (how:2) se schová na aero nástavce a zůstane tam (tvar víc než výkon)
  const pose = tw(t, T('how:2'), 1.0, E.io), aero = clamp(pose);
  const dist = t * lerp(530, 560, aero), st = { dist, riders: { A: { x: 0, pose, crank: t * 9.4, wheel: dist / 71 } } };
  scene3d(VIEW, st, () => air3d('A', t, lerp(760, 800, aero), lerp(1, 0.35, aero), pose, 0.95));
  const tag = (s, at, out, c, size) => tag3d('A', pose, s, t, at, out, { c, size });
  tag('40 km/h · 250 W', T('need:0'), T('need:2') - 0.1, null, 46);
  // texty z původního videa (nadpisy scén bars, flow a rider)
  classicUI(t, a, {
    hook: { line: 'hook', cy: 440, items: [{ whatIf: true, i: 0, size: 140 }, { t: 'you wanted to ride', i: 1, size: 56, gap: 12 }, { t: '100 km/h', i: 2, big: true, size: 120 }, { t: 'on a flat road?', i: 3, size: 56 }] },
    heads: {
      need: [{ at: 'need:0', label: 'ROAD BIKE · FLAT ROAD', big: '3,400 W', bigAt: 'need:2', sub: 'no human can hold that', subAt: 'need:3' }],
      record: [{ at: 'record:1', label: 'HUMAN-POWERED RECORD', big: '144 km/h', bigAt: 'record:2' }, { at: 'how:1', label: 'THE TRICK', big: 'a smooth shell', bigAt: 'how:2', sub: 'shaped like a teardrop', subAt: 'how:4' }],
      tip: [{ at: 'cube:0', title: 'At speed', big: "it's all air", bigAt: 'cube:1' }, { at: 'tip:2', title: 'Shape', big: 'beats power', bigAt: 'tip:4' }]
    }
  });
  ctaCards(t, { share: T('cta:0'), pick: T('cta:1'), tap: T('cta:2') + 0.5, follow: T('cta:4'), ftap: T('cta:5') });
};
module.exports = {
  title: 'what-if-hundred-kmh',
  about: 'Na 100 km/h po rovině by silniční kolo potřebovalo asi 3 400 W. Rekord vozidla na lidský pohon je přesto 144 km/h, díky kapotáži.',
  style: { look: 'golden', ui: 'classic', camera: 'whip' },
  acts: [['hook', 'hook'], ['need', 'need'], ['record', 'record', 'how'], ['tip', 'cube', 'tip'], ['cta', 'cta']],
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
      chunks: ["You can't ride", 'in a shell.', 'But the lesson', 'is the same:', 'shape beats power.'] },
    cta: { say: 'Send this to the friend who thinks more watts is the answer. And follow for more free speed.',
      chunks: ['Send this', 'to the friend', 'who thinks more watts', 'is the answer.', ['And follow', 'AND'], 'for more free speed.'] }
  },
  scenes: { hook: { type: 'free', amb: 0.12, draw: ride }, need: { type: 'free', amb: 0.12, draw: ride }, record: { type: 'free', amb: 0.12, draw: ride }, tip: { type: 'free', amb: 0.12, draw: ride }, cta: { type: 'free', amb: 0.12, draw: ride } },
  facts: P => [
    ['100 km/h po rovině, CdA 0,25, W', P.watts(100), 3400, 10],
    ['40 km/h, CdA 0,25, W', P.watts(40), 250, 1.5]
  ],
  sources: 'Rekord vozidla na lidský pohon: 144,17 km/h, Todd Reichert, Aerovelo Eta (plně kapotované lehokolo), Battle Mountain, 17. 9. 2016 (IHPVA).'
};
