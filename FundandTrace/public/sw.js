/* Fund&Trace service worker.
 *
 * Registered by src/pages/_app.tsx in production only. Deliberately
 * conservative — this is a payments product, so we never serve stale HTML or
 * API responses:
 *   - /_next/static/* (content-hashed, immutable)  -> cache-first
 *   - page navigations                             -> network-first, offline
 *                                                     fallback page on failure
 *   - campaign & tracker pages (/campaign/*)        -> network-first; the last
 *                                                     copy is kept so they open
 *                                                     offline (never /donate/*)
 *   - Cloudinary images in data-saver mode          -> rewritten to small,
 *                                                     economy-quality versions
 *   - everything else (API, payments, 3rd-party)   -> untouched (network)
 *
 * We intentionally do NOT call clients.claim(): _app.tsx reloads the page on
 * `controllerchange`, and claiming on first install would reload a visitor's
 * very first page view. Updates still activate immediately via skipWaiting().
 */
const VERSION = "ft-sw-v2";
const STATIC_CACHE = `${VERSION}-static`;
const PAGES_CACHE = `${VERSION}-pages`;
const SETTINGS_CACHE = "ft-settings"; // survives version bumps
const OFFLINE_URL = "/offline.html";
const MAX_PAGES = 20;

// Data saver flag, sent by the page (src/utils/lowData.tsx) and persisted so
// it survives the worker being stopped and restarted.
let lowData = false;
let lowDataLoaded = false;
const loadLowData = caches
  .open(SETTINGS_CACHE)
  .then((c) => c.match("/__ft/lowdata"))
  .then((r) => (r ? r.text() : "0"))
  .then((v) => (lowData = v === "1"))
  .catch(() => undefined)
  .then(() => (lowDataLoaded = true));
self.addEventListener("message", (event) => {
  // Only our own pages may change settings.
  if (event.origin && event.origin !== self.location.origin) return;
  if (event.data?.type !== "lowdata") return;
  lowData = Boolean(event.data.value);
  event.waitUntil?.(caches.open(SETTINGS_CACHE).then((c) => c.put("/__ft/lowdata", new Response(lowData ? "1" : "0"))));
});

/** Cloudinary: insert a small, economy-quality transformation after /upload/. */
function economyImageUrl(url) {
  if (url.hostname !== "res.cloudinary.com" || !url.pathname.includes("/image/upload/")) return null;
  return url.href.replace("/image/upload/", "/image/upload/f_auto,q_auto:eco,w_480,c_limit/");
}

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (const k of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(k);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, "/favicon192x192.png"]))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(VERSION) && key !== SETTINGS_CACHE)
            .map((key) => caches.delete(key))
        )
      )
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (request.destination === "image" && url.origin !== self.location.origin) {
    if (lowDataLoaded && !lowData) return; // normal mode: don't touch images
    event.respondWith(
      loadLowData.then(() => {
        const small = lowData && economyImageUrl(url);
        return fetch(small ? new Request(small, { mode: "no-cors", credentials: "omit" }) : request).catch(() => fetch(request));
      })
    );
    return;
  }
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((response) => {
              if (response.ok) cache.put(request, response.clone());
              return response;
            })
        )
      )
    );
    return;
  }

  // Campaign and tracker pages: keep the last copy for offline reading.
  // Donate pages are never served from cache.
  if (request.mode === "navigate" && /^\/campaign\/[a-f0-9]{24}(\/tracker)?\/?$/.test(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(PAGES_CACHE).then((c) => c.put(url.pathname, copy)).then(() => trimCache(PAGES_CACHE, MAX_PAGES));
          }
          return response;
        })
        .catch(() => caches.match(url.pathname, { cacheName: PAGES_CACHE }).then((cached) => cached || caches.match(OFFLINE_URL)))
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then(
          (cached) =>
            cached ||
            new Response("You are offline.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
        )
      )
    );
  }
});
