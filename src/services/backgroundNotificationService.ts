export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  prayerName?: string;
  prayerKey?: string;
}

const PUBLIC_VAPID_KEY = import.meta.env.VITE_PUBLIC_VAPID_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const backgroundNotificationService = {
  isPushSupported: (): boolean => {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  },

  getPermissionState: (): NotificationPermission => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
    return Notification.permission;
  },

  requestNotificationPermission: async (): Promise<boolean> => {
    if (!backgroundNotificationService.isPushSupported()) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  getPushSubscription: async (): Promise<PushSubscription | null> => {
    if (!backgroundNotificationService.isPushSupported()) return null;
    try {
      const registration = await navigator.serviceWorker.ready;
      return await registration.pushManager.getSubscription();
    } catch (e) {
      console.error('[BackgroundNotification] Error fetching push subscription:', e);
      return null;
    }
  },

  subscribeToPush: async (): Promise<PushSubscription | null> => {
    if (!backgroundNotificationService.isPushSupported()) return null;

    const granted = await backgroundNotificationService.requestNotificationPermission();
    if (!granted) return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        const options: PushSubscriptionOptionsInit = {
          userVisibleOnly: true,
        };

        if (PUBLIC_VAPID_KEY) {
          options.applicationServerKey = urlBase64ToUint8Array(PUBLIC_VAPID_KEY) as unknown as BufferSource;
        }

        subscription = await registration.pushManager.subscribe(options);
        console.log('[BackgroundNotification] Subscribed to Web Push:', subscription.endpoint);
      }

      if (subscription) {
        try {
          await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription),
          });
          console.log('[BackgroundNotification] Push subscription registered on serverless API');
        } catch (err) {
          console.warn('[BackgroundNotification] Serverless subscribe sync failed:', err);
        }
      }

      localStorage.setItem('background_notifications_enabled', 'true');
      return subscription;
    } catch (e) {
      console.error('[BackgroundNotification] Failed to subscribe to Web Push:', e);
      return null;
    }
  },

  unsubscribeFromPush: async (): Promise<boolean> => {
    if (!backgroundNotificationService.isPushSupported()) return false;
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
      localStorage.setItem('background_notifications_enabled', 'false');
      console.log('[BackgroundNotification] Unsubscribed from Web Push.');
      return true;
    } catch (e) {
      console.error('[BackgroundNotification] Error unsubscribing from Web Push:', e);
      return false;
    }
  },

  isBackgroundEnabled: (): boolean => {
    return localStorage.getItem('background_notifications_enabled') === 'true' &&
      backgroundNotificationService.getPermissionState() === 'granted';
  },

  sendTestBackgroundNotification: async (payload?: PushNotificationPayload): Promise<boolean> => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      const granted = await Notification.requestPermission();
      if (granted !== 'granted') return false;
    }

    const title = payload?.title || 'إشعار صلاة خلفية (اختبار) 🕌';
    const body = payload?.body || 'تنبيه دخول وقت الصلاة عبر الخدمة المستقلة في الخلفية';
    const targetUrl = payload?.url || '/prayer';

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body,
          icon: '/logo.png',
          badge: '/logo.png',
          dir: 'rtl',
          data: { url: targetUrl },
          tag: `test-background-${Date.now()}`,
          requireInteraction: true,
        });
        return true;
      } catch (e) {
        console.warn('[BackgroundNotification] SW showNotification failed, falling back to Notification API:', e);
      }
    }

    const notification = new Notification(title, {
      body,
      icon: '/logo.png',
      badge: '/logo.png',
      dir: 'rtl',
      requireInteraction: true,
    });
    notification.onclick = () => {
      window.focus();
      window.location.href = targetUrl;
    };
    return true;
  },
};
