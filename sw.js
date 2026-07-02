const CACHE_NAME = 'cozy-sudoku-v1';
const ASSETS_TO_CACHE = [
  "./",
  "index.html",
  "style.css",
  "script.js",
  "manifest.json",
  "icons/icon-48x48.png",
  "icons/icon-72x72.png",
  "icons/icon-96x96.png",
  "icons/icon-128x128.png",
  "icons/icon-144x144.png",
  "icons/icon-152x152.png",
  "icons/icon-192x192.png",
  "icons/icon-256x256.png",
  "icons/icon-384x384.png",
  "icons/icon-512x512.png",
];

// 1. Install Event - Caching the game assets locally
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Cozy caching complete!');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // Force the latest worker to activate instantly
});

// 2. Activate Event - Cleaning up old caches if you push updates later
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache room...');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Event - Cache-First Strategy for Instant Offline Play
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return local cache file if found, otherwise fall back to internet
      return cachedResponse || fetch(event.request);
    })
  );
});