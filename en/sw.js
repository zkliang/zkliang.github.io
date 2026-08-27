// FreeNav (English) Service Worker — precaches core /en/ assets for offline + installability
// Strategy: core assets precache + network-first (always fresh); others stale-while-revalidate

const CACHE = "freenav-en-v1";
const CORE_ASSETS = [
  "/en/", "/en/index.html",
  "/en/assets/css/style.min.css",
  "/en/assets/js/config.min.js", "/en/assets/js/data.min.js", "/en/assets/js/columns.min.js",
  "/en/assets/js/app.min.js", "/en/assets/js/theme.min.js", "/en/assets/js/column-render.min.js",
  "/en/assets/js/icons.min.js", "/en/assets/js/licenses.min.js", "/en/assets/js/widgets.js",
  "/en/assets/js/pwa-install.min.js", "/en/assets/js/sw-register.js",
  "/en/favicon.svg", "/en/manifest.webmanifest"
];

self.addEventListener("install", function (e) {
  // precache one file at a time: a single 404 skips that file instead of failing the whole batch
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(CORE_ASSETS.map(function (u) {
        return c.add(u).catch(function (err) {
          console.warn("[FreeNav SW] precache failed, skipped: " + u, err && (err.message || err));
          return null;
        });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
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

  // only cache same-origin requests
  if (url.origin !== self.location.origin) return;

  // core assets: network-first, fall back to cache (always get the latest content)
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

  // non-core: stale-while-revalidate (return cache first, refresh silently in background)
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      var fetchPromise = fetch(e.request).then(function (res) {
        if (res && res.ok && res.type === "basic") {
          var cp = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, cp); });
        }
        return res;
      }).catch(function () { return hit || caches.match("/en/"); });

      return hit || fetchPromise;
    })
  );
});
