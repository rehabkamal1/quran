import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { PrayerTimes } from './prayerApi';

export interface PrayerNotificationConfig {
  fajr: boolean;
  sunrise: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
}

const DEFAULT_PRAYER_CONFIG: PrayerNotificationConfig = {
  fajr: true,
  sunrise: false,
  dhuhr: true,
  asr: true,
  maghrib: true,
  isha: true,
};

const PRAYER_NAMES_AR: Record<string, string> = {
  Fajr: 'صلاة الفجر',
  Sunrise: 'شروق الشمس',
  Dhuhr: 'صلاة الظهر',
  Asr: 'صلاة العصر',
  Maghrib: 'صلاة المغرب',
  Isha: 'صلاة العشاء',
};

const PRAYER_IDS: Record<string, number> = {
  Fajr: 101,
  Sunrise: 102,
  Dhuhr: 103,
  Asr: 104,
  Maghrib: 105,
  Isha: 106,
};

export const nativeNotificationService = {
  /**
   * Check if running on Android/iOS native platform via Capacitor
   */
  isNative: (): boolean => {
    return Capacitor.isNativePlatform();
  },

  /**
   * Request notification permissions from Android OS (POST_NOTIFICATIONS)
   */
  requestPermission: async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const status = await LocalNotifications.requestPermissions();
      return status.display === 'granted';
    } catch (e) {
      console.error('[NativeNotification] Error requesting permission:', e);
      return false;
    }
  },

  /**
   * Check current permission state
   */
  checkPermission: async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const status = await LocalNotifications.checkPermissions();
      return status.display === 'granted';
    } catch {
      return false;
    }
  },

  /**
   * Setup High-Priority Android Notification Channel for Adhan
   */
  setupChannel: async (): Promise<void> => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.createChannel({
        id: 'adhan_prayer_channel',
        name: 'أذان مواقيت الصلاة',
        description: 'تنبيهات وأذان الصلوات الخمس اليومية بدقة في الخلفية',
        importance: 5, // High priority
        visibility: 1, // Visible on lock screen
        vibration: true,
        lights: true,
        lightColor: '#C9A45C',
      });
    } catch (e) {
      console.warn('[NativeNotification] Error creating channel:', e);
    }
  },

  /**
   * Schedule 5 daily prayers into Android OS Exact Alarms
   */
  schedulePrayers: async (
    timings: PrayerTimes,
    cityName: string = 'مدينتك',
    customConfig?: Partial<PrayerNotificationConfig>
  ): Promise<number> => {
    if (!Capacitor.isNativePlatform()) return 0;

    const granted = await nativeNotificationService.checkPermission();
    if (!granted) {
      const requested = await nativeNotificationService.requestPermission();
      if (!requested) return 0;
    }

    await nativeNotificationService.setupChannel();

    const config = { ...DEFAULT_PRAYER_CONFIG, ...customConfig };
    const notificationsToSchedule: any[] = [];
    const now = new Date();

    const prayerKeys: (keyof PrayerTimes)[] = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    for (const key of prayerKeys) {
      const configKey = key.toLowerCase() as keyof PrayerNotificationConfig;
      if (!config[configKey]) continue;

      const timeStr = timings[key];
      if (!timeStr) continue;

      const [hStr, mStr] = timeStr.split(':');
      const hours = parseInt(hStr, 10);
      const minutes = parseInt(mStr, 10);

      if (isNaN(hours) || isNaN(minutes)) continue;

      // Schedule for today
      const scheduleDate = new Date(now);
      scheduleDate.setHours(hours, minutes, 0, 0);

      // If already passed today, schedule for tomorrow!
      if (scheduleDate.getTime() <= now.getTime()) {
        scheduleDate.setDate(scheduleDate.getDate() + 1);
      }

      const id = PRAYER_IDS[key] || Math.floor(Math.random() * 1000);
      const prayerArabic = PRAYER_NAMES_AR[key] || key;

      notificationsToSchedule.push({
        id,
        title: `حان الآن موعد ${prayerArabic} 🕌`,
        body: key === 'Sunrise' 
          ? `حان موعد شروق الشمس في ${cityName}` 
          : `حي على الصلاة، حي على الفلاح — موعد ${prayerArabic} في ${cityName}`,
        schedule: {
          at: scheduleDate,
          allowWhileIdle: true, // Wakes Android device even in Doze Mode!
        },
        channelId: 'adhan_prayer_channel',
        smallIcon: 'ic_stat_icon_config_sample',
        iconColor: '#C9A45C',
        extra: {
          prayer: key,
          cityName,
        },
      });
    }

    if (notificationsToSchedule.length > 0) {
      try {
        await LocalNotifications.schedule({
          notifications: notificationsToSchedule,
        });
        console.log(`[NativeNotification] Scheduled ${notificationsToSchedule.length} prayer alarms in Android OS.`);
        return notificationsToSchedule.length;
      } catch (e) {
        console.error('[NativeNotification] Error scheduling alarms:', e);
      }
    }

    return 0;
  },

  /**
   * Cancel all pending scheduled prayer notifications
   */
  cancelAll: async (): Promise<void> => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({
          notifications: pending.notifications,
        });
      }
    } catch (e) {
      console.error('[NativeNotification] Error cancelling notifications:', e);
    }
  },

  /**
   * Send an immediate test notification
   */
  sendTestNotification: async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) return false;

    const granted = await nativeNotificationService.requestPermission();
    if (!granted) return false;

    await nativeNotificationService.setupChannel();

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 9999,
            title: 'اختبار أذان الصلاة 🕌',
            body: 'تم ضبط وتفعيل نظام إشعارات الأذان بنجاح على هاتفك الأندرويد!',
            schedule: { at: new Date(Date.now() + 1000), allowWhileIdle: true },
            channelId: 'adhan_prayer_channel',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#C9A45C',
          },
        ],
      });
      return true;
    } catch (e) {
      console.error('[NativeNotification] Test notification error:', e);
      return false;
    }
  },
};

