// Realistický formát „ride“ s texty původní šablony What if (autor 22. 11. 2026): jeden jezdec do kopce v krajině za zlaté
// hodinky, ujíždějící asfalt, hlas Liam; nápis whatIF, nadpisy nahoře, titulky dole a barvy jako ve videu what-if-no-air.
// Mezi akty plynulý průlet 3D kamery (GSAP), sytější barvy krajiny, nahoře bez malých popisků (autor 22. 11. 2026). Na konci „pošli
// kamarádovi a sleduj“ (karty přes krajinu jako ve vzorovém reelu, karta profilu wattIF).
const ride = function (t, a) {
  // pohled kamery, silnice do kopce a jezdec (popis musí být uvnitř funkce, do scenes.js se přenáší jen ona)
  const VIEW = { cam: { pos: [300, 380, 1250], look: [0, 175, -60], fov: 40 }, road: { lanes: [-260], z0: -700, z1: 900 }, riders: { A: { kit: 'purple', z: 60 } } };
  const T = r => TR(r), tLow = T('gain:2'), tTip = T('tip:3');
  // stoupání: silnice nakloněná nahoru (5 % = 2,9°, v obraze víc), jezdec nejdřív vzpřímeně, pak kompaktně (ohnuté lokty, rovná záda)
  const slope = 7 * tw(t, T('share:0'), 1.2, E.io);
  const pose = 0.85 * tw(t, tLow, 1.0, E.io) - 0.85 * tw(t, T('tip:1'), 0.8, E.io) + 0.85 * tw(t, tTip, 0.8, E.io);
  const dist = t * 190, st = { dist, slope, riders: { A: { x: 0, pose, grip: 'base', crank: t * 8.6, wheel: dist / 71 } } };
  scene3d(VIEW, st, () => air3d('A', t, 330, lerp(0.7, 0.35, clamp(pose / 0.85)), pose, 0.8));
  const tag = (s, at, out, c, size) => tag3d('A', pose, s, t, at, out, { c, size });
  tag('250 W', T('share:1'), T('gain:0') - 0.1, 'pu', 46);
  tag('17.5 km/h', T('gain:1'), T('gain:2') - 0.1, null, 46); tag('17.9 km/h', T('gain:3'), T('tip:0') - 0.1, 'pu', 46);
  // texty z původního videa (stejné nadpisy jako dřív ve scénách rows, race a rider)
  classicUI(t, a, {
    hook: { line: 'hook', cy: 440, items: [{ whatIf: true, i: 0, size: 140 }, { t: 'aero still matters', i: 1, size: 56 }, { t: "when you're climbing", i: 2, size: 56 }, { t: 'at 17 km/h?', i: 3, big: true, size: 104 }] },
    heads: {
      share: [{ at: 'myth:1', title: 'Uphill = weight?', sub: 'not quite', subAt: 'myth:3' }, { at: 'share:0', label: '5% CLIMB · 250 W', big: '11%', bigAt: 'share:3', sub: 'of your power still fights air', subAt: 'share:4' }],
      race: [{ at: 'gain:0', big: '5% climb', c: 'ink', sub: '10 km · same 250 W' }, { at: 'gain:5', big: '39 s', sub: 'faster over 10 km' }, { at: 'kilo:0', title: 'Or lose', big: '2+ kilos', bigAt: 'kilo:3' }],
      tip: [{ at: 'tip:1', title: "Don't sit up", big: 'like a sail', bigAt: 'tip:2', c: 'ink' }, { at: 'tip:3', big: 'Stay compact' }]
    }
  });
  // konec: pošli kamarádovi (vybere se Alex, klepnutí na Send) a sleduj (klepnutí na Follow), varianta 1 od autora 22. 11. 2026
  ctaCards(t, { share: T('cta:0'), pick: T('cta:1'), tap: T('cta:2') + 0.5, follow: T('cta:4'), ftap: T('cta:5') });
};
module.exports = {
  title: 'what-if-aero-on-climbs',
  about: 'I do kopce jde část výkonu na vzduch: na 5% stoupání asi 11 %. Kompaktní pozice (ohnuté lokty, rovná záda) ušetří 39 s na 10 km, víc než shození 2 kg.',
  style: { look: 'golden', ui: 'classic', camera: 'orbit', lean: 1, grade: { sat: 1.5, con: 1.12 } },
  acts: [['hook', 'hook'], ['share', 'myth', 'share'], ['race', 'gain', 'kilo'], ['tip', 'tip'], ['cta', 'cta']],
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
      chunks: ['So on steady climbs,', "don't sit up", 'like a sail.', 'Stay compact.'] },
    cta: { say: 'Send this to the friend who always sits up on climbs. And follow for more free speed.',
      chunks: ['Send this', 'to the friend', 'who always sits up', 'on climbs.', ['And follow', 'AND'], 'for more free speed.'] }
  },
  scenes: { hook: { type: 'free', amb: 0.12, draw: ride }, share: { type: 'free', amb: 0.12, draw: ride }, race: { type: 'free', amb: 0.12, draw: ride }, tip: { type: 'free', amb: 0.12, draw: ride }, cta: { type: 'free', amb: 0.12, draw: ride } },
  facts: P => [
    ['250 W na 5% stoupání, CdA 0,40, km/h', P.kmh(250, { cda: 0.40, grade: 0.05 }), 17.5, 0.05],
    ['250 W na 5% stoupání, CdA 0,32, km/h', P.kmh(250, { cda: 0.32, grade: 0.05 }), 17.9, 0.06],
    ['podíl vzduchu na 5% stoupání, CdA 0,40, %', P.airShare(P.kmh(250, { cda: 0.40, grade: 0.05 }), { cda: 0.40, grade: 0.05 }) * 100, 11, 0.5],
    ['rozdíl času na 10 km, s', P.time(250, 10, { cda: 0.40, grade: 0.05 }) - P.time(250, 10, { cda: 0.32, grade: 0.05 }), 39, 0.6],
    ['pro srovnání: 2 kg méně dají jen tolik sekund', P.time(250, 10, { cda: 0.40, grade: 0.05 }) - P.time(250, 10, { cda: 0.40, grade: 0.05, m: 82 }), 35, 0.5]
  ],
  sources: 'Model jako v aplikaci (84 kg, Crr 0,004, účinnost 97,5 %, 20 °C).'
};
