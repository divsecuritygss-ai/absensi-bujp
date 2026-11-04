const CACHE_NAME = 'bujp-pwa-v2.0'; // Versi dinaikkan agar HP personil otomatis memuat UI/UX baru

// Daftar aset inti yang wajib disimpan saat instalasi pertama
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// 1. Install Event (Pre-cache aset inti)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. Activate Event (Bersihkan cache versi usang secara otomatis)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[ServiceWorker] Menghapus cache versi lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Event (Smart Network-First Strategy)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Abaikan request selain GET
  if (req.method !== 'GET') return;

  // JANGAN cache tile gambar peta OpenStreetMap & API Google Script (Hemat memori HP & Jamin Data Realtime)
  if (url.hostname.includes('tile.openstreetmap.org') || 
      url.hostname.includes('script.google.com') ||
      url.hostname.includes('script.googleusercontent.com')) {
    return; // Langsung ambil lewat jaringan tanpa cache
  }

  // Abaikan skema selain http / https (misal chrome-extension://)
  if (!req.url.startsWith('http')) return;

  // Strategi Network-First dengan Cache Fallback
  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        // Hanya simpan respon yang valid (status 200) ke cache
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Jika offline / koneksi putus, buka dari cache lokal
        return caches.match(req);
      })
  );
});
