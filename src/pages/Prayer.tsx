import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Clock, MapPin } from 'lucide-react';
import { ProgressBar } from '../components/ui/ProgressBar';
import { prayerApi } from '../services/prayerApi';
import type { PrayerTimes } from '../services/prayerApi';

const CITIES = [
  { id: 'Makkah', name: 'مكة المكرمة', country: 'SA' },
  { id: 'Madinah', name: 'المدينة المنورة', country: 'SA' },
  { id: 'Cairo', name: 'القاهرة', country: 'EG' },
  { id: 'Dubai', name: 'دبي', country: 'AE' },
  { id: 'Amman', name: 'عمان', country: 'JO' },
  { id: 'Riyadh', name: 'الرياض', country: 'SA' },
];

export const Prayer: React.FC = () => {
  const [timings, setTimings] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(true);
  const [useLocation, setUseLocation] = useState(true);
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);

  // Try fetching by location or fallback to city
  useEffect(() => {
    const fetchTimings = async () => {
      setLoading(true);
      if (useLocation && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const data = await prayerApi.getTimingsByCoordinates(position.coords.latitude, position.coords.longitude);
            if (data) setTimings(data);
            setLoading(false);
          },
          async () => {
            // Fallback if denied
            setUseLocation(false);
            const data = await prayerApi.getTimingsByCity(selectedCity.id, selectedCity.country);
            if (data) setTimings(data);
            setLoading(false);
          }
        );
      } else {
        const data = await prayerApi.getTimingsByCity(selectedCity.id, selectedCity.country);
        if (data) setTimings(data);
        setLoading(false);
      }
    };
    fetchTimings();
  }, [useLocation, selectedCity]);

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = CITIES.find(c => c.id === e.target.value);
    if (city) {
      setSelectedCity(city);
      setUseLocation(false);
    }
  };



  const formattedPrayers = timings ? [
    { name: 'الفجر', time: timings.Fajr, status: 'past' },
    { name: 'الشروق', time: timings.Sunrise, status: 'past' },
    { name: 'الظهر', time: timings.Dhuhr, status: 'current' },
    { name: 'العصر', time: timings.Asr, status: 'upcoming' },
    { name: 'المغرب', time: timings.Maghrib, status: 'upcoming' },
    { name: 'العشاء', time: timings.Isha, status: 'upcoming' },
  ] : [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-500 pb-20">
      
      {/* Location Selector */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-black/5 dark:bg-white/5 p-4 rounded-2xl">
        <Button 
          variant={useLocation ? 'primary' : 'outline'} 
          className="w-full sm:w-auto gap-2"
          onClick={() => setUseLocation(true)}
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

      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : (
        <>
          <Card className="bg-gradient-to-br from-primary to-primary-light text-white border-0 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Clock size={120} />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80">الصلاة القادمة</p>
                  <h2 className="text-4xl font-bold font-quran mt-2">العصر</h2>
                </div>
                <div className="text-left">
                  <p className="text-white/80">الوقت المتبقي</p>
                  <p className="text-2xl font-bold text-left" dir="ltr">-02:45:30</p>
                </div>
              </div>
              <ProgressBar progress={60} color="secondary" className="bg-white/20" />
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formattedPrayers.map((prayer, i) => (
              <Card 
                key={i} 
                className={`flex items-center justify-between p-4 ${prayer.status === 'current' ? 'border-primary ring-1 ring-primary/20 shadow-md' : ''}`}
              >
                <span className={`text-xl font-bold ${prayer.status === 'current' ? 'text-primary dark:text-primary-light' : ''}`}>
                  {prayer.name}
                </span>
                <span className="text-lg font-semibold text-text-muted dark:text-text-darkMuted" dir="ltr">
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
