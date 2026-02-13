// Service Worker for offline functionality and performance optimization
const CACHE_NAME = 'fairytale-v1.0.0';
const STATIC_CACHE = 'fairytale-static-v1.0.0';
const DYNAMIC_CACHE = 'fairytale-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/register.html',
  '/create-project.html',
  '/style.css',
  '/enhanced-styles.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics-compat.js',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // Handle different types of requests
  if (isStaticAsset(url)) {
    // Static assets - cache-first strategy
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(url)) {
    // API requests - network-first with offline fallback
    event.respondWith(handleAPIRequest(request));
  } else {
    // Other requests - network-first strategy
    event.respondWith(handleGeneralRequest(request));
  }
});

// Helper function to determine if request is for static asset
function isStaticAsset(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.html'))
  );
}

// Helper function to determine if request is for Firebase API
function isAPIRequest(url) {
  return (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com')
  );
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Static asset fetch failed:', error);
    return new Response('Offline - Asset not available', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Handle API requests with network-first and offline queuing
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful GET requests
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('API request failed, trying cache:', request.url);

    // Try to serve from cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Queue failed requests for when we're back online
    if (request.method !== 'GET') {
      await queueRequest(request);
    }

    return new Response(
      JSON.stringify({
        error: 'Offline - Request queued for when online',
        queued: true,
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle general requests with network-first strategy
async function handleGeneralRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('General request failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Queue failed requests for background sync
async function queueRequest(request) {
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now(),
  };

  // Store in IndexedDB for background sync
  const db = await openDB();
  const tx = db.transaction(['queuedRequests'], 'readwrite');
  await tx.objectStore('queuedRequests').add(requestData);
}

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(processQueuedRequests());
  }
});

// Process queued requests when back online
async function processQueuedRequests() {
  try {
    const db = await openDB();
    const tx = db.transaction(['queuedRequests'], 'readwrite');
    const store = tx.objectStore('queuedRequests');
    const requests = await store.getAll();

    for (const requestData of requests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body,
        });

        if (response.ok) {
          await store.delete(requestData.id);
          console.log('Queued request processed successfully');
        }
      } catch (error) {
        console.error('Failed to process queued request:', error);
      }
    }
  } catch (error) {
    console.error('Error processing queued requests:', error);
  }
}

// IndexedDB helper for queue storage
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ProjectTrackerDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('queuedRequests')) {
        const store = db.createObjectStore('queuedRequests', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

// Push notification event
self.addEventListener('push', (event) => {
  const options = {
    body: event.data
      ? event.data.text()
      : 'New notification from Project Tracker',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/favicon.ico',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/favicon.ico',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification('Project Tracker', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/'));
  }
});

// Periodic background sync for cache cleanup
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanUpCaches());
  }
});

// Clean up old cache entries
async function cleanUpCaches() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    const now = Date.now();

    for (const request of requests) {
      const response = await cache.match(request);
      const dateHeader = response?.headers.get('date');

      if (dateHeader) {
        const responseDate = new Date(dateHeader).getTime();
        const age = now - responseDate;

        // Remove entries older than 7 days
        if (age > 7 * 24 * 60 * 60 * 1000) {
          await cache.delete(request);
        }
      }
    }
  } catch (error) {
    console.error('Cache cleanup failed:', error);
  }
}
