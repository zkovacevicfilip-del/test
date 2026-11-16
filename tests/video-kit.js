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
    ok(`[${name}] hook je první věta, má nejvýš 16 slov a text přímo ve scéně`,
      hook.captions === false && hook.say.trim().split(/\s+/).length <= 16, hook.say);
  } else {
    ok(`[${name}] formát je buď vynechaný, nebo "short"`, sc.format === undefined, String(sc.format));
    ok(`[${name}] scénář má 120 až 180 slov (asi 55 až 70 s)`, words >= 120 && words <= 180, words + " slov");
  }
  ok(`[${name}] hlas je Liam z ElevenLabs`, sc.voice.provider === "elevenlabs" && sc.voice.voice_id === "TX3LPaxmHKxFdv7VOQHJ");

  // scenes.js jen definuje funkce a tři tabulky, takže jde načíst bez prohlížeče
  const code = fs.readFileSync(path.join(dir, "scenes.js"), "utf8");
  const t = vm.runInNewContext(code + "\n;({ SCENES, AMBIENT, FLOWS })", {});
  const ids = sc.acts.map(a => a.id);
  ok(`[${name}] každý akt má scénu i sílu pozadí`,
    ids.every(id => typeof t.SCENES[id] === "function" && t.AMBIENT[id] >= 0 && t.AMBIENT[id] <= 0.5), ids.join(", "));
  ok(`[${name}] používá jen připravená proudění`, Object.keys(t.FLOWS).every(n => ["rider", "cyl", "drop"].includes(n)), Object.keys(t.FLOWS).join(", "));
  ok(`[${name}] scény nepoužívají náhodu ani skutečný čas`, !/Math\.random|Date\.now|new Date/.test(code));
  ok(`[${name}] video nezmiňuje aplikaci`, !/aero pozice|logoImg/i.test(code + JSON.stringify(sc.lines)));
}

check(KIT, "aktuální video");
for (const ex of fs.readdirSync(path.join(KIT, "examples"))) check(path.join(KIT, "examples", ex), "vzor " + ex);
ok("motor a nástroje sady jsou na místě", ["engine/engine.js", "engine/render.js", "engine/index.html", "tools/tts.py", "tools/align.py", "tools/timeline.py",
  "tools/audio.py", "tools/sheet.py", "tools/physics.py", "sim/lbm.py", "sim/potential.py", "sim/mkmask.js", "build.sh", "SABLONA.md"].every(f => fs.existsSync(path.join(KIT, f))));
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
