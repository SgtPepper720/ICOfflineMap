const CACHE_NAME = "ic-offline-map-v2";
const PREFIX = "/ICOfflineMap/";

const OFFLINE_FILES = [
  PREFIX + "index.html",
  PREFIX + "manifest-v2.json",
  PREFIX + "churches.geojson",
  PREFIX + "leaflet/leaflet.css",
  PREFIX + "leaflet/leaflet.js",
  PREFIX + "leaflet/images/marker-icon.png",
  PREFIX + "leaflet/images/marker-icon-2x.png",
  PREFIX + "images/IC-Circle-Icon-filled.png",
  PREFIX + "images/IC-Circle-Icon-filled-192.png",
  PREFIX + "leaflet/images/marker-shadow.png"
];

// Install and cache core files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(OFFLINE_FILES);
    })
  );

  self.skipWaiting();
});



self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch handler: prefer the network for the app shell so updates appear quickly,
// while still using cache for other assets and offline fallback.
self.addEventListener("fetch", event => {
  const { request } = event;
  const isNavigationRequest = request.mode === "navigate" || request.destination === "document";

  if (isNavigationRequest) {
    event.respondWith(
      fetch(request)
        .then(fetchRes => {
          const copy = fetchRes.clone();
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(request, copy);
            return fetchRes;
          });
        })
        .catch(() => caches.match(PREFIX + "index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then(fetchRes => {
          if (fetchRes && fetchRes.status === 200) {
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(request, fetchRes.clone());
              return fetchRes;
            });
          }
          return fetchRes;
        })
        .catch(() => null);
    })
  );
});
