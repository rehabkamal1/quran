export const notificationService = {
  requestPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  isEnabled: (): boolean => {
    return localStorage.getItem('adhkar_alerts_enabled') === 'true' && 
           ('Notification' in window && Notification.permission === 'granted');
  },

  setEnabled: (enabled: boolean) => {
    localStorage.setItem('adhkar_alerts_enabled', enabled ? 'true' : 'false');
  },

  checkAndTriggerReminder: () => {
    if (!notificationService.isEnabled()) return;

    const now = new Date();
    const hour = now.getHours();
    const todayStr = now.toDateString();

    // Morning Reminder: Between 6:00 AM and 11:00 AM
    if (hour >= 6 && hour < 11) {
      const lastMorningAlert = localStorage.getItem('last_morning_alert_date');
      if (lastMorningAlert !== todayStr) {
        notificationService.showNotification(
          "أذكار الصباح ☀️",
          "حان الآن موعد أذكار الصباح، اضغط لقراءتها والاستماع إليها.",
          "/adhkar/reader/morning"
        );
        localStorage.setItem('last_morning_alert_date', todayStr);
      }
    }

    // Evening Reminder: Between 4:00 PM and 8:00 PM
    if (hour >= 16 && hour < 20) {
      const lastEveningAlert = localStorage.getItem('last_evening_alert_date');
      if (lastEveningAlert !== todayStr) {
        notificationService.showNotification(
          "أذكار المساء 🌙",
          "حان الآن موعد أذكار المساء، اضغط لقراءتها والاستماع إليها.",
          "/adhkar/reader/evening"
        );
        localStorage.setItem('last_evening_alert_date', todayStr);
      }
    }
  },

  showNotification: (title: string, body: string, urlPath: string) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const options = {
      body: body,
      icon: '/logo.png',
      badge: '/logo.png',
      dir: 'rtl' as NotificationDirection,
      tag: 'adhkar-reminder',
      requireInteraction: true
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, options);
      });
    } else {
      const notification = new Notification(title, options);
      notification.onclick = () => {
        window.focus();
        window.location.href = urlPath;
      };
    }
  }
};
