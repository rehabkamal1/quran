import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { prayerApi } from '../services/prayerApi';
import type { PrayerTimes } from '../services/prayerApi';

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

const CITIES = [
  { id: 'Makkah', name: 'مكة المكرمة', country: 'SA' },
  { id: 'Madinah', name: 'المدينة المنورة', country: 'SA' },
  { id: 'Cairo', name: 'القاهرة', country: 'EG' },
  { id: 'Dubai', name: 'دبي', country: 'AE' },
  { id: 'Amman', name: 'عمان', country: 'JO' },
  { id: 'Riyadh', name: 'الرياض', country: 'SA' },
];

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
    return localStorage.getItem('adhan_enabled') === 'true';
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
      const audio = new Audio('/audio/adhan.mp3');
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
      audio.currentTime = 0;
      await audio.play();
      audio.pause();
      audio.muted = false;
      audio.currentTime = 0;
      setAudioUnlocked(true);
      console.log('[Adhan] audio unlocked: true');
    } catch (err: any) {
      console.warn('[Adhan] audio unlocked: false (User gesture failed):', err?.name, err?.message);
      setAudioUnlocked(false);
    }
  };

  const playAdhan = (prayerName: string = '') => {
    console.log(`[Adhan] enabled: ${adhanEnabledRef.current}`);
    console.log(`[Adhan] audio unlocked: ${audioUnlockedRef.current}`);
    console.log(`[Adhan] attempting playback for: ${prayerName}`);

    const audio = getAudioElement();
    audio.pause();
    audio.currentTime = 0;
    audio.src = '/audio/adhan.mp3';
    setIsPlaying(true);
    setCurrentPrayerName(prayerName);

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log(`[Adhan] audio.play SUCCESS for ${prayerName} at ${new Date().toLocaleTimeString()}`);
        })
        .catch((err: any) => {
          console.error(`[Adhan] audio.play FAILED for ${prayerName}`);
          console.error(`Error name: ${err?.name || 'Unknown'}`);
          console.error(`Error message: ${err?.message || 'Failed to play'}`);
          setIsPlaying(false);
        });
    }

    audio.onended = () => {
      console.log(`[Adhan] adhan playback ended for ${prayerName}`);
      setIsPlaying(false);
      setCurrentPrayerName('');
    };
  };

  const checkMissedOrDuePrayer = (timings: PrayerTimes) => {
    const enabled = localStorage.getItem('adhan_enabled') === 'true';
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
      // If prayer occurred in the last 30 minutes (0 to 30 mins ago)
      if (diffMs >= 0 && diffMs <= 30 * 60 * 1000) {
        const playKey = formatPrayerKey(pDate, p.key);
        const alreadyPlayed = localStorage.getItem('last_played_adhan_key') === playKey;

        if (!alreadyPlayed) {
          console.log(`[Adhan] 🎯 Due/Missed Prayer Detected: ${p.name} (${p.time}) - Diff: ${Math.round(diffMs / 1000)}s ago - Key: ${playKey}`);
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
    console.log(`[Adhan] scheduled in: ${msRemaining} ms`);

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

      import('../services/notificationService').then(async ({ notificationService }) => {
        const granted = await notificationService.requestPermission();
        if (granted) {
          notificationService.showNotification("تم تفعيل تنبيهات الأذان 🕌", "سيصلك إشعار عند دخول وقت الصلاة", "/prayer");
        } else {
          alert("يرجى السماح بالإشعارات من إعدادات المتصفح لضمان وصول تنبيه الأذان حتى لو كان الموقع في الخلفية.");
        }
      });
      setAdhanEnabled(true);
      localStorage.setItem('adhan_enabled', 'true');
    } else {
      setAdhanEnabled(false);
      localStorage.setItem('adhan_enabled', 'false');
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
    playAdhan('تجربة الأذان');
  };

  // Monitor & Schedule prayer times on load & visibility change
  useEffect(() => {
    const fetchAndSchedule = async () => {
      const enabled = localStorage.getItem('adhan_enabled') === 'true';
      console.log(`[Adhan] enabled: ${enabled}`);
      console.log(`[Adhan] audio unlocked: ${audioUnlockedRef.current}`);
      if (!enabled) return;

      const useLocation = localStorage.getItem('prayer_use_location') !== 'false';
      const cityId = localStorage.getItem('prayer_selected_city') || 'Makkah';
      const city = CITIES.find(c => c.id === cityId) || CITIES[0];

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
          if (cache.date === todayStr && cache.useLocation === useLocation && (useLocation ? cache.latLng === latLngStr : cache.cityId === city.id) && cache.timings) {
            timings = cache.timings;
          }
        }

        if (!timings) {
          console.log(`[Adhan] 📍 Fetching fresh prayer timings for ${city.name}...`);
          if (useLocation && cachedLat && cachedLng) {
            timings = await prayerApi.getTimingsByCoordinates(Number(cachedLat), Number(cachedLng));
          } else {
            timings = await prayerApi.getTimingsByCity(city.id, city.country);
          }

          if (timings) {
            localStorage.setItem('prayer_timings_cache', JSON.stringify({
              date: todayStr,
              useLocation,
              latLng: latLngStr,
              cityId: city.id,
              timings
            }));
          }
        }
      } catch (e) {
        console.error('[Adhan] Error fetching prayer timings:', e);
      }

      if (timings) {
        scheduleNextPrayer(timings);
      }
    };

    fetchAndSchedule();

    const onForeground = () => {
      if (document.visibilityState === 'visible' && timingsRef.current) {
        console.log('[Adhan] Page foreground event, checking missed prayers & re-syncing schedule...');
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
