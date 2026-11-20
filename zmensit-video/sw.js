// Service worker Zmenšovače videa: soubory stránky si uloží, takže aplikace funguje i bez internetu.
// Když je internet, načte vždy nejnovější verzi ze sítě (a uloží ji), bez internetu použije uloženou.
const CACHE = "zmensovac-v1";
const SOUBORY = ["./", "index.html", "zmensit-video.css?v=2", "zmensit-video.js?v=2", "manifest.webmanifest?v=1", "ikony/icon-192.png?v=1", "ikony/favicon-32.png?v=1"];
// každý soubor zvlášť: když jeden nejde stáhnout, ostatní se stejně uloží
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => Promise.all(SOUBORY.map(f => c.add(f).catch(() => {})))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("zmensovac-") && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      const odp = await fetch(r, { cache: "no-cache" });
      if (odp.ok && odp.type === "basic") c.put(r, odp.clone());
      return odp;
    } catch (err) {
      return (await c.match(r)) || (await c.match(r, { ignoreSearch: true })) || (r.mode === "navigate" ? await c.match("index.html") : Response.error());
    }
  })());
});
