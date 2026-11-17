// Zkoušení oblečení: míry, fotky, verdikt „sedí / nevejde se“ a koláž. Bez AI, nic se nikam neposílá.
"use strict";

// ---------- míry ----------
// typ: "o" obvod, "s" šířka, "d" délka. dil: pro který druh oblečení se míra porovnává.
// meze [nevejde se, těsné, volné] = rezerva oblečení proti tělu v cm (oblečení − tělo).
// bezne = obvyklá rezerva, když tabulka udává míry postavy (odhad míry oblečení = horní hranice + bezne).
// Hranice jsou orientační pravidla, ne norma.
const MIRY = [
  { k: "vyska", telo: "Výška" },
  { k: "hrudnik", telo: "Obvod hrudníku", kus: "Hrudník (podpaží)", typ: "o", dil: "horni", meze: [0, 4, 20], bezne: 8 },
  { k: "pas", telo: "Obvod pasu", kus: "Pas", typ: "o", dil: "oba", meze: [0, 2, 12], bezne: 2 },
  { k: "boky", telo: "Obvod boků", kus: "Boky", typ: "o", dil: "oba", meze: [0, 2, 14], bezne: 4 },
  { k: "ramenaObvod", telo: "Obvod přes ramena", kus: "Obvod přes ramena", typ: "o", dil: "horni", meze: [0, 3, 20], bezne: 6 },
  { k: "ramenaSirka", telo: "Šířka ramen", kus: "Šířka ramen", typ: "s", dil: "horni", meze: [-5, -2, 6], bezne: 1 },
  { k: "paze", telo: "Obvod paže (biceps)", kus: "Obvod rukávu", typ: "o", dil: "horni", meze: [0, 2, 12], bezne: 4 },
  { k: "delkaPaze", telo: "Délka paže (rameno–zápěstí)", kus: "Délka rukávu", typ: "d", dil: "horni", meze: [null, -3, 5], bezne: 0 },
  { k: "krk", telo: "Obvod krku", kus: "Límec", typ: "o", dil: "horni", meze: [0, 1, 5], bezne: 2 },
  { k: "stehno", telo: "Obvod stehna", kus: "Stehno", typ: "o", dil: "dolni", meze: [0, 2, 14], bezne: 4 },
  { k: "nohavice", telo: "Vnitřní délka nohy", kus: "Vnitřní délka nohavice", typ: "d", dil: "dolni", meze: [null, -3, 5], bezne: 0 }
];
const STAVY = { nevejde: "nevejde se", tesne: "těsné", sedi: "sedí", volne: "volné", kratke: "krátké", dlouhe: "dlouhé" };

// všechna čísla v textu: "96–100" → [96, 100], "52,5" → [52.5]
function cisla(text) {
  return (String(text == null ? "" : text).replace(/,/g, ".").match(/\d+(\.\d+)?/g) || []).map(Number);
}
const cislo = text => cisla(text)[0] || null;

// míra oblečení v cm převedená na obvod oblečení (u tabulky postavy jen odhad)
function kusCm(m, text, volby) {
  const n = cisla(text);
  if (!n.length) return null;
  if (volby.postava) return Math.max(...n) + m.bezne;
  const v = n.reduce((a, b) => a + b, 0) / n.length;
  return volby.naplocho && m.typ === "o" ? v * 2 : v;
}

// porovnání jedné míry: rezerva v cm a stav
function posud(m, telo, kus, pruzne) {
  const r = kus - telo, [nevejde, tesne, volne] = m.meze;
  let stav;
  if (m.typ === "d") stav = r < tesne ? "kratke" : r > volne ? "dlouhe" : "sedi";
  else if (r < nevejde) stav = pruzne && r >= nevejde - 0.08 * telo ? "tesne" : "nevejde";
  else stav = r < tesne ? "tesne" : r > volne ? "volne" : "sedi";
  return { rezerva: r, stav };
}

// porovná všechny vyplněné míry a vrátí řádky tabulky a celkový verdikt
function vyhodnot(miryTela, k) {
  const radky = [];
  for (const m of MIRY) {
    if (!m.meze || (m.dil !== "oba" && m.dil !== k.dil)) continue;
    const telo = cislo(miryTela[m.k]), kus = kusCm(m, k.miry[m.k], k);
    if (telo && kus) radky.push(Object.assign({ m, telo, kus }, posud(m, telo, kus, k.pruzne)));
  }
  let celkem = null;
  const male = radky.filter(r => r.stav === "nevejde");
  if (male.length) celkem = { stav: "nevejde", text: "Na tebe se to nevejde: " + male.map(r => r.m.telo.toLowerCase() + " chybí " + Math.round(-r.rezerva) + " cm").join(", ") + "." };
  else if (radky.some(r => r.stav === "tesne" || r.stav === "kratke")) celkem = { stav: "tesne", text: "Obléct to půjde, ale někde to bude těsné nebo krátké." };
  else if (radky.length) celkem = { stav: "sedi", text: "Mělo by ti to sedět." };
  return { radky, celkem };
}

// ---------- uložení v prohlížeči ----------
function nacti(klic, vychozi) {
  try { return Object.assign(vychozi, JSON.parse(localStorage.getItem(klic)) || {}); } catch (e) { return vychozi; }
}
let profil = nacti("obleceni.profil", { miry: {}, fotky: {}, body: [] });
let kus = nacti("obleceni.kus", { dil: "horni", miry: {}, naplocho: false, postava: false, pruzne: false, foto: null, body: [] });
const $ = id => document.getElementById(id);

function uloz() {
  try {
    localStorage.setItem("obleceni.profil", JSON.stringify(profil));
    localStorage.setItem("obleceni.kus", JSON.stringify(kus));
    $("stav").textContent = "";
  } catch (e) {
    $("stav").textContent = "Do prohlížeče se už nic nevejde, poslední změna se po zavření stránky ztratí. Zkus menší fotky.";
  }
}

// ---------- fotky ----------
// zmenší fotku (delší strana nejvýš max px) a vrátí ji jako JPEG v textu (data URL)
function zmensiFoto(soubor, max) {
  return new Promise((hotovo, chyba) => {
    const url = URL.createObjectURL(soubor), img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      const g = c.getContext("2d");
      g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); // průhledné PNG dostane bílé pozadí
      g.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      hotovo(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); chyba(new Error("Fotku se nepodařilo otevřít.")); };
    img.src = url;
  });
}
function obrazek(dataUrl) {
  return new Promise(hotovo => {
    if (!dataUrl) return hotovo(null);
    const img = new Image();
    img.onload = () => hotovo(img);
    img.onerror = () => hotovo(null);
    img.src = dataUrl;
  });
}

// odstraní pozadí: od okrajů obrázku se šíří a mizí vše, co má podobnou barvu jako rohy
function vyriznout(img) {
  const c = document.createElement("canvas"), w = img.width, h = img.height;
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, w, h), p = d.data;
  const rohy = [0, w - 1, (h - 1) * w, h * w - 1];
  const bg = [0, 1, 2].map(i => rohy.reduce((s, j) => s + p[j * 4 + i], 0) / 4);
  const pozadi = j => Math.abs(p[j * 4] - bg[0]) + Math.abs(p[j * 4 + 1] - bg[1]) + Math.abs(p[j * 4 + 2] - bg[2]) < 60;
  const hotovo = new Uint8Array(w * h), fronta = [];
  for (let x = 0; x < w; x++) fronta.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) fronta.push(y * w, y * w + w - 1);
  while (fronta.length) {
    const j = fronta.pop();
    if (hotovo[j] || !pozadi(j)) continue;
    hotovo[j] = 1;
    p[j * 4 + 3] = 0;
    const x = j % w;
    if (x > 0) fronta.push(j - 1);
    if (x < w - 1) fronta.push(j + 1);
    if (j >= w) fronta.push(j - w);
    if (j < w * (h - 1)) fronta.push(j + w);
  }
  g.putImageData(d, 0, 0);
  return c;
}

const obr = { predek: null, vyrez: null }; // načtené obrázky pro kreslení

// ---------- označování bodů klepnutím ----------
const TELO_BODY = ["temeno hlavy", "spodek chodidel", "okraj hrudníku vlevo (v podpaží)", "okraj hrudníku vpravo (v podpaží)", "okraj pasu vlevo", "okraj pasu vpravo"];
const kusBody = () => kus.dil === "horni" ? ["okraj kusu vlevo v podpaží", "okraj kusu vpravo v podpaží"] : ["levý konec pasu (horní okraj)", "pravý konec pasu (horní okraj)"];

function kresliBody(platno, img, body, popisky, krok) {
  platno.classList.toggle("hidden", !img);
  if (!img) { krok.textContent = "Nejdřív nahraj fotku."; return; }
  platno.width = img.width; platno.height = img.height;
  const g = platno.getContext("2d"), r = Math.max(5, img.width / 90);
  g.drawImage(img, 0, 0);
  g.fillStyle = "#8B3DFF"; g.strokeStyle = "#fff"; g.lineWidth = r / 3;
  for (const [x, y] of body) { g.beginPath(); g.arc(x * img.width, y * img.height, r, 0, 2 * Math.PI); g.fill(); g.stroke(); }
  krok.textContent = body.length < popisky.length ? "Klepni na: " + popisky[body.length] + " (" + (body.length + 1) + "/" + popisky.length + ")" : "Body jsou označené.";
}

function klepnuti(platno, data, popisky) {
  platno.addEventListener("click", e => {
    const body = data().body;
    if (body.length >= popisky().length) return;
    const r = platno.getBoundingClientRect();
    body.push([(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]);
    uloz(); vse();
  });
}

// ---------- koláž ----------
// Šířka oblečení = šířka těla na fotce × (obvod oblečení / obvod těla).
// Délka podle skutečných cm: měřítko fotky z výšky postavy, měřítko kusu z jeho šířky naplocho (polovina obvodu).
function kresliKolaz() {
  const c = $("kolaz"), zona = kus.dil === "horni" ? "hrudnik" : "pas", m = MIRY.find(x => x.k === zona);
  const vyska = cislo(profil.miry.vyska), telo = cislo(profil.miry[zona]), g = kusCm(m, kus.miry[zona], kus), chybi = [];
  if (!obr.predek) chybi.push("tvoje fotka zepředu"); else if (profil.body.length < 6) chybi.push("body na tvé fotce");
  if (!obr.vyrez) chybi.push("fotka oblečení"); else if (kus.body.length < 2) chybi.push("body na oblečení");
  if (!vyska) chybi.push("tvoje výška");
  if (!telo) chybi.push(m.telo.toLowerCase());
  if (!g) chybi.push("míra kusu „" + m.kus + "“");
  c.classList.toggle("hidden", chybi.length > 0);
  $("kolazInfo").textContent = chybi.length ? "Pro koláž chybí: " + chybi.join(", ") + "." : "";
  if (chybi.length) return;

  const W = obr.predek.width, H = obr.predek.height, V = obr.vyrez;
  const B = profil.body.map(([x, y]) => [x * W, y * H]), K = kus.body.map(([x, y]) => [x * V.width, y * V.height]);
  const [L, R] = zona === "hrudnik" ? [B[2], B[3]] : [B[4], B[5]];
  const pxNaCm = Math.abs(B[1][1] - B[0][1]) / vyska;
  const sirkaTela = Math.abs(R[0] - L[0]), sirkaKusu = Math.abs(K[1][0] - K[0][0]) || 1;
  let pomer = g / telo;
  if (kus.pruzne && pomer < 1 && pomer >= 0.92) pomer = 1; // pružný kus se natáhne na tělo
  const sx = sirkaTela * pomer / sirkaKusu, sy = pxNaCm * (g / 2) / sirkaKusu;

  c.width = W; c.height = H;
  const x = c.getContext("2d");
  x.drawImage(obr.predek, 0, 0);
  x.globalAlpha = Number($("kryti").value);
  // střed označené čáry na kusu se položí na střed stejné čáry na těle
  x.setTransform(sx, 0, 0, sy, (L[0] + R[0]) / 2 - sx * (K[0][0] + K[1][0]) / 2, (L[1] + R[1]) / 2 - sy * (K[0][1] + K[1][1]) / 2);
  x.drawImage(V, 0, 0);
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalAlpha = 1;
}

// ---------- výsledek ----------
function kresliVysledek() {
  const { radky, celkem } = vyhodnot(profil.miry, kus), v = $("verdikt"), t = $("tabulka");
  v.className = "verdikt " + (celkem ? celkem.stav : "");
  v.textContent = celkem ? celkem.text : "Vyplň aspoň jednu svou míru a stejnou míru kusu.";
  t.replaceChildren();
  if (!radky.length) return;
  const radek = (bunky, tag) => {
    const tr = document.createElement("tr");
    for (const b of bunky) { const td = document.createElement(tag); td.textContent = b; tr.append(td); }
    return t.appendChild(tr);
  };
  radek(["Míra", "Ty", "Kus", "Výsledek"], "th");
  const cm = n => Math.round(n * 10) / 10 + " cm";
  for (const r of radky) {
    const tr = radek([r.m.telo, cm(r.telo), cm(r.kus) + (kus.postava ? " (odhad)" : ""), (r.rezerva >= 0 ? "+" : "") + cm(r.rezerva) + ", " + STAVY[r.stav]], "td");
    tr.lastChild.className = "s-" + r.stav;
  }
}

// ---------- formuláře ----------
function pole(m, data, nazev, typ) {
  const l = document.createElement("label"), i = document.createElement("input");
  l.className = "pole"; l.textContent = nazev;
  i.type = typ; i.dataset[data] = m.k; i.value = (data === "telo" ? profil : kus).miry[m.k] || "";
  if (typ === "number") { i.inputMode = "decimal"; i.min = "0"; i.step = "0.5"; }
  l.append(i);
  return l;
}
function kresliKusPole() {
  $("kusMiry").replaceChildren(...MIRY.filter(m => m.meze && (m.dil === "oba" || m.dil === kus.dil)).map(m => pole(m, "kus", m.kus, "text")));
}

function vse() {
  for (const k of ["predek", "zezadu", "levy", "pravy"]) { const i = $("nahled-" + k); if (profil.fotky[k]) i.src = profil.fotky[k]; else i.removeAttribute("src"); }
  kresliBody($("teloPlatno"), obr.predek, profil.body, TELO_BODY, $("teloKrok"));
  kresliBody($("kusPlatno"), obr.vyrez, kus.body, kusBody(), $("kusKrok"));
  kresliVysledek();
  kresliKolaz();
}

async function start() {
  if (window.top !== window.self) document.documentElement.classList.add("framed"); // ochrana proti vložení do cizího rámečku
  $("teloMiry").replaceChildren(...MIRY.map(m => pole(m, "telo", m.telo, "number")));
  kresliKusPole();
  $("kusDil").value = kus.dil;
  for (const k of ["naplocho", "postava", "pruzne"]) $("kus" + k[0].toUpperCase() + k.slice(1)).checked = !!kus[k];

  document.addEventListener("input", e => {
    const d = e.target.dataset;
    if (d.telo) profil.miry[d.telo] = e.target.value;
    else if (d.kus) kus.miry[d.kus] = e.target.value;
    else return;
    uloz(); kresliVysledek(); kresliKolaz();
  });
  for (const k of ["naplocho", "postava", "pruzne"]) {
    $("kus" + k[0].toUpperCase() + k.slice(1)).addEventListener("change", e => { kus[k] = e.target.checked; uloz(); vse(); });
  }
  $("kusDil").addEventListener("change", e => { kus.dil = e.target.value; kus.body = []; uloz(); kresliKusPole(); vse(); });
  $("kryti").addEventListener("input", e => { $("krytiOut").textContent = Math.round(e.target.value * 100) + " %"; kresliKolaz(); });
  $("teloZnovu").addEventListener("click", () => { profil.body = []; uloz(); vse(); });
  $("kusZnovu").addEventListener("click", () => { kus.body = []; uloz(); vse(); });
  klepnuti($("teloPlatno"), () => profil, () => TELO_BODY);
  klepnuti($("kusPlatno"), () => kus, kusBody);

  for (const vstup of document.querySelectorAll("input[data-foto]")) {
    vstup.addEventListener("change", async () => {
      const k = vstup.dataset.foto;
      if (!vstup.files[0]) return;
      try { profil.fotky[k] = await zmensiFoto(vstup.files[0], 1200); } catch (e) { $("stav").textContent = e.message; return; }
      if (k === "predek") { profil.body = []; obr.predek = await obrazek(profil.fotky.predek); }
      uloz(); vse();
    });
  }
  $("kusFoto").addEventListener("change", async e => {
    if (!e.target.files[0]) return;
    try { kus.foto = await zmensiFoto(e.target.files[0], 1000); } catch (err) { $("stav").textContent = err.message; return; }
    kus.body = [];
    const img = await obrazek(kus.foto);
    obr.vyrez = img && vyriznout(img);
    uloz(); vse();
  });

  obr.predek = await obrazek(profil.fotky.predek);
  const img = await obrazek(kus.foto);
  obr.vyrez = img && vyriznout(img);
  vse();
}
start();
