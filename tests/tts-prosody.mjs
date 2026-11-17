// Test úpravy přednesu (video-kit/tts/prosody.mjs): běží v Node na umělých zvucích, bez modelu a bez internetu.
import * as P from "../video-kit/tts/prosody.mjs";
let passed = 0, failed = 0;
const ok = (label, cond, detail) => { if (cond) { passed++; console.log("✓ " + label); } else { failed++; console.log("✗ " + label + (detail ? " → " + detail : "")); } };
const SR = 24000;
// „slovo“ = tón 140 Hz s obálkou, „pauza“ = ticho
const tone = s => { const n = Math.round(s * SR), a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = 0.5 * Math.sin(2 * Math.PI * 140 * i / SR) * Math.sin(Math.PI * i / n); return a; };
const sil = s => new Float32Array(Math.round(s * SR));
const join = parts => { const n = parts.reduce((x, p) => x + p.length, 0), a = new Float32Array(n); let o = 0; for (const p of parts) { a.set(p, o); o += p.length; } return a; };
// nejdelší ticho uvnitř zvuku (s)
const longestGap = a => { const { db } = P.envelope(a, SR), G = P.gaps(db); return Math.max(0, ...G.gaps.map(g => (g[1] - g[0]) * 0.01)); };

const w = P.words("Same rider, same power. One finishes three and a half minutes ahead! Why?");
ok("text se rozdělí na slova a věty (poloha se počítá v každé větě zvlášť)", w.length === 13 && w[4].w === "one" && w[4].si === 0 && w[4].sn === 8 && w[12].si === 0 && w[12].sn === 1, JSON.stringify(w.map(x => [x.w, x.si, x.sn])));
ok("pomocná slova a čísla se poznají", w[7].func && w[6].num && !w[1].func && !w[1].num);
ok("pravidla jsou v mezích (nejvýš ±4 dB) a první slovo věty je zesílené", Object.values(P.RULES).flat().every(v => Math.abs(v) <= 4) && P.RULES.first > 0);
const ws = P.words("The power, the wind and the road.");
ok("zisk slova: první slovo věty hlasitější než stejné slovo uprostřed", P.gainOf(ws, 0) > P.gainOf(ws, 2), P.gainOf(ws, 0) + " / " + P.gainOf(ws, 2));
ok("zisk slova nikdy nepřekročí ±4 dB", ws.every((_, i) => Math.abs(P.gainOf(ws, i)) <= 4));

// krátká pauza u čárky se prodlouží na Liamovu délku, dlouhá zkrátí, a nic jiného se nezmění
const text = "Same rider, same power today.";
const short = join([tone(0.25), tone(0.3), sil(0.10), tone(0.25), tone(0.3), tone(0.3)]);
const out1 = P.shape(short, SR, text, "sˈeɪm ɹˈaɪdɚ sˈeɪm pˈaʊɚ tədˈeɪ");
ok("pauza u čárky 0,10 s se prodlouží na asi 0,28 s", Math.abs(longestGap(out1) - P.PAUSE[","]) < 0.04, longestGap(out1).toFixed(3) + " s");
const long = join([tone(0.25), tone(0.3), sil(0.70), tone(0.25), tone(0.3), tone(0.3)]);
const out2 = P.shape(long, SR, text, "");
ok("pauza u čárky 0,70 s se zkrátí na asi 0,28 s", Math.abs(longestGap(out2) - P.PAUSE[","]) < 0.04, longestGap(out2).toFixed(3) + " s");
ok("výsledek je platný zvuk (žádné NaN, bez přebuzení nad 1,6×)", [out1, out2].every(a => a.every(v => Number.isFinite(v) && Math.abs(v) < 0.8)));
const T = P.wordTimes(long, SR, P.words(text), "");
ok("pauza se přiřadí ke slovu s čárkou a časy slov jdou po sobě", T.cut.has(1) && T.times.every((t, i) => t[0] <= t[1] && (i === 0 || t[0] >= T.times[i - 1][1] - 1e-9)), JSON.stringify([...T.cut.keys()]));
ok("jedno slovo nebo prázdný zvuk projde beze změny", P.shape(tone(0.3), SR, "Hello.", "").length === Math.round(0.3 * SR) && P.shape(new Float32Array(0), SR, "Hello there.", "").length === 0);

console.log("\nPřednes – úspěšných: " + passed + ", neúspěšných: " + failed);
process.exit(failed ? 1 : 0);
