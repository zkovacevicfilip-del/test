// Okno s Podmínkami použití při prvním spuštění. Bez zaškrtnutí a potvrzení nejde aplikace používat.
// Přijetí (verze a čas) se ukládá jen v zařízení. Při nové verzi podmínek se okno zobrazí znovu.
(() => {
  const html = document.documentElement, gate = document.getElementById("termsGate"); if (!gate) return;
  const VER = window.AERO_TERMS_VER || "2026-11-08";
  const read = () => { try { const t = JSON.parse(localStorage.getItem("aero.terms")); return !!(t && t.v === VER && t.at); } catch (e) { return false; } };
  if (read()) { html.classList.remove("terms-needed"); return; }
  html.classList.add("terms-needed");

  const doc = document.getElementById("tgDoc"), ok = document.getElementById("tgOk"), go = document.getElementById("tgGo");
  // zbytek stránky je pro klávesnici a čtečky obrazovky nedostupný, dokud podmínky nepřijmeš
  const others = [...document.body.children].filter(e => e !== gate && e.tagName !== "SCRIPT");
  others.forEach(e => { e.inert = true; e.setAttribute("aria-hidden", "true"); });

  // celé znění podmínek z jediného zdroje (podminky.html)
  fetch("podminky.html?v=1", { cache: "no-cache" })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(t => { const main = new DOMParser().parseFromString(t, "text/html").getElementById("doc"); if (!main) throw new Error("bez obsahu"); doc.innerHTML = main.innerHTML; doc.scrollTop = 0; })
    .catch(() => { doc.innerHTML = '<p>Podmínky se nepodařilo načíst. Otevři je prosím <a href="podminky.html" target="_blank" rel="noopener">zde</a> a pak se vrať.</p>'; });

  ok.addEventListener("change", () => { go.disabled = !ok.checked; });
  go.addEventListener("click", () => {
    if (!ok.checked) return;
    try { localStorage.setItem("aero.terms", JSON.stringify({ v: VER, at: new Date().toISOString() })); } catch (e) { /* soukromý režim: platí jen pro toto otevření */ }
    html.classList.remove("terms-needed");
    others.forEach(e => { e.inert = false; e.removeAttribute("aria-hidden"); });
    gate.setAttribute("aria-hidden", "true");
    const first = document.querySelector("#topnav button.on"); if (first) first.focus({ preventScroll: true });
  });
  setTimeout(() => { try { gate.focus({ preventScroll: true }); } catch (e) { } }, 50); // fokus na okno (pro čtečky obrazovky)
})();
