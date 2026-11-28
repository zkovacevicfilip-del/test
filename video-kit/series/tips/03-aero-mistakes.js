// Video „3 chyby v aero pozici“ (autor 28. 11. 2026): vzhled a efekty jako video o VO2 max (odznak kapitoly, karta, která se
// staví s hlasem, karta výsledku s počítáním, rychlý přechod kapkou, ukazatel postupu, titulky se zvýrazněným slovem,
// zvuky a jemný rytmus), jezdec na venkovské silnici. Chyby od nejmenší ztráty k největší (při 40 km/h, model fyziky):
// 1 koukání do cyklocomputeru (hlava dolů, ocas helmy nahoru, CdA +0,008 → 7 W), 2 ramena do šířky (CdA +0,012 → 10 W,
// pohled zepředu s vyšrafovanou ušetřenou plochou), 3 sedání z aero polohy, když to bolí (CdA +0,059 → 50 W, víc než 1 + 2).
// Varianty háčku pro trial reels: variants (bash video-kit/series/variant.sh), zoom: series/zoom.sh.
const ride = function (t, a) {
  const T = r => TR(r);
  // kamera: z boku; u chyby 2 zepředu blíž a níž (jako u videa o časovce)
  const cam = window.CAM || {}, front = clamp(((cam.o || 0) - 0.3) / 0.6), k = lerp(1, 0.55, front), Lk = [0, lerp(175, 210, front), lerp(-60, 40, front)];
  const VIEW = { cam: { pos: [Lk[0] + 300 * k, lerp(380, 300, front), Lk[2] + 1310 * k], look: Lk, fov: 40 }, road: { lanes: [-260], z0: -700, z1: 900, len: 40000, scenery: 'country' },
    riders: { A: { kit: 'purple', z: 60, over: { shortsLen: 0.86, gripIn: 0.22 } } } };
  // jezdec: chyba 1 hlava dolů (look) a zpět; chyba 2 ramena do šířky → k sobě (shrug); chyba 3 sedne (poloha 0) a zase dolů
  const look = 0.45 * (tw(t, T('one:2'), 0.6, E.io) - tw(t, T('one:5'), 0.6, E.io));
  const shrug = tw(t, T('two:4'), 0.9, E.io) * (1 - tw(t, T('three:0'), 0.6, E.io));
  const pose = 1 - tw(t, T('three:2'), 0.8, E.io) * (1 - tw(t, T('three:8'), 0.8, E.io)), up = 1 - pose;
  const dist = t * 560;
  const st = { dist, riders: { A: { x: 0, pose, look, shrug, crank: t * 9.4, wheel: dist / 71 } },
    sil: { id: 'A', k: front * tw(t, T('two:4') - 0.3, 0.5), ghost: { pose: 1, shrug: 0 } } };
  scene3d(VIEW, st, () => air3d('A', t, lerp(820, 860, up), lerp(0.4, 1, up), pose, 0.9 * (1 - front)));
  classicUI(t, a, {
    // háček: „3 MISTAKES“ a další dva titulky úvodní věty (varianty mají jiná slova), pak slib o trojce
    hook: { line: 'hook', cy: 430, items: [{ mark: [['3 ', 'ink'], ['MISTAKES', 'pu']], i: 0, size: 130 }, { t: L.hook.chunks[1].text, i: 1, size: 54 }, { t: L.hook.chunks[2].text, i: 2, size: 54, gap: 14 }, { t: '#3 is the worst', at: 'promise:0', big: true, size: 90 }] },
    heads: {},
    tips: { at: [T('one:0'), T('two:0'), T('three:0')], end: T('cta:0') }
  });
  const y0 = 380, end = id => ACT[id].end - 0.25, cf = id => T(id + ':0') + 1.3, af = (id, r) => Math.max(T(r), cf(id) + 0.15);
  const bA = chapterBadge(t, { v: 1, at: [T('one:0'), T('two:0'), T('three:0')], names: ['Eyes down', 'Wide shoulders', 'Sitting up'], dur: 1.3 });
  mistakeCard(t, { y0, title: '1 · Staring at your computer', from: cf('one'), to: end('one'), out: T('one:6'), hide: bA,
    wrong: { label: 'Chin down, helmet tail up', at: af('one', 'one:2') }, fix: { label: 'Eyes up the road', at: af('one', 'one:5') } });
  resultCard(t, { y0, at: T('one:6'), out: T('two:0') - 0.35, value: 7, fmt: 'w', label: 'WASTED AT 40 KM/H', sub: 'just from looking down', src: 'AERO MODEL · CdA +0.008' });
  mistakeCard(t, { y0, title: '2 · Shoulders wide', from: cf('two'), to: end('two'), out: T('two:6'), hide: bA,
    wrong: { label: 'Chest open to the wind', at: af('two', 'two:2') }, fix: { label: 'Shoulders in, elbows narrow', at: af('two', 'two:4') } });
  resultCard(t, { y0, at: T('two:6'), out: T('three:0') - 0.35, value: 10, fmt: 'w', label: 'WASTED AT 40 KM/H', sub: 'from a wider frontal area', src: 'AERO MODEL · CdA +0.012' });
  mistakeCard(t, { y0, title: '3 · Sitting up when it hurts', from: cf('three'), to: end('three'), out: T('three:6'), hide: bA,
    wrong: { label: 'Off the aero bars', at: af('three', 'three:2') }, fix: { label: 'Stay low, even when it burns', at: T('three:8') } });
  resultCard(t, { y0, at: T('three:6'), out: T('cta:0') - 0.3, value: 50, fmt: 'w', label: 'WASTED AT 40 KM/H', sub: 'more than 1 + 2 combined', src: 'AERO MODEL · CdA +0.059' });
  cardMorph(t, T('two:0') - 0.35, y0); cardMorph(t, T('three:0') - 0.35, y0);
  ctaCards(t, { share: T('cta:0') - 0.15, pick: T('cta:1') + 0.1, tap: T('cta:2') + 0.15, follow: T('cta:3') + 0.1, ftap: T('cta:4') + 0.2 });
};
module.exports = {
  title: 'tips-aero-mistakes',
  about: 'Tři chyby v aero pozici od nejmenší ztráty po největší (40 km/h): koukání do cyklocomputeru 7 W, ramena do šířky 10 W, sedání z aero polohy, když to bolí, 50 W – víc než první dvě dohromady.',
  style: { look: 'golden', ui: 'classic', camera: 'orbit', lean: 1, grade: { sat: 1.5, con: 1.12 }, orbit: [0, 0.15, 1.2, 0.05, 0], orbitDur: 2.2, words: { v: 2 } },
  acts: [['hook', 'hook', 'promise'], ['one', 'one'], ['two', 'two'], ['three', 'three'], ['cta', 'cta']],
  lines: {
    hook: { say: 'These three mistakes are costing you a lot of time on the bike.', captions: false, gain: 5,
      chunks: [['These 3 mistakes', 'THESE'], ['are costing you a lot', 'ARE'], ['of time on the bike.', 'OF']] },
    promise: { say: 'Number three is the most crucial mistake most people make.', captions: false, gain: 5,
      chunks: [['Number 3', 'NUMBER'], ['is the most crucial', 'IS'], ['mistake most people make.', 'MISTAKE']] },
    one: { say: "One: staring at your bike computer. Your chin drops, and your helmet tail points at the sky. Eyes up the road: seven watts back.",
      chunks: [['1: staring at', 'ONE'], ['your bike computer.', 'YOUR'], ['Your chin drops,', 'YOUR'], ['and your helmet tail', 'AND'], ['points at the sky.', 'POINTS'], ['Eyes up the road:', 'EYES|EYE'], ['7 watts back.', 'SEVEN']] },
    two: { say: 'Two: shoulders wide like a table. Your chest catches all the wind. Pull your shoulders in, narrow your elbows: ten more watts.',
      chunks: [['2: shoulders wide', 'TWO'], ['like a table.', 'LIKE'], ['Your chest catches', 'YOUR'], ['all the wind.', 'ALL'], ['Pull your shoulders in,', 'PULL'], ['narrow your elbows:', 'NARROW'], ['10 more watts.', 'TEN']] },
    three: { say: 'And three, the big one: sitting up when it hurts. Every time you leave the aero bars, you give away fifty watts. More than one and two combined. Stay low, even when it burns!',
      chunks: [['And 3,', 'AND'], 'the big one:', ['sitting up', 'SITTING'], ['when it hurts.', 'WHEN'], ['Every time you leave', 'EVERY'], ['the aero bars,', 'THE'], ['you give away 50 watts.', 'YOU'], ['More than 1 and 2 combined.', 'MORE'], ['Stay low,', 'STAY'], ['even when it burns!', 'EVEN']] },
    cta: { say: 'Send this to the friend who always sits up. And follow for more free speed.',
      chunks: ['Send this', 'to the friend', 'who always sits up.', ['And follow', 'AND'], 'for more free speed.'] }
  },
  // varianty háčku pro trial reels (autor 28. 11. 2026, „původní styl“): 3 titulky, první je „3 … mistakes“ (na obrazovce 3 MISTAKES)
  variants: {
    aero: { say: 'Three aero mistakes that cost you free speed.', chunks: [['3 aero mistakes', 'THREE'], ['that cost you', 'THAT'], ['free speed.', 'FREE']] },
    slow: { say: 'Three position mistakes slowing you down every ride.', chunks: [['3 position mistakes', 'THREE'], ['slowing you down', 'SLOWING'], ['every ride.', 'EVERY']] }
  },
  sfx: [{ at: 'hook:0', kind: 'pop' }, { at: 'promise:0', kind: 'ding' },
    { at: 'one:0', kind: 'pop' }, { at: 'one:2', kind: 'click' }, { at: 'one:5', kind: 'shimmer' }, { at: 'one:6', kind: 'ding' },
    { at: 'two:0', kind: 'pop' }, { at: 'two:2', kind: 'click' }, { at: 'two:4', kind: 'shimmer' }, { at: 'two:6', kind: 'ding' },
    { at: 'three:0', kind: 'riser' }, { at: 'three:0', kind: 'pop' }, { at: 'three:2', kind: 'click' }, { at: 'three:6', kind: 'impact' }, { at: 'three:8', kind: 'shimmer' },
    { at: 'cta:0-0.15', kind: 'pop' }, { at: 'cta:1+0.1', kind: 'click' }, { at: 'cta:2+0.15', kind: 'click' }, { at: 'cta:3+0.1', kind: 'pop' }, { at: 'cta:4+0.2', kind: 'click' }],
  bed: 1,
  scenes: { hook: { type: 'free', amb: 0.12, draw: ride }, one: { type: 'free', amb: 0.12, draw: ride }, two: { type: 'free', amb: 0.12, draw: ride }, three: { type: 'free', amb: 0.12, draw: ride }, cta: { type: 'free', amb: 0.12, draw: ride } },
  facts: P => {
    const w = c => P.watts(40, { cda: c }), b = 0.25;
    return [
      ['chyba 1: hlava dolů, ocas helmy nahoru (CdA 0,25 → 0,258), 40 km/h, W', w(b + 0.008) - w(b), 7, 0.5],
      ['chyba 2: ramena do šířky (CdA 0,25 → 0,262), 40 km/h, W', w(b + 0.012) - w(b), 10, 0.5],
      ['chyba 3: sedání z aero polohy na základní řídítko (CdA 0,25 → 0,309), 40 km/h, W', w(b + 0.059) - w(b), 50, 0.5],
      ['chyba 3 minus chyby 1 a 2 dohromady, W (ve videu „more than 1 and 2 combined“)', (w(b + 0.059) - w(b)) - (w(b + 0.008) - w(b)) - (w(b + 0.012) - w(b)), 33, 1]
    ];
  },
  sources: 'Model fyziky sady (84 kg s kolem, 40 km/h, rovina, bezvětří, Crr 0,004). Rozdíly CdA jsou typické hodnoty z měření v tunelu a na velodromu: sklopená hlava s ocasem časovkářské helmy nahoru asi +0,005 až +0,015, ramena do šířky proti stáhnutým asi +0,01 až +0,02, vzpřímeně na základním řídítku proti aero nástavcům asi +0,05 až +0,07; u konkrétního jezdce se liší.'
};
