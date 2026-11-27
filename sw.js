const scope = self.registration.scope;
const CACHE_PREFIX = 'futoshiki-app-' + scope + ':';
const CACHE_NAME = CACHE_PREFIX + 'v3';
const home = new URL('./index.html', scope).href;
const files = [
  './index.html',
  './style.css',
  './src/game.mjs',
  './src/generator.mjs',
  './src/solver.mjs',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
].map(path => new URL(path, scope).href);
const assets = new Set(files);

self.addEventListener('install', event => {
  const requests = files.map(url => new Request(url, { cache: 'reload' }));
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(requests)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const isHome = request.mode === 'navigate' &&
    (url.origin + url.pathname === scope || url.origin + url.pathname === home);
  if (!isHome && !assets.has(request.url)) return;

  // Serve one consistent app version while this worker controls the page.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    return (await cache.match(isHome ? home : request)) ?? fetch(request);
  })());
});
