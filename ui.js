// Jen vzhled: směr animace při přepnutí hlavních částí a posun na začátek obsahu.
// Funkce aplikace neovlivňuje (přepínání samo dělá aero.js).
(() => {
  const nav = document.getElementById("topnav"); if (!nav) return;
  const order = ["pos", "aero", "hist"], root = document.documentElement.style;
  let timer = null;

  // Ještě před přepnutím: obsah vjede zprava (dopředu v menu) nebo zleva (zpět)
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("#topnav button"); if (!b) return;
    const cur = nav.querySelector("button.on");
    const d = order.indexOf(b.dataset.top) - order.indexOf(cur ? cur.dataset.top : "pos");
    if (!d) return;
    root.setProperty("--dx", (d > 0 ? 36 : -36) + "px"); root.setProperty("--dy", "0px");
    clearTimeout(timer); timer = setTimeout(() => { root.removeProperty("--dx"); root.removeProperty("--dy"); }, 800);
    // když je stránka odscrollovaná, vrať se na začátek obsahu pod menu
    const hero = document.querySelector(".hero"), top = hero ? hero.getBoundingClientRect().bottom + window.scrollY : 0;
    if (window.scrollY > top + 4) requestAnimationFrame(() => window.scrollTo({ top, behavior: "smooth" }));
  }, true);

  // Bílá pilulka pod zvoleným tlačítkem: plynule přejede ze staré polohy na novou
  const ind = nav.querySelector(".nav-ind"), still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let raf = 0, curX = 0, curW = 0;
  const set = (x, w) => { curX = x; curW = w; ind.style.width = w + "px"; ind.style.transform = "translateX(" + x + "px)"; };
  const place = () => { const a = nav.querySelector("button.on"); if (a && ind) set(a.offsetLeft, a.offsetWidth); };
  const slide = () => {
    if (!ind) return;
    if (still) { requestAnimationFrame(place); return; }
    const fx = curX, fw = curW, t0 = performance.now(), dur = 600;
    cancelAnimationFrame(raf);
    const step = now => {
      const a = nav.querySelector("button.on"); if (!a) return;
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4); // stejný průběh jako tlačítka
      set(fx + (a.offsetLeft - fx) * e, fw + (a.offsetWidth - fw) * e);
      if (p < 1) raf = requestAnimationFrame(step); else requestAnimationFrame(place);
    };
    raf = requestAnimationFrame(step);
  };
  // při změně velikosti okna (otočení tabletu) tlačítka chvíli mění šířku, pilulka je sleduje
  const follow = () => { const end = performance.now() + 750; cancelAnimationFrame(raf); const step = () => { place(); if (performance.now() < end) raf = requestAnimationFrame(step); }; raf = requestAnimationFrame(step); };
  if (ind) { nav.classList.add("js"); place(); window.addEventListener("resize", follow); if (document.fonts && document.fonts.ready) document.fonts.ready.then(place); }
  nav.addEventListener("click", slide);

  // Pro čtečky obrazovky: které tlačítko je zvolené
  const sync = () => nav.querySelectorAll("button").forEach(x => x.setAttribute("aria-current", x.classList.contains("on") ? "page" : "false"));
  new MutationObserver(sync).observe(nav, { subtree: true, attributes: true, attributeFilter: ["class"] });
  sync();
})();
