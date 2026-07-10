// FreeNav Service Worker —— 离线缓存核心资源，可安装到手机桌面
const CACHE = "freenav-v1";
const ASSETS = [
  "/", "/index.html",
  "/assets/css/style.css",
  "/assets/js/config.js", "/assets/js/data.js", "/assets/js/columns.js",
  "/assets/js/app.js", "/assets/js/theme.js", "/assets/js/column-render.js",
  "/favicon.svg", "/manifest.webmanifest"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS).catch(function () {}); }));
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      if (hit) return hit;
      return fetch(e.request).then(function (res) {
        if (res && res.ok && res.type === "basic") {
          var cp = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, cp); });
        }
        return res;
      }).catch(function () { return caches.match("/"); });
    })
  );
});
