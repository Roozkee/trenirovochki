// Офлайн-кеш. При изменении файлов приложения поднимайте номер версии.
const CACHE = 'hw-v2';
const IMG_IDS = ['floor_press','row1','seated_press','lateral','curl','french','bulgarian','rdl','glute_bridge','calf1','core',
  'pushup','row2','arnold','band_pulldown','face_pull','hammer','band_pushdown','pullover','goblet','reverse_lunge','sl_rdl','leg_curl','calf'];
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png',
  ...IMG_IDS.flatMap(id => [`./img/${id}-0.jpg`, `./img/${id}-1.jpg`])];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Сначала отдаём из кеша (работает без сети), параллельно обновляем кеш из сети.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const key = req.mode === 'navigate' ? './index.html' : req;
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(key, {ignoreSearch: true});
      const network = fetch(req).then(res => {
        if (res && res.ok) cache.put(key, res.clone());
        return res;
      }).catch(() => null);
      if (cached) { e.waitUntil(network); return cached; }
      const res = await network;
      return res || new Response('Нет сети', {status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}});
    })
  );
});
