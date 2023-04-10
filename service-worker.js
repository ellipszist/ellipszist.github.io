// Firebase Cloud Messaging configuration
importScripts('https://www.gstatic.com/firebasejs/9.19.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.19.1/firebase-messaging.js');

firebase.initializeApp({
  // Firebase project configuration
  apiKey: "AIzaSyB0mys5Hj0qt7lUgKFiDRYkDfbgOS7nAp8",
  authDomain: "ell-store-630f8.firebaseapp.com",
  projectId: "ell-store-630f8",
  storageBucket: "ell-store-630f8.appspot.com",
  messagingSenderId: "705373234131",
  appId: "1:705373234131:web:2c5a52b052292452278526",
  measurementId: "G-R629QDWGBQ"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[Service Worker] Received background message:', payload);

  // Customize notification title and body
  const notificationTitle = 'Firebase Push Notification';
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon,
  };

  // Show the notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Cache the app shell
const CACHE_NAME = 'my-app-cache';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/images/junispring.png',
];

self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[Service Worker] Caching app shell...');
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.error('[Service Worker] Failed to cache app shell:', error);
      })
  );
});

// Clean up old caches
self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then(function(keyList) {
        return Promise.all(keyList.map(function(key) {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        }));
      })
      .catch(function(error) {
        console.error('[Service Worker] Failed to remove old caches:', error);
      })
  );
});

// Serve cached app shell or fetch from network
self.addEventListener('fetch', function(event) {
  console.log('[Service Worker] Fetch event:', event.request.url);

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          console.log('[Service Worker] Serving cached response:', event.request.url);
          return response;
        }

        console.log('[Service Worker] Fetching new response:', event.request.url);
        return fetch(event.request);
      })
      .catch(function(error) {
        console.error('[Service Worker] Failed to fetch response:', error);
      })
  );
});
