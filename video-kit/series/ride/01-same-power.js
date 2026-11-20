// Formát „ride“: souvislá jízda dvou 3D jezdců, štítky s čísly, titulky nahoře. Náš hlas (Liamovi došly kredity).
const ride = function (t) {
  // pohled kamery, silnice a dva jezdci (popis musí být uvnitř funkce, do scenes.js se přenáší jen ona)
  const VIEW = { cam: { pos: [330, 900, 1500], look: [20, 110, -330], fov: 40 }, road: { lanes: [-300], z0: -1050, z1: 480 },
    riders: { A: { kit: 'white', z: 200 }, B: { kit: 'white', over: { helmet: '#8B3DFF' }, z: -760 } } };
  const T = r => TR(r), tPose = T('she:1'), tRace = T('speeds:0'), tGap = T('hour:0'), tCta = T('cta:0');
  const e = ease('power2.inOut'), k = e(clamp((t - tRace) / Math.max(1, tCta - tRace)));
  // jezdkyně B (vzadu, fialová helma) se po změně polohy začne vzdalovat, jezdec A (vpředu) zůstává
  const xB = 60 + 170 * k, xA = 50 - 10 * k, poseB = tw(t, tPose, 1.1, E.io), dist = t * 430, ctaK = tw(t, tCta, 0.8, E.quint);
  const st = { dist, a: 1 - ctaK * 0.62, riders: { A: { x: xA, pose: 0, crank: t * 9.4 + 1.3, wheel: dist / 71 }, B: { x: xB, pose: poseB, crank: t * 9.4, wheel: dist / 71 } } };
  // proudnice mezi silnicí a jezdci
  scene3d(VIEW, st, () => { air3d('B', t, 620, lerp(1, 0.3, poseB), poseB, 0.95 * (1 - ctaK)); air3d('A', t, 620, 1, 0, 0.95 * (1 - ctaK)); });
  // štítky nad helmou: výkon, poloha, rychlost
  const tag = (id, pose, s, at, out, c, size) => tag3d(id, pose, s, t, at, out, { c, size, side: id === 'A' ? 'left' : null });
  tag('B', poseB, '250 W', T('hook:2'), T('he:0'), 'pu', 42); tag('A', 0, '250 W', T('hook:2'), T('he:0'), null, 42);
  tag('A', 0, 'CdA 0.32', T('he:0'), T('speeds:0') - 0.1); tag('B', poseB, 'CdA 0.27', T('she:0'), T('speeds:0') - 0.1, 'pu');
  tag('A', 0, '37.0 km/h', T('speeds:0'), T('cost:0') - 0.1, null, 46); tag('B', poseB, '39.1 km/h', T('speeds:2'), tCta - 0.1, 'pu', 46);
  tag('A', 0, '290 W needed', T('cost:1'), tCta - 0.1, null, 42);
  statAt(t, T('he:0'), T('speeds:0') - 0.15, 'DRAG AREA (CdA)', '0.32 → 0.27', C.ink);
  statAt(t, tGap, T('cost:0') - 0.15, 'AFTER ONE HOUR', '+2 km');
  statAt(t, T('cost:1'), tCta - 0.15, 'EXTRA POWER, JUST FOR SITTING UP', '+40 W · 16%', C.ink);
  ctaEnd(t, T('cta:0'), T('cta:3'), 'Follow for more free speed');
};
module.exports = {
  title: 'ride-same-power',
  about: 'Dva jezdci se stejnými 250 W: vzpřímený s nataženými pažemi a nízký s ohnutými lokty. Nízký ujíždí o 2 km/h rychleji, vzpřímený by na stejnou rychlost potřeboval o 40 W (16 %) víc.',
  style: { captions: 'top' },
  voice: 'ours',
  acts: [['hook', 'hook'], ['stance', 'he', 'she'], ['race', 'speeds', 'hour'], ['cost', 'cost'], ['cta', 'cta']],
  lines: {
    hook: { say: 'Same bike. Same two hundred fifty watts. So why does one rider just ride away?',
      chunks: ['Same bike.', 'Same', ['250 watts.', 'TWO'], 'So why does', 'one rider', 'just ride away?'] },
    he: { say: "He's sitting up, arms straight.",
      chunks: [["He's sitting up,", "HE'S|HES"], 'arms straight.'] },
    she: { say: 'She drops her back and bends her elbows.',
      chunks: [['She drops her back', 'DROPS'], 'and bends', 'her elbows.'] },
    speeds: { say: 'Thirty-seven versus thirty-nine kilometers per hour.',
      chunks: [['37', 'THIRTY'], 'versus', ['39 km/h.', 'THIRTY']] },
    hour: { say: "After one hour, she's two kilometers ahead.",
      chunks: ['After one hour,', ["she's 2 km ahead.", "SHE'S|SHES"]] },
    cost: { say: "To match her, he'd need forty extra watts. Sixteen percent more power, just for sitting up.",
      chunks: ['To match her,', ["he'd need", "HE'D|HED"], ['40 extra watts.', 'FORTY'], ['16% more power,', 'SIXTEEN'], 'just for sitting up.'] },
    cta: { say: 'Send this to the friend who rides with straight arms. And follow for more free speed.',
      chunks: ['Send this', 'to the friend who rides', 'with straight arms.', 'And follow', 'for more free speed.'] }
  },
  scenes: { hook: { type: 'free', amb: 0.12, draw: ride }, stance: { type: 'free', amb: 0.12, draw: ride }, race: { type: 'free', amb: 0.12, draw: ride }, cost: { type: 'free', amb: 0.12, draw: ride }, cta: { type: 'free', amb: 0.12, draw: ride } },
  facts: P => [
    ['250 W, CdA 0,32 (na páčkách, natažené paže), km/h', P.kmh(250, { cda: 0.32 }), 37.0, 0.05],
    ['250 W, CdA 0,27 (ohnuté lokty, nižší záda), km/h', P.kmh(250, { cda: 0.27 }), 39.1, 0.05],
    ['náskok po hodině, km', P.kmh(250, { cda: 0.27 }) - P.kmh(250, { cda: 0.32 }), 2, 0.1],
    ['watty navíc pro CdA 0,32 při rychlosti 39,1 km/h', P.watts(P.kmh(250, { cda: 0.27 }), { cda: 0.32 }) - 250, 40, 1],
    ['o kolik procent víc výkonu', (P.watts(P.kmh(250, { cda: 0.27 }), { cda: 0.32 }) / 250 - 1) * 100, 16, 0.5],
    ['o kolik procent méně výkonu stačí nízko při 36 km/h (13 %)', (1 - P.watts(36, { cda: 0.27 }) / P.watts(36, { cda: 0.32 })) * 100, 13, 0.5]
  ],
  sources: 'CdA 0,32 a 0,27 leží v rozsahu silničních pozic z přehledu Crouch a kol. 2017. Vzorové video (Peakfy) uvádí podle větrného tunelu, že ruce na páčkách s ohnutými lokty a vodorovnými předloktími snižují potřebný výkon asi o 13 %, což tento model potvrzuje (13 % při stejné rychlosti).'
};
