'use strict';
// Z popisu videa (soubor ve složce series/<série>/) vyrobí script.json a scenes.js pro build.sh.
//   node make.js <popis.js> <složka>     zapíše script.json a scenes.js do složky (pracovní kopie sady)
//   node make.js --facts <popis.js>      vypíše „Odkud jsou čísla“ a ověří je výpočtem
const fs = require('fs'), path = require('path'), P = require('./physics.js');
const VOICE = { provider: 'elevenlabs', name: 'Liam - Energetic, Social Media Creator', voice_id: 'TX3LPaxmHKxFdv7VOQHJ', model: 'eleven_multilingual_v2',
  settings: { stability: 0.26, similarity_boost: 0.8, style: 0.65, use_speaker_boost: true, speed: 1.1 } };
const TIMING = { lead: 0.15, max_pause: 0.35, gap_line: 0.32, gap_act: 0.62, tail: 0.9 };

// zápis popisu scén jako kód (umí i funkce, třeba vlastní kreslení v „draw“)
function ser(v) {
  if (typeof v === 'function') return v.toString();
  if (Array.isArray(v)) return '[' + v.map(ser).join(', ') + ']';
  if (v && typeof v === 'object') return '{ ' + Object.keys(v).map(k => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)) + ': ' + ser(v[k])).join(', ') + ' }';
  return JSON.stringify(v);
}
// čísla ve videu proti výpočtu: [popis, spočtená hodnota, číslo ve videu, tolerance]
function facts(spec) {
  return (spec.facts ? spec.facts(P) : []).map(f => ({ label: f[0], calc: f[1], shown: f[2], tol: f[3], ok: Math.abs(f[1] - f[2]) <= f[3] }));
}
function build(spec) {
  const script = { title: spec.title, format: 'short', voice: VOICE, timing: TIMING,
    acts: spec.acts.map(a => ({ id: a[0], lines: a.slice(1) })), lines: spec.lines };
  const fl = facts(spec), blocks = fs.readFileSync(path.join(__dirname, 'blocks.js'), 'utf8');
  const head = ["'use strict';", '// SCÉNY krátkého videa „' + spec.title + '“. ' + (spec.about || ''),
    '// Soubor je vyrobený z popisu v series/ (node series/make.js), neupravuj ho ručně.',
    '// Předpoklady výpočtů: 84 kg s kolem, Crr 0,004, účinnost převodů 97,5 %, 20 °C, 0 m n. m., rovina, bezvětří (pokud není řečeno jinak).']
    .concat(fl.map(f => '// Číslo: ' + f.label + ' = ' + (+f.calc.toFixed(3)) + ' (ve videu ' + f.shown + ')'))
    .concat(spec.sources ? ['// Zdroje: ' + spec.sources] : []);
  const scenes = head.join('\n') + '\n\n' + blocks + '\n// ---------- popis tohoto videa ----------\nconst V = ' + ser(spec.scenes) + ';\n' +
    'const SCENES = {}, AMBIENT = {};\nfor (const id in V) { SCENES[id] = makeScene(V[id]); AMBIENT[id] = V[id].amb == null ? 0.2 : V[id].amb; }\nconst FLOWS = makeFlows(V);\n';
  return { script, scenes, facts: fl };
}
module.exports = { build, facts, VOICE, TIMING };

if (require.main === module) {
  const a = process.argv.slice(2);
  if (a[0] === '--facts') {
    const spec = require(path.resolve(a[1])); let bad = 0;
    for (const f of facts(spec)) { if (!f.ok) bad++; console.log((f.ok ? '✓ ' : '✗ ') + f.label + ': spočteno ' + (+f.calc.toFixed(3)) + ', ve videu ' + f.shown); }
    if (spec.sources) console.log('Zdroje: ' + spec.sources);
    process.exit(bad ? 1 : 0);
  }
  const spec = require(path.resolve(a[0])), out = build(spec), bad = out.facts.filter(f => !f.ok);
  if (bad.length) { bad.forEach(f => console.log('ČÍSLO NESEDÍ: ' + f.label + ': spočteno ' + f.calc + ', ve videu ' + f.shown)); process.exit(1); }
  fs.writeFileSync(path.join(a[1], 'script.json'), JSON.stringify(out.script, null, 1) + '\n');
  fs.writeFileSync(path.join(a[1], 'scenes.js'), out.scenes);
}
