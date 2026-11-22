// Realistický formát „ride“ s texty původní šablony What if (autor 22. 11. 2026): jeden jezdec v krajině za zlaté hodinky,
// ujíždějící asfalt, hlas Liam, nápis whatIF, nadpisy nahoře, titulky dole, švih kamery a fialový stírací přechod.
// Na konci „pošli kamarádovi a sleduj“ (karty přes krajinu, karta profilu wattIF).
const ride = function (t, a) {
  // pohled kamery, silnice a jezdec (popis musí být uvnitř funkce, do scenes.js se přenáší jen ona)
  const VIEW = { cam: { pos: [300, 380, 1250], look: [0, 175, -60], fov: 40 }, road: { lanes: [-260], z0: -700, z1: 900 }, riders: { A: { kit: 'purple', z: 60 } } };
  const T = r => TR(r), tLow = T('low:0'), tTip = T('tip:3');
  // vzpřímený sprint → nízko nad řídítky („gets low“), na konci rada „chest low“ zase nízko; ruce pořád na základním řídítku
  const pose = 1.6 * tw(t, tLow, 0.8, E.io) - 1.6 * tw(t, T('why:0'), 0.8, E.io) + 1.6 * tw(t, tTip, 0.8, E.io), low = clamp(pose / 1.6);
  const dist = t * lerp(780, 830, low);
  const st = { dist, riders: { A: { x: 0, pose, grip: 'base', crank: t * 11.5, wheel: dist / 71 } } };
  scene3d(VIEW, st, () => air3d('A', t, lerp(1100, 1180, low), lerp(1, 0.45, low), pose, 0.95));
  const tag = (s, at, out, c, size) => tag3d('A', pose, s, t, at, out, { c, size });
  tag('CdA 0.35', T('high:0'), T('high:2') - 0.1); tag('58.9 km/h', T('high:2'), T('low:0') - 0.1, null, 46);
  tag('CdA 0.30', T('low:1'), T('low:3') - 0.1, 'pu'); tag('61.9 km/h', T('low:3'), T('why:0') - 0.1, 'pu', 46);
  // texty z původního videa (nadpisy scén race a rider)
  classicUI(t, a, {
    hook: { line: 'hook', cy: 430, items: [{ whatIf: true, i: 0, size: 140 }, { t: 'the sprint', i: 1, size: 56 }, { t: 'is decided by', i: 2, size: 56 }, { t: 'your elbows,', i: 3, big: true, size: 104 }, { t: 'not your legs?', i: 4, size: 56 }] },
    heads: {
      race: [{ at: 'two:1', big: '1,000 W', c: 'ink', sub: 'same rider', subAt: 'two:0' }, { at: 'low:3', big: '+3 km/h', sub: 'same watts · lower position' }, { at: 'gap:2', big: '10 m', sub: 'ahead after 200 m' }],
      tip: [{ at: 'why:0', label: 'AT 60 KM/H', big: '90%+', bigAt: 'why:1', sub: 'of that power fights the air', subAt: 'why:2' }, { at: 'tip:0', title: 'Same legs', big: 'same watts', bigAt: 'tip:1', c: 'ink' }, { at: 'tip:3', big: 'Chest low', sub: 'elbows in · eyes up', subAt: 'tip:4' }]
    }
  });
  ctaCards(t, { share: T('cta:0'), pick: T('cta:1'), tap: T('cta:2') + 0.5, follow: T('cta:4'), ftap: T('cta:5') });
};
module.exports = {
  title: 'what-if-sprint-position',
  about: 'Jeden sprinter se stejnými 1000 W: vzpřímeně a široko 58,9 km/h, nízko nad řídítky 61,9 km/h. Na posledních 200 metrech je to asi 10 metrů náskoku.',
  style: { look: 'golden', ui: 'classic', camera: 'whip', overlay: 'wipe' },
  acts: [['hook', 'hook'], ['race', 'two', 'high', 'low', 'gap'], ['tip', 'why', 'tip'], ['cta', 'cta']],
  lines: {
    hook: { say: 'What if the sprint is decided by your elbows, not your legs?', captions: false,
      chunks: ['What if', 'the sprint', 'is decided by', 'your elbows,', 'not your legs?'] },
    two: { say: 'Same rider, same one thousand watts.',
      chunks: ['Same rider,', ['same 1,000 watts.', 'SAME']] },
    high: { say: 'Sprinting upright and wide: fifty-nine kilometers per hour.',
      chunks: ['Sprinting', 'upright and wide:', ['59 km/h.', 'FIFTY']] },
    low: { say: 'Now chest low, elbows in, over the bars: sixty-two!',
      chunks: [['Now chest low,', 'NOW'], 'elbows in,', 'over the bars:', ['62!', 'SIXTY']] },
    gap: { say: "Over the last two hundred meters, that's a ten meter gap. Five bike lengths!",
      chunks: ['Over the last', ['200 meters,', 'TWO'], ["that's a 10 meter gap.", "THAT'S"], ['5 bike lengths!', 'FIVE']] },
    why: { say: 'At sixty kilometers per hour, over ninety percent of that power fights the air.',
      chunks: [['At 60 km/h,', 'AT'], ['over 90%', 'OVER'], 'of that power', 'fights the air.'] },
    tip: { say: 'Same legs, same watts. So when you sprint: chest low, elbows in, eyes up.',
      chunks: ['Same legs,', 'same watts.', 'So when you sprint:', 'chest low,', 'elbows in,', 'eyes up.'] },
    cta: { say: 'Send this to the friend who always sprints sitting up. And follow for more free speed.',
      chunks: ['Send this', 'to the friend', 'who always sprints', 'sitting up.', ['And follow', 'AND'], 'for more free speed.'] }
  },
  scenes: { hook: { type: 'free', amb: 0.12, draw: ride }, race: { type: 'free', amb: 0.12, draw: ride }, tip: { type: 'free', amb: 0.12, draw: ride }, cta: { type: 'free', amb: 0.12, draw: ride } },
  facts: P => [
    ['1000 W, CdA 0,35 (vzpřímeně, široko), km/h', P.kmh(1000, { cda: 0.35 }), 58.9, 0.05],
    ['1000 W, CdA 0,30 (nízko, lokty u těla), km/h', P.kmh(1000, { cda: 0.30 }), 61.9, 0.05],
    ['rozdíl rychlostí, km/h', P.kmh(1000, { cda: 0.30 }) - P.kmh(1000, { cda: 0.35 }), 3, 0.1],
    ['náskok na 200 m při ustálených rychlostech, m', 200 * (1 - P.speed(1000, { cda: 0.35 }) / P.speed(1000, { cda: 0.30 })), 10, 0.3],
    ['podíl vzduchu při 60 km/h, CdA 0,35, % (ve videu „over 90 %“, na obrazovce 95 %)', P.airShare(60, { cda: 0.35 }) * 100, 94.7, 0.5]
  ],
  sources: 'Náskok je spočítaný z ustálených rychlostí, zrychlování se nepočítá. Délka kola je asi 1,7 až 2 m, 10 m je tedy asi 5 délek. Jezdec je na časovkářském kole s rukama na základním řídítku (jiné kolo model zatím nemá).'
};
