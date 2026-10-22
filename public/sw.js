const CACHE_NAME = 'alphacore-cache-v2';
const ASSETS_TO_CACHE = [
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/Images/favico.png',
  '/Images/ALPHA-LOGO.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== 'GET' || requestUrl.origin !== self.location.origin ||
      requestUrl.pathname === '/api' || requestUrl.pathname.startsWith('/api/') ||
      requestUrl.pathname.startsWith('/.netlify/functions/')) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(event.request);
        if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
          await cache.put('/index.html', response.clone()).catch(() => {});
        }
        return response;
      } catch (error) {
        const cachedResponse = await cache.match('/index.html');
        if (cachedResponse) return cachedResponse;
        throw error;
      }
    })());
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => cache.match(event.request)).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('alphacore-cache-') && cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ─── Push Notification & Broadcast Dispatchers ─────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {
    title: '◢ ALPHACORE TECH // ALERT ◣',
    body: 'Encrypted system broadcast received.',
    icon: '/icon-192.png',
    badge: '/Images/favico.png',
    tag: 'alphacore-broadcast',
    url: '/#/overview'
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (_) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/Images/favico.png',
    tag: data.tag || 'alphacore-broadcast',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/#/overview'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/#/overview';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title || '◢ ALPHACORE TECH // ALERT ◣', {
      icon: '/icon-192.png',
      badge: '/Images/favico.png',
      vibrate: [200, 100, 200],
      ...options
    });
  }
});
