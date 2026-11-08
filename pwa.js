// Instalace aplikace na plochu (bez offline režimu).
(() => {
  const card = document.getElementById("pwaCard"), btn = document.getElementById("pwaInstall");
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).catch(() => {});
  let prompt = null;
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); prompt = e; card.classList.remove("hidden"); });
  btn.onclick = async () => {
    if (!prompt) return;
    prompt.prompt();
    await prompt.userChoice.catch(() => {});
    prompt = null; card.classList.add("hidden");
  };
  window.addEventListener("appinstalled", () => card.classList.add("hidden"));
})();
