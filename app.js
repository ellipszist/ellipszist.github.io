if ('serviceWorker' in navigator && 'PushManager' in window) {
  console.log('[App] Initializing Service Worker...');

  // Register the Service Worker
  navigator.serviceWorker.register('service-worker.js')
    .then(function(registration) {
      console.log('[App] Service Worker registration successful:', registration);
      
      // Request permission to send notifications
      return window.Notification.requestPermission()
        .then(function(permission) {
          if (permission === 'granted') {
            console.log('[App] Notification permission granted!');
          } else {
            console.log('[App] Notification permission denied!');
          }
        });
    })
    .catch(function(error) {
      console.error('[App] Service Worker registration failed:', error);
    });
} else {
  console.warn('[App] Service Worker and Push notifications are not supported!');
}
