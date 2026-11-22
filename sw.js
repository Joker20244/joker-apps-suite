const C = 'jk-suite-v1';
const CORE = ['./','./index.html','./joker-base.css','./joker-core.js','./crown.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(clients.claim()); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
    if (resp.ok){ const copy = resp.clone(); caches.open(C).then(c => c.put(e.request, copy)); }
    return resp;
  }).catch(() => caches.match('./index.html'))));
});
