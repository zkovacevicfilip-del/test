// Formát „ride“: jeden časovkář (3D, MakeHuman) tam proti větru a zpět po větru, stopky, kdy se vyplatí aero nástavce. Náš hlas (Liamovi došly kredity).
const ride = function (t) {
  // pohled kamery, silnice a jeden jezdec (popis musí být uvnitř funkce, do scenes.js se přenáší jen ona)
  const VIEW = { cam: { pos: [300, 560, 1180], look: [0, 150, -60], fov: 40 }, road: { lanes: [-260], z0: -700, z1: 900 }, riders: { A: { kit: 'purple', z: 60 } } };
  // stopky m:ss (scenes.js nemá physics.js, proto vlastní)
  const P_clock = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const T = r => TR(r), tOut = T('out:0'), tBack = T('back:0'), tLow = T('low:0'), tCta = T('cta:0');
  // tam doprava proti větru; otočky: zpět po větru (back), znovu proti větru (low:2), po větru (low:4), na konci zase doprava
  const flips = [tBack, T('low:2'), T('low:4'), tCta].map(x => tw(t, x - 0.25, 0.5, E.io)), dir = flips.reduce((d, f) => f > 0.5 ? -d : d, 1), back = dir < 0;
  const pose = tw(t, T('low:2'), 0.9, E.io) * (1 - tw(t, tCta, 0.6, E.io)), ctaK = tw(t, tCta, 0.8, E.quint);
  const turn = Math.min(1, flips.reduce((s, f) => s + Math.sin(Math.PI * f), 0));   // při otočce na chvíli ztmavne
  const dist = t * (back ? 640 : 340) * dir;
  const st = { dist, a: (1 - ctaK * 0.62) * (1 - 0.85 * turn), riders: { A: { x: 0, dir, pose, crank: t * 9.4, wheel: Math.abs(dist) / 71 } } };
  // vzduch proti jezdci: tam 46,4 km/h, zpět jen 31,4 km/h (jezdec je rychlejší než vítr) → rychlost a víření čar
  scene3d(VIEW, st, () => air3d('A', t, back ? 420 : 900, back ? 0.5 : 1, pose, 0.95 * (1 - ctaK) * (1 - turn), dir));
  // šipka větru: vždy zprava doleva
  const wa = clamp((t - T('setup:0')) / 0.3) * (1 - ctaK) * (1 - turn);
  if (wa > 0) { const y = 560, ph = (t * 1.6) % 1; ctx.save(); ctx.globalAlpha *= wa; ctx.scale(-1, 1); for (let i = 0; i < 3; i++) { const x = 900 - ((ph + i / 3) % 1) * 760; ctx.globalAlpha = wa * Math.sin(Math.PI * ((ph + i / 3) % 1)); arrow(-x, y, 150, C.pu, 1); } ctx.restore(); txt('WIND 20 km/h', 540, 500, { size: 30, w: 800, c: C.muted, ls: 4, a: wa }); }
  // stopky: tam 0 → 45:30, zpět 0 → 23:20 (zrychleně během věty)
  const clockAt = (t0, t1, s1) => P_clock(s1 * clamp((t - t0) / Math.max(0.5, t1 - t0)));
  // obě stopky zůstanou vidět až do součtu: tam nahoře, zpět pod nimi
  bigNum(t, tOut, T('total:0') - 0.15, clockAt(tOut, tOut + 1.6, 2730), 'OUT', 330, 1415, { size: 88, c: C.ink, uc: C.pu });
  bigNum(t, tBack + 0.3, T('total:0') - 0.15, clockAt(tBack + 0.3, tBack + 1.6, 1400), 'BACK', 330, 1535, { size: 88, c: C.ink, uc: C.pu });
  statAt(t, T('setup:0'), T('out:0') - 0.15, '20 km EACH WAY · 250 W', 'Out & back', C.ink);
  statAt(t, T('total:0'), T('why:0') - 0.15, 'SLOWER THAN NO WIND', '+5:21');
  statAt(t, T('why:0'), tLow - 0.15, 'TIME IN THE HEADWIND', '~2× longer', C.ink);
  statAt(t, T('low:3'), T('low:4') - 0.1, 'AERO BARS, HEADWIND', '−5:00');
  statAt(t, T('low:5'), tCta - 0.15, 'AERO BARS, TAILWIND', '−1:21', C.ink);
  ctaEnd(t, tCta, T('cta:1'), 'Follow for more free speed');
};
module.exports = {
  title: 'ride-headwind',
  about: 'Časovkář tam a zpět 20 km při 250 W a větru 20 km/h: vzpřímeně na základním řídítku (CdA 0,30) tam 45:30, zpět 23:20, celkem o 5:21 pomaleji než bez větru. Aero nástavce (CdA 0,23) ušetří proti větru 5:00, po větru jen 1:21.',
  style: { captions: 'top' },
  acts: [['hook', 'hook'], ['setup', 'setup'], ['out', 'out'], ['back', 'back'], ['total', 'total'], ['why', 'why'], ['low', 'low'], ['cta', 'cta']],
  lines: {
    hook: { say: "Out into the wind, back with it. Doesn't it cancel out?",
      chunks: ['Out into the wind,', 'back with it.', ["Doesn't it", "DOESN'T|DOESNT"], 'cancel out?'] },
    setup: { say: 'Twenty kilometers each way, two hundred fifty watts, and a twenty kilometer per hour wind.',
      chunks: [['20 km each way,', 'TWENTY'], ['250 watts,', 'TWO'], 'and a', ['20 km/h wind.', 'TWENTY']] },
    out: { say: 'Out: forty-five and a half minutes.', chunks: ['Out:', ['45.5 minutes.', 'FORTY']] },
    back: { say: 'Back: just twenty-three.', chunks: ['Back:', ['just 23.', 'JUST']] },
    total: { say: "That's over five minutes slower than no wind at all.",
      chunks: [["That's over 5 minutes", "THAT'S|THATS"], 'slower than', 'no wind at all.'] },
    why: { say: 'Because you spend almost twice as long in the headwind.',
      chunks: ['Because you spend', 'almost twice as long', 'in the headwind.'] },
    low: { say: 'So when do the aero bars pay off? In the headwind, they save five minutes. In the tailwind, just over one.',
      chunks: ['So when do', 'the aero bars pay off?', 'In the headwind,', ['they save 5 minutes.', 'THEY'], 'In the tailwind,', 'just over one.'] },
    cta: { say: 'Send this to a friend who sits up into the wind. Follow for more.',
      chunks: ['Send this to a friend', 'who sits up', 'into the wind.', 'Follow for more.'] }
  },
  scenes: { hook: { type: 'free', amb: 0.12, draw: ride }, setup: { type: 'free', amb: 0.12, draw: ride }, out: { type: 'free', amb: 0.12, draw: ride }, back: { type: 'free', amb: 0.12, draw: ride }, total: { type: 'free', amb: 0.12, draw: ride }, why: { type: 'free', amb: 0.12, draw: ride }, low: { type: 'free', amb: 0.12, draw: ride }, cta: { type: 'free', amb: 0.12, draw: ride } },
  facts: P => {
    const w = 20 / 3.6, o = { cda: 0.30 }, out = P.time(250, 20, { wind: w, cda: 0.30 }), back = P.time(250, 20, { wind: -w, cda: 0.30 }), calm = 2 * P.time(250, 20, o);
    return [
      ['tam proti větru 20 km/h, 250 W, CdA 0,30, s (45:30)', out, 2730, 2],
      ['zpět po větru, s (23:20)', back, 1400, 2],
      ['o kolik pomaleji než bez větru, s (5:21, „over five minutes“)', out + back - calm, 321, 2],
      ['kolikrát déle proti větru („almost twice“, „~2×“)', out / back, 1.95, 0.02],
      ['úspora v nástavcích (CdA 0,23) proti větru, s (5:00, „five minutes“)', out - P.time(250, 20, { wind: w, cda: 0.23 }), 300, 2],
      ['úspora v nástavcích (CdA 0,23) po větru, s (1:21, „just over one“)', back - P.time(250, 20, { wind: -w, cda: 0.23 }), 81, 2]
    ];
  },
  sources: 'Model jako v aplikaci (84 kg, Crr 0,004, účinnost 97,5 %, 20 °C), vítr přesně proti a po směru jízdy. Vzpřímeně na základním řídítku CdA 0,30, v aero nástavcích 0,23 (rozsah z přehledu Crouch a kol. 2017).'
};
