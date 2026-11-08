// Jen vzhled: klouzavá bílá pilulka ve všech vodorovných výběrech, směr přechodů
// a posun na začátek obsahu. Funkce aplikace neovlivňuje: přepínání samo dělají
// aero.js a index.html, tady se jen sleduje, které tlačítko má třídu "on".
(() => {
  const nav = document.getElementById("topnav");
  const root = document.documentElement.style;
  const still = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  const ease = p => 1 - Math.pow(1 - p, 4); // stejný průběh jako přechody tlačítek v CSS
  const EASE = "cubic-bezier(.22,1,.36,1)";
  let timer = null;

  // ---------- hlavní menu: obsah vjede ze strany a stránka se vrátí na začátek obsahu ----------
  if (nav) document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("#topnav button"); if (!b) return;
    const order = ["pos", "aero", "hist"], cur = nav.querySelector("button.on");
    const d = order.indexOf(b.dataset.top) - order.indexOf(cur ? cur.dataset.top : "pos");
    if (!d) return;
    root.setProperty("--dx", (d > 0 ? 36 : -36) + "px"); root.setProperty("--dy", "0px");
    clearTimeout(timer); timer = setTimeout(() => { root.removeProperty("--dx"); root.removeProperty("--dy"); }, 800);
    const hero = document.querySelector(".hero"), top = hero ? hero.getBoundingClientRect().bottom + window.scrollY : 0;
    if (window.scrollY > top + 4) requestAnimationFrame(() => window.scrollTo({ top, behavior: "smooth" }));
  }, true);

  // ---------- obsah vybrané záložky vjede ze strany (podle data-pane) ----------
  const animatePane = (fam, dir) => {
    const sel = fam.dataset && fam.dataset.pane; if (!sel || still || !dir) return;
    requestAnimationFrame(() => document.querySelectorAll(sel).forEach(p => {
      if (!p.offsetParent || !p.animate) return;
      p.animate([{ opacity: 0, transform: "translate3d(" + dir * 24 + "px,0,0)" }, { opacity: 1, transform: "none" }], { duration: 450, easing: EASE });
    }));
  };

  // ---------- vodorovný výběr: bílá pilulka přejede pod zvolené tlačítko ----------
  function initSeg(el) {
    if (el._seg) return;
    let ind = el.querySelector(":scope > .seg-ind");
    if (!ind) { ind = document.createElement("span"); ind.className = "seg-ind"; ind.setAttribute("aria-hidden", "true"); el.insertBefore(ind, el.firstChild); }
    const fam = el.closest("[data-pane]") || el, isNav = el === nav;
    const st = el._seg = { x: 0, w: 0, raf: 0, act: null, shown: false };
    const active = () => el.querySelector(":scope > button.on");
    const set = (x, w) => { st.x = x; st.w = w; ind.style.width = w + "px"; ind.style.transform = "translateX(" + x + "px)"; };
    const show = on => { if (st.shown !== on) { st.shown = on; ind.style.opacity = on ? "1" : "0"; } };
    const place = () => { const a = active(); if (!a) { show(false); return; } if (!a.offsetWidth) return; set(a.offsetLeft, a.offsetWidth); show(true); };
    // okraje naznačí, že se výběr dá posunout (jen když se nevejde na šířku)
    const fade = () => { const max = el.scrollWidth - el.clientWidth; el.classList.toggle("fade-l", max > 1 && el.scrollLeft > 2); el.classList.toggle("fade-r", max > 1 && el.scrollLeft < max - 2); };
    const follow = ms => { cancelAnimationFrame(st.raf); const end = performance.now() + ms; const step = () => { place(); fade(); if (performance.now() < end) st.raf = requestAnimationFrame(step); }; st.raf = requestAnimationFrame(step); };
    const reveal = a => { const max = el.scrollWidth - el.clientWidth; if (max <= 1) return; el.scrollTo({ left: Math.max(0, Math.min(max, a.offsetLeft - (el.clientWidth - a.offsetWidth) / 2)), behavior: still ? "auto" : "smooth" }); };
    const aria = () => el.querySelectorAll(":scope > button").forEach(b => b.setAttribute("aria-current", b.classList.contains("on") ? (isNav ? "page" : "true") : "false"));
    const change = () => {
      aria();
      const a = active();
      if (a === st.act) { follow(700); return; } // změnil se jen text nebo šířka
      st.act = a;
      if (!a) { show(false); return; }          // zvolené je v jiné skupině
      const prev = fam._last;
      if (a !== prev) {
        const dir = prev && prev.isConnected ? (prev.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING ? 1 : -1) : 0;
        fam._last = a; if (!isNav) animatePane(fam, dir);
      }
      setTimeout(() => reveal(a), 60); setTimeout(() => { if (active() === a) reveal(a); }, 660); // znovu po roztažení tlačítka
      if (still || !st.shown || !st.w) { follow(700); return; } // pilulka se objeví rovnou na místě
      const fx = st.x, fw = st.w, t0 = performance.now(), dur = 600;
      cancelAnimationFrame(st.raf);
      const step = now => {
        const b = active(); if (!b) return;
        const p = Math.min(1, (now - t0) / dur), e = ease(p);
        set(fx + (b.offsetLeft - fx) * e, fw + (b.offsetWidth - fw) * e); fade();
        if (p < 1) st.raf = requestAnimationFrame(step); else follow(120);
      };
      st.raf = requestAnimationFrame(step);
    };
    el.classList.add("js");
    st.act = active(); if (!fam._last && st.act) fam._last = st.act;
    place(); fade(); aria();
    new MutationObserver(muts => { if (muts.some(m => m.target !== el && m.target !== ind)) change(); })
      .observe(el, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["class"] });
    el.addEventListener("scroll", fade, { passive: true });
    // při zobrazení skryté části nebo změně velikosti (otočení tabletu) pilulka dojede na místo
    if (window.ResizeObserver) new ResizeObserver(() => follow(750)).observe(el); else window.addEventListener("resize", () => follow(750));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  }

  const scan = r => r.querySelectorAll(".seg").forEach(initSeg);
  if (nav) initSeg(nav);
  // výběry v části Aero a výkon vytváří aero.js, ten doběhne před DOMContentLoaded
  document.addEventListener("DOMContentLoaded", () => scan(document));
  // záložky pohledů se vytvoří až po výběru režimu
  const tabs = document.getElementById("tabs");
  if (tabs) new MutationObserver(() => scan(tabs)).observe(tabs, { childList: true });
})();
