// Právní stránky: ochrana proti vložení do cizí stránky, režim vložení a tlačítko tisku.
(function () {
  if (window.top !== window.self) {
    document.documentElement.classList.add("framed");
    try { window.top.location.replace(window.self.location.href); } catch (e) { }
  }
  if (/[?&]embed=1/.test(location.search)) document.documentElement.classList.add("embed-html");
  document.addEventListener("DOMContentLoaded", function () {
    if (document.documentElement.classList.contains("embed-html")) document.body.classList.add("embed");
    document.querySelectorAll("[data-print]").forEach(function (b) { b.addEventListener("click", function () { window.print(); }); });
  });
})();
