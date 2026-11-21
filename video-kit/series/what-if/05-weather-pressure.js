// Realistický formát „ride“ (od 22. 11. 2026): jeden časovkář v krajině za zlaté hodinky, barometr, hlas Liam, pohybová grafika
// z GSAP (švih kamery do aktů) a Kokonut UI (číslice jako válečky automatu, stírací přechod), úvodní nápis wattIF.
const ride = function (t) {
  // pohled kamery, silnice a jezdec (popis musí být uvnitř funkce, do scenes.js se přenáší jen ona)
  const VIEW = { cam: { pos: [300, 380, 1250], look: [0, 175, -60], fov: 40 }, road: { lanes: [-260], z0: -700, z1: 900 }, riders: { A: { kit: 'purple', z: 60 } } };
  const T = r => TR(r);
  // časovkář v nástavcích; na „fix what you control: your position“ ještě níž
  const pose = 1 + 0.6 * tw(t, T('tip:5'), 0.8, E.io), dist = t * 440;
  const st = { dist, riders: { A: { x: 0, pose, crank: t * 9.4, wheel: dist / 71 } } };
  scene3d(VIEW, st, () => air3d('A', t, 660, 0.4, pose, 0.9));
  const tag = (s, at, out, c, size) => tag3d('A', pose, s, t, at, out, { c, size });
  hookTitle(t, T('hook:0'), T('hook:4'));
  // barometr: tlaková výše 1030 hPa → níže 990 hPa, když zazní „stormy low-pressure day“
  barometer(t, T('look:0'), T('race:0') - 0.1, 1030, 990, T('press:1'));
  statAt(t, T('press:3'), T('race:0') - 0.15, 'THINNER AIR AT 990 hPa', '−4 %');
  tag('40.3 km/h', T('race:1'), T('equal:0') - 0.1, 'pu', 46);
  statAt(t, T('race:2'), T('equal:0') - 0.15, 'SAME 250 W, 40 km', '−45 s');
  statAt(t, T('equal:2'), T('tip:0') - 0.15, 'SAME AS SAVING CdA', '0.01 m²', C.ink);
  statAt(t, T('tip:2'), T('tip:4') - 0.15, 'CHECK THE', 'Barometer', C.ink);
  ctaEnd(t, T('tip:4'), null, 'Follow for more free speed');
};
module.exports = {
  title: 'what-if-weather-pressure',
  about: 'Tlak vzduchu podle počasí mění hustotu vzduchu o několik procent: při tlakové níži se jede rychleji. Při 250 W na 40 km je rozdíl mezi 1030 a 990 hPa asi 45 s.',
  style: { captions: 'top', look: 'golden', camera: 'whip', text: 'slot', overlay: 'wipe', hook: 'watt' },
  acts: [['hook', 'hook'], ['baro', 'look', 'press'], ['race', 'race', 'equal'], ['tip', 'tip']],
  lines: {
    hook: { say: 'What if the weather forecast could tell you when to go for a personal best?',
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
      chunks: ['So before your next', 'time trial,', 'check the barometer.', 'Then fix', 'what you control:', 'your position.'] }
  },
  scenes: { hook: { type: 'free', amb: 0.12, draw: ride }, baro: { type: 'free', amb: 0.12, draw: ride }, race: { type: 'free', amb: 0.12, draw: ride }, tip: { type: 'free', amb: 0.12, draw: ride } },
  facts: P => [
    ['hustota při 990 hPa proti 1030 hPa, %', P.rho({ hpa: 990 }) / P.rho({ hpa: 1030 }) * 100, 96, 0.2],
    ['250 W při 1030 hPa, km/h', P.kmh(250, { hpa: 1030 }), 39.8, 0.05],
    ['250 W při 990 hPa, km/h', P.kmh(250, { hpa: 990 }), 40.3, 0.05],
    ['rozdíl času na 40 km, s', P.time(250, 40, { hpa: 1030 }) - P.time(250, 40, { hpa: 990 }), 45, 0.5],
    ['pro srovnání: 0,01 m² CdA na 40 km, s', P.time(250, 40) - P.time(250, 40, { cda: 0.24 }), 45, 1]
  ],
  sources: 'Tlak 990 a 1030 hPa jsou běžné hodnoty tlakové níže a výše u hladiny moře.'
};
