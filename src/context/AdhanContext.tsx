import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { prayerApi } from '../services/prayerApi';
import type { PrayerTimes } from '../services/prayerApi';

interface AdhanContextType {
  adhanEnabled: boolean;
  toggleAdhan: () => void;
  isPlaying: boolean;
  currentPrayerName: string;
  stopAdhan: () => void;
  playTestAdhan: () => void;
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

export const AdhanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adhanEnabled, setAdhanEnabled] = useState(() => {
    return localStorage.getItem('adhan_enabled') === 'true';
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPrayerName, setCurrentPrayerName] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedRef = useRef<string>(''); // format: 'YYYY-MM-DD:prayerKey'

  const toggleAdhan = () => {
    setAdhanEnabled(prev => {
      const next = !prev;
      localStorage.setItem('adhan_enabled', String(next));
      if (!next) {
        stopAdhan();
      }
      return next;
    });
  };

  const playAdhan = (prayerName: string = '') => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio('/audio/adhan.mp3');
    audioRef.current = audio;
    setIsPlaying(true);
    setCurrentPrayerName(prayerName);
    audio.play().catch(err => {
      console.log('Autoplay blocked or audio failed', err);
      setIsPlaying(false);
    });

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentPrayerName('');
    };
  };

  const stopAdhan = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentPrayerName('');
  };

  const playTestAdhan = () => {
    playAdhan('تجربة الأذان');
  };

  // Monitor prayer times
  useEffect(() => {
    let timer: any;

    const checkPrayerTimes = async () => {
      const enabled = localStorage.getItem('adhan_enabled') === 'true';
      if (!enabled) return;

      const useLocation = localStorage.getItem('prayer_use_location') !== 'false';
      const cityId = localStorage.getItem('prayer_selected_city') || 'Makkah';
      const city = CITIES.find(c => c.id === cityId) || CITIES[0];

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      let timings: PrayerTimes | null = null;

      try {
        const cacheStr = localStorage.getItem('prayer_timings_cache');
        const cachedLat = localStorage.getItem('prayer_lat');
        const cachedLng = localStorage.getItem('prayer_lng');
        const latLngStr = (cachedLat && cachedLng) ? `${cachedLat},${cachedLng}` : '';
        
        if (cacheStr) {
          const cache = JSON.parse(cacheStr);
          const isSameDate = cache.date === todayStr;
          const isSameLocationMode = cache.useLocation === useLocation;
          const isSameLocationData = useLocation ? cache.latLng === latLngStr : cache.cityId === city.id;
          
          if (isSameDate && isSameLocationMode && isSameLocationData && cache.timings) {
            timings = cache.timings;
          }
        }

        if (!timings) {
          if (useLocation && cachedLat && cachedLng) {
            timings = await prayerApi.getTimingsByCoordinates(Number(cachedLat), Number(cachedLng));
          } else {
            timings = await prayerApi.getTimingsByCity(city.id, city.country);
          }

          if (timings) {
            const newCache = {
              date: todayStr,
              useLocation,
              latLng: latLngStr,
              cityId: city.id,
              timings
            };
            localStorage.setItem('prayer_timings_cache', JSON.stringify(newCache));
          }
        }
      } catch (e) {
        console.error('Error handling timings cache', e);
      }

      if (!timings) return;

      const prayers = [
        { name: 'الفجر', key: 'Fajr', time: timings.Fajr },
        { name: 'الظهر', key: 'Dhuhr', time: timings.Dhuhr },
        { name: 'العصر', key: 'Asr', time: timings.Asr },
        { name: 'المغرب', key: 'Maghrib', time: timings.Maghrib },
        { name: 'العشاء', key: 'Isha', time: timings.Isha },
      ];

      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      for (const prayer of prayers) {
        const [h, m] = prayer.time.split(':').map(Number);
        const prayerMinutes = h * 60 + m;

        if (currentMinutes === prayerMinutes) {
          const playKey = `${todayStr}:${prayer.key}`;
          if (lastPlayedRef.current !== playKey) {
            lastPlayedRef.current = playKey;
            playAdhan(prayer.name);
            
            import('../services/notificationService').then(({ notificationService }) => {
              notificationService.showNotification(
                `حان الآن موعد أذان ${prayer.name}`,
                "حي على الصلاة، حي على الفلاح",
                "/prayer"
              );
            });
          }
        }
      }
    };

    // Check every 30 seconds
    timer = setInterval(checkPrayerTimes, 30000);
    checkPrayerTimes();

    return () => clearInterval(timer);
  }, [adhanEnabled]);

  return (
    <AdhanContext.Provider value={{ adhanEnabled, toggleAdhan, isPlaying, currentPrayerName, stopAdhan, playTestAdhan }}>
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
