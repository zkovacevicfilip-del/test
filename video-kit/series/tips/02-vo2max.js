// Video „3 tréninky na VO2 max“ (autor 26. 11. 2026 podle reference the.better.run): formát reference s naším tréninkem,
// barvami a realistickým jezdcem. Každá kapitola: odznak (asi 2 s) → karta tréninku, která se staví s hlasem (bloky tvrdě
// a lehce, štítky s délkou, počítadlo opakování, čára VO2 MAX; asi 4 s) → karta výsledku s číslem ze studie (2–3 s).
// Tréninky: 1 Tabata (+7 ml/kg/min za 6 týdnů, Tabata 1996), 2 4×4 min (+7,2 % za 8 týdnů, Helgerud 2007),
// 3 30/15 s (+8,7 % za 10 týdnů u cyklistů, Rønnestad 2015). Jezdec jede tvrdě a lehce podle toho, o čem se mluví.
const ride = function (t, a) {
  const WV = 1, BG = 'land';   // volba autora 26. 11. 2026: karta tréninku 1 = bloky, pozadí krajina (2 profil, 'studio', 'dim' zůstávají v kódu)
  const far = BG === 'studio' ? 1.5 : BG === 'dim' ? 1.25 : 1, up = BG === 'studio' ? 70 : BG === 'dim' ? 40 : 0;
  const VIEW = { cam: { pos: [300 * far, 380 + up, -60 + 1310 * far], look: [0, 175 + up, -60], fov: 40 }, road: { lanes: [-260], z0: -700, z1: 900, len: 40000, scenery: 'country' },
    riders: { A: { kit: 'purple', z: 60, over: { shortsLen: 0.86, gripIn: 0.22 } } } };
  const T = r => TR(r), st0 = (x, at, d) => tw(x, at, d || 0.4, E.io);
  // rytmus intervalů zrychleně (tvrdě p dílu, lehce zbytek), obálka od a do b
  const rhythm = (x, a1, b1, per, p) => { const ph = ((x - a1) % per + per) % per, r = 0.18; const on = ph < r ? E.io(ph / r) : ph < p * per ? 1 : ph < p * per + r ? 1 - E.io((ph - p * per) / r) : 0; return on * st0(x, a1, 0.3) * (1 - st0(x, b1, 0.3)); };
  // úsilí 0 (lehce) až 1 (tvrdě) podle toho, co se právě říká
  const effort = x => {
    let h = 0.2;
    h += 0.8 * (st0(x, T('one:1')) - st0(x, T('one:2'))) + 0.8 * rhythm(x, T('one:3'), T('one:5'), 0.9, 0.66);
    h += 0.7 * (st0(x, T('two:2')) - st0(x, T('two:3'))) + 0.7 * rhythm(x, T('two:4'), T('two:5'), 1.6, 0.57);
    h += 0.75 * (st0(x, T('three:3')) - st0(x, T('three:4'))) + 0.75 * rhythm(x, T('three:5'), T('three:8'), 1.2, 0.66);
    return clamp(h);
  };
  let dist = 0, crank = 0; for (let x = 0; x < t; x += 0.05) { const dt = Math.min(0.05, t - x), h = effort(x); dist += lerp(420, 660, h) * dt; crank += lerp(8.2, 11.4, h) * dt; }
  const h = effort(t), pose = 0.85 * h;
  // ztmavená krajina: tmavá vrstva mezi silnicí s krajinou a jezdcem (jezdec zůstane světlý)
  const dimBg = () => { if (BG !== 'dim') return; ctx.save(); ctx.fillStyle = 'rgba(12,13,15,0.62)'; ctx.fillRect(-300, -300, 1700, 2500); ctx.restore(); };
  scene3d(VIEW, { dist, riders: { A: { x: 0, pose, grip: 'base', crank, wheel: dist / 71 } } }, () => { dimBg(); air3d('A', t, lerp(700, 980, h), lerp(0.9, 0.55, h), pose, 0.7 + 0.25 * h); });
  classicUI(t, a, {
    hook: { line: 'hook', cy: 440, items: [{ mark: [['3 ', 'ink'], ['SESSIONS', 'pu']], i: 0, size: 130 }, { t: 'to raise your', i: 1, size: 56 }, { t: 'VO2 max', i: 2, size: 56, gap: 14 }, { t: '#3 matters most', i: 3, big: true, size: 92 }] },
    heads: {},
    tips: { at: [T('one:0'), T('two:0'), T('three:0')], end: T('cta:0') }
  });
  const y0 = BG === 'land' ? 380 : 470;
  // odznak 1,3 s (jméno tréninku zazní hned na začátku), pak karta tréninku; první blok naskočí až s kartou, ať se staví s hlasem
  const bA = chapterBadge(t, { v: 1, at: [T('one:0'), T('two:0'), T('three:0')], names: ['Tabata', '4×4 min', '30/15s'], dur: 1.3 });
  const end = id => ACT[id].end - 0.25, cf = id => T(id + ':0') + 1.3, af = (id, r) => Math.max(T(r), cf(id) + 0.15);
  workoutCard(t, { v: WV, y0, title: '1 · Tabata', from: cf('one'), to: end('one'), out: T('one:5'), hide: bA, reps: 8, sets: 1,
    hard: { label: '20 S ALL OUT', dur: 20, lvl: 1 }, easy: { label: '10 S REST', dur: 10, lvl: 0.12 }, line: { label: 'VO2 MAX', lvl: 0.72 },
    at: { hard: af('one', 'one:1'), easy: af('one', 'one:2'), reps: T('one:3'), line: T('one:4') } });
  resultCard(t, { y0, at: T('one:5'), out: T('two:0') - 0.35, value: 7, fmt: 'ml', label: 'VO2 MAX', sub: 'ml/kg/min in 6 weeks', src: 'TABATA ET AL. 1996 · 5× A WEEK' });
  workoutCard(t, { v: WV, y0, title: '2 · 4×4 min', from: cf('two'), to: end('two'), out: T('two:5'), hide: bA, reps: 4, sets: 1,
    hard: { label: '4 MIN HARD', dur: 240, lvl: 0.72 }, easy: { label: '3 MIN EASY', dur: 180, lvl: 0.3 }, line: { label: 'VO2 MAX', lvl: 0.72 },
    at: { hard: af('two', 'two:2'), easy: af('two', 'two:3'), reps: T('two:4'), line: T('two:2') + 0.5 } });
  resultCard(t, { y0, at: T('two:5'), out: T('three:0') - 0.35, value: 7.2, label: 'VO2 MAX', sub: 'in 8 weeks', src: 'HELGERUD ET AL. 2007 · 3× A WEEK' });
  workoutCard(t, { v: WV, y0, title: '3 · 30/15s', from: cf('three'), to: end('three'), out: T('three:8'), hide: bA, reps: 13, sets: 3,
    hard: { label: '30 S HARD', dur: 30, lvl: 0.86 }, easy: { label: '15 S EASY', dur: 15, lvl: 0.3 }, line: { label: 'VO2 MAX', lvl: 0.72 },
    at: { hard: af('three', 'three:3'), easy: af('three', 'three:4'), reps: T('three:5'), sets: T('three:6'), line: T('three:7') } });
  resultCard(t, { y0, at: T('three:8'), out: T('cta:0') - 0.3, value: 8.7, label: 'VO2 MAX · CYCLISTS', sub: 'in 10 weeks', src: 'RØNNESTAD ET AL. 2015 · 9 CYCLISTS' });
  // rychlý přechod: karta výsledku se smrskne do kapky, z které vyskočí odznak další kapitoly
  cardMorph(t, T('two:0') - 0.35, y0); cardMorph(t, T('three:0') - 0.35, y0);
  ctaCards(t, { share: T('cta:0') - 0.15, pick: T('cta:1') + 0.1, tap: T('cta:2') + 0.15, follow: T('cta:3') + 0.1, ftap: T('cta:4') + 0.2 });
};
module.exports = {
  title: 'tips-vo2max',
  about: 'Tři intervalové tréninky na VO2 max ve formátu reference: Tabata +7 ml/kg/min za 6 týdnů, 4×4 min +7,2 % za 8 týdnů, 30/15 s +8,7 % za 10 týdnů u cyklistů. U každého je vidět, jak trénink přesně vypadá.',
  style: { look: 'golden', ui: 'classic', camera: 'orbit', lean: 1, grade: { sat: 1.5, con: 1.12 }, orbit: [0, 0.14, -0.1, 0.12, 0], orbitDur: 3, words: { v: 2 } },
  acts: [['hook', 'hook'], ['one', 'one'], ['two', 'two'], ['three', 'three'], ['cta', 'cta']],
  lines: {
    hook: { say: 'Three interval sessions that raise your V O two max. Number three is the most important.', captions: false, gain: 5,
      chunks: [['3 interval sessions', 'THREE'], 'that raise your', ['VO2 max.', 'V|VO|VEE|VI'], ['Number 3', 'NUMBER'], 'is the most important.'] },
    one: { say: 'One: Tabata. Twenty seconds all out, ten seconds rest, eight times. Just four minutes, and V O two max rose seven points in six weeks.',
      chunks: [['1: Tabata.', 'ONE'], ['20 seconds all out,', 'TWENTY'], ['10 seconds rest,', 'TEN'], ['8 times.', 'EIGHT'], ['Just 4 minutes,', 'JUST'], ['and VO2 max rose', 'AND'], ['7 points in 6 weeks.', 'SEVEN']] },
    two: { say: 'Two: four by fours. Four minutes hard, three minutes easy, four times. Plus seven point two percent in eight weeks.',
      chunks: [['2:', 'TWO'], ['4 by 4s.', 'FOUR'], ['4 minutes hard,', 'FOUR'], ['3 minutes easy,', 'THREE'], ['4 times.', 'FOUR'], ['+7.2%', 'PLUS'], ['in 8 weeks.', 'IN']] },
    three: { say: 'And three, the big one: thirty fifteens. Thirty seconds hard, fifteen easy, thirteen times, three sets. Tested on cyclists: plus eight point seven percent in ten weeks!',
      chunks: [['And 3,', 'AND'], 'the big one:', ['30/15s.', 'THIRTY'], ['30 seconds hard,', 'THIRTY'], ['15 easy,', 'FIFTEEN'], ['13 times,', 'THIRTEEN'], ['3 sets.', 'THREE'], ['Tested on cyclists:', 'TESTED'], ['+8.7%', 'PLUS'], ['in 10 weeks!', 'IN']] },
    cta: { say: 'Send this to your training buddy. And follow for more.',
      chunks: ['Send this', 'to your', 'training buddy.', ['And follow', 'AND'], 'for more.'] }
  },
  // zvuk: efekty u odznaků, bloků a čísel, jemný rytmus pod hlasem (bez akordů)
  sfx: [{ at: 'hook:0', kind: 'pop' }, { at: 'hook:3', kind: 'ding' },
    { at: 'one:0', kind: 'pop' }, { at: 'one:1', kind: 'click' }, { at: 'one:2', kind: 'click' }, { at: 'one:3', kind: 'shimmer' }, { at: 'one:5', kind: 'ding' },
    { at: 'two:0', kind: 'pop' }, { at: 'two:2', kind: 'click' }, { at: 'two:3', kind: 'click' }, { at: 'two:4', kind: 'shimmer' }, { at: 'two:5', kind: 'ding' },
    { at: 'three:0', kind: 'riser' }, { at: 'three:0', kind: 'pop' }, { at: 'three:3', kind: 'click' }, { at: 'three:4', kind: 'click' }, { at: 'three:5', kind: 'shimmer' }, { at: 'three:8', kind: 'impact' },
    { at: 'cta:0-0.15', kind: 'pop' }, { at: 'cta:1+0.1', kind: 'click' }, { at: 'cta:2+0.15', kind: 'click' }, { at: 'cta:3+0.1', kind: 'pop' }, { at: 'cta:4+0.2', kind: 'click' }],
  bed: 1,
  scenes: { hook: { type: 'free', amb: 0.12, draw: ride }, one: { type: 'free', amb: 0.12, draw: ride }, two: { type: 'free', amb: 0.12, draw: ride }, three: { type: 'free', amb: 0.12, draw: ride }, cta: { type: 'free', amb: 0.12, draw: ride } },
  // čísla ze studií (nepočítají se z fyziky): ve videu přesně jako ve studiích
  facts: () => [
    ['Tabata 20/10 s × 8 (asi 170 % VO2max), 5× týdně 6 týdnů, nárůst VO2max, ml/kg/min (Tabata et al. 1996)', 7, 7, 0],
    ['4×4 min (90–95 % SFmax, 3 min lehce), 3× týdně 8 týdnů, nárůst VO2max, % (Helgerud et al. 2007)', 7.2, 7.2, 0],
    ['30/15 s, 3 série po 13, 10 týdnů, trénovaní cyklisté (9), nárůst VO2max, % (Rønnestad et al. 2015)', 8.7, 8.7, 0]
  ],
  sources: 'Tabata I. et al. (1996) Effects of moderate-intensity endurance and high-intensity intermittent training on anaerobic capacity and VO2max. Med Sci Sports Exerc 28(10) (7 mužů, 5× týdně, 6 týdnů). Helgerud J. et al. (2007) Aerobic high-intensity intervals improve VO2max more than moderate training. Med Sci Sports Exerc 39(4). Rønnestad B. R. et al. (2015) Short intervals induce superior training adaptations compared with long intervals in cyclists. Scand J Med Sci Sports 25(2) (malý vzorek, pozdější studie výsledek ne vždy zopakovaly). Výška bloků na kartě tréninku je jen orientační (tvrdost úseku), čára VO2 MAX taky.'
};
