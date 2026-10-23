// Guarda o jogo no aparelho para abrir rápido e funcionar sem internet.
const CACHE = 'mundo-luize-v3';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {}))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  if (r.mode === 'navigate') { e.respondWith(fetch(r).then(res => { caches.open(CACHE).then(c => c.put('./index.html', res.clone())); return res; }).catch(() => caches.match('./index.html'))); return; }
  e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => { if (res.ok && (new URL(r.url).origin === location.origin || r.url.includes('cdnjs') || r.url.includes('cdn.jsdelivr'))) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; }).catch(() => hit)));
});
