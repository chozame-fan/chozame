// オフラインでも開けるように、アプリのファイルを保存しておく。
// 新しい版があればネットから取り、つながらない時は保存しておいた物を使う。
const CACHE = 'chozame-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-180.png',
  './js/main.js', './js/fish.js', './js/world.js', './js/data.js', './js/others.js',
  './vendor/three.module.js', './vendor/three.core.js', './vendor/addons/BufferGeometryUtils.js'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; })
    .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
