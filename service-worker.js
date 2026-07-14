const CACHE_NAME = "ic-offline-map-v1";

const OFFLINE_FILES = [
  "index.html",
  "manifest.json",
  "churches.geojson",
  "leaflet/leaflet.css",
  "leaflet/leaflet.js",
  "leaflet/images/marker-icon.png",
  "leaflet/images/marker-icon-2x.png",
  "leaflet/images/marker-shadow.png"
];

// Cache tiles dynamically
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(OFFLINE_FILES);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return (
        response ||
        fetch(event.request).then(fetchRes => {
          // Cache tiles and other resources on the fly
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, fetchRes.clone());
            return fetchRes;
          });
        })
      );
    })
  );
});
