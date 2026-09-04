/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache API data
registerRoute(
  /^\/data\/.*/i,
  new CacheFirst({
    cacheName: 'quran-adhkar-data-v1',
    plugins: [
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 30 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Cache audio files
registerRoute(
  /^\/audio\/.*/i,
  new CacheFirst({
    cacheName: 'app-audio-v1',
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Cache external Quran audio CDN
registerRoute(
  /^https:\/\/cdn\.islamic\.network\/quran\/audio\/.*/i,
  new CacheFirst({
    cacheName: 'quran-audio-cdn-v1',
    plugins: [
      new ExpirationPlugin({ maxEntries: 1000, maxAgeSeconds: 60 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Cache external Adhkar audio CDN
registerRoute(
  /^https:\/\/(hisnmuslim\.com|archive\.org|backup\.qurango\.net)\/.*/i,
  new CacheFirst({
    cacheName: 'adhkar-audio-cdn-v1',
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// Handle Incoming Push Notifications
self.addEventListener('push', (event: PushEvent) => {
  console.log('[ServiceWorker] Push event received');

  let data = {
    title: 'تنبيه صلاة 🕌',
    body: 'حان الآن موعد الصلاة',
    url: '/prayer',
    icon: '/logo.png',
    badge: '/logo.png',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options: NotificationOptions = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    dir: 'rtl',
    data: { url: data.url },
    tag: `prayer-push-${Date.now()}`,
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle Notification Clicks
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  console.log('[ServiceWorker] Notification click received');
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/prayer';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client && client.url.includes(targetUrl)) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
