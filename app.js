import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-app.js';
import { getMessaging } from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-messaging.js';
import { onBackgroundMessage } from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-messaging-compat.js';

if ('serviceWorker' in navigator && 'PushManager' in window) {
  console.log('[App] Initializing Service Worker...');

  // Register the Service Worker
  navigator.serviceWorker.register('service-worker.js')
    .then(function(registration) {
      console.log('[App] Service Worker registration successful:', registration);

      // Initialize Firebase app
      const firebaseConfig = {
        // Firebase project configuration
        apiKey: "AIzaSyB0mys5Hj0qt7lUgKFiDRYkDfbgOS7nAp8",
        authDomain: "ell-store-630f8.firebaseapp.com",
        projectId: "ell-store-630f8",
        storageBucket: "ell-store-630f8.appspot.com",
        messagingSenderId: "705373234131",
        appId: "1:705373234131:web:2c5a52b052292452278526",
        measurementId: "G-R629QDWGBQ"
      };
      const app = initializeApp(firebaseConfig);

      // Initialize Firebase Cloud Messaging
      const messaging = getMessaging(app);

      // Request permission to send notifications
      return Notification.requestPermission()
        .then(function(permission) {
          if (permission === 'granted') {
            console.log('[App] Notification permission granted!');
            // Handle incoming push notifications while app is in the background
            onBackgroundMessage(messaging, function(payload) {
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
