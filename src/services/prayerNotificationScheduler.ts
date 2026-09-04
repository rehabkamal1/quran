import type { PrayerTimes } from './prayerApi';
import { parsePrayerMinutes } from '../context/AdhanContext';
import { backgroundNotificationService } from './backgroundNotificationService';

export interface PrayerScheduleItem {
  name: string;
  key: string;
  timeStr: string;
  targetDate: Date;
  playKey: string;
}

export const formatPrayerNotificationKey = (prayerDate: Date, prayerKeyName: string): string => {
  const y = prayerDate.getFullYear();
  const m = String(prayerDate.getMonth() + 1).padStart(2, '0');
  const d = String(prayerDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}:${prayerKeyName}`;
};

export const getPrayerDateFromTimeStr = (baseDate: Date, timeStr: string): Date | null => {
  const minutes = parsePrayerMinutes(timeStr);
  if (minutes === null) return null;
  const d = new Date(baseDate);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d;
};

export const prayerNotificationScheduler = {
  getUpcomingScheduleItems: (timings: PrayerTimes, baseDate: Date = new Date()): PrayerScheduleItem[] => {
    const prayers = [
      { name: 'الفجر', key: 'Fajr', time: timings.Fajr },
      { name: 'الظهر', key: 'Dhuhr', time: timings.Dhuhr },
      { name: 'العصر', key: 'Asr', time: timings.Asr },
      { name: 'المغرب', key: 'Maghrib', time: timings.Maghrib },
      { name: 'العشاء', key: 'Isha', time: timings.Isha },
    ];

    const items: PrayerScheduleItem[] = [];

    for (const p of prayers) {
      const pDate = getPrayerDateFromTimeStr(baseDate, p.time);
      if (!pDate) continue;

      if (pDate.getTime() > baseDate.getTime()) {
        items.push({
          name: p.name,
          key: p.key,
          timeStr: p.time,
          targetDate: pDate,
          playKey: formatPrayerNotificationKey(pDate, p.key),
        });
      }
    }

    // Include tomorrow Fajr if all prayers today passed
    if (items.length === 0) {
      const tomorrow = new Date(baseDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowFajr = getPrayerDateFromTimeStr(tomorrow, prayers[0].time);
      if (tomorrowFajr) {
        items.push({
          name: prayers[0].name,
          key: prayers[0].key,
          timeStr: prayers[0].time,
          targetDate: tomorrowFajr,
          playKey: formatPrayerNotificationKey(tomorrowFajr, prayers[0].key),
        });
      }
    }

    return items;
  },

  checkAndTriggerBackgroundNotification: (timings: PrayerTimes) => {
    if (!backgroundNotificationService.isBackgroundEnabled()) return;

    const now = new Date();
    const items = prayerNotificationScheduler.getUpcomingScheduleItems(timings, new Date(now.getTime() - 30 * 60 * 1000));

    for (const item of items) {
      const diffMs = now.getTime() - item.targetDate.getTime();
      // If prayer occurred in the last 30 minutes
      if (diffMs >= 0 && diffMs <= 30 * 60 * 1000) {
        const lastNotifiedKey = localStorage.getItem('last_bg_notified_prayer_key');
        if (lastNotifiedKey !== item.playKey) {
          localStorage.setItem('last_bg_notified_prayer_key', item.playKey);
          backgroundNotificationService.sendTestBackgroundNotification({
            title: `حان الآن موعد أذان ${item.name} 🕌`,
            body: `حي على الصلاة، حي على الفلاح — موعد أذان ${item.name} (${item.timeStr})`,
            url: '/prayer',
            prayerName: item.name,
            prayerKey: item.playKey,
          });
          break;
        }
      }
    }
  },
};
