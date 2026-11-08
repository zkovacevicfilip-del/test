// Service worker bez offline režimu. Jen smaže dřívější offline cache (aplikace a modely)
// a nic neukládá, vše se načítá ze sítě. Zůstává kvůli instalaci aplikace na plochu.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("aero-")) await caches.delete(k);
    await self.clients.claim();
  })());
});
