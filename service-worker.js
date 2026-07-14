const CACHE_NAME = "ic-offline-map-v1";
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

// Install and cache core files and tiles, with progress indicator
self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);


      console.log("SW install running");

      // Pre-cache app shell
      await cache.addAll(OFFLINE_FILES);



      // Fetch tile list
      const response = await fetch("/ICOfflineMap/tiles.json");
      const tileList = await response.json();

      let completed = 0;
      const total = tileList.length;

      // Send initial message
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: "tile-cache-start", total });
          
        });
      });

      // Cache tiles one by one
      for (const url of tileList) {
        try {
          await cache.add(url);
        } catch (e) {
          // Ignore failures (missing tiles etc.)
        }

        completed++;

        console.log("Caching tile:", url);


        // Send progress update
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: "tile-cache-progress",
              completed,
              total
            });
          });
        });
      }

      // Send completion message
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: "tile-cache-complete" });
        });
      });
    })()
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
