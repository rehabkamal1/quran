import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Play, Pause, Radio as RadioIcon, Loader2, WifiOff } from 'lucide-react';

interface RadioStation {
  id: number;
  name: string;
  url: string;
}

const DEFAULT_STATIONS: RadioStation[] = [
  { id: 1, name: 'إذاعة القران الكريم - القاهرة', url: 'https://stream.radiojar.com/8shnrn40cv8uv' },
  { id: 2, name: 'إذاعة القرآن الكريم - مكة المكرمة', url: 'https://backup.qurango.net/radio/makkah' },
  { id: 3, name: 'إذاعة مشاري العفاسي', url: 'https://backup.qurango.net/radio/mishary_alafasi' },
  { id: 4, name: 'إذاعة عبد الباسط عبد الصمد', url: 'https://backup.qurango.net/radio/abdulbasit_abdulsamad_mojawwad' },
  { id: 5, name: 'إذاعة ماهر المعيقلي', url: 'https://backup.qurango.net/radio/maher' },
  { id: 6, name: 'إذاعة محمود خليل الحصري', url: 'https://backup.qurango.net/radio/hussary' },
];

export const Radio: React.FC = () => {
  const [stations, setStations] = useState<RadioStation[]>(DEFAULT_STATIONS);
  const [loading, setLoading] = useState(true);
  const [activeStation, setActiveStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const handleOnlineStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    const fetchRadios = async () => {
      try {
        if (!navigator.onLine) {
          setLoading(false);
          return;
        }
        const res = await fetch('https://mp3quran.net/api/v3/radios?language=ar');
        if (!res.ok) throw new Error('Failed to fetch radios');
        const data = await res.json();
        if (data && data.radios && data.radios.length > 0) {
          setStations(data.radios);
        }
      } catch (error) {
        console.warn('Failed to fetch radios online, using fallback list', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRadios();

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const togglePlay = (station: RadioStation) => {
    if (activeStation?.id === station.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setActiveStation(station);
      setIsPlaying(true);
      const audio = new Audio(station.url);
      audioRef.current = audio;
      audio.play();
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-primary dark:text-primary-light flex items-center justify-center gap-2">
          <RadioIcon size={32} /> إذاعة القرآن الكريم
        </h1>
        <p className="text-text-muted dark:text-text-darkMuted text-lg">بث مباشر على مدار الساعة</p>
      </div>

      {isOffline && (
        <Card className="p-4 bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 flex items-center gap-3">
          <WifiOff size={24} className="shrink-0" />
          <p className="text-sm font-semibold">
            أنت حالياً في الوضع غير المتصل بالإنترنت. استماع البث المباشر للإذاعات يحتاج لاتصال إنترنت.
          </p>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center p-12 text-primary">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stations.map(station => {
            const isActive = activeStation?.id === station.id;
            return (
              <Card 
                key={station.id} 
                className={`p-4 cursor-pointer border-2 transition-all ${isActive ? 'border-primary bg-primary/5' : 'border-transparent hover:border-black/5'}`}
                onClick={() => togglePlay(station)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-primary text-white' : 'bg-black/5 dark:bg-white/5 text-primary'}`}>
                      {isActive && isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                    </div>
                    <span className="font-bold text-lg">{station.name}</span>
                  </div>
                  {isActive && isPlaying && (
                    <div className="flex gap-1 items-end h-4">
                      <div className="w-1 bg-primary animate-pulse h-full"></div>
                      <div className="w-1 bg-primary animate-pulse h-2/3 delay-75"></div>
                      <div className="w-1 bg-primary animate-pulse h-full delay-150"></div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
