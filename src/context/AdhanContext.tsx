import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { prayerApi } from '../services/prayerApi';
import type { PrayerTimes } from '../services/prayerApi';
import { nativeNotificationService } from '../services/nativeNotificationService';
import { findCity } from '../data/cities';
import { getMuezzinById } from '../data/muezzins';
import { dhikrReminderService } from '../services/dhikrReminderService';

export interface NextPrayerInfo {
  name: string;
  time: string;
  msRemaining: number;
}

interface AdhanContextType {
  adhanEnabled: boolean;
  audioUnlocked: boolean;
  toggleAdhan: () => Promise<void>;
  unlockAudio: () => Promise<void>;
  isPlaying: boolean;
  currentPrayerName: string;
  nextPrayerInfo: NextPrayerInfo | null;
  stopAdhan: () => void;
  playTestAdhan: () => Promise<void>;
}

const AdhanContext = createContext<AdhanContextType | undefined>(undefined);

export const parsePrayerMinutes = (timeStr: string): number | null => {
  if (!timeStr || typeof timeStr !== 'string') return null;

  let cleaned = timeStr.trim();
  cleaned = cleaned.replace(/\s*\([^)]*\)/g, '').trim();

  const isPM = /pm/i.test(cleaned);
  const isAM = /am/i.test(cleaned);

  cleaned = cleaned.replace(/\s*(am|pm)/i, '').trim();

  const parts = cleaned.split(':');
  if (parts.length < 2) return null;

  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) return null;

  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
};

const getPrayerDate = (baseDate: Date, timeStr: string): Date | null => {
  const minutes = parsePrayerMinutes(timeStr);
  if (minutes === null) return null;
  const d = new Date(baseDate);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d;
};

const formatPrayerKey = (prayerDate: Date, prayerKeyName: string): string => {
  const y = prayerDate.getFullYear();
  const m = String(prayerDate.getMonth() + 1).padStart(2, '0');
  const d = String(prayerDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}:${prayerKeyName}`;
};

export const AdhanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adhanEnabled, setAdhanEnabled] = useState(() => {
    const stored = localStorage.getItem('adhan_enabled');
    return stored === null ? true : stored === 'true';
  });
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPrayerName, setCurrentPrayerName] = useState('');
  const [nextPrayerInfo, setNextPrayerInfo] = useState<{ name: string; time: string; msRemaining: number } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scheduledTimeoutRef = useRef<any>(null);
  const timingsRef = useRef<PrayerTimes | null>(null);
  const adhanEnabledRef = useRef(adhanEnabled);
  const audioUnlockedRef = useRef(audioUnlocked);

  useEffect(() => {
    adhanEnabledRef.current = adhanEnabled;
  }, [adhanEnabled]);

  useEffect(() => {
    audioUnlockedRef.current = audioUnlocked;
  }, [audioUnlocked]);

  const getAudioElement = (): HTMLAudioElement => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = 'auto';
      audioRef.current = audio;
    }
    return audioRef.current;
  };

  // Perform actual user gesture unlock on HTMLAudioElement
  const unlockAudio = async () => {
    try {
      const audio = getAudioElement();
      audio.muted = true;
      audio.volume = 1.0;
      await audio.play().catch(() => {});
      audio.pause();
      audio.muted = false;
      audio.currentTime = 0;
      setAudioUnlocked(true);
      console.log('[Adhan] audio unlocked: true');
    } catch (err: any) {
      console.warn('[Adhan] audio unlocked attempt:', err?.name, err?.message);
    }
  };

  // Automatically unlock audio on first interaction anywhere in the app
  useEffect(() => {
    const handleFirstGesture = () => {
      unlockAudio();
    };

    window.addEventListener('click', handleFirstGesture, { passive: true, once: true });
    window.addEventListener('touchstart', handleFirstGesture, { passive: true, once: true });
    window.addEventListener('keydown', handleFirstGesture, { passive: true, once: true });

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, []);

  // Initialize Dhikr foreground periodic reminders
  useEffect(() => {
    const cleanupDhikr = dhikrReminderService.startForegroundScheduler();

    if (nativeNotificationService.isNative()) {
      dhikrReminderService.scheduleNativeReminders();
    }

    return () => {
      cleanupDhikr();
    };
  }, []);

  const playAdhan = async (prayerName: string = '') => {
    console.log(`[Adhan] attempting playback for: ${prayerName}`);

    const chosenMuezzin = getMuezzinById();
    const primaryUrl = chosenMuezzin.url.startsWith('/') 
      ? `${window.location.origin}${chosenMuezzin.url}` 
      : chosenMuezzin.url;
    const backupUrl = chosenMuezzin.backupUrl || 'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Ali_Ibn_Ahmad_Mala_HQ.mp3';

    const audio = getAudioElement();
    audio.pause();
    audio.currentTime = 0;
    audio.muted = false;
    audio.volume = 1.0;
    audio.src = primaryUrl;
    audio.load();

    setIsPlaying(true);
    setCurrentPrayerName(prayerName || chosenMuezzin.name);

    try {
      await audio.play();
      console.log(`[Adhan] audio.play SUCCESS for ${prayerName} (${primaryUrl})`);
    } catch (err: any) {
      console.warn(`[Adhan] Primary play failed for ${prayerName}, trying backup CDN:`, err?.message);
      try {
        audio.src = backupUrl;
        audio.load();
        await audio.play();
        console.log(`[Adhan] Backup audio.play SUCCESS for ${prayerName}`);
      } catch (backupErr: any) {
        console.error(`[Adhan] Both primary and backup playback failed:`, backupErr);
        // Fallback to default local adhan
        try {
          audio.src = `${window.location.origin}/audio/adhan.mp3`;
          audio.load();
          await audio.play();
        } catch {
          setIsPlaying(false);
          setCurrentPrayerName('');
        }
      }
    }

    audio.onended = () => {
      console.log(`[Adhan] adhan playback ended for ${prayerName}`);
      setIsPlaying(false);
      setCurrentPrayerName('');
    };
  };

  const checkMissedOrDuePrayer = (timings: PrayerTimes) => {
    const stored = localStorage.getItem('adhan_enabled');
    const enabled = stored === null ? true : stored === 'true';
    if (!enabled) return;

    const now = new Date();
    const prayers = [
      { name: 'الفجر', key: 'Fajr', time: timings.Fajr },
      { name: 'الظهر', key: 'Dhuhr', time: timings.Dhuhr },
      { name: 'العصر', key: 'Asr', time: timings.Asr },
      { name: 'المغرب', key: 'Maghrib', time: timings.Maghrib },
      { name: 'العشاء', key: 'Isha', time: timings.Isha },
    ];

    const today = new Date(now);

    for (const p of prayers) {
      const pDate = getPrayerDate(today, p.time);
      if (!pDate) continue;

      const diffMs = now.getTime() - pDate.getTime();
      // If prayer occurred in the last 20 minutes (0 to 20 mins ago)
      if (diffMs >= 0 && diffMs <= 20 * 60 * 1000) {
        const playKey = formatPrayerKey(pDate, p.key);
        const alreadyPlayed = localStorage.getItem('last_played_adhan_key') === playKey;

        if (!alreadyPlayed) {
          console.log(`[Adhan] 🎯 Due/Missed Prayer Detected: ${p.name} (${p.time}) - Key: ${playKey}`);
          localStorage.setItem('last_played_adhan_key', playKey);

          if (adhanEnabledRef.current) {
            playAdhan(p.name);

            import('../services/notificationService').then(({ notificationService }) => {
              notificationService.showNotification(
                `حان الآن موعد أذان ${p.name} 🕌`,
                "حي على الصلاة، حي على الفلاح",
                "/prayer"
              );
            });
          }
          break; // Trigger only the latest missed prayer
        }
      }
    }
  };

  const scheduleNextPrayer = (timings: PrayerTimes) => {
    if (scheduledTimeoutRef.current) {
      clearTimeout(scheduledTimeoutRef.current);
      scheduledTimeoutRef.current = null;
    }

    timingsRef.current = timings;
    const now = new Date();

    // Check for missed/due prayer in recent window
    checkMissedOrDuePrayer(timings);

    const prayers = [
      { name: 'الفجر', key: 'Fajr', time: timings.Fajr },
      { name: 'الظهر', key: 'Dhuhr', time: timings.Dhuhr },
      { name: 'العصر', key: 'Asr', time: timings.Asr },
      { name: 'المغرب', key: 'Maghrib', time: timings.Maghrib },
      { name: 'العشاء', key: 'Isha', time: timings.Isha },
    ];

    let upcoming: { name: string; key: string; date: Date; timeStr: string } | null = null;

    for (const p of prayers) {
      const pDate = getPrayerDate(now, p.time);
      if (!pDate) continue;

      if (pDate.getTime() > now.getTime()) {
        upcoming = { name: p.name, key: p.key, date: pDate, timeStr: p.time };
        break;
      }
    }

    // If all prayers today passed, schedule Fajr for tomorrow
    if (!upcoming) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowFajrDate = getPrayerDate(tomorrow, prayers[0].time);

      if (tomorrowFajrDate) {
        upcoming = { name: prayers[0].name, key: prayers[0].key, date: tomorrowFajrDate, timeStr: prayers[0].time };
      }
    }

    if (!upcoming) return;

    const msRemaining = Math.max(0, upcoming.date.getTime() - now.getTime());
    const upcomingPlayKey = formatPrayerKey(upcoming.date, upcoming.key);

    setNextPrayerInfo({ name: upcoming.name, time: upcoming.timeStr, msRemaining });

    console.log(`[Adhan] next prayer: ${upcoming.name} (${upcoming.timeStr}) on ${upcomingPlayKey}`);

    scheduledTimeoutRef.current = setTimeout(() => {
      console.log(`[Adhan] Scheduled timeout fired for ${upcoming!.name} (${upcomingPlayKey})!`);

      if (localStorage.getItem('last_played_adhan_key') !== upcomingPlayKey) {
        localStorage.setItem('last_played_adhan_key', upcomingPlayKey);
        if (adhanEnabledRef.current) {
          playAdhan(upcoming!.name);

          import('../services/notificationService').then(({ notificationService }) => {
            notificationService.showNotification(
              `حان الآن موعد أذان ${upcoming!.name} 🕌`,
              "حي على الصلاة، حي على الفلاح",
              "/prayer"
            );
          });
        }
      }

      if (timingsRef.current) {
        scheduleNextPrayer(timingsRef.current);
      }
    }, msRemaining);
  };

  const toggleAdhan = async () => {
    if (!adhanEnabled) {
      await unlockAudio();

      if (nativeNotificationService.isNative()) {
        const granted = await nativeNotificationService.requestPermission();
        if (granted && timingsRef.current) {
          const cityId = localStorage.getItem('prayer_selected_city') || 'Cairo';
          const city = findCity(cityId);
          await nativeNotificationService.schedulePrayers(timingsRef.current, city.name);
        }
      } else {
        import('../services/notificationService').then(async ({ notificationService }) => {
          const granted = await notificationService.requestPermission();
          if (granted) {
            notificationService.showNotification("تم تفعيل تنبيهات الأذان 🕌", "سيصلك إشعار عند دخول وقت الصلاة", "/prayer");
          } else {
            alert("يرجى السماح بالإشعارات من إعدادات المتصفح لضمان وصول تنبيه الأذان حتى لو كان الموقع في الخلفية.");
          }
        });
      }
      setAdhanEnabled(true);
      localStorage.setItem('adhan_enabled', 'true');
    } else {
      setAdhanEnabled(false);
      localStorage.setItem('adhan_enabled', 'false');
      if (nativeNotificationService.isNative()) {
        await nativeNotificationService.cancelAll();
      }
      stopAdhan();
    }
  };

  const stopAdhan = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentPrayerName('');
  };

  const playTestAdhan = async () => {
    await unlockAudio();
    if (nativeNotificationService.isNative()) {
      await nativeNotificationService.sendTestNotification();
    }
    const muezzin = getMuezzinById();
    playAdhan(`تجربة الأذان (${muezzin.name})`);
  };

  // Monitor & Schedule prayer times on load & visibility change
  useEffect(() => {
    const fetchAndSchedule = async () => {
      const stored = localStorage.getItem('adhan_enabled');
      const enabled = stored === null ? true : stored === 'true';
      if (!enabled) return;

      const useLocation = localStorage.getItem('prayer_use_location') !== 'false';
      const cityId = localStorage.getItem('prayer_selected_city') || 'Cairo';
      const city = findCity(cityId);
      const calcMethod = localStorage.getItem('prayer_calc_method') || 'egypt';
      const asrMethod = localStorage.getItem('prayer_asr_juristic') || 'standard';

      const now = new Date();
      const todayStr = formatPrayerKey(now, '').replace(':', '');

      let timings: PrayerTimes | null = null;

      try {
        const cacheStr = localStorage.getItem('prayer_timings_cache');
        const cachedLat = localStorage.getItem('prayer_lat');
        const cachedLng = localStorage.getItem('prayer_lng');
        const latLngStr = (cachedLat && cachedLng) ? `${cachedLat},${cachedLng}` : '';

        if (cacheStr) {
          const cache = JSON.parse(cacheStr);
          if (
            cache.date === todayStr &&
            cache.useLocation === useLocation &&
            cache.calcMethod === calcMethod &&
            cache.asrMethod === asrMethod &&
            (useLocation ? cache.latLng === latLngStr : cache.cityId === city.id) &&
            cache.timings
          ) {
            timings = cache.timings;
          }
        }

        if (!timings) {
          if (useLocation && cachedLat && cachedLng) {
            timings = await prayerApi.getTimingsByCoordinates(Number(cachedLat), Number(cachedLng), calcMethod, asrMethod);
          } else {
            timings = await prayerApi.getTimingsByCity(city.id, city.countryCode, calcMethod, asrMethod);
          }

          if (timings) {
            localStorage.setItem('prayer_timings_cache', JSON.stringify({
              date: todayStr,
              useLocation,
              latLng: latLngStr,
              cityId: city.id,
              calcMethod,
              asrMethod,
              timings
            }));
          }
        }
      } catch (e) {
        console.error('[Adhan] Error fetching prayer timings:', e);
      }

      if (timings) {
        scheduleNextPrayer(timings);
        if (enabled && nativeNotificationService.isNative()) {
          nativeNotificationService.schedulePrayers(timings, city.name);
        }
      }
    };

    fetchAndSchedule();

    const onForeground = () => {
      if (document.visibilityState === 'visible' && timingsRef.current) {
        scheduleNextPrayer(timingsRef.current);
      }
    };

    document.addEventListener('visibilitychange', onForeground);
    window.addEventListener('focus', onForeground);
    window.addEventListener('pageshow', onForeground);

    // Backup check loop every 30 seconds
    const intervalId = setInterval(() => {
      if (timingsRef.current) {
        scheduleNextPrayer(timingsRef.current);
      }
    }, 30000);

    return () => {
      if (scheduledTimeoutRef.current) clearTimeout(scheduledTimeoutRef.current);
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onForeground);
      window.removeEventListener('focus', onForeground);
      window.removeEventListener('pageshow', onForeground);
    };
  }, [adhanEnabled]);

  return (
    <AdhanContext.Provider 
      value={{ 
        adhanEnabled, 
        audioUnlocked, 
        toggleAdhan, 
        unlockAudio, 
        isPlaying, 
        currentPrayerName, 
        nextPrayerInfo, 
        stopAdhan, 
        playTestAdhan 
      }}
    >
      {children}
    </AdhanContext.Provider>
  );
};

export const useAdhan = () => {
  const context = useContext(AdhanContext);
  if (context === undefined) {
    throw new Error('useAdhan must be used within an AdhanProvider');
  }
  return context;
};
