// Video „Norwegian 4×4“ (autor 26. 11. 2026): předělávka reference the.better.run (52 s) do našeho formátu – stejné grafiky
// v našich barvách (budík VO2 MAX, mřížka 4 tréninků, 40 postaviček a štítky, sloupce „NO REAL CHANGE“, srdce a dvě sklenice,
// karta tréninku s grafem tepu a plánem týdne), realistický jezdec v krajině, hlas Liam, titulky se zvýrazněným slovem.
// Místo rychlejšího půlmaratonu rychlejší bike split, na konci „pošli kamarádovi a sleduj“. Čísla: Helgerud et al. 2007.
// Text hlasu je vlastní (formát a fakta podle reference, věty se nekopírují).
const ride = function (t, a) {
  // jezdec o kus níž (kamera výš a dál), ať se nad něj vejdou velké karty
  const VIEW = { cam: { pos: [330, 425, 1380], look: [0, 215, -60], fov: 40 }, road: { lanes: [-260], z0: -700, z1: 900, len: 40000, scenery: 'country' },
    riders: { A: { kit: 'purple', z: 60, over: { shortsLen: 0.86, gripIn: 0.22 } } } };
  const T = r => TR(r), st0 = (x, at, d) => tw(x, at, d || 0.4, E.io), END = id => ACT[id].end - 0.15;
  const rhythm = (x, a1, b1, per, p) => { const ph = ((x - a1) % per + per) % per, r = 0.18; const on = ph < r ? E.io(ph / r) : ph < p * per ? 1 : ph < p * per + r ? 1 - E.io((ph - p * per) / r) : 0; return on * st0(x, a1, 0.3) * (1 - st0(x, b1, 0.3)); };
  // úsilí: „blow up“ naplno, v tréninku rozjetí – tvrdě – lehce – 4× rytmus, jinak lehce
  const effort = x => clamp(0.28 + 0.6 * (st0(x, T('intro:1')) - st0(x, T('intro:3'))) + 0.1 * (st0(x, T('how:1')) - st0(x, T('how:2')))
    + 0.72 * (st0(x, T('how:2')) - st0(x, T('how:5'))) - 0.1 * (st0(x, T('how:5')) - st0(x, T('how:6'))) + 0.72 * rhythm(x, T('how:6'), T('week:0'), 1.4, 0.57));
  let dist = 0, crank = 0; for (let x = 0; x < t; x += 0.05) { const dt = Math.min(0.05, t - x), h = effort(x); dist += lerp(420, 660, h) * dt; crank += lerp(8.2, 11.4, h) * dt; }
  const h = effort(t), pose = 0.85 * h;
  scene3d(VIEW, { dist, riders: { A: { x: 0, pose, grip: 'base', crank, wheel: dist / 71 } } }, () => air3d('A', t, lerp(700, 980, h), lerp(0.9, 0.55, h), pose, 0.7 + 0.25 * h));
  // text háčku z titulků úvodní věty (varianty pro trial reels mají jiný háček, viz variants a series/variant.sh)
  classicUI(t, a, { hook: { line: 'hook', cy: 240, items: [{ t: L.hook.chunks[0].text, i: 0, size: 56 }, { t: L.hook.chunks[1].text, i: 1, big: true, size: 100 }] }, heads: {} });
  // 1) budík VO2 MAX: ručička se rozkývá a při „blow up“ vystřelí nahoru; pak název tréninku
  const nv = 0.18 + 0.3 * st0(t, T('hook:1'), 0.8) + 0.08 * Math.sin(t * 5) * (1 - st0(t, T('intro:1'), 0.3)) + 0.4 * tw(t, T('intro:1'), 0.9, E.back);
  n44Gauge(t, { a: 0.15, b: T('study:0') - 0.3, cx: 540, cy: 595, r: 150, label: 'BIKE SPLIT', inner: 'VO2 MAX', val: nv, dim: 1.25 * st0(t, T('intro:3'), 0.4) });
  // název tréninku přímo přes ztlumený budík (pod ním už je jezdec)
  n44Pop(t, T('intro:3'), T('study:0') - 0.3, 540, 605, () => { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 22; txt('THE NORWEGIAN', 540, 565, { size: 44, w: 800, f: F.U, ls: 2, c: C.ink }); txt('4×4', 540, 685, { size: 130, w: 800, f: F.U, ls: -4, c: C.pu }); ctx.restore(); });
  // 2) studie: 4 tréninky se stejnou prací, 40 mužů, 8 týdnů, 3× týdně
  n44Study(t, { a: T('study:0') - 0.2, b: T('res:0') + 0.05, y0: 330, head: '4 GROUPS · EQUAL WORK',
    tiles: [{ name: 'LONG SLOW', sub: '70% HR MAX', at: T('study:1'), lvl: 0.3 }, { name: 'THRESHOLD', sub: '85% HR MAX', at: T('study:1') + 0.25, lvl: 0.6 },
      { name: '15/15', sub: '90–95% HR MAX', at: T('study:1') + 0.5, lvl: 0.9 }, { name: '4×4', sub: '90–95% HR MAX', at: T('study:0'), lvl: 0.9, hl: true }],
    dots: { at: T('study:2'), n: 40 }, chips: [{ lab: '40 MEN', at: T('study:2') + 0.5 }, { lab: '8 WEEKS', at: T('study:3') }, { lab: '3× A WEEK', at: T('study:4') }, { lab: 'EQUAL WORK', at: T('study:5'), hl: true }] });
  // 3) výsledky: lehce a na prahu skoro nic, 15/15 +5,5 %, 4×4 +7,2 %
  // výsledky zůstanou svítit, dokud nenaskočí srdce (jinak by +7,2 % bylo vidět jen chvilku)
  n44Results(t, { a: T('res:0') - 0.1, b: T('heart:0') + 0.45, y0: 330, head: 'VO2 MAX CHANGE · 8 WEEKS', max: 8,
    bars: [{ name: 'LONG SLOW', val: 0.4, at: T('res:0'), grow: T('res:0'), grey: true }, { name: 'THRESHOLD', val: 0.4, at: T('res:1'), grow: T('res:1'), grey: true },
      { name: '15/15', val: 5.5, at: T('res:3'), grow: T('res:4') }, { name: '4×4', val: 7.2, at: T('res:5'), grow: T('res:6') }],
    tag: { lab: 'NO REAL CHANGE', at: T('res:2') }, src: 'HELGERUD ET AL. 2007 · MED SCI SPORTS EXERC' });
  // 4) srdce: po intervalech asi o 10 % víc krve na jeden úder
  n44Heart(t, { a: T('heart:0') + 0.3, b: END('heart'), y0: 330, head: 'BLOOD PER BEAT', at: { glass: T('heart:1'), after: T('heart:2'), pct: T('heart:2') + 0.5 }, pct: '+10%',
    foot: 'STROKE VOLUME · INTERVAL GROUPS', src: 'HELGERUD ET AL. 2007' });
  // 5) trénink: rozjetí 10 min, 4 min tvrdě (90–95 % SFmax), 3 min lehce, 4×; 1–2× týdně, zbytek lehce
  n44Session(t, { a: T('how:0') - 0.2, b: T('cta:0') - 0.3, y0: 300, low: h,
    state: [[T('how:0'), 'READY', false], [T('how:1'), 'WARM UP', false], [T('how:2'), 'HARD', true], [T('how:5'), 'EASY SPIN', false], [T('how:6'), 'HARD', true], [T('how:6') + 0.8, 'EASY SPIN', false], [T('how:6') + 1.4, 'HARD', true], [T('week:0'), 'EASY', false]],
    at: { warm: T('how:1'), hard: T('how:2'), band: T('how:3'), easy: T('how:5'), reps: T('how:6'), week: T('week:0'), rest: T('week:2') }, week: ['E', 'H', 'E', 'E', 'h', 'E', 'E'] });
  ctaCards(t, { share: T('cta:0') - 0.15, pick: T('cta:1') + 0.1, tap: T('cta:2') + 0.15, follow: T('cta:3') + 0.1, ftap: T('cta:4') + 0.2 });
};
module.exports = {
  title: 'study-norwegian-4x4',
  about: 'Předělávka reference (rychlejší půlmaraton → rychlejší bike split): norská 4×4 ve studii Helgerud et al. 2007 proti třem jiným tréninkům se stejnou prací. 40 mužů, 8 týdnů, 3× týdně: lehce a na prahu se VO2 max skoro nehnulo, 15/15 +5,5 %, 4×4 +7,2 %, srdce po intervalech asi o 10 % víc krve na úder. Pak přesný trénink a plán týdne.',
  style: { look: 'golden', ui: 'classic', camera: 'orbit', lean: 1, grade: { sat: 1.5, con: 1.12 }, orbit: [0, 0.12, -0.1, 0.1, -0.12, 0], orbitDur: 3, words: { v: 2 } },
  acts: [['hook', 'hook', 'intro'], ['study', 'study'], ['res', 'res'], ['heart', 'heart'], ['how', 'how', 'week'], ['cta', 'cta']],
  lines: {
    hook: { say: 'Want a faster bike split?', captions: false, gain: 5, chunks: [['Want a faster', 'WANT'], ['bike split?', 'BIKE']] },
    // vlastní text (fakta ze studie, formulace naše; text reference se nekopíruje)
    intro: { say: "There's one session that boosts your V O two max fast: the Norwegian four by four.",
      chunks: [["There's one session", "THERE'S|THERES|THERE"], ['that boosts', 'THAT'], ['your VO2 max fast:', 'YOUR'], ['the Norwegian', 'THE'], ['4 by 4.', 'FOUR']] },
    study: { say: 'A study pitted it against three other sessions. Forty moderately fit men, eight weeks, three workouts a week, every group doing equal total work.',
      chunks: [['A study pitted it', 'A'], ['against 3 other sessions.', 'AGAINST'], ['40 moderately fit men,', 'FORTY'], ['8 weeks,', 'EIGHT'], ['3 workouts a week,', 'THREE'], ['every group doing', 'EVERY'], ['equal total work.', 'EQUAL']] },
    res: { say: 'Long easy sessions and threshold work? Almost no change. Fifteen fifteen intervals: up five point five percent. The four by four: up seven point two percent!',
      chunks: [['Long easy sessions', 'LONG'], ['and threshold work?', 'AND'], ['Almost no change.', 'ALMOST'], ['15/15 intervals:', 'FIFTEEN'], ['up 5.5%.', 'UP'], ['The 4 by 4:', 'THE'], ['up 7.2%!', 'UP']] },
    heart: { say: 'On top of that, each heartbeat pushed out about ten percent more blood.',
      chunks: [['On top of that,', 'ON'], ['each heartbeat', 'EACH'], ['pushed out about', 'PUSHED'], ['10% more blood.', 'TEN']] },
    how: { say: 'The session: ten minutes to warm up. Then four hard minutes at ninety to ninety-five percent of your max heart rate. Spin easy for three. Do four rounds.',
      chunks: [['The session:', 'THE'], ['10 minutes to warm up.', 'TEN'], ['Then 4 hard minutes', 'THEN'], ['at 90 to 95%', 'AT'], ['of your max heart rate.', 'OF'], ['Spin easy for 3.', 'SPIN'], ['Do 4 rounds.', 'DO']] },
    week: { say: 'One or two of these a week is plenty. Ride easy on the other days.',
      chunks: [['1 or 2 of these', 'ONE'], ['a week is plenty.', 'A'], ['Ride easy', 'RIDE'], ['on the other days.', 'ON']] },
    cta: { say: 'Send this to your training buddy. And follow for more.',
      chunks: ['Send this', 'to your', 'training buddy.', ['And follow', 'AND'], 'for more.'] }
  },
  // varianty háčku pro trial reels (autor 28. 11. 2026): přerenderuje se jen úvod do konce aktu hook, zbytek se vezme ze
  // základního videa (bash video-kit/series/variant.sh <popis.js> <id>); háček má 2 titulky, druhý je velký
  variants: {
    stuck: { say: 'Stuck at the same bike split?', chunks: [['Stuck at the same', 'STUCK'], ['bike split?', 'BIKE']] },
    easy: { say: "More easy miles won't raise your ceiling.", chunks: [['More easy miles', 'MORE'], ["won't raise your ceiling.", "WON'T|WONT|WON"]] },
    four: { say: 'Four minutes, four times.', chunks: [['4 minutes,', 'FOUR'], ['4 times.', 'FOUR']] }
  },
  sfx: [{ at: 'hook:0', kind: 'pop' }, { at: 'intro:1', kind: 'riser' }, { at: 'intro:3', kind: 'impact' },
    { at: 'study:0', kind: 'pop' }, { at: 'study:1', kind: 'click' }, { at: 'study:2', kind: 'shimmer' }, { at: 'study:3', kind: 'click' }, { at: 'study:4', kind: 'click' }, { at: 'study:5', kind: 'ding' },
    { at: 'res:0', kind: 'pop' }, { at: 'res:2', kind: 'click' }, { at: 'res:4', kind: 'ding' }, { at: 'res:6', kind: 'impact' },
    { at: 'heart:0', kind: 'pop' }, { at: 'heart:2', kind: 'ding' },
    { at: 'how:0', kind: 'pop' }, { at: 'how:2', kind: 'click' }, { at: 'how:3', kind: 'click' }, { at: 'how:5', kind: 'click' }, { at: 'how:6', kind: 'shimmer' }, { at: 'week:0', kind: 'pop' },
    { at: 'cta:0-0.15', kind: 'pop' }, { at: 'cta:1+0.1', kind: 'click' }, { at: 'cta:2+0.15', kind: 'click' }, { at: 'cta:3+0.1', kind: 'pop' }, { at: 'cta:4+0.2', kind: 'click' }],
  bed: 1,
  scenes: { hook: { type: 'free', amb: 0.12, draw: ride }, study: { type: 'free', amb: 0.12, draw: ride }, res: { type: 'free', amb: 0.12, draw: ride }, heart: { type: 'free', amb: 0.12, draw: ride }, how: { type: 'free', amb: 0.12, draw: ride }, cta: { type: 'free', amb: 0.12, draw: ride } },
  facts: () => [
    ['počet mužů ve studii (Helgerud et al. 2007)', 40, 40, 0],
    ['délka studie, týdny', 8, 8, 0],
    ['tréninků týdně', 3, 3, 0],
    ['15/15, nárůst VO2max za 8 týdnů, %', 5.5, 5.5, 0],
    ['4×4 min, nárůst VO2max za 8 týdnů, %', 7.2, 7.2, 0],
    ['tepový objem po intervalech, asi o %', 10, 10, 0]
  ],
  sources: 'Helgerud J. et al. (2007) Aerobic high-intensity intervals improve VO2max more than moderate training. Med Sci Sports Exerc 39(4): 40 zdravých středně trénovaných mužů, 4 skupiny se stejnou prací (lehce 70 % SFmax, práh 85 % SFmax, 15/15 a 4×4 v 90–95 % SFmax), 3× týdně 8 týdnů; lehce a práh bez významné změny VO2max, 15/15 +5,5 %, 4×4 +7,2 %; tepový objem po intervalech asi +10 %. Studie byla v běhu; 4×4 se stejně používá i na kole. „Lehce a na prahu“ ve videu jako malé šedé sloupce bez čísla (změna nebyla významná). Rada 1–2× týdně je běžné trenérské doporučení, ne protokol studie.'
};
