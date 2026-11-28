// Kontrola sady na videa (video-kit): scénář a scény k sobě musí sedět. Spouští se v rámci npm test.
// Nic nevykresluje ani negeneruje hlas, jen čte soubory, takže běží do vteřiny.
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const KIT = path.join(__dirname, "..", "video-kit");
let passed = 0, failed = 0;
function ok(label, cond, detail) {
  if (cond) { passed++; console.log("✓ " + label); }
  else { failed++; console.log("✗ " + label + (detail ? " → " + detail : "")); }
}

function check(dir, name) {
  const sc = JSON.parse(fs.readFileSync(path.join(dir, "script.json"), "utf8"));
  const keys = sc.acts.flatMap(a => a.lines);
  ok(`[${name}] každá věta z aktů existuje a je použitá právě jednou`,
    keys.every(k => sc.lines[k]) && new Set(keys).size === keys.length && keys.length === Object.keys(sc.lines).length);
  ok(`[${name}] název souboru jen z malých písmen, číslic a pomlček`, /^[a-z0-9-]+$/.test(sc.title), sc.title);

  const bad = [];
  let words = 0;
  for (const k of keys) {
    const l = sc.lines[k];
    // závěrečná výzva „pošli kamarádovi a sleduj“ (věta cta, autor 22. 11. 2026) se do délky obsahu nepočítá, sama má nejvýš 20 slov
    if (k === "cta") { if (l.say.trim().split(/\s+/).length > 20) bad.push("cta: výzva na konci má víc než 20 slov"); }
    else words += l.say.trim().split(/\s+/).length;
    if (/\d/.test(l.say)) bad.push(`${k}: v "say" je číslice (hlas potřebuje čísla slovy)`);
    for (const c of l.chunks) {
      const text = Array.isArray(c) ? c[0] : c, anchor = Array.isArray(c) ? c[1] : text.split(/\s+/)[0].replace(/[^A-Za-z']/g, "");
      if (!anchor) bad.push(`${k}: titulek „${text}“ nezačíná slovem a nemá kotvu`);
      if (text.split(/\s+/).length > 6) bad.push(`${k}: titulek „${text}“ je delší než 6 slov`);
    }
  }
  ok(`[${name}] titulky mají kotvu a rozumnou délku, čísla v hlase jsou slovy`, bad.length === 0, bad.join("; "));
  // krátká verze ("format": "short", asi 30 s) má jiný rozsah a hook musí být krátký a velký přímo ve scéně
  if (sc.format === "short") {
    ok(`[${name}] krátký scénář má 55 až 150 slov (asi 25 až 55 s; delší video autor povolil 26. 11. 2026)`, words >= 55 && words <= 150, words + " slov");
    const hook = sc.lines[keys[0]];
    // formát „ride“ (layout 'top'): hook ukazují titulky nahoře, ve scéně jsou jezdci
    ok(`[${name}] hook je první věta, má nejvýš 16 slov a text přímo ve scéně (nebo v titulcích nahoře)`,
      (hook.captions === false || sc.layout === "top") && hook.say.trim().split(/\s+/).length <= 16, hook.say);
    const T = sc.timing || {};
    ok(`[${name}] krátké video: začátek do 0,2 s, pauzy ve větě nejvýš 0,5 s, dozvuk nejvýš 1 s`,
      T.lead <= 0.2 && T.max_pause > 0 && T.max_pause <= 0.5 && T.tail <= 1.0, JSON.stringify(T));
  } else {
    ok(`[${name}] formát je buď vynechaný, nebo "short"`, sc.format === undefined, String(sc.format));
    ok(`[${name}] scénář má 120 až 180 slov (asi 55 až 70 s)`, words >= 120 && words <= 180, words + " slov");
  }
  // od 20. 11. 2026 i náš hlas (stránka video-kit/tts, Kokoro), když Liamovi dojdou kredity ElevenLabs
  ok(`[${name}] hlas je Liam z ElevenLabs, nebo náš hlas Kokoro`, (sc.voice.provider === "elevenlabs" && sc.voice.voice_id === "TX3LPaxmHKxFdv7VOQHJ") || sc.voice.provider === "ours", sc.voice.provider);

  // scenes.js jen definuje funkce a tři tabulky, takže jde načíst bez prohlížeče
  const code = fs.readFileSync(path.join(dir, "scenes.js"), "utf8");
  const t = vm.runInNewContext(code + "\n;({ SCENES, AMBIENT, FLOWS })", {});
  const ids = sc.acts.map(a => a.id);
  ok(`[${name}] každý akt má scénu i sílu pozadí`,
    ids.every(id => typeof t.SCENES[id] === "function" && t.AMBIENT[id] >= 0 && t.AMBIENT[id] <= 0.5), ids.join(", "));
  ok(`[${name}] používá jen připravená proudění`, Object.keys(t.FLOWS).every(n => ["rider", "cyl", "drop"].includes(n)), Object.keys(t.FLOWS).join(", "));
  ok(`[${name}] scény nepoužívají náhodu ani skutečný čas`, !/Math\.random|Date\.now|new Date/.test(code));
  // výjimka od 17. 11. 2026: úvodní nápis wattIF, když ho popis videa zapne (style.hook); jinde název aplikace ani logo ne
  // výjimka od 22. 11. 2026: karta profilu v závěrečné výzvě (oddíl KONEC VIDEA v series/ride.js) smí ukázat název a malé logo
  const codeNoHook = code.replace(/\/\/ ---------- KONEC VIDEA[\s\S]*?\/\/ ---------- \/KONEC VIDEA ----------/, "");   // nápis se zapíná hodnotou hook: 'watt', takže celý název se v kódu nevyskytuje
  ok(`[${name}] video nezmiňuje aplikaci (kromě zapnutého úvodního nápisu wattIF a karty profilu na konci)`, !/aero pozice|wattif|logoImg/i.test(codeNoHook + JSON.stringify(sc.lines)));
}

check(KIT, "aktuální video");
for (const ex of fs.readdirSync(path.join(KIT, "examples"))) check(path.join(KIT, "examples", ex), "vzor " + ex);

// série z bloků (video-kit/series/): každý popis se převede na script.json a scenes.js a projde stejnou kontrolou,
// navíc musí čísla ve videu sedět s výpočtem (series/physics.js) a časy scén musí odkazovat na existující titulky
{
  const os = require("os");
  const S = path.join(KIT, "series"), make = require(path.join(S, "make.js")), P = require(path.join(S, "physics.js"));
  const near = (a, b, tol) => Math.abs(a - b) <= tol;
  ok("fyzika série dává stejná čísla jako tools/physics.py (250 W: 37,8 a 40,0 km/h, rozdíl 3,5 min na 40 km)",
    near(P.kmh(250, { cda: 0.30 }), 37.80, 0.01) && near(P.kmh(250), 40.04, 0.01) && near((P.time(250, 40, { cda: 0.30 }) - P.time(250, 40)) / 60, 3.55, 0.02));
  ok("fyzika série: protivítr a stoupání zpomalují, řidší vzduch zrychluje, bez vzduchu zbývá jen valivý odpor",
    P.kmh(250, { wind: 5 }) < P.kmh(250) && P.kmh(250, { grade: 0.02 }) < P.kmh(250) && P.kmh(250, { alt: 2000 }) > P.kmh(250) &&
    near(P.watts(40, { rho: 0 }), 0.004 * 84 * 9.80665 * (40 / 3.6) / 0.975, 0.01));
  const titles = new Set();
  for (const series of fs.readdirSync(S).filter(d => fs.statSync(path.join(S, d)).isDirectory())) {
    for (const f of fs.readdirSync(path.join(S, series)).filter(f => f.endsWith(".js")).sort()) {
      const spec = require(path.join(S, series, f)), name = "série " + series + "/" + f.replace(/\.js$/, ""), out = make.build(spec);
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kit-"));
      fs.writeFileSync(path.join(dir, "script.json"), JSON.stringify(out.script)); fs.writeFileSync(path.join(dir, "scenes.js"), out.scenes);
      check(dir, name);
      fs.rmSync(dir, { recursive: true, force: true });
      const bad = out.facts.filter(x => !x.ok);
      ok(`[${name}] čísla ve videu sedí s výpočtem`, bad.length === 0, bad.map(x => x.label + ": spočteno " + x.calc.toFixed(3) + ", ve videu " + x.shown).join("; "));
      // každý odkaz na čas ('věta:2', 'věta', 'věta$+0.3') musí mířit na existující větu a titulek
      const refs = [], walk = v => { if (typeof v === "string") refs.push(v); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === "object") for (const k in v) { if (["at", "out", "subAt", "bigAt", "numAt", "leftAt", "rightAt", "labAt", "showAt", "start", "end", "finishAt", "speedAt", "fillAt"].includes(k) && typeof v[k] === "string") refs.push("@" + v[k]); else if (k === "pose") Object.values(v[k]).forEach(x => { if (typeof x === "string") refs.push("@" + x); else if (Array.isArray(x)) refs.push("@" + x[0]); }); else if (typeof v[k] === "object") walk(v[k]); } };
      walk(spec.scenes);
      const wrong = refs.filter(r => r[0] === "@").map(r => r.slice(1)).filter(r => { const m = /^([A-Za-z0-9_]+)(?::(\d+))?(\$)?([+-]\d*\.?\d+)?$/.exec(r); return !m || !spec.lines[m[1]] || (m[2] != null && !spec.lines[m[1]].chunks[+m[2]]); });
      const hookItems = Object.values(spec.scenes).filter(x => x.type === "hook" || x.type === "text").flatMap(x => x.items.filter(i => i.i != null).map(i => [x.line, i.i])).filter(([l, i]) => !spec.lines[l] || !spec.lines[l].chunks[i]);
      ok(`[${name}] časy scén odkazují na existující věty a titulky`, wrong.length === 0 && hookItems.length === 0, wrong.concat(hookItems.map(String)).join(", "));
      if (spec.style) ok(`[${name}] styl zapne kameru nebo pozadí jen přes háčky motoru (CAMERA, BACKGROUND)`, /const CAMERA = STYLE\.camera \? makeCamera/.test(out.scenes) && /const BACKGROUND = STYLE\.bg \? makeBackground/.test(out.scenes) && ["whip", "punch", "drift", "flip", "orbit", "swipe", "swipe-blur", undefined].includes(spec.style.camera) && [1, 2, 3, undefined].includes(spec.style.lean) && (spec.style.grade === undefined || (spec.style.grade.sat > 0 && spec.style.grade.con > 0)) && ["words", "marker", "slot", "reveal", "flap", "glitch", "typing", undefined].includes(spec.style.text) && ["dots", "halftone", "paths", undefined].includes(spec.style.bg) && ["wipe", undefined].includes(spec.style.overlay) && ["top", undefined].includes(spec.style.captions) && ["day", "golden", "overcast", undefined].includes(spec.style.look) && ["classic", undefined].includes(spec.style.ui), JSON.stringify(spec.style));
      if (spec.style && spec.style.captions === "top") ok(`[${name}] titulky nahoře jdou přes háček CAPTIONS a scénář má layout 'top'`, /const CAPTIONS = STYLE\.captions === 'top' \? topCaptions/.test(out.scenes) && out.script.layout === "top" && /function topCaptions/.test(out.scenes) && /function scene3d/.test(out.scenes));
      // autor 22. 11. 2026: realistická krajina, ale texty jako v původní šabloně (whatIF, nadpisy nahoře, titulky dole, fialová)
      if (spec.style && spec.style.ui === "classic") ok(`[${name}] style.ui 'classic': krajina realistická, texty z původní šablony`, !!spec.style.look && spec.style.captions !== "top" && spec.style.hook !== "watt" && out.script.layout !== "top" && /function classicUI/.test(out.scenes) && /classicUI\(t, a, \{/.test(out.scenes) && /const TXTOUT = \(\) => !!OUTDOOR\(\) && !CLASSIC\(\)/.test(out.scenes) && /typeof TXTOUT === 'function' && TXTOUT\(\)/.test(out.scenes) && out.script.lines[out.script.acts[0].lines[0]].captions === false, JSON.stringify(spec.style));
      // oprava 22. 11. 2026: nadpis přes dva akty se při švihu kamery usekl o okraj; nadpisy jsou po aktech a mizí s aktem (actIO),
      // ve venkovní krajině se stíracím pruhem švihá scéna vždy zleva (odkrytý okraj je pod pruhem)
      if (spec.style && spec.style.ui === "classic") ok(`[${name}] nadpisy po aktech mizí s aktem a švih kamery nechá odkrytý okraj pod pruhem`, /hs0 = o\.heads && a && o\.heads\[a\.id\]/.test(out.scenes) && /actIO\(t, a\); ctx\.save\(\); ctx\.globalAlpha \*= io\.a; heads\(t, hs, io\.dy\)/.test(out.scenes) && /out && st\.overlay === 'wipe' \? -1/.test(out.scenes) && !/heads: \[/.test(out.scenes.slice(out.scenes.indexOf("classicUI(t, a, {"))));
      // autor 22. 11. 2026: fialový stírací pruh pryč, místo něj jemný švih (posun 60 px je menší než skrytý okraj scény 90 px)
      // autor 22. 11. 2026: fialový pruh pryč, mezi akty plynulý průlet 3D kamery (ne cuknutí), méně textu (A1) a sytější barvy (B2)
      if (spec.style && spec.style.ui === "classic") ok(`[${name}] průlet 3D kamery, nahoře bez malých popisků, sytější barvy krajiny`, spec.style.overlay === undefined && spec.style.camera === "orbit" && spec.style.lean === 1 && spec.style.grade && spec.style.grade.sat === 1.5 && spec.style.grade.con === 1.12 && /if \(st\.camera === 'orbit' && i > 0\) tl\.fromTo\(cam, \{ o: orb\(i - 1\) \}, \{ o: orb\(i\), duration: st\.orbitDur \|\| 1\.4, ease: st\.orbitDur \? 'sine\.inOut' : 'power2\.inOut'/.test(out.scenes) && /st\.cam\.position\.set\(Lk\[0\] \+ dx \* co \+ dz \* so/.test(out.scenes) && /hs0 && lean \? hs0\.map\(h => Object\.assign\(\{\}, h, \{ label: undefined, sub: undefined \}\)\)/.test(out.scenes) && /ctx\.filter = `saturate\(\$\{gr\.sat \|\| 1\}\) contrast\(\$\{gr\.con \|\| 1\}\)`; one\(X\); ctx\.filter = 'none';/.test(out.scenes), JSON.stringify(spec.style));
      // autor 22. 11. 2026: na konci „pošli kamarádovi a sleduj“ (varianta 1, karty přes krajinu): poslední akt cta, věta s Send this a follow
      if (Object.values(spec.scenes).some(x => typeof x.draw === "function" && /ctaCards\(t, /.test(String(x.draw)))) ok(`[${name}] konec videa: pošli kamarádovi a sleduj (karty ctaCards)`, spec.acts[spec.acts.length - 1][0] === "cta" && /Send this .*follow/i.test(spec.lines.cta.say) && /function ctaCards/.test(out.scenes) && /ctaCards\(t, \{ share: T\('cta:\d'\)/.test(out.scenes) && /function ctaProfile/.test(out.scenes), spec.lines.cta && spec.lines.cta.say);
      // série „What if“ (a její zkouška stylů) začíná slovy What if; jiné série (ride) mají vlastní háček
      const whatIf = ["what-if", "styl-test"].includes(series);
      ok(`[${name}] název je jedinečný` + (whatIf ? ` a video začíná slovy „What if“` : ""), !titles.has(spec.title) && (!whatIf || /^What if /.test(out.script.lines[out.script.acts[0].lines[0]].say)), spec.title);
      if (spec.voice) ok(`[${name}] voice: 'ours' přepne na náš hlas`, spec.voice === "ours" && out.script.voice.provider === "ours" && out.script.voice.speed === 1.15);
      titles.add(spec.title);
    }
  }
}
// headwind: stopky OUT/BACK zmizí dřív, než švih kamery přejde do součtu (jinak je posune mimo obraz, render hlásil PŘETÉKÁ),
// a zpětné stopky do té doby doběhnou na 23:20
{ const hw = fs.readFileSync(path.join(KIT, "series/ride/03-headwind.js"), "utf8");
  ok("headwind: stopky doběhnou a zmizí před švihem kamery do dalšího aktu", /const tClk = T\('back\$'\) - 0\.1;/.test(hw) && (hw.match(/bigNum\(t, [^,]+, tClk, clockAt\(/g) || []).length === 2 && /clockAt\(tBack \+ 0\.1, tBack \+ 0\.8, 1400\)/.test(hw) && !/T\('total:0'\) - 0\.15/.test(hw)); }
// šablona pro nový chat (SABLONA.md, oddíl 15): styl a konec v receptu musí být stejné jako v hotových realistických videích
{ const sab = fs.readFileSync(path.join(KIT, "SABLONA.md"), "utf8"), r15 = sab.slice(sab.indexOf("## 15. Realistický styl What if"));
  const styl = "style: { look: 'golden', ui: 'classic', camera: 'orbit', lean: 1, grade: { sat: 1.5, con: 1.12 } }";
  const cta = "ctaCards(t, { share: T('cta:0'), pick: T('cta:1'), tap: T('cta:2') + 0.5, follow: T('cta:4'), ftap: T('cta:5') });";
  const vzory = ["series/what-if/10-hundred-kmh.js", "series/what-if/14-five-kilos.js", "series/what-if/13-aero-on-climbs.js"];
  const classic = ["what-if", "ride"].flatMap(d => fs.readdirSync(path.join(KIT, "series", d)).map(f => path.join(KIT, "series", d, f))).filter(f => /ui: 'classic'/.test(fs.readFileSync(f, "utf8")));
  ok("šablona, oddíl 15: recept má stejný styl a konec jako hotová videa a vzory existují", r15.length > 2000 && r15.includes(styl) && r15.includes(cta) && /oddíl 15/.test(sab.slice(0, sab.indexOf("## 1."))) &&
    vzory.every(f => fs.existsSync(path.join(KIT, f)) && fs.readFileSync(path.join(KIT, f), "utf8").includes(cta)) && classic.length === 9 && classic.every(f => fs.readFileSync(f, "utf8").includes(styl)), classic.length); }
// video „3 tipy“ (autor 24. 11. 2026): úvod slibuje 3 tipy a že trojka je nejdůležitější, tipy jdou od nejmenší úspory k největší
// a trojka je víc než první dva dohromady (kvůli dokoukanosti); nahoře ukazatel postupu
for (const f of fs.readdirSync(path.join(KIT, "series/tips")).filter(f => f.endsWith(".js"))) {
  const src = fs.readFileSync(path.join(KIT, "series/tips", f), "utf8"), spec = require(path.join(KIT, "series/tips", f)), fx = spec.facts(require(path.join(KIT, "series/physics.js"))).slice(0, 3).map(x => x[1]);
  ok(`[tips/${f}] úvod: 3 tipy a trojka nejdůležitější; tipy od nejmenšího k největšímu, trojka víc než 1 + 2; ukazatel postupu`,
    /^Three (tips|ways|interval sessions)\b/.test(spec.lines.hook.say) && /Number three is the most important/.test(spec.lines.hook.say) && spec.acts.map(a => a[0]).join() === "hook,one,two,three,cta" &&
    (/workoutCard\(t, /.test(src) || (fx[0] < fx[1] && fx[1] < fx[2])) && (!/combined/i.test(spec.lines.three.say) || fx[2] > fx[0] + fx[1]) && /tips: \{ at: \[T\('one:0'\), T\('two:0'\), T\('three:0'\)\]/.test(src) && /function tipsBar/.test(fs.readFileSync(path.join(KIT, "series/ride.js"), "utf8")), fx.map(x => x.toFixed(1)).join(" < "));
  // výměna helmy: helmy se prohodí naráz, hlava nikdy nezůstane holá (v každém okamžiku je jedna helma aspoň v plné velikosti)
  const sc = vm.runInNewContext(require(path.join(KIT, "series/make.js")).build(spec).scenes + "\n;({ helmSwap })", { clamp: (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), tw: (t, s0, d, e) => (e || (x => x))(Math.min(1, Math.max(0, (t - s0) / d))), E: { back: x => x, io: x => x, expo: x => x } });
  const hs = Array.from({ length: 201 }, (_, i) => sc.helmSwap(i * 0.01, 1)), bare = hs.filter(h => Math.max(h[0], h[1]) < 0.999 || (h[0] > 0 && h[1] > 0));
  // prvky podle reference (autor 25. 11. 2026): titulky dole se zvýrazněným slovem, odznak plný kruh, karta s pruhy, čísla v kartě
  // sedí s výpočtem, zvukové efekty míří na existující titulky, podkres rytmus bez akordů; počítadlo nikdy neukáže „0:60“
  const facts3 = spec.facts(require(path.join(KIT, "series/physics.js"))).slice(0, 3).map(x => x[2]);
  const vals = /workoutCard\(t, /.test(src) ? [...src.matchAll(/resultCard\(t, \{[^}]*?value: ([\d.]+)/g)].map(m => +m[1]) : [...src.matchAll(/head: '(?:Tip|Way) \d · [^']*'[^}]*?value: ([\d.]+)/g)].map(m => +m[1]);
  const refOk = r => { const m = /^([A-Za-z0-9_]+)(?::(\d+))?(\$)?([+-]\d*\.?\d+)?$/.exec(r); return !!m && !!spec.lines[m[1]] && (m[2] == null || !!spec.lines[m[1]].chunks[+m[2]]); };
  const ck = vm.runInNewContext(require(path.join(KIT, "series/make.js")).build(spec).scenes + "\n;({ clockNeg })", {}).clockNeg;
  const bad60 = Array.from({ length: 2000 }, (_, i) => ck(i * 0.07)).filter(x => /:6\d$/.test(x));
  ok(`[tips/${f}] prvky podle reference: titulky 2, odznak 1, karta 2 s čísly z výpočtu, zvuky na existující titulky, rytmus bez akordů`,
    spec.style.words && spec.style.words.v === 2 && /chapterBadge\(t, \{ v: 1,/.test(src) && (/dataCard\(t, \{ v: 2,/.test(src) || (src.match(/workoutCard\(t, \{ v: WV,/g) || []).length === 3) && JSON.stringify(vals) === JSON.stringify(facts3) &&
    Array.isArray(spec.sfx) && spec.sfx.length >= 10 && spec.sfx.every(e => refOk(e.at) && ["pop", "ding", "click", "impact", "shimmer", "riser"].includes(e.kind)) && spec.bed === 1 &&
    bad60.length === 0 && ck(138) === "−2:18" && ck(59.7) === "−1:00", JSON.stringify({ vals, facts3, bad60: bad60.slice(0, 3) }));
  // formát reference (autor 26. 11. 2026): u videa s kartou tréninku každá kapitola odznak → karta tréninku → karta výsledku,
  // rychlý přechod (karta se smrskne do kapky přesně před odznakem další kapitoly), kamera jen pomalu dotáčí
  if (/workoutCard\(t, /.test(src)) ok(`[tips/${f}] formát reference: 3 karty tréninku a výsledku, přechod kapkou před odznakem, pomalá kamera`,
    (src.match(/resultCard\(t, /g) || []).length === 3 && /cardMorph\(t, T\('two:0'\) - 0\.35, y0\); cardMorph\(t, T\('three:0'\) - 0\.35, y0\);/.test(src) &&
    /out: T\('two:0'\) - 0\.35/.test(src) && /out: T\('three:0'\) - 0\.35/.test(src) && spec.style.orbitDur >= 2 && /function cardMorph/.test(fs.readFileSync(path.join(KIT, "series/ride.js"), "utf8")));
  ok(`[tips/${f}] výměna helmy naráz: hlava nikdy holá, silniční a časovkářská nikdy současně`, bare.length === 0 && hs[0][0] === 1 && hs[200][1] === 1, JSON.stringify(bare.slice(0, 3)));
}
// šablona, oddíl 16 (video „3 tipy“): vzor existuje a recept používá stejné pomůcky a nastavení jako vzor
{ const sab = fs.readFileSync(path.join(KIT, "SABLONA.md"), "utf8"), r16 = sab.slice(sab.indexOf("## 16. Video „3 tipy“")), vz = fs.readFileSync(path.join(KIT, "series/tips/01-time-trial.js"), "utf8");
  ok("šablona, oddíl 16: recept na „3 tipy“ sedí se vzorem", sab.includes("## 16. Video „3 tipy“") && /oddíl 16/.test(sab.slice(0, sab.indexOf("## 1."))) &&
    ["helmSwap(t, ", "orbit: [0, 0.35, -0.2, 1.2, 0]", "tips: { at: [T('one:0'), T('two:0'), T('three:0')], end: T('cta:0') }", "ghost: { pose: 1, shrug: 0 }", "pre: { suit: '#EDECE8', suit2: '#16171A', sleeve: 0.44, loose: 1 }"].every(k => r16.includes(k) && vz.includes(k))); }
// varianty háčku (trial reels, autor 28. 11. 2026): každá má 2 titulky, nejvýš 8 slov, čísla slovy, text háčku na obrazovce
// se bere z titulků; nástroje variant.sh a zoom.sh jsou na místě
for (const f of ["study/01-norwegian-4x4.js"]) {
  const spec = require(path.join(KIT, "series", f)), src = fs.readFileSync(path.join(KIT, "series", f), "utf8"), vs = Object.entries(spec.variants || {});
  ok(`[${f}] varianty háčku: aspoň 3, 2 titulky, nejvýš 8 slov, čísla slovy, text háčku z titulků`, vs.length >= 3 && vs.every(([, v]) => v.chunks.length === 2 && v.say.split(/\s+/).length <= 8 && !/\d/.test(v.say)) &&
    /t: L\.hook\.chunks\[0\]\.text/.test(src) && ["series/variant.sh", "series/zoom.sh", "tools/variant_timeline.py"].every(x => fs.existsSync(path.join(KIT, x))), vs.map(v => v[0]).join(", "));
}
ok("motor a nástroje sady jsou na místě", ["engine/engine.js", "engine/render.js", "engine/index.html", "engine/vendor/gsap.min.js", "engine/vendor/LICENSE-gsap.txt",
  "engine/vendor/three.module.js", "engine/vendor/three.core.js", "engine/vendor/LICENSE-three.txt", "engine/vendor/MarchingCubes.js", "engine/vendor/RoomEnvironment.js", "engine/rider3d.mjs", "engine/three-boot.mjs",
  "engine/models/cyclist.json", "engine/models/cyclist.bin", "engine/models/LICENSE-makehuman-CC0.md", "tools/makehuman-cyclist.py", "tools/kokoro-page.js", "series/ride.js", "tools/tts.py", "tools/align.py", "tools/timeline.py",
  "tools/audio.py", "tools/sheet.py", "tools/physics.py", "sim/lbm.py", "sim/potential.py", "sim/mkmask.js", "build.sh", "SABLONA.md"].every(f => fs.existsSync(path.join(KIT, f))));
// náš hlas: bez trvalého profilu prohlížeče (jeho mezipaměť hlásila chybu „match on Cache“ a hlas se zasekl), zvuk přes bypassCSP
{ const kp = fs.readFileSync(path.join(KIT, "tools/kokoro-page.js"), "utf8");
  ok("náš hlas ve výrobě: prohlížeč bez trvalého profilu a bez podstrkování modelu, CSP stránky se nemění", !/launchPersistentContext|\.route\(/.test(kp) && /bypassCSP: true/.test(kp)); }
ok("stránka motoru načítá 3D jezdce jako modul ze souboru", /<script type="module" src="three-boot\.mjs"><\/script>/.test(fs.readFileSync(path.join(KIT, "engine/index.html"), "utf8")));
ok("stránka motoru nemá skript přímo v HTML", !/<script(?![^>]*\bsrc=)[^>]*>/i.test(fs.readFileSync(path.join(KIT, "engine/index.html"), "utf8")));

// ořez ticha a cvaknutí v hlasu (tools/tts.py). Potřebuje python s numpy (pracovní prostředí sady), jinak se přeskočí.
{
  const { spawnSync } = require("child_process");
  const py = [path.join(KIT, "work/env/bin/python"), "python3"].find(p => spawnSync(p, ["-c", "import numpy"]).status === 0);
  if (py) {
    const r = spawnSync(py, [path.join(__dirname, "tts-trim.py"), path.join(KIT, "tools/tts.py")], { encoding: "utf8" });
    ok("hlas: ořez odstraní ticho i osamocené cvaknutí na konci věty, slova nechá", r.status === 0, (r.stdout + r.stderr).trim());
    const g = spawnSync(py, [path.join(__dirname, "audio-gain.py"), path.join(KIT, "tools/audio.py")], { encoding: "utf8" });
    ok("zvuk: gain u věty zesílí úvod aspoň o 3 dB, špičky nepřerostou ostatní věty, ty zůstanou stejně hlasité", g.status === 0, (g.stdout + g.stderr).trim());
    const vt = spawnSync(py, [path.join(__dirname, "variant-timeline.py"), path.join(KIT, "tools/variant_timeline.py")], { encoding: "utf8" });
    ok("varianty pro trial reels: háček se vejde, další věta se posune jen do volného místa, zrychlení nejvýš 1,15×", vt.status === 0, (vt.stdout + vt.stderr).trim());
    const fx = spawnSync(py, [path.join(__dirname, "audio-sfx.py"), path.join(KIT, "tools/audio.py")], { encoding: "utf8" });
    ok("zvuk: efekty zazní ve svůj čas, rytmus vyplní ticho, ale zůstane aspoň 10 dB pod hlasem a nic se neořízne", fx.status === 0, (fx.stdout + fx.stderr).trim());
  } else console.log("- test ořezu hlasu přeskočen (chybí python s numpy, spusť bash video-kit/build.sh setup)");
}

console.log("");
console.log("Sada na videa – úspěšných: " + passed + ", neúspěšných: " + failed);
process.exit(failed ? 1 : 0);
