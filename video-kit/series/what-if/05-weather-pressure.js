// Realistický formát „ride“ s texty původní šablony What if (autor 22. 11. 2026): jeden časovkář v krajině za zlaté hodinky,
// ujíždějící asfalt, barometr, hlas Liam, nápis whatIF, nadpisy nahoře, titulky dole, plynulý průlet 3D kamery mezi akty, sytější barvy krajiny a nahoře bez malých popisků.
// Na konci „pošli kamarádovi a sleduj“ (karty přes krajinu, karta profilu wattIF).
const ride = function (t, a) {
  // pohled kamery, silnice a jezdec (popis musí být uvnitř funkce, do scenes.js se přenáší jen ona)
  const VIEW = { cam: { pos: [300, 380, 1250], look: [0, 175, -60], fov: 40 }, road: { lanes: [-260], z0: -700, z1: 900 }, riders: { A: { kit: 'purple', z: 60 } } };
  const T = r => TR(r);
  // časovkář v nástavcích; na „fix what you control: your position“ ještě níž
  const pose = 1 + 0.6 * tw(t, T('tip:5'), 0.8, E.io), dist = t * 440;
  const st = { dist, riders: { A: { x: 0, pose, crank: t * 9.4, wheel: dist / 71 } } };
  scene3d(VIEW, st, () => air3d('A', t, 660, 0.4, pose, 0.9));
  const tag = (s, at, out, c, size) => tag3d('A', pose, s, t, at, out, { c, size });
  // barometr: tlaková výše 1030 hPa → níže 990 hPa, když zazní „stormy low-pressure day“ (vpravo nad jezdcem, nahoře jsou nadpisy)
  barometer(t, T('look:0'), T('race:0') - 0.1, 1030, 990, T('press:1'), 800, 640);
  tag('40.3 km/h', T('race:1'), T('equal:0') - 0.1, 'pu', 46);
  // texty z původního videa (nadpisy scén)
  classicUI(t, a, {
    hook: { line: 'hook', cy: 430, items: [{ whatIf: true, i: 0, size: 140 }, { t: 'the weather forecast', i: 1, size: 56 }, { t: 'could tell you', i: 2, size: 56 }, { t: 'when to go for', i: 3, size: 46, c: 'muted' }, { t: 'a personal best?', i: 4, big: true, size: 92 }] },
    heads: {
      baro: [{ at: 'look:0', title: 'Air pressure' }, { at: 'press:3', big: '−4%', sub: 'thinner air on a low-pressure day' }],
      race: [{ at: 'race:0', big: '250 W', c: 'ink', sub: 'same rider · same power' }, { at: 'race:2', big: '45 s', sub: 'faster over 40 km' }, { at: 'equal:0', title: 'Same gain as', big: '−0.01 m² CdA', bigAt: 'equal:2' }],
      tip: [{ at: 'tip:2', title: 'Check the barometer' }, { at: 'tip:3', title: 'Then fix', big: 'your position', bigAt: 'tip:5' }]
    }
  });
  ctaCards(t, { share: T('cta:0'), pick: T('cta:1'), tap: T('cta:2') + 0.5, follow: T('cta:4'), ftap: T('cta:5') });
};
module.exports = {
  title: 'what-if-weather-pressure',
  about: 'Tlak vzduchu podle počasí mění hustotu vzduchu o několik procent: při tlakové níži se jede rychleji. Při 250 W na 40 km je rozdíl mezi 1030 a 990 hPa asi 45 s.',
  style: { look: 'golden', ui: 'classic', camera: 'orbit', lean: 1, grade: { sat: 1.5, con: 1.12 } },
  acts: [['hook', 'hook'], ['baro', 'look', 'press'], ['race', 'race', 'equal'], ['tip', 'tip'], ['cta', 'cta']],
  lines: {
    hook: { say: 'What if the weather forecast could tell you when to go for a personal best?', captions: false,
      chunks: ['What if', 'the weather forecast', 'could tell you', 'when to go for', 'a personal best?'] },
    look: { say: 'Look at the air pressure.',
      chunks: ['Look at', 'the air pressure.'] },
    press: { say: 'On a stormy low-pressure day, the air is four percent thinner than under a sunny high.',
      chunks: ['On a stormy', ['low-pressure day,', 'LOW'], 'the air is', ['4% thinner', 'FOUR'], 'than under', 'a sunny high.'] },
    race: { say: 'Same power over forty kilometers: forty-five seconds faster!',
      chunks: ['Same power', ['over 40 km:', 'OVER'], ['45 seconds', 'FORTY'], 'faster!'] },
    equal: { say: "That's the same as shaving a hand-sized patch off your drag area.",
      chunks: ["That's the same", 'as shaving', 'a hand-sized patch', 'off your drag area.'] },
    tip: { say: 'So before your next time trial, check the barometer. Then fix what you control: your position.',
      chunks: ['So before your next', 'time trial,', 'check the barometer.', 'Then fix', 'what you control:', 'your position.'] },
    cta: { say: 'Send this to the friend who always blames the weather. And follow for more free speed.',
      chunks: ['Send this', 'to the friend', 'who always blames', 'the weather.', ['And follow', 'AND'], 'for more free speed.'] }
  },
  scenes: { hook: { type: 'free', amb: 0.12, draw: ride }, baro: { type: 'free', amb: 0.12, draw: ride }, race: { type: 'free', amb: 0.12, draw: ride }, tip: { type: 'free', amb: 0.12, draw: ride }, cta: { type: 'free', amb: 0.12, draw: ride } },
  facts: P => [
    ['hustota při 990 hPa proti 1030 hPa, %', P.rho({ hpa: 990 }) / P.rho({ hpa: 1030 }) * 100, 96, 0.2],
    ['250 W při 1030 hPa, km/h', P.kmh(250, { hpa: 1030 }), 39.8, 0.05],
    ['250 W při 990 hPa, km/h', P.kmh(250, { hpa: 990 }), 40.3, 0.05],
    ['rozdíl času na 40 km, s', P.time(250, 40, { hpa: 1030 }) - P.time(250, 40, { hpa: 990 }), 45, 0.5],
    ['pro srovnání: 0,01 m² CdA na 40 km, s', P.time(250, 40) - P.time(250, 40, { cda: 0.24 }), 45, 1]
  ],
  sources: 'Tlak 990 a 1030 hPa jsou běžné hodnoty tlakové níže a výše u hladiny moře.'
};
