// Service worker: offline režim a cache modelů MediaPipe.
// Při každé změně index.html, aero.js nebo pwa.js zvyš APP_VER, aby se stáhla nová verze.
const APP_VER = "5";
const APP_CACHE = "aero-app-v" + APP_VER;
// Soubory z CDN mají verzi v adrese, proto mají vlastní cache, která se při aktualizaci aplikace nemaže.
const CDN_CACHE = "aero-cdn-v1";
const APP_FILES = [
  "./", "./index.html", "./aero.js", "./pwa.js", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png", "./icons/favicon-32.png"
];
const CDN_HOSTS = ["cdn.jsdelivr.net", "storage.googleapis.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(APP_CACHE).then(c => c.addAll(APP_FILES.map(u => new Request(u, { cache: "reload" })))));
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keep = [APP_CACHE, CDN_CACHE];
    for (const k of await caches.keys()) if (k.startsWith("aero-") && !keep.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("message", e => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (CDN_HOSTS.includes(url.hostname)) e.respondWith(cdnFirst(req));
  else if (url.origin === self.location.origin) e.respondWith(appNetworkFirst(req));
});

// CDN: nejdřív cache (soubory se pod stejnou adresou nemění), jinak síť a uložit.
async function cdnFirst(req) {
  const c = await caches.open(CDN_CACHE);
  const hit = await c.match(req.url);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok && res.status === 200) await c.put(req.url, res.clone()).catch(() => {});
  return res;
}

// Aplikace: nejdřív síť (vždy nejnovější verze), při výpadku nebo pomalé síti z cache.
async function appNetworkFirst(req) {
  const c = await caches.open(APP_CACHE);
  const isPage = req.mode === "navigate";
  const net = fetch(req).then(res => {
    if (res.ok && res.status === 200) c.put(isPage ? "./index.html" : req, res.clone()).catch(() => {});
    return res;
  });
  net.catch(() => {});
  const cached = () => c.match(isPage ? "./index.html" : req, { ignoreSearch: true });
  try {
    // Když síť neodpoví do 4 s a máme kopii, použije se kopie (síť se dokončí na pozadí).
    const timeout = new Promise(r => setTimeout(r, 4000)).then(cached).then(h => h || net);
    return await Promise.race([net, timeout]);
  } catch (err) {
    const hit = await cached();
    if (hit) return hit;
    throw err;
  }
}
