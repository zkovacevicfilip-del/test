// Video „3 tipy“ (autor 24. 11. 2026): stejný realistický vzhled jako posledních 9 videí (jezdec v krajině za zlaté hodinky,
// průlet 3D kamery mezi akty, sytější barvy, nahoře bez malých popisků, titulky dole, hlas Liam), ale místo whatIF začíná
// „3 TIPS“ a slibem, že trojka je nejdůležitější; nahoře ukazatel postupu (varianta 3). Tipy jdou od nejmenší úspory
// k největší (−0:36, −1:07, −2:18 na 40 km) a trojka je víc než první dva dohromady, aby se divák dokoukal až na konec.
// Jezdec začíná se silniční helmou a ve volném dresu: u tipu 1 helma „poskočí“ na časovkářskou, u tipu 2 se dres svítící
// linkou změní na kombinézu, u tipu 3 se kamera přetočí před jezdce a vyšrafovaná plocha ukáže, o kolik se zmenší,
// když dá hlavu dolů a ramena k sobě. Na konci „pošli kamarádovi a sleduj“ (karty přes krajinu, karta profilu wattIF).
const ride = function (t, a) {
  // pohled kamery, dlouhá silnice (kamera zepředu vidí daleko) a jezdec: silniční helma, volný bílý dres → kombinéza;
  // kraťasy skoro ke kolenům (shortsLen 0,86), jinak pod zadkem u sedla vykukovalo holé stehno (oprava 25. 11. 2026);
  // držátka nástavců blíž u sebe (gripIn 0,22: pěsti asi 13 cm od sebe místo 23,5 cm, autor 25. 11. 2026);
  // pozadí venkov (scenery 'country', varianta 2 od autora 25. 11. 2026): krajnice, patníky, plot, seno, statky, sloupy s dráty
  // u tipu 3 (kamera zepředu, f → 1) kamera přijede blíž a níž, aby byla postava velká a plocha zepředu dobře vidět
  // (zepředu kamera míří o kus výš, takže jezdec je v obraze níž a hlava i vyšrafovaná plocha nejsou pod kartou s grafem)
  const cam = window.CAM || {}, front = clamp(((cam.o || 0) - 0.3) / 0.6), k = lerp(1, 0.55, front), Lk = [0, lerp(175, 210, front), lerp(-60, 40, front)];
  const VIEW = { cam: { pos: [Lk[0] + 300 * k, lerp(380, 300, front), Lk[2] + 1310 * k], look: Lk, fov: 40 }, road: { lanes: [-260], z0: -700, z1: 900, len: 40000, scenery: 'country' },
    riders: { A: { kit: 'purple', z: 60, over: { road: '#F2F2EF', sleeve: 0.66, shortsLen: 0.86, gripIn: 0.22, pre: { suit: '#EDECE8', suit2: '#16171A', sleeve: 0.44, loose: 1 } } } } };
  const T = r => TR(r), tH = T('one:4'), tS = T('two:1');
  // tip 3: hlava dolů (poloha 1 → 1,7) a ramena k sobě; plocha zepředu se ukáže, jen když kamera míří zepředu
  const pose = 1 + 0.7 * tw(t, T('three:2'), 0.9, E.io), shrug = tw(t, T('three:3'), 0.9, E.io);
  const dist = t * 560;
  const st = { dist, riders: { A: { x: 0, pose, shrug, crank: t * 9.4, wheel: dist / 71, hs: helmSwap(t, tH), swap: tw(t, tS, 1.3, E.io), t } },
    sil: { id: 'A', k: front * tw(t, T('three:2') - 0.3, 0.5), ghost: { pose: 1, shrug: 0 } } };
  scene3d(VIEW, st, () => air3d('A', t, 820, lerp(0.45, 0.3, clamp(pose - 1)), pose, 0.95 * (1 - front)));
  // „pop“ při výměně helmy a dresu
  const h = R3.riders.A.head();
  popFX(t, tH, at3d('A', [h.x, h.y, h.z]), 70 * scale3d('A'));
  popFX(t, tS, at3d('A', [-20, 215, 0]), 95 * scale3d('A'));
  classicUI(t, a, {
    hook: { line: 'hook', cy: 440, items: [{ mark: [['3 ', 'ink'], ['TIPS', 'pu']], i: 0, size: 150 }, { t: 'for a faster', i: 1, size: 56 }, { t: 'time trial', i: 2, size: 56, gap: 14 }, { t: '#3 matters most', i: 3, big: true, size: 92 }] },
    heads: {},
    tips: { at: [T('one:0'), T('two:0'), T('three:0')], end: T('cta:0') }
  });
  // prvky podle reference RunLive (autor 25. 11. 2026): odznak kapitoly 1 (plný kruh) na začátku tipu, pak datová karta 2
  // (vodorovné pruhy, čas se dopočítá s hlasem, u trojky čára „1 + 2“); titulky dole se zvýrazněným slovem (style.words)
  const bA = chapterBadge(t, { v: 1, at: [T('one:0'), T('two:0'), T('three:0')], names: ['Aero helmet', 'Skinsuit', 'Head down'], dur: 1.9 });
  dataCard(t, { v: 2, title: 'TIME SAVED · 40 KM · 250 W', from: T('one:0') + 1.9, to: T('cta:0'), hide: bA, compare: { at: T('three:6'), label: '1 + 2' },
    items: [{ name: 'HELMET', head: 'Tip 1 · Aero helmet', value: 36, at: T('one:0'), grow: T('one:5') }, { name: 'SKINSUIT', head: 'Tip 2 · Skinsuit', value: 67, at: T('two:0'), grow: T('two:3') }, { name: 'POSITION', head: 'Tip 3 · Head down', value: 138, at: T('three:0'), grow: T('three:5') }] });
  // krátká závěrečná věta: karty o kousek dřív, aby „Sent“ i „Following“ byly vidět aspoň půl vteřiny
  ctaCards(t, { share: T('cta:0') - 0.15, pick: T('cta:1') + 0.1, tap: T('cta:2') + 0.15, follow: T('cta:3') + 0.1, ftap: T('cta:4') + 0.2 });
};
module.exports = {
  title: 'tips-time-trial',
  about: 'Tři tipy na rychlejší časovku (40 km, 250 W): aero helma −0:36, kombinéza místo volného dresu −1:07, hlava dolů a ramena k sobě −2:18, víc než první dva dohromady a zadarmo.',
  // kamera po aktech: úvod z boku, tip 1 zepředu šikmo (helma), tip 2 z boku zezadu (dres), tip 3 zepředu (plocha), konec z boku
  style: { look: 'golden', ui: 'classic', camera: 'orbit', lean: 1, grade: { sat: 1.5, con: 1.12 }, orbit: [0, 0.35, -0.2, 1.2, 0], words: { v: 2 } },
  acts: [['hook', 'hook'], ['one', 'one'], ['two', 'two'], ['three', 'three'], ['cta', 'cta']],
  lines: {
    // gain: úvod o 5 dB hlasitěji s měkkým omezením špiček (autor 25. 11. 2026: začátek byl moc pasivní)
    hook: { say: "Three tips for a faster time trial. Number three is the most important, and it's free.", captions: false, gain: 5,
      chunks: [['3 tips', 'THREE'], 'for a faster', 'time trial.', ['Number 3', 'NUMBER'], 'is the most important,', "and it's free."] },
    one: { say: 'Tip one: an aero helmet. Swap your vented road helmet for a time trial helmet: thirty-six seconds faster over forty kilometers.',
      chunks: [['Tip 1:', 'TIP'], 'an aero helmet.', 'Swap your vented', 'road helmet', 'for a time trial helmet:', ['36 seconds faster', 'THIRTY-SIX|THIRTY'], ['over 40 km.', 'OVER']] },
    two: { say: "Tip two: a skinsuit instead of a loose jersey. That's another minute and seven seconds.",
      chunks: [['Tip 2:', 'TIP'], 'a skinsuit', 'instead of a loose jersey.', ["That's another minute", "THAT'S"], ['and 7 seconds.', 'AND']] },
    three: { say: 'And number three, the big one: head down, shoulders in. It costs nothing, and saves two minutes eighteen. More than the first two combined!',
      chunks: [['And number 3,', 'AND'], 'the big one:', 'head down,', 'shoulders in.', 'It costs nothing,', ['and saves 2:18.', 'AND'], 'More than the first two', 'combined!'] },
    cta: { say: 'Send this to your time trial buddy. And follow for more free speed.',
      chunks: ['Send this', 'to your', 'time trial buddy.', ['And follow', 'AND'], 'for more free speed.'] }
  },
  // zvuk (autor 25. 11. 2026): efekty u čísel a přechodů a jemný rytmus pod hlasem (bed 1, bez akordů, ty zněly jako levná hudba)
  sfx: [{ at: 'hook:0', kind: 'pop' }, { at: 'hook:3', kind: 'ding' },
    { at: 'one:0', kind: 'pop' }, { at: 'one:4', kind: 'pop' }, { at: 'one:5', kind: 'ding' },
    { at: 'two:0', kind: 'pop' }, { at: 'two:1', kind: 'shimmer' }, { at: 'two:3', kind: 'ding' },
    { at: 'three:0', kind: 'riser' }, { at: 'three:0', kind: 'pop' }, { at: 'three:5', kind: 'impact' }, { at: 'three:6', kind: 'ding' },
    { at: 'cta:0-0.15', kind: 'pop' }, { at: 'cta:1+0.1', kind: 'click' }, { at: 'cta:2+0.15', kind: 'click' }, { at: 'cta:3+0.1', kind: 'pop' }, { at: 'cta:4+0.2', kind: 'click' }],
  bed: 1,
  scenes: { hook: { type: 'free', amb: 0.12, draw: ride }, one: { type: 'free', amb: 0.12, draw: ride }, two: { type: 'free', amb: 0.12, draw: ride }, three: { type: 'free', amb: 0.12, draw: ride }, cta: { type: 'free', amb: 0.12, draw: ride } },
  facts: P => {
    const T40 = c => P.time(250, 40, { cda: c }), t1 = T40(0.26) - T40(0.252), t2 = T40(0.26) - T40(0.245), t3 = T40(0.26) - T40(0.23);
    return [
      ['tip 1: aero helma místo větrané silniční (CdA 0,26 → 0,252), 40 km při 250 W, s (ve videu 0:36)', t1, 36, 1],
      ['tip 2: kombinéza místo volného dresu (CdA 0,26 → 0,245), s (ve videu 1:07)', t2, 67, 1],
      ['tip 3: hlava dolů a ramena k sobě (CdA 0,26 → 0,23), s (ve videu 2:18)', t3, 138, 1],
      ['tip 3 minus tipy 1 a 2 dohromady, s (ve videu „more than the first two combined“)', t3 - t1 - t2, 35, 1]
    ];
  },
  sources: 'CdA: časovkář v nástavcích se silniční helmou a ve volném dresu 0,26. Aero helma místo větrané silniční ušetří obvykle 0,005 až 0,015 m² (tady 0,008), kombinéza místo volného dresu 0,01 až 0,02 (tady 0,015), hlava dolů a ramena k sobě 0,02 až 0,04 (tady 0,03); záleží na postavě a výbavě (měření v tunelu a na velodromu). 84 kg s kolem, rovina, bezvětří.'
};
