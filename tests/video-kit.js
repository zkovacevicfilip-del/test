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
    words += l.say.trim().split(/\s+/).length;
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
    ok(`[${name}] krátký scénář má 55 až 90 slov (asi 25 až 33 s)`, words >= 55 && words <= 90, words + " slov");
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
  const codeNoHook = code;   // nápis se zapíná hodnotou hook: 'watt', takže celý název se v kódu nevyskytuje
  ok(`[${name}] video nezmiňuje aplikaci (kromě zapnutého úvodního nápisu wattIF)`, !/aero pozice|wattif|logoImg/i.test(codeNoHook + JSON.stringify(sc.lines)));
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
      if (spec.style) ok(`[${name}] styl zapne kameru nebo pozadí jen přes háčky motoru (CAMERA, BACKGROUND)`, /const CAMERA = STYLE\.camera \? makeCamera/.test(out.scenes) && /const BACKGROUND = STYLE\.bg \? makeBackground/.test(out.scenes) && ["whip", "punch", "drift", "flip", undefined].includes(spec.style.camera) && ["words", "marker", "slot", "reveal", "flap", "glitch", "typing", undefined].includes(spec.style.text) && ["dots", "halftone", "paths", undefined].includes(spec.style.bg) && ["wipe", undefined].includes(spec.style.overlay) && ["top", undefined].includes(spec.style.captions) && ["day", "golden", "overcast", undefined].includes(spec.style.look) && ["classic", undefined].includes(spec.style.ui), JSON.stringify(spec.style));
      if (spec.style && spec.style.captions === "top") ok(`[${name}] titulky nahoře jdou přes háček CAPTIONS a scénář má layout 'top'`, /const CAPTIONS = STYLE\.captions === 'top' \? topCaptions/.test(out.scenes) && out.script.layout === "top" && /function topCaptions/.test(out.scenes) && /function scene3d/.test(out.scenes));
      // autor 22. 11. 2026: realistická krajina, ale texty jako v původní šabloně (whatIF, nadpisy nahoře, titulky dole, fialová)
      if (spec.style && spec.style.ui === "classic") ok(`[${name}] style.ui 'classic': krajina realistická, texty z původní šablony`, !!spec.style.look && spec.style.captions !== "top" && spec.style.hook !== "watt" && out.script.layout !== "top" && /function classicUI/.test(out.scenes) && /classicUI\(t, a, \{/.test(out.scenes) && /const TXTOUT = \(\) => !!OUTDOOR\(\) && !CLASSIC\(\)/.test(out.scenes) && /typeof TXTOUT === 'function' && TXTOUT\(\)/.test(out.scenes) && out.script.lines[out.script.acts[0].lines[0]].captions === false, JSON.stringify(spec.style));
      // oprava 22. 11. 2026: nadpis přes dva akty se při švihu kamery usekl o okraj; nadpisy jsou po aktech a mizí s aktem (actIO),
      // ve venkovní krajině se stíracím pruhem švihá scéna vždy zleva (odkrytý okraj je pod pruhem)
      if (spec.style && spec.style.ui === "classic") ok(`[${name}] nadpisy po aktech mizí s aktem a švih kamery nechá odkrytý okraj pod pruhem`, /const hs = o\.heads && a && o\.heads\[a\.id\]/.test(out.scenes) && /actIO\(t, a\); ctx\.save\(\); ctx\.globalAlpha \*= io\.a; heads\(t, hs, io\.dy\)/.test(out.scenes) && /OUTDOOR\(\) && st\.overlay === 'wipe' \? -1/.test(out.scenes) && !/heads: \[/.test(out.scenes.slice(out.scenes.indexOf("classicUI(t, a, {"))));
      // série „What if“ (a její zkouška stylů) začíná slovy What if; jiné série (ride) mají vlastní háček
      const whatIf = ["what-if", "styl-test"].includes(series);
      ok(`[${name}] název je jedinečný` + (whatIf ? ` a video začíná slovy „What if“` : ""), !titles.has(spec.title) && (!whatIf || /^What if /.test(out.script.lines[out.script.acts[0].lines[0]].say)), spec.title);
      if (spec.voice) ok(`[${name}] voice: 'ours' přepne na náš hlas`, spec.voice === "ours" && out.script.voice.provider === "ours" && out.script.voice.speed === 1.15);
      titles.add(spec.title);
    }
  }
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
  } else console.log("- test ořezu hlasu přeskočen (chybí python s numpy, spusť bash video-kit/build.sh setup)");
}

console.log("");
console.log("Sada na videa – úspěšných: " + passed + ", neúspěšných: " + failed);
process.exit(failed ? 1 : 0);
