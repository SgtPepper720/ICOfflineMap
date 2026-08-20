const CACHE_NAME = "ic-offline-map-v2";
const PREFIX = "./";

const OFFLINE_FILES = [
  new URL('./index.html', self.location.href).toString(),
  new URL('./manifest-v2.json', self.location.href).toString(),
  new URL('./churches.geojson', self.location.href).toString(),
  new URL('./places_urls.json', self.location.href).toString(),
  new URL('./towns.json', self.location.href).toString(),
  new URL('./leaflet/leaflet.css', self.location.href).toString(),
  new URL('./leaflet/leaflet.js', self.location.href).toString(),
  new URL('./leaflet/images/marker-icon.png', self.location.href).toString(),
  new URL('./leaflet/images/marker-icon-2x.png', self.location.href).toString(),
  new URL('./images/IC-Circle-Icon-filled.png', self.location.href).toString(),
  new URL('./images/IC-Circle-Icon-filled-192.png', self.location.href).toString(),
  new URL('./leaflet/images/marker-shadow.png', self.location.href).toString()
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
        .catch(() => caches.match(new URL('./index.html', self.location.href)))
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
