const CACHE_NAME = "ic-offline-map-v1";
const PREFIX = "/ICOfflineMap/";

const OFFLINE_FILES = [
  PREFIX + "index.html",
  PREFIX + "manifest.json",
  PREFIX + "churches.geojson",
  PREFIX + "leaflet/leaflet.css",
  PREFIX + "leaflet/leaflet.js",
  PREFIX + "leaflet/images/marker-icon.png",
  PREFIX + "leaflet/images/marker-icon-2x.png",
  PREFIX + "images/IC-Circle-Icon-filled.png",
  PREFIX + "leaflet/images/marker-shadow.png"
];

// Install and cache core files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(OFFLINE_FILES);
    })
  );
});

// Fetch handler: serve from cache, then network, and cache tiles dynamically
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;

      return fetch(event.request)
        .then(fetchRes => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, fetchRes.clone());
            return fetchRes;
          });
        })
        .catch(() => caches.match(PREFIX + "index.html"));
    })
  );
});
