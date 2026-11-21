// Formát „ride“: jeden časovkář (3D, MakeHuman) se stejnými 250 W nejdřív vzpřímeně, pak v aero nástavcích. Štítky
// s čísly, titulky nahoře. Náš hlas (Liamovi došly kredity). Autor 21. 11. 2026: ve videu jen jeden jezdec.
const ride = function (t) {
  // pohled kamery, silnice a jezdec (popis musí být uvnitř funkce, do scenes.js se přenáší jen ona)
  const VIEW = { cam: { pos: [300, 560, 1180], look: [0, 150, -60], fov: 40 }, road: { lanes: [-260], z0: -700, z1: 900 }, riders: { A: { kit: 'purple', z: 60 } } };
  const T = r => TR(r), tDrop = T('drop:1'), tUp = T('cost:1'), tBack = T('cta:0') + 0.3, tCta = T('cta:0');
  // poloha: vzpřímeně → do nástavců („onto the aero bars“) → na chvíli zase vzpřímeně („sitting up“ za 314 W) → zpět do nástavců
  const pose = tw(t, tDrop, 1.1, E.io) - tw(t, tUp, 0.9, E.io) + tw(t, tBack, 0.9, E.io), aero = clamp(pose);
  const dist = t * lerp(400, 460, aero), ctaK = tw(t, tCta + 0.6, 0.8, E.quint);
  const st = { dist, a: 1 - ctaK * 0.62, riders: { A: { x: 0, pose, crank: t * 9.4, wheel: dist / 71 } } };
  // proudnice mezi silnicí a jezdcem: v nástavcích klidnější úplav
  scene3d(VIEW, st, () => air3d('A', t, lerp(620, 680, aero), lerp(1, 0.35, aero), pose, 0.95 * (1 - ctaK)));
  const tag = (s, at, out, c, size) => tag3d('A', pose, s, t, at, out, { c, size });
  tag('250 W', T('hook:2'), T('he:0') - 0.1, 'pu', 44);
  tag('CdA 0.30', T('he:0'), T('he:2') - 0.1); tag('37.8 km/h', T('he:2'), T('drop:0') - 0.1, null, 46);
  tag('CdA 0.23', T('drop:1'), T('speeds:0') - 0.1, 'pu'); tag('41.1 km/h', T('speeds:0'), T('cost:0') - 0.1, 'pu', 46);
  tag('314 W needed', T('cost:1'), tBack, null, 44); tag('41.1 km/h', tBack + 0.4, null, 'pu', 46);
  statAt(t, T('he:0'), T('speeds:0') - 0.15, 'DRAG AREA (CdA)', '0.30 → 0.23', C.ink);
  statAt(t, T('speeds:1'), T('hour:0') - 0.15, 'SAME 250 W', '+3.3 km/h');
  statAt(t, T('hour:0'), T('cost:0') - 0.15, 'AFTER ONE HOUR', '+3.3 km');
  statAt(t, T('cost:1'), tCta - 0.15, 'EXTRA POWER, JUST FOR SITTING UP', '+64 W · 26%', C.ink);
  ctaEnd(t, T('cta:1'), T('cta:3'), 'Follow for more free speed');
};
module.exports = {
  title: 'ride-same-power',
  about: 'Jeden časovkář se stejnými 250 W na časovkářském kole: vzpřímeně s rukama na základním řídítku (CdA 0,30) jede 37,8 km/h, v aero nástavcích s lokty na opěrkách (CdA 0,23) 41,1 km/h. Vzpřímeně by na stejnou rychlost potřeboval o 64 W (26 %) víc.',
  style: { captions: 'top' },
  acts: [['hook', 'hook'], ['stance', 'he', 'drop'], ['race', 'speeds', 'hour'], ['cost', 'cost'], ['cta', 'cta']],
  lines: {
    hook: { say: 'Same rider, same bike, same two hundred fifty watts. So how does he suddenly go faster?',
      chunks: ['Same rider,', 'same bike,', ['same 250 watts.', 'SAME'], ['So how does he', 'SO|THOUGH|HOW'], 'suddenly go faster?'] },
    he: { say: 'Sitting up, hands on the base bar: thirty-eight kilometers per hour.',
      chunks: [['Sitting up,', 'SITTING'], 'hands on the base bar:', ['38 km/h.', 'THIRTY']] },
    drop: { say: 'Then he drops onto the aero bars, elbows on the pads.',
      chunks: [['Then he drops', 'THEN|AND|HE'], ['onto the aero bars,', 'ONTO|ON'], 'elbows on the pads.'] },
    speeds: { say: 'Forty-one kilometers per hour. Same watts.',
      chunks: [['41 km/h.', 'FORTY'], 'Same watts.'] },
    hour: { say: 'After one hour, that is over three kilometers further.',
      chunks: ['After one hour,', 'that is', ['over 3 km further.', 'OVER']] },
    cost: { say: "To go that fast sitting up, he'd need sixty-four extra watts. A quarter more power.",
      chunks: [['To go that fast', 'TO|GO'], 'sitting up,', ["he'd need", "HE'D|HED|HE"], ['64 extra watts.', 'SIXTY'], 'A quarter more power.'] },
    cta: { say: 'Send this to the friend who never uses his aero bars. And follow for more free speed.',
      chunks: ['Send this', 'to the friend who never', ['uses his aero bars.', 'USES'], 'And follow', 'for more free speed.'] }
  },
  scenes: { hook: { type: 'free', amb: 0.12, draw: ride }, stance: { type: 'free', amb: 0.12, draw: ride }, race: { type: 'free', amb: 0.12, draw: ride }, cost: { type: 'free', amb: 0.12, draw: ride }, cta: { type: 'free', amb: 0.12, draw: ride } },
  facts: P => [
    ['250 W, CdA 0,30 (vzpřímeně, ruce na základním řídítku), km/h („38“)', P.kmh(250, { cda: 0.30 }), 37.8, 0.05],
    ['250 W, CdA 0,23 (aero nástavce, lokty na opěrkách), km/h („41“)', P.kmh(250, { cda: 0.23 }), 41.1, 0.05],
    ['rozdíl rychlosti a vzdálenost za hodinu, km/h a km („over three“)', P.kmh(250, { cda: 0.23 }) - P.kmh(250, { cda: 0.30 }), 3.3, 0.05],
    ['watty navíc pro CdA 0,30 při 41,1 km/h („64“, 314 W)', P.watts(P.kmh(250, { cda: 0.23 }), { cda: 0.30 }) - 250, 64, 1],
    ['o kolik procent víc výkonu („a quarter“)', (P.watts(P.kmh(250, { cda: 0.23 }), { cda: 0.30 }) / 250 - 1) * 100, 26, 0.5]
  ],
  sources: 'CdA 0,30 (vzpřímeně na základním řídítku časovkářského kola) a 0,23 (v aero nástavcích) leží v rozsahu z přehledu Crouch a kol. 2017 (časovkářské polohy asi 0,20 až 0,25).'
};
