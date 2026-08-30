import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Clock, MapPin, Volume2, VolumeX, Play, Square } from 'lucide-react';
import { ProgressBar } from '../components/ui/ProgressBar';
import { prayerApi } from '../services/prayerApi';
import type { PrayerTimes } from '../services/prayerApi';
import { useAdhan } from '../context/AdhanContext';

const CITIES = [
  { id: 'Makkah', name: 'مكة المكرمة', country: 'SA' },
  { id: 'Madinah', name: 'المدينة المنورة', country: 'SA' },
  { id: 'Cairo', name: 'القاهرة', country: 'EG' },
  { id: 'Dubai', name: 'دبي', country: 'AE' },
  { id: 'Amman', name: 'عمان', country: 'JO' },
  { id: 'Riyadh', name: 'الرياض', country: 'SA' },
];

const parsePrayerTime = (timeStr: string, date: Date = new Date()): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

export const Prayer: React.FC = () => {
  const [timings, setTimings] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(true);
  const [useLocation, setUseLocation] = useState(() => {
    return localStorage.getItem('prayer_use_location') !== 'false';
  });
  const [selectedCity, setSelectedCity] = useState(() => {
    const cityId = localStorage.getItem('prayer_selected_city') || 'Makkah';
    return CITIES.find(c => c.id === cityId) || CITIES[0];
  });

  const { adhanEnabled, toggleAdhan, playTestAdhan, isPlaying, stopAdhan } = useAdhan();
  const [nextPrayer, setNextPrayer] = useState<{ name: string; timeLeft: string; progress: number } | null>(null);

  // Try fetching by location or fallback to city
  useEffect(() => {
    const fetchTimings = async () => {
      setLoading(true);
      if (useLocation && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            localStorage.setItem('prayer_use_location', 'true');
            localStorage.setItem('prayer_lat', String(latitude));
            localStorage.setItem('prayer_lng', String(longitude));
            const data = await prayerApi.getTimingsByCoordinates(latitude, longitude);
            if (data) setTimings(data);
            setLoading(false);
          },
          async () => {
            // Fallback if denied
            setUseLocation(false);
            localStorage.setItem('prayer_use_location', 'false');
            const data = await prayerApi.getTimingsByCity(selectedCity.id, selectedCity.country);
            if (data) setTimings(data);
            setLoading(false);
          }
        );
      } else {
        localStorage.setItem('prayer_use_location', 'false');
        const data = await prayerApi.getTimingsByCity(selectedCity.id, selectedCity.country);
        if (data) setTimings(data);
        setLoading(false);
      }
    };
    fetchTimings();
  }, [useLocation, selectedCity]);

  // Update countdown to next prayer
  useEffect(() => {
    if (!timings) return;

    const updateCountdown = () => {
      const now = new Date();
      const prayers = [
        { name: 'الفجر', key: 'Fajr', time: timings.Fajr },
        { name: 'الشروق', key: 'Sunrise', time: timings.Sunrise },
        { name: 'الظهر', key: 'Dhuhr', time: timings.Dhuhr },
        { name: 'العصر', key: 'Asr', time: timings.Asr },
        { name: 'المغرب', key: 'Maghrib', time: timings.Maghrib },
        { name: 'العشاء', key: 'Isha', time: timings.Isha },
      ];

      let next = null;
      let diffMs = 0;
      let prevTime = null;

      for (let i = 0; i < prayers.length; i++) {
        const prayerDate = parsePrayerTime(prayers[i].time, now);
        if (prayerDate > now) {
          next = prayers[i];
          diffMs = prayerDate.getTime() - now.getTime();
          
          const prevIndex = i === 0 ? prayers.length - 1 : i - 1;
          const prevPrayer = prayers[prevIndex];
          let prevDate = parsePrayerTime(prevPrayer.time, now);
          if (i === 0) {
            prevDate.setDate(prevDate.getDate() - 1);
          }
          prevTime = prevDate;
          break;
        }
      }

      if (!next) {
        next = prayers[0];
        const tomorrowFajr = parsePrayerTime(prayers[0].time, now);
        tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
        diffMs = tomorrowFajr.getTime() - now.getTime();

        const ishaDate = parsePrayerTime(prayers[5].time, now);
        prevTime = ishaDate;
      }

      const totalSeconds = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      const timeLeftStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      let progress = 100;
      if (prevTime) {
        const totalDuration = next.key === 'Fajr' && prevTime.getDate() !== now.getDate()
          ? (parsePrayerTime(next.time, now).getTime() + 24 * 60 * 60 * 1000) - prevTime.getTime()
          : parsePrayerTime(next.time, now).getTime() - prevTime.getTime();
        const elapsed = totalDuration - diffMs;
        progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
      }

      setNextPrayer({
        name: next.name,
        timeLeft: timeLeftStr,
        progress
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [timings]);

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = CITIES.find(c => c.id === e.target.value);
    if (city) {
      setSelectedCity(city);
      setUseLocation(false);
      localStorage.setItem('prayer_use_location', 'false');
      localStorage.setItem('prayer_selected_city', city.id);
    }
  };

  const getPrayerStatus = (prayerKey: string, prayerTime: string) => {
    if (!timings) return 'upcoming';
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const keys = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const idx = keys.indexOf(prayerKey);
    if (idx === -1) return 'upcoming';

    const [h, m] = prayerTime.split(':').map(Number);
    const timeMinutes = h * 60 + m;

    if (currentMinutes < timeMinutes) {
      return 'upcoming';
    } else {
      if (idx === keys.length - 1) {
        return 'current';
      }
      const nextKey = keys[idx + 1];
      const nextTime = (timings as any)[nextKey];
      const [nh, nm] = nextTime.split(':').map(Number);
      const nextMinutes = nh * 60 + nm;
      if (currentMinutes < nextMinutes) {
        return 'current';
      }
      return 'past';
    }
  };

  const formattedPrayers = timings ? [
    { name: 'الفجر', key: 'Fajr', time: timings.Fajr, status: getPrayerStatus('Fajr', timings.Fajr) },
    { name: 'الشروق', key: 'Sunrise', time: timings.Sunrise, status: getPrayerStatus('Sunrise', timings.Sunrise) },
    { name: 'الظهر', key: 'Dhuhr', time: timings.Dhuhr, status: getPrayerStatus('Dhuhr', timings.Dhuhr) },
    { name: 'العصر', key: 'Asr', time: timings.Asr, status: getPrayerStatus('Asr', timings.Asr) },
    { name: 'المغرب', key: 'Maghrib', time: timings.Maghrib, status: getPrayerStatus('Maghrib', timings.Maghrib) },
    { name: 'العشاء', key: 'Isha', time: timings.Isha, status: getPrayerStatus('Isha', timings.Isha) },
  ] : [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-500 pb-20">
      
      {/* Location Selector */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-black/5 dark:bg-white/5 p-4 rounded-2xl">
        <Button 
          variant={useLocation ? 'primary' : 'outline'} 
          className="w-full sm:w-auto gap-2"
          onClick={() => {
            setUseLocation(true);
            localStorage.setItem('prayer_use_location', 'true');
          }}
        >
          <MapPin size={20} />
          موقعي الحالي
        </Button>
        <span className="text-text-muted">أو اختر:</span>
        <select 
          className="w-full sm:w-auto flex-1 bg-white dark:bg-card-dark border border-black/10 dark:border-white/10 rounded-xl p-3 outline-none cursor-pointer"
          value={selectedCity.id}
          onChange={handleCityChange}
        >
          {CITIES.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Adhan Toggle Control Card */}
      <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-black/5 dark:bg-white/5 border-transparent gap-4">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            {adhanEnabled ? (
              <Volume2 className="text-primary dark:text-primary-light" size={24} />
            ) : (
              <VolumeX className="text-text-muted" size={24} />
            )}
            <h3 className="font-bold text-lg">تنبيه صوت الأذان</h3>
          </div>
          <p className="text-sm text-text-muted">
            تشغيل الأذان تلقائياً عند دخول وقت الصلاة (إذا كان التطبيق مفتوحاً).
          </p>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
          <Button
            variant="outline"
            className="gap-2 text-sm px-4"
            onClick={isPlaying ? stopAdhan : playTestAdhan}
          >
            {isPlaying ? (
              <>
                <Square size={16} className="fill-current" />
                إيقاف التجربة
              </>
            ) : (
              <>
                <Play size={16} className="fill-current" />
                تجربة الأذان
              </>
            )}
          </Button>

          <div dir="ltr">
            <button 
              onClick={toggleAdhan} 
              className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${adhanEnabled ? 'bg-primary dark:bg-primary-light' : 'bg-black/20 dark:bg-white/20'}`}
            >
              <div className={`bg-white dark:bg-background-dark w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${adhanEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : (
        <>
          {nextPrayer && (
            <Card className="bg-gradient-to-br from-primary to-primary-light text-white border-0 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Clock size={120} />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80">الصلاة القادمة</p>
                    <h2 className="text-4xl font-bold font-quran mt-2">{nextPrayer.name}</h2>
                  </div>
                  <div className="text-left">
                    <p className="text-white/80">الوقت المتبقي</p>
                    <p className="text-2xl font-bold text-left" dir="ltr">-{nextPrayer.timeLeft}</p>
                  </div>
                </div>
                <ProgressBar progress={nextPrayer.progress} color="secondary" className="bg-white/20" />
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formattedPrayers.map((prayer, i) => (
              <Card 
                key={i} 
                className={`flex items-center justify-between p-4 transition-all duration-300 ${
                  prayer.status === 'current' 
                    ? 'border-primary ring-1 ring-primary/20 shadow-md bg-primary/5 dark:bg-primary-light/5' 
                    : prayer.status === 'past' 
                      ? 'opacity-60 bg-black/[0.02] dark:bg-white/[0.02]' 
                      : ''
                }`}
              >
                <span className={`text-xl font-bold ${prayer.status === 'current' ? 'text-primary dark:text-primary-light font-extrabold' : ''}`}>
                  {prayer.name}
                </span>
                <span className={`text-lg font-semibold ${prayer.status === 'current' ? 'text-primary dark:text-primary-light' : 'text-text-muted dark:text-text-darkMuted'}`} dir="ltr">
                  {prayer.time}
                </span>
              </Card>
            ))}
          </div>
        </>
      )}

    </div>
  );
};
