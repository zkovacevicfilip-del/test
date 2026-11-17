// PŘEDNES: úprava hlasitosti a pauz tak, aby hlas Kokoro mluvil podobně živě jako Liam z ElevenLabs.
// Nemění barvu hlasu, jen dynamiku: kde věta zesílí, kde zeslabí a jak dlouhé jsou pauzy.
// Pravidla (RULES) jsou rozdíl dvou lineárních modelů hlasitosti slova změřených na 125 větách z našich videí:
// stejné věty namluvené Liamem a vygenerované hlasem am_fenrir (rozbor 17. 11. 2026, viz README).
// Funguje i v Node (testy): nepoužívá nic z prohlížeče.

export const FUNC = new Set("a an the of to and or in on at by for with is are was be it its it's you your you're that this as from but so if than then just about over".split(" "));
export const NUM = new Set("zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred thousand percent half quarter".split(" "));

// korekce v dB (Liam − Fenrir): obrys věty v 5 pásmech polohy (0–20 % … 80–100 %), první a poslední slovo, druh slova a interpunkce.
// Hodnoty: dvě kola měření (17. 11. 2026). Po úpravě se model hlasitosti Fenrira liší od Liamova nejvýš o 0,65 dB v každé vlastnosti
// (před úpravou až o 2,4 dB). Celková hlasitost se na konci vyrovná, rozhoduje tvar.
export const RULES = { band: [-1.09, -0.56, -0.45, 0.6, 1.51], first: 3.78, last: -0.74, func: 2.2, num: 0.51, comma: -0.73, q: 1.49, max: 4 };
// cílové délky pauz u interpunkce uvnitř úseku (s): medián u Liama. Kratší pauzy se prodlouží, delší zkrátí.
export const PAUSE = { ",": 0.28, ":": 0.25, ";": 0.28, ".": 0.29, "?": 0.31, "!": 0.35, "…": 0.35 };

// slova věty s druhem a interpunkcí za nimi; pomlčky dělí slovo na dvě (jako přepis řeči)
export function words(text) {
  const out = [];
  for (const raw of text.trim().split(/\s+/)) {
    const m = /^["'(]*(.*?)([.,:;!?…"')\]]*)$/.exec(raw), parts = m[1].split("-").filter(Boolean);
    parts.forEach((p, j) => {
      const w = p.toLowerCase().replace(/[^a-z']/g, "");
      if (w) out.push({ w, punct: j === parts.length - 1 ? m[2] : "", func: FUNC.has(w), num: NUM.has(w) });
    });
  }
  // poloha ve větě: věta končí . ? ! (jeden úsek textu může mít víc vět)
  let s0 = 0;
  out.forEach((x, i) => { if (i === out.length - 1 || /[.!?…]/.test(x.punct)) { for (let k = s0; k <= i; k++) { out[k].si = k - s0; out[k].sn = i - s0 + 1; } s0 = i + 1; } });
  return out;
}

// váha slova pro odhad délky: počet hlásek z fonetického přepisu (když je), jinak samohlásky a délka slova
function weights(ws, phonemes) {
  const ph = (phonemes || "").replace(/[ˈˌː.,!?;:—…"()]/g, "").trim().split(/\s+/).filter(Boolean);
  if (ph.length === ws.length) return ph.map(p => Math.max(2, [...p].length));
  return ws.map(x => Math.max(2, (x.w.match(/[aeiouy]+/g) || []).length * 2 + x.w.length * 0.4));
}

// hlasitost po 10 ms v dB
export function envelope(a, sr) {
  const hop = Math.round(sr * 0.01), n = Math.max(1, Math.floor(a.length / hop)), db = new Float32Array(n);
  for (let i = 0; i < n; i++) { let s = 0; for (let k = i * hop; k < Math.min(a.length, (i + 1) * hop); k++) s += a[k] * a[k]; db[i] = 10 * Math.log10(s / hop + 1e-10); }
  return { db, hop };
}

// tiché úseky uvnitř řeči delší než 50 ms (ve snímcích po 10 ms)
export function gaps(db) {
  let peak = -200; for (const v of db) peak = Math.max(peak, v);
  const thr = peak - 35, on = Array.from(db, v => v > thr), s = on.indexOf(true), e = on.lastIndexOf(true), out = [];
  for (let i = s; i <= e; i++) if (!on[i]) { let j = i; while (j <= e && !on[j]) j++; if (j - i >= 5) out.push([i, j]); i = j; }
  return { start: Math.max(0, s), end: Math.max(0, e + 1), gaps: out };
}

// odhad, kde které slovo ve zvuku je (v sekundách): pauzy se přiřadí k interpunkci, uvnitř úseků podle počtu hlásek
// a hranice se dorovnají na nejbližší pokles hlasitosti
export function wordTimes(a, sr, ws, phonemes) {
  const { db, hop } = envelope(a, sr), G = gaps(db), dt = hop / sr, wt = weights(ws, phonemes), n = ws.length;
  const total = wt.reduce((x, y) => x + y, 0); let acc = 0; const frac = wt.map(v => (acc += v) / total);   // podíl řeči na konci slova
  // kandidáti na pauzu: slova s interpunkcí (ne poslední); ke každé pauze nejbližší kandidát podle polohy
  const cand = ws.map((x, i) => i < n - 1 && /[,:;.!?…]/.test(x.punct) ? i : -1).filter(i => i >= 0), cut = new Map();
  const speech = G.end - G.start - G.gaps.reduce((x, g) => x + g[1] - g[0], 0);
  // nejdelší ticha přiřadit první (skutečná pauza je delší než zavření rtů u p, t, k); pořadí pauz musí odpovídat pořadí slov
  for (const g of [...G.gaps].sort((x, y) => (y[1] - y[0]) - (x[1] - x[0]))) {
    const before = g[0] - G.start - G.gaps.filter(h => h[1] <= g[0]).reduce((x, h) => x + h[1] - h[0], 0), p = before / Math.max(1, speech);
    let best = -1, bd = 0.08;
    for (const i of cand) {
      if (cut.has(i) || Math.abs(frac[i] - p) >= bd) continue;
      let ok = true; for (const [j, h] of cut) if ((j < i && h[1] > g[0]) || (j > i && h[0] < g[1])) ok = false;
      if (ok) { bd = Math.abs(frac[i] - p); best = i; }
    }
    if (best >= 0) cut.set(best, g);
  }
  // úseky mezi přiřazenými pauzami; uvnitř rozdělit podle vah
  const bounds = [], idx = [-1, ...[...cut.keys()].sort((x, y) => x - y), n - 1];
  for (let s = 0; s < idx.length - 1; s++) {
    const i0 = idx[s] + 1, i1 = idx[s + 1], f0 = s === 0 ? G.start : cut.get(idx[s])[1], f1 = s === idx.length - 2 ? G.end : cut.get(idx[s + 1])[0];
    const w = wt.slice(i0, i1 + 1), W = w.reduce((x, y) => x + y, 0); let c = 0;
    for (let i = i0; i <= i1; i++) {
      const t0 = f0 + (f1 - f0) * c / W; c += wt[i]; const t1 = f0 + (f1 - f0) * c / W;
      bounds[i] = [t0, t1];
    }
  }
  // dorovnání vnitřních hranic na nejtišší snímek v okolí ±50 ms (jen uvnitř souvislé řeči)
  for (let i = 0; i < n - 1; i++) {
    if (cut.has(i)) continue;
    const b = Math.round(bounds[i][1]); let best = b;
    for (let k = Math.max(1, b - 5); k <= Math.min(db.length - 2, b + 5); k++) if (db[k] < db[best]) best = k;
    bounds[i][1] = best; bounds[i + 1][0] = best;
  }
  return { times: bounds.map(([x, y]) => [x * dt, y * dt]), cut, gaps: G, dt };
}

// zisk slova v dB podle pravidel: obrys věty plynule mezi středy pásem, k tomu vlastnosti slova
export function gainOf(ws, i, R = RULES) {
  const x = ws[i], j = x.si, n = x.sn, p = n > 1 ? j / (n - 1) : 0, c = Math.max(0, Math.min(4, p * 5 - 0.5)), k = Math.floor(c), u = c - k;
  const band = R.band[k] + (R.band[Math.min(4, k + 1)] - R.band[k]) * u;
  const g = band + (j === 0 ? R.first : 0) + (j === n - 1 && n > 1 ? R.last : 0) + (x.func ? R.func : 0) + (x.num ? R.num : 0) +
    (j < n - 1 && /^[,:;]/.test(x.punct) ? R.comma : 0) + (/\?/.test(x.punct) ? R.q : 0);
  return Math.max(-R.max, Math.min(R.max, g));
}

// celá úprava jedné věty: zisk po slovech s plynulými přechody (40 ms) a zkrácení dlouhých pauz na Liamovy délky
export function shape(a, sr, text, phonemes, R = RULES) {
  const ws = words(text); if (ws.length < 2 || !a.length) return a;
  const T = wordTimes(a, sr, ws, phonemes), g = ws.map((_, i) => gainOf(ws, i, R)), ramp = 0.04;
  const out = new Float32Array(a.length);
  // zisk v čase: uprostřed slova jeho hodnota, na hranici plynulý přechod k sousednímu
  let w = 0;
  for (let k = 0; k < a.length; k++) {
    const t = k / sr; while (w < ws.length - 1 && t > T.times[w][1]) w++;
    let db = g[w];
    const b0 = T.times[w][0], b1 = T.times[w][1];
    if (w > 0 && t - b0 < ramp / 2) { const u = 0.5 + (t - b0) / ramp; db = g[w - 1] + (g[w] - g[w - 1]) * (0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, u)))); }
    else if (w < ws.length - 1 && b1 - t < ramp / 2) { const u = 0.5 - (b1 - t) / ramp; db = g[w] + (g[w + 1] - g[w]) * (0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, u)))); }
    out[k] = a[k] * Math.pow(10, db / 20);
  }
  // pauzy u interpunkce srovnat na Liamovu délku (kratší prodloužit tichem, delší zkrátit); střih uprostřed ticha s prolnutím 10 ms
  const cuts = [...T.cut.entries()].sort((x, y) => x[0] - y[0]), hop = Math.round(T.dt * sr), parts = []; let last = 0;
  for (const [i, gp] of cuts) {
    const target = PAUSE[ws[i].punct[0]] ?? 0.28, have = (gp[1] - gp[0]) * T.dt, mid = Math.round((gp[0] + gp[1]) / 2 * hop);
    if (Math.abs(have - target) < 0.03) continue;
    if (have > target) { const drop = Math.round((have - target) * sr); parts.push(out.subarray(last, mid - (drop >> 1))); last = mid + drop - (drop >> 1); }
    else { parts.push(out.subarray(last, mid)); parts.push(new Float32Array(Math.round((target - have) * sr))); last = mid; }
  }
  if (!parts.length) return out;
  parts.push(out.subarray(last));
  const len = parts.reduce((x, p) => x + p.length, 0), res = new Float32Array(len), f = Math.round(0.01 * sr); let o = 0;
  parts.forEach((p, j) => { res.set(p, o); if (j > 0) for (let k = 0; k < f && o + k < len; k++) res[o + k] *= k / f; if (j < parts.length - 1) for (let k = 0; k < f; k++) res[o + p.length - 1 - k] *= k / f; o += p.length; });
  return res;
}
