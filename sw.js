/* 電車モード（オフライン） Service Worker
 * アプリ本体（シェル）をキャッシュして、電波が無くても起動できるようにする。
 * 問題データ本体は localStorage に保存するので、ここではシェルだけ面倒を見る。
 * CACHE を上げると全端末で更新が反映される（activate時に旧キャッシュを掃除）。 */
const CACHE = 'shoshi-offline-v7';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 同一オリジン（＝GitHub Pages上のシェル）だけ面倒を見る。GASのパック取得(別オリジン)は素通し。
  if (url.origin !== self.location.origin) return;
  // /shorts/（登記簿ショート動画）はキャッシュせず常にネットから＝更新が即反映される
  if (url.pathname.indexOf('/shorts/') >= 0) return;
  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        // 取れた同一オリジンのGETは次回のためにキャッシュ（オフライン強化）
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        // オフラインでキャッシュにも無い→ナビゲーションなら index を返す
        if (req.mode === 'navigate') return caches.match('./index.html');
        return new Response('', { status: 504, statusText: 'offline' });
      });
    })
  );
});
