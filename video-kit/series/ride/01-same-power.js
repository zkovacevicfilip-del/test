// Formát „ride“: jeden časovkář (3D, MakeHuman) se stejnými 250 W nejdřív vzpřímeně, pak v aero nástavcích. Štítky
// s čísly, hlas Liam. Autor 21. 11. 2026: ve videu jen jeden jezdec. Od 22. 11. 2026 texty jako v původní šabloně
// (nadpisy nahoře, titulky dole), ujíždějící asfalt a na konci „pošli kamarádovi a sleduj“ (karty přes krajinu).
const ride = function (t, a) {
  // pohled kamery, silnice a jezdec (popis musí být uvnitř funkce, do scenes.js se přenáší jen ona)
  const VIEW = { cam: { pos: [300, 380, 1250], look: [0, 175, -60], fov: 40 }, road: { lanes: [-260], z0: -700, z1: 900 }, riders: { A: { kit: 'purple', z: 60 } } };
  const T = r => TR(r), tDrop = T('drop:1'), tUp = T('cost:1'), tBack = T('cta:0') + 0.3, tCta = T('cta:0');
  // poloha: vzpřímeně → do nástavců („onto the aero bars“) → na chvíli zase vzpřímeně („sitting up“ za 314 W) → zpět do nástavců
  const pose = tw(t, tDrop, 1.1, E.io) - tw(t, tUp, 0.9, E.io) + tw(t, tBack, 0.9, E.io), aero = clamp(pose);
  const dist = t * lerp(400, 460, aero);
  const st = { dist, riders: { A: { x: 0, pose, crank: t * 9.4, wheel: dist / 71 } } };
  // proudnice mezi silnicí a jezdcem: v nástavcích klidnější úplav
  scene3d(VIEW, st, () => air3d('A', t, lerp(620, 680, aero), lerp(1, 0.35, aero), pose, 0.95));
  const tag = (s, at, out, c, size) => tag3d('A', pose, s, t, at, out, { c, size });
  tag('CdA 0.30', T('he:0'), T('he:2') - 0.1); tag('37.8 km/h', T('he:2'), T('drop:0') - 0.1, null, 46);
  tag('CdA 0.23', T('drop:1'), T('speeds:0') - 0.1, 'pu'); tag('41.1 km/h', T('speeds:0'), T('cost:0') - 0.1, 'pu', 46);
  tag('314 W needed', T('cost:1'), tBack, null, 44); tag('41.1 km/h', tBack + 0.4, tCta + 0.2, 'pu', 46);
  classicUI(t, a, {
    hook: { line: 'hook', cy: 450, items: [{ t: 'Same rider,', i: 0, size: 64 }, { t: 'same bike,', i: 1, size: 64 }, { t: 'same 250 W', i: 2, big: true, size: 120 }, { t: 'So how does he suddenly go faster?', i: 3, size: 44, c: 'muted' }] },
    heads: {
      stance: [{ at: 'he:0', label: 'SITTING UP', big: 'CdA 0.30', c: 'ink' }, { at: 'drop:1', label: 'ON THE AERO BARS', big: 'CdA 0.23' }],
      race: [{ at: 'speeds:1', label: 'SAME 250 W', big: '+3.3 km/h' }, { at: 'hour:0', big: '+3.3 km', sub: 'after one hour' }],
      cost: [{ at: 'cost:1', label: 'SITTING UP COSTS', big: '+64 W', bigAt: 'cost:3', sub: 'a quarter more power', subAt: 'cost:4' }]
    }
  });
  ctaCards(t, { share: T('cta:0'), pick: T('cta:1'), tap: T('cta:2') + 0.5, follow: T('cta:4'), ftap: T('cta:5') });
};
module.exports = {
  title: 'ride-same-power',
  about: 'Jeden časovkář se stejnými 250 W na časovkářském kole: vzpřímeně s rukama na základním řídítku (CdA 0,30) jede 37,8 km/h, v aero nástavcích s lokty na opěrkách (CdA 0,23) 41,1 km/h. Vzpřímeně by na stejnou rychlost potřeboval o 64 W (26 %) víc.',
  style: { look: 'golden', ui: 'classic', camera: 'orbit', lean: 1, grade: { sat: 1.5, con: 1.12 } },
  acts: [['hook', 'hook'], ['stance', 'he', 'drop'], ['race', 'speeds', 'hour'], ['cost', 'cost'], ['cta', 'cta']],
  lines: {
    hook: { say: 'Same rider, same bike, same two hundred fifty watts. So how does he suddenly go faster?', captions: false,
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
      chunks: ['Send this', 'to the friend', 'who never uses', 'his aero bars.', ['And follow', 'AND'], 'for more free speed.'] }
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
