// FreeNav Service Worker —— 离线缓存核心资源，可安装到手机桌面
// 缓存策略：核心资源 precache + 网络优先（避免过期）
//           非核心资源 stale-while-revalidate（后台更新、前台不阻塞）

const CACHE = "freenav-v2";
const CORE_ASSETS = [
  "/", "/index.html",
  "/assets/css/style.min.css",
  "/assets/js/config.min.js", "/assets/js/data.min.js", "/assets/js/columns.min.js",
  "/assets/js/app.min.js", "/assets/js/theme.min.js", "/assets/js/column-render.min.js",
  "/assets/js/icons.min.js",
  "/favicon.svg", "/manifest.webmanifest"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE_ASSETS).catch(function () {}); }));
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
  var url = new URL(e.request.url);

  // 同源请求才缓存
  if (url.origin !== self.location.origin) return;

  // 核心资源：网络优先，失败则回退缓存（确保用户拿到最新内容）
  var isCore = CORE_ASSETS.some(function (a) {
    return url.pathname === a || url.pathname === a + "/";
  });

  if (isCore) {
    e.respondWith(
      fetch(e.request).then(function (res) {
        if (res && res.ok) {
          var cp = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, cp); });
        }
        return res;
      }).catch(function () { return caches.match(e.request); })
    );
    return;
  }

  // 非核心资源：stale-while-revalidate（先返回缓存，后台静默更新）
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      var fetchPromise = fetch(e.request).then(function (res) {
        if (res && res.ok && res.type === "basic") {
          var cp = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, cp); });
        }
        return res;
      }).catch(function () { return hit || caches.match("/"); });

      return hit || fetchPromise;
    })
  );
});
