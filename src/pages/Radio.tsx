import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Play, Pause, Radio as RadioIcon, Loader2, WifiOff, Search, X, 
  AlertCircle, StopCircle, RefreshCw
} from 'lucide-react';

export interface RadioStation {
  id: number;
  name: string;
  url: string;
}

const DEFAULT_STATIONS: RadioStation[] = [
  { id: 1, name: 'إذاعة القرآن الكريم - القاهرة (بث رسمي)', url: 'https://stream.radiojar.com/8shnrn40cv8uv' },
  { id: 2, name: 'إذاعة القرآن الكريم - مكة المكرمة', url: 'https://backup.qurango.net/radio/makkah' },
  { id: 3, name: 'إذاعة القرآن الكريم - المدينة المنورة', url: 'https://backup.qurango.net/radio/madinah' },
  { id: 4, name: 'إذاعة الشيخ محمود خليل الحصري', url: 'https://backup.qurango.net/radio/hussary' },
  { id: 5, name: 'إذاعة الشيخ محمد صديق المنشاوي (المجود)', url: 'https://backup.qurango.net/radio/mohammed_siddiq_alminshawi_mojawwad' },
  { id: 6, name: 'إذاعة الشيخ عبد الباسط عبد الصمد (المجود)', url: 'https://backup.qurango.net/radio/abdulbasit_abdulsamad_mojawwad' },
  { id: 7, name: 'إذاعة الشيخ مشاري راشد العفاسي', url: 'https://backup.qurango.net/radio/mishary_alafasi' },
  { id: 8, name: 'إذاعة الشيخ ماهر المعيقلي', url: 'https://backup.qurango.net/radio/maher' },
  { id: 9, name: 'إذاعة الشيخ عبد الرحمن السديس', url: 'https://backup.qurango.net/radio/abdulrahman_alsudaes' },
  { id: 10, name: 'إذاعة الشيخ سعد الغامدي', url: 'https://backup.qurango.net/radio/saad_alghamdi' },
  { id: 11, name: 'إذاعة الشيخ أحمد بن علي العجمي', url: 'https://backup.qurango.net/radio/ahmad_alajmy' },
  { id: 12, name: 'إذاعة آيات السكينة وتفريج الهموم', url: 'https://backup.qurango.net/radio/al_sakeenah' },
  { id: 13, name: 'إذاعة الرقية الشرعية', url: 'https://backup.qurango.net/radio/roqiah' },
  { id: 14, name: 'إذاعة تفسير القرآن الكريم', url: 'https://backup.qurango.net/radio/tafseer' },
  { id: 15, name: 'إذاعة الفتاوى والأحكام', url: 'https://backup.qurango.net/radio/fatwa' }
];

const CATEGORIES = [
  { id: 'all', label: 'الكل' },
  { id: 'cairo', label: 'إذاعة القاهرة ومصر 🇪🇬' },
  { id: 'haramain', label: 'الحرمان الشريفان 🕋' },
  { id: 'reciters', label: 'كبار القراء 🎙️' },
  { id: 'quiet', label: 'سكينة ورقية 🌿' },
  { id: 'tafsir', label: 'تفسير وفتاوى 📖' },
];

// Arabic normalization helper for accurate and tolerant search
const normalizeArabic = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel
    .replace(/[أإآء]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\s\-_]+/g, ' ')
    .trim();
};

export const Radio: React.FC = () => {
  const [stations, setStations] = useState<RadioStation[]>(DEFAULT_STATIONS);
  const [loading, setLoading] = useState(true);
  const [activeStation, setActiveStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

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
          // Merge API stations, making sure default primary stations stay prominent
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

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const togglePlay = (station: RadioStation) => {
    setStreamError(null);

    // If clicking on already active station: toggle pause/play
    if (activeStation?.id === station.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
        setIsBuffering(false);
      } else {
        setIsBuffering(true);
        audioRef.current
          ?.play()
          .then(() => {
            setIsPlaying(true);
            setIsBuffering(false);
          })
          .catch((err) => {
            console.error('Playback resume failed:', err);
            setIsPlaying(false);
            setIsBuffering(false);
            setStreamError('تعذر استئناف البث، يرجى المحاولة مرة أخرى.');
          });
      }
      return;
    }

    // Changing station
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    setActiveStation(station);
    setIsBuffering(true);
    setIsPlaying(true);

    const audio = new Audio(station.url);
    audioRef.current = audio;

    audio.onwaiting = () => setIsBuffering(true);
    audio.onplaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
    };

    audio.onerror = () => {
      console.warn('Audio stream error for:', station.name);
      setIsPlaying(false);
      setIsBuffering(false);
      setStreamError(`تعذر الاتصال ببث "${station.name}" حالياً، قد يكون البث متوقفاً من المصدر.`);
    };

    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        setIsBuffering(false);
      })
      .catch((err) => {
        console.warn('Play error:', err);
        setIsBuffering(false);
        setIsPlaying(false);
        setStreamError('يرجى النقر على زر التشغيل مرة أخرى لبدء الصوت.');
      });
  };

  const stopActiveStation = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setActiveStation(null);
    setIsPlaying(false);
    setIsBuffering(false);
    setStreamError(null);
  };

  // Filtered stations with Arabic normalization & Category filtering
  const filteredStations = useMemo(() => {
    let list = stations;

    // 1. Category Filter
    if (selectedCategory === 'cairo') {
      list = list.filter((s) => {
        const n = normalizeArabic(s.name);
        return n.includes('قاهره') || n.includes('مصر');
      });
    } else if (selectedCategory === 'haramain') {
      list = list.filter((s) => {
        const n = normalizeArabic(s.name);
        return n.includes('مكه') || n.includes('مدينه') || n.includes('حرم') || n.includes('سعوديه');
      });
    } else if (selectedCategory === 'reciters') {
      const keywords = [
        'حصري', 'منشاوي', 'عبدالباسط', 'عبد الباسط', 'عفاسي', 'معيقلي', 
        'سديس', 'شريم', 'غامدي', 'عجمي', 'بنا', 'طبلاوي', 'رفعت', 
        'مصطفي اسماعيل', 'عبد الرشيد', 'الشاطري', 'الجهني'
      ];
      list = list.filter((s) => {
        const n = normalizeArabic(s.name);
        return keywords.some((k) => n.includes(k));
      });
    } else if (selectedCategory === 'quiet') {
      list = list.filter((s) => {
        const n = normalizeArabic(s.name);
        return n.includes('سكينه') || n.includes('رقيه') || n.includes('خاشع') || n.includes('تهجد');
      });
    } else if (selectedCategory === 'tafsir') {
      list = list.filter((s) => {
        const n = normalizeArabic(s.name);
        return n.includes('تفسير') || n.includes('فتاوي') || n.includes('سيره') || n.includes('حديث') || n.includes('دروس');
      });
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = normalizeArabic(searchQuery);
      list = list.filter((s) => normalizeArabic(s.name).includes(q));
    }

    return list;
  }, [stations, searchQuery, selectedCategory]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-32" dir="rtl">

      {/* Page Header */}
      <div className="text-center space-y-2 mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-primary-light text-white shadow-lg shadow-primary/20 mb-1 animate-in zoom-in-95">
          <RadioIcon size={32} />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center justify-center gap-2">
          <span>إذاعات القرآن الكريم</span>
        </h1>
        <p className="text-text-muted dark:text-text-darkMuted text-sm max-w-md mx-auto">
          بث مباشر على مدار 24 ساعة لأشهر الإذاعات الرسمية وكبار قراء العالم الإسلامي
        </p>
      </div>

      {/* Offline Alert */}
      {isOffline && (
        <Card className="p-4 bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 flex items-center gap-3 rounded-2xl shadow-sm">
          <WifiOff size={24} className="shrink-0 text-amber-600" />
          <p className="text-xs sm:text-sm font-semibold">
            أنت حالياً في الوضع غير المتصل بالإنترنت. يحتاج تشغيل البث المباشر للإذاعات إلى اتصال فعال بالإنترنت.
          </p>
        </Card>
      )}

      {/* Stream Error Alert */}
      {streamError && (
        <Card className="p-4 bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400 flex items-center justify-between gap-3 rounded-2xl animate-in fade-in shadow-sm">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
            <AlertCircle size={20} className="shrink-0 text-red-500" />
            <span>{streamError}</span>
          </div>
          <button
            onClick={() => setStreamError(null)}
            className="text-text-muted hover:text-text-main p-1 rounded-lg"
          >
            <X size={16} />
          </button>
        </Card>
      )}

      {/* Search Input Bar */}
      <div className="relative flex items-center w-full shadow-sm rounded-2xl bg-white dark:bg-card-dark border border-black/10 dark:border-white/10 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        <div className="absolute right-4 text-primary pointer-events-none">
          <Search size={22} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث عن إذاعة أو قارئ أو دولة (مثال: القاهرة، الحصري، العفاسي، مكة)..."
          className="w-full h-14 pr-12 pl-12 rounded-2xl bg-transparent text-sm md:text-base text-gray-900 dark:text-white placeholder:text-text-muted dark:placeholder:text-text-darkMuted focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute left-4 w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-text-muted hover:text-text-main transition-colors cursor-pointer"
            title="مسح البحث"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Quick Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                  : 'bg-white dark:bg-card-dark border border-black/5 dark:border-white/5 text-text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Stations Counter & Quick Reset */}
      <div className="flex items-center justify-between text-xs text-text-muted px-1">
        <span>
          تم العثور على <strong className="text-primary dark:text-primary-light font-mono font-bold">{filteredStations.length}</strong> إذاعة
        </span>
        {(searchQuery || selectedCategory !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="text-primary hover:underline flex items-center gap-1 font-bold cursor-pointer"
          >
            <RefreshCw size={12} />
            <span>عرض كافة الإذاعات</span>
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 text-primary gap-3">
          <Loader2 className="animate-spin" size={36} />
          <p className="text-xs text-text-muted font-bold">جاري تحميل وتحديث قائمة الإذاعات...</p>
        </div>
      ) : filteredStations.length === 0 ? (
        /* Empty State */
        <Card className="p-12 text-center space-y-4 rounded-3xl border-dashed border-2 border-black/10 dark:border-white/10">
          <div className="w-16 h-16 mx-auto rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-text-muted">
            <RadioIcon size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">لم يتم العثور على إذاعة مطابقة</h3>
            <p className="text-xs text-text-muted">
              {searchQuery ? `لا توجد إذاعة تحتوي على "${searchQuery}" في هذا التصنيف.` : 'لا توجد إذاعات في هذا التصنيف حالياً.'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="text-xs font-bold border-primary/30 text-primary"
          >
            إعادة تعيين البحث
          </Button>
        </Card>
      ) : (
        /* Stations Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredStations.map((station) => {
            const isActive = activeStation?.id === station.id;
            return (
              <Card
                key={station.id}
                className={`p-4 cursor-pointer border-2 transition-all rounded-2xl hover:scale-[1.01] active:scale-[0.99] ${
                  isActive
                    ? 'border-primary bg-primary/10 dark:bg-primary-dark/20 shadow-md ring-2 ring-primary/20'
                    : 'border-transparent hover:border-black/10 dark:hover:border-white/10 hover:shadow-sm'
                }`}
                onClick={() => togglePlay(station)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-sm ${
                        isActive
                          ? 'bg-primary text-white scale-105 shadow-primary/30'
                          : 'bg-black/5 dark:bg-white/5 text-primary hover:bg-primary/10'
                      }`}
                      title={isActive && isPlaying ? 'إيقاف مؤقت' : 'تشغيل الإذاعة'}
                    >
                      {isActive && isBuffering ? (
                        <Loader2 size={22} className="animate-spin text-white" />
                      ) : isActive && isPlaying ? (
                        <Pause size={22} />
                      ) : (
                        <Play size={22} className="mr-0.5 fill-current" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <span className={`font-bold text-sm md:text-base block truncate ${isActive ? 'text-primary dark:text-primary-light' : 'text-gray-900 dark:text-white'}`}>
                        {station.name}
                      </span>
                      <span className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive && isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} />
                        <span>{isActive && isPlaying ? 'يتم البث الآن 🟢' : 'بث إذاعي مباشر'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Live Equalizer Animation for active station */}
                  {isActive && isPlaying && !isBuffering && (
                    <div className="flex gap-1 items-end h-5 shrink-0 px-2">
                      <div className="w-1 bg-primary rounded-full animate-pulse h-full" />
                      <div className="w-1 bg-primary rounded-full animate-pulse h-2/3 delay-100" />
                      <div className="w-1 bg-primary rounded-full animate-pulse h-4/5 delay-200" />
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Floating Bottom Sticky Bar when an active station is running */}
      {activeStation && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:w-[460px] z-50 bg-white/95 dark:bg-[#1A2228]/95 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl border border-primary/30 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-md">
              <RadioIcon size={20} className={isPlaying ? 'animate-pulse' : ''} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-[10px] font-bold text-red-600 dark:text-red-400">مباشر الآن</span>
              </div>
              <p className="font-bold text-xs sm:text-sm truncate text-gray-900 dark:text-white">
                {activeStation.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => togglePlay(activeStation)}
              className="w-9 h-9 rounded-xl bg-primary hover:bg-primary-dark text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
              title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            >
              {isBuffering ? (
                <Loader2 size={16} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={16} />
              ) : (
                <Play size={16} className="mr-0.5 fill-current" />
              )}
            </button>

            <button
              onClick={stopActiveStation}
              className="w-9 h-9 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-red-500/10 text-text-muted hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer"
              title="إيقاف البث"
            >
              <StopCircle size={18} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
