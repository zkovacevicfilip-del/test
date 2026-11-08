// Spouští se jako první (v hlavičce stránky), ještě před vykreslením.
// 1) Ochrana proti vložení aplikace do cizí stránky (clickjacking): mimo vlastní okno se obsah nezobrazí.
if (window.top !== window.self) {
  document.documentElement.classList.add("framed");
  try { window.top.location.replace(window.self.location.href); } catch (e) { /* cizí stránka to nedovolí, obsah zůstane skrytý */ }
}
// 2) Zda je potřeba zobrazit okno s Podmínkami použití (bez probliknutí aplikace).
window.AERO_TERMS_VER = "2026-11-08";
try {
  var t = JSON.parse(localStorage.getItem("aero.terms") || "null");
  if (!t || t.v !== window.AERO_TERMS_VER) document.documentElement.classList.add("terms-needed");
} catch (e) { document.documentElement.classList.add("terms-needed"); }
