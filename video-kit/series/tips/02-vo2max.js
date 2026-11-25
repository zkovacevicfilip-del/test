// Video „3 tipy“ o VO2 max (autor 25. 11. 2026): stejný vzhled jako 3 tipy na časovku (jezdec na venkovské silnici, průlet
// kamery, odznak kapitoly, karta s pruhy, titulky se zvýrazněným slovem, zvuky efektů a rytmus), úvod „3 WAYS“ a slib, že
// trojka je nejdůležitější. Způsoby jdou od nejmenšího zisku k největšímu podle studií: 4×4 min +7,2 % (Helgerud 2007),
// 30/15 s +8,7 % (Rønnestad 2015, cyklisté), většinou lehce a tvrdé dny tvrdě +11,7 % (Stöggl & Sperlich 2014).
// Jezdec v tvrdém úseku nízko s rychlejší kadencí, v lehkém vzpřímeně; u 30/15 se střídá rytmus 2 : 1.
const ride = function (t, a) {
  const VIEW = { cam: { pos: [300, 380, 1250], look: [0, 175, -60], fov: 40 }, road: { lanes: [-260], z0: -700, z1: 900, len: 40000, scenery: 'country' },
    riders: { A: { kit: 'purple', z: 60, over: { shortsLen: 0.86, gripIn: 0.22 } } } };
  const T = r => TR(r), st0 = (x, at, d) => tw(x, at, d || 0.5, E.io);
  // úsilí 0 (lehce) až 1 (tvrdě) v čase x
  const effort = x => {
    let h = 0.25 + 0.75 * (st0(x, T('one:2')) - st0(x, T('one:3')) + st0(x, T('one:4')) - st0(x, T('one:5')));
    const a2 = T('two:2'), b2 = T('two:5'), ph = ((x - a2) % 1.5 + 1.5) % 1.5;   // 30/15 zrychleně: 1 s tvrdě, 0,5 s lehce
    const on = ph < 0.25 ? E.io(ph / 0.25) : ph < 1 ? 1 : ph < 1.25 ? 1 - E.io((ph - 1) / 0.25) : 0;
    h += 0.75 * on * st0(x, a2, 0.3) * (1 - st0(x, b2, 0.3));
    h += -0.25 * (st0(x, T('three:2')) - st0(x, T('three:4'))) + 0.75 * (st0(x, T('three:4')) - st0(x, T('three:5')));   // většinou lehce, tvrdé dny tvrdě
    return clamp(h);
  };
  // ujetá dráha a klika = součet rychlosti a kadence (jinak by při změně tempa poskočily)
  let dist = 0, crank = 0; for (let x = 0; x < t; x += 0.05) { const dt = Math.min(0.05, t - x), h = effort(x); dist += lerp(420, 640, h) * dt; crank += lerp(8.2, 11, h) * dt; }
  const h = effort(t), pose = 0.85 * h;
  scene3d(VIEW, { dist, riders: { A: { x: 0, pose, grip: 'base', crank, wheel: dist / 71 } } }, () => air3d('A', t, lerp(700, 960, h), lerp(0.9, 0.55, h), pose, 0.75 + 0.2 * h));
  classicUI(t, a, {
    hook: { line: 'hook', cy: 440, items: [{ mark: [['3 ', 'ink'], ['WAYS', 'pu']], i: 0, size: 150 }, { t: 'to raise your', i: 1, size: 56 }, { t: 'VO2 max', i: 2, size: 56, gap: 14 }, { t: '#3 matters most', i: 3, big: true, size: 92 }] },
    heads: {},
    tips: { at: [T('one:0'), T('two:0'), T('three:0')], end: T('cta:0') }
  });
  const bA = chapterBadge(t, { v: 1, at: [T('one:0'), T('two:0'), T('three:0')], names: ['4×4 min', '30/15s', 'Mostly easy'], dur: 1.9 });
  dataCard(t, { v: 2, fmt: 'pct', title: 'VO2 MAX GAIN IN STUDIES', from: T('one:0') + 1.9, to: T('cta:0'), hide: bA,
    items: [{ name: '4×4', head: 'Way 1 · 4×4 min', recipe: '4 × (4 MIN HARD + 3 MIN EASY)', src: 'HELGERUD ET AL. 2007 · 8 WEEKS', value: 7.2, at: T('one:0'), grow: T('one:5') },
      { name: '30/15', head: 'Way 2 · 30/15s', recipe: '3 × 13 × (30 S HARD + 15 S EASY)', src: 'RØNNESTAD ET AL. 2015 · CYCLISTS · 10 WEEKS', value: 8.7, at: T('two:0'), grow: T('two:5') },
      { name: 'MOSTLY EASY', head: 'Way 3 · Mostly easy', recipe: 'MOST RIDES EASY · HARD DAYS HARD', src: 'STÖGGL & SPERLICH 2014 · 9 WEEKS', value: 11.7, at: T('three:0'), grow: T('three:5'), week: ['E', 'H', 'E', 'R', 'H', 'E', 'E'], weekAt: T('three:2') }] });
  ctaCards(t, { share: T('cta:0') - 0.15, pick: T('cta:1') + 0.1, tap: T('cta:2') + 0.15, follow: T('cta:3') + 0.1, ftap: T('cta:4') + 0.2 });
};
module.exports = {
  title: 'tips-vo2max',
  about: 'Tři způsoby, jak zvednout VO2 max, od nejmenšího zisku ve studii k největšímu: 4×4 min +7,2 % za 8 týdnů, 30/15 s +8,7 % za 10 týdnů u cyklistů, většinou lehce a tvrdé dny tvrdě (polarizovaně) +11,7 % za 9 týdnů.',
  style: { look: 'golden', ui: 'classic', camera: 'orbit', lean: 1, grade: { sat: 1.5, con: 1.12 }, orbit: [0, 0.3, -0.25, -0.1, 0], words: { v: 2 } },
  acts: [['hook', 'hook'], ['one', 'one'], ['two', 'two'], ['three', 'three'], ['cta', 'cta']],
  lines: {
    hook: { say: 'Three ways to raise your V O two max. Number three is the most important.', captions: false, gain: 5,
      chunks: [['3 ways', 'THREE'], 'to raise your', ['VO2 max.', 'V|VO|VEE|VI'], ['Number 3', 'NUMBER'], 'is the most important.'] },
    one: { say: 'Way one: four by fours. Four minutes hard, three easy, four times: plus seven point two percent in eight weeks.',
      chunks: [['Way 1:', 'WAY'], ['4 by 4s.', 'FOUR'], ['4 minutes hard,', 'FOUR'], ['3 easy,', 'THREE'], ['4 times:', 'FOUR'], ['+7.2%', 'PLUS'], ['in 8 weeks.', 'IN']] },
    two: { say: 'Way two: thirty fifteens. Thirty seconds hard, fifteen easy, thirteen times. Cyclists gained eight point seven percent in ten weeks.',
      chunks: [['Way 2:', 'WAY'], ['30/15s.', 'THIRTY'], ['30 seconds hard,', 'THIRTY'], ['15 easy,', 'FIFTEEN'], ['13 times.', 'THIRTEEN'], ['Cyclists gained 8.7%', 'CYCLISTS'], ['in 10 weeks.', 'IN']] },
    three: { say: 'And number three, the big one: keep most of your riding easy. Only the hard days hard. Plus eleven point seven percent, the biggest gain of all!',
      chunks: [['And number 3,', 'AND'], 'the big one:', ['keep most', 'KEEP'], 'of your riding easy.', ['Only the hard days hard.', 'ONLY'], ['+11.7%,', 'PLUS'], 'the biggest gain', 'of all!'] },
    cta: { say: 'Send this to your training buddy. And follow for more.',
      chunks: ['Send this', 'to your', 'training buddy.', ['And follow', 'AND'], 'for more.'] }
  },
  // zvuk: efekty u čísel a přechodů, jemný rytmus pod hlasem (bez akordů)
  sfx: [{ at: 'hook:0', kind: 'pop' }, { at: 'hook:3', kind: 'ding' },
    { at: 'one:0', kind: 'pop' }, { at: 'one:5', kind: 'ding' },
    { at: 'two:0', kind: 'pop' }, { at: 'two:5', kind: 'ding' },
    { at: 'three:0', kind: 'riser' }, { at: 'three:0', kind: 'pop' }, { at: 'three:2', kind: 'shimmer' }, { at: 'three:5', kind: 'impact' }, { at: 'three:6', kind: 'ding' },
    { at: 'cta:0-0.15', kind: 'pop' }, { at: 'cta:1+0.1', kind: 'click' }, { at: 'cta:2+0.15', kind: 'click' }, { at: 'cta:3+0.1', kind: 'pop' }, { at: 'cta:4+0.2', kind: 'click' }],
  bed: 1,
  scenes: { hook: { type: 'free', amb: 0.12, draw: ride }, one: { type: 'free', amb: 0.12, draw: ride }, two: { type: 'free', amb: 0.12, draw: ride }, three: { type: 'free', amb: 0.12, draw: ride }, cta: { type: 'free', amb: 0.12, draw: ride } },
  // čísla ze studií (nepočítají se z fyziky): ve videu přesně jako ve studiích
  facts: () => [
    ['4×4 min (90–95 % SFmax, 3 min lehce), 3× týdně 8 týdnů, nárůst VO2max, % (Helgerud et al. 2007)', 7.2, 7.2, 0],
    ['30/15 s, 3 série po 13, 10 týdnů, trénovaní cyklisté, nárůst VO2max, % (Rønnestad et al. 2015)', 8.7, 8.7, 0],
    ['polarizovaný trénink 9 týdnů, dobře trénovaní vytrvalci, nárůst VO2peak, % (Stöggl & Sperlich 2014)', 11.7, 11.7, 0]
  ],
  sources: 'Helgerud J. et al. (2007) Aerobic high-intensity intervals improve VO2max more than moderate training. Med Sci Sports Exerc 39(4). Rønnestad B. R. et al. (2015) Short intervals induce superior training adaptations compared with long intervals in cyclists. Scand J Med Sci Sports 25(2) (malý vzorek: 9 a 7 cyklistů). Stöggl T., Sperlich B. (2014) Polarized training has greater impact on key endurance variables than threshold, high intensity, or high volume training. Front Physiol 5:33. Studie mají různé skupiny sportovců, proto karta říká „in studies“; plán týdne je ukázka, ne protokol studie.'
};
