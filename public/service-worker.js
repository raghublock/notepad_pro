/* ═══════════════════════════════════════════════════
   रंगीन नोट्स — Service Worker v2.0
   Offline-first caching + background sync
═══════════════════════════════════════════════════ */

const CACHE_NAME = 'rangeen-notes-v2';
const OFFLINE_URL = 'index.html';

// Files to cache on install
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './oauth_callback.html',
  'https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap'
];

/* ── INSTALL ── */
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Pre-caching files');
        // Cache each URL individually, ignore failures for external resources
        return Promise.allSettled(
          PRECACHE_URLS.map(url =>
            cache.add(url).catch(err => console.log('[SW] Cache fail for', url, err))
          )
        );
      })
      .then(() => {
        console.log('[SW] Install complete');
        return self.skipWaiting();
      })
  );
});

/* ── ACTIVATE ── */
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Active and controlling');
      return self.clients.claim();
    })
  );
});

/* ── FETCH ── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and external API calls (Zoho OAuth/WorkDrive)
  if (request.method !== 'GET') return;
  if (url.hostname.includes('zoho.') || url.hostname.includes('zohoapis.')) return;

  // Google Fonts — network first, cache fallback
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(networkFirstThenCache(request));
    return;
  }

  // App shell — cache first, network fallback
  event.respondWith(cacheFirstThenNetwork(request));
});

/* ── CACHE STRATEGIES ── */
async function cacheFirstThenNetwork(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type !== 'opaque') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch(err) {
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      const fallback = await caches.match(OFFLINE_URL);
      if (fallback) return fallback;
    }
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function networkFirstThenCache(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch(err) {
    const cached = await caches.match(request);
    return cached || new Response('', { status: 503 });
  }
}

/* ── BACKGROUND SYNC ── */
self.addEventListener('sync', event => {
  if (event.tag === 'sync-notes') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'BACKGROUND_SYNC' });
        });
      })
    );
  }
});

/* ── PUSH NOTIFICATIONS (future use) ── */
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body || 'नोट्स sync हो गए',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' }
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'रंगीन नोट्स', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

/* ── MESSAGE HANDLER ── */
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('[SW] Service Worker loaded — रंगीन नोट्स v2.0');
