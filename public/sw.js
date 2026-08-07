const OFFLINE_URL = "/offline.html";
const CACHE_NAME = "duamimbar-offline-v1";

// Pas Service Worker pertama kali ke-install, simpen halaman offline.html
// ke cache browser -- biar tetep bisa dibuka nanti walau internet mati
// total (nggak ada request ke server sama sekali).
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // SENGAJA cuma nangkep navigasi HALAMAN (pas buka/refresh URL), bukan
  // API call atau data lain -- biar dashboard yang butuh data fresh dari
  // Supabase/Google Sheets nggak ke-cache atau keganggu Service Worker ini.
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL))
  );
});
