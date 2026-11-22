const C = 'jk-suite-v3';
const CORE = ['./','./index.html','./joker-base.css','./joker-core.js','./crown.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('jk-suite-') && k !== C).map(k => caches.delete(k)))).then(() => clients.claim()));
});
function networkFirst(req){
  return fetch(req).then(resp => {
    if (resp.ok){ const copy = resp.clone(); caches.open(C).then(c => c.put(req, copy)); }
    return resp;
  }).catch(() => caches.match(req));
}
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.mode === 'navigate'){
    e.respondWith(fetch(e.request).then(resp => {
      if (resp.ok){ const copy = resp.clone(); caches.open(C).then(c => c.put(e.request, copy)); }
      return resp;
    }).catch(() => caches.match(e.request).then(r => r ||
      (e.request.url.endsWith('/') || e.request.url.endsWith('index.html')
        ? caches.match('./index.html')
        : new Response('الصفحة دي مش متخزنة على جهازك وانت دلوقتي من غير نت. افتحها مرة وانت متصل الأول.', {status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}})))));
    return;
  }
  // Network-first for assets too: updates (fonts/CSS/JS) reach existing installs immediately; cache is the offline fallback.
  e.respondWith(networkFirst(e.request));
});
