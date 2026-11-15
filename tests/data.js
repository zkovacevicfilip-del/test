// Testovací data vyrobená skriptem. Všechno jsou vymyšlená čísla,
// žádné skutečné fotky, videa, soubory .fit ani údaje skutečného jezdce.
"use strict";

// Vlastní generátor náhodných čísel se stálým začátkem: data vyjdou při každém běhu stejně.
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

// Platná záloha: seznam pozic ve tvaru, v jakém ho aplikace stahuje (Moje pozice → Stáhnout zálohu).
function validBackup(n) {
  const r = rng(20261112), between = (a, b, d) => +(a + (b - a) * r()).toFixed(d);
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({
      id: "test-id-" + (i + 1),
      rid: "test-rid-" + (i + 1),
      name: "Testovací pozice " + (i + 1),
      date: "2026-0" + (i + 1) + "-15T10:00:00.000Z",
      note: "vyrobeno skriptem",
      mode: "fixed",
      views: [{ view: "left", video: false, frames: 1, edited: false }],
      rider: { height: between(170, 190, 0), weight: between(65, 80, 1) },
      side: { torso: between(5, 20, 1), hip: between(40, 55, 1), knee: between(140, 150, 1) },
      mobility: { hip: between(110, 130, 0) },
      area: { m2: between(0.32, 0.38, 3), bike: true, scale: "a4" },
      cda: { value: between(0.2, 0.25, 3), sd: 0.004, laps: 5, source: "jízda", wind: false },
      comfort: 7,
      sentHash: null
    });
  }
  return out;
}

const json = x => Buffer.from(JSON.stringify(x, null, 1), "utf8");
const file = (name, buffer) => ({ name, mimeType: "application/json", buffer });

module.exports = {
  validBackup,
  // soubory pro pole „Načíst zálohu“
  files: {
    valid: n => file("zaloha-platna.json", json(validBackup(n))),
    notJson: () => file("zaloha-neni-json.json", Buffer.from("tohle neni JSON {{{", "utf8")),
    notList: () => file("zaloha-neni-seznam.json", json({ pozice: validBackup(1) })),
    // záznamy bez povinných položek nebo se špatným typem
    badRecords: () => file("zaloha-vadne-zaznamy.json", json([{ name: "bez id" }, "text místo záznamu", { id: "mezera v id", rid: "x" }, 42])),
    // pokus propašovat do stránky cizí kód přes název a neznámé pole
    hostile: () => file("zaloha-skodliva.json", json([{
      id: "zly-1", rid: "zly-rid-1", name: '<img src=x id="vetrelec" onerror="window.__napadeno=1">',
      note: "<script>window.__napadeno=1</script>", cizi: "neznámé pole", side: { torso: "<b>text místo čísla</b>" }
    }])),
    tooBig: () => file("zaloha-moc-velka.json", Buffer.alloc(5e6 + 10, 0x20))
  }
};
