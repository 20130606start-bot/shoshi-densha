/* 枠どり練習帳（記述式・オフライン） Service Worker
 * ------------------------------------------------------------------
 * アプリ本体（シェル）だけキャッシュする。解いた記録は localStorage 側。
 * CACHE を上げると全端末で更新が反映される（activate時に旧キャッシュを掃除）。
 *
 * ⚠ 置き場が /shoshi-densha/kijutsu/ なので、**電車モードのSWの守備範囲の中にいる**。
 *   ルートの sw.js に「/kijutsu/ は素通しする」を1行入れてある。**あちらを消さないこと。**
 *   （根拠ノート /konkyo/ を足したときに踏んだ穴と同じ。同じ手当てをしてある）
 */
const CACHE = 'shoshi-kijutsu-j3';
/* ⭐ 別紙（原本のページ画像）も**最初の1回でまとめて取っておく**。
   ここに入れないと、電車の中で問題を開いた時に**別紙だけ出ない**＝解けない。
   （2026-09-12。社長の言葉は「ネット接続関係なしにサクサク」＝**中身まで含めて**の話） */
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './besshi/r7-37/p-57.png',
  './besshi/r7-37/p-58.png',
  './besshi/r7-37/p-59.png',
  './besshi/r7-37/p-60.png',
  './besshi/r7-37/p-61.png',
  './besshi/r7-37/p-62.png',
  './besshi/r7-37/p-63.png',
  './besshi/r7-37/p-64.png',
  './besshi/r7-37/p-65.png',
  './besshi/r7-37/p-66.png',
  './besshi/r7-37/p-67.png',
  './besshi/r7-37/p-68.png',
  './besshi/r7-37/p-69.png',
  './besshi/r7-37/p-70.png'
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
  if (url.origin !== self.location.origin) return;
  /* 自分の持ち場（/kijutsu/）の外には手を出さない＝電車モードのファイルを横取りしない */
  if (url.pathname.indexOf('/kijutsu/') < 0) return;
  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        if (req.mode === 'navigate') return caches.match('./index.html');
        return new Response('', { status: 504, statusText: 'offline' });
      });
    })
  );
});
