/* Saldo · service worker
   Deja la app abrir sin internet y rápido. Los archivos con ?v= se guardan por versión;
   la página y version.json siempre prueban primero la red, para que las actualizaciones lleguen. */
const CACHE = 'saldo-shell-v37';
const SHELL = ['./', 'index.html', 'styles.css?v=37', 'app.js?v=37', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('saldo-shell-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
    if (hit) return hit;
    throw err;
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.ok) cache.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // Google, fuentes, Drive y el buzón van directo
  if (url.pathname.endsWith('/version.json')) return; // siempre de la red
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) return e.respondWith(networkFirst(req));
  if (/\.(js|css|png|webmanifest)$/.test(url.pathname)) return e.respondWith(url.search ? cacheFirst(req) : networkFirst(req));
});
