// Aurea: funciona offline. Arquivos do próprio site vêm da rede quando há conexão e do cache quando não há.
const CACHE = 'aurea-v1';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function remember(request, response) {
  const copy = response.clone();
  caches.open(CACHE).then((c) => c.put(request, copy));
  return response;
}

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    e.respondWith(
      fetch(r).then((res) => remember(r, res)).catch(() => caches.match(r).then((m) => m || caches.match('./index.html')))
    );
  } else if (u.hostname.endsWith('googleapis.com') || u.hostname.endsWith('gstatic.com')) {
    e.respondWith(caches.match(r).then((m) => m || fetch(r).then((res) => remember(r, res))));
  }
});
