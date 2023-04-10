// Install the service worker
self.addEventListener('install', function(event) {
  console.log('Service worker installed');
});

// Activate the service worker
self.addEventListener('activate', function(event) {
  console.log('Service worker activated');
});

// Intercept network requests
self.addEventListener('fetch', function(event) {
  console.log('Intercepted network request:', event.request.url);
});
