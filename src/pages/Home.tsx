import React, { useEffect, useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  BookOpen, Compass, Heart, Activity, Bookmark, Clock,
  Radio, ShieldCheck, ChevronLeft, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../services/storage';
import type { LastRead } from '../services/storage';
import { quranApi } from '../services/quranApi';
import { prayerApi } from '../services/prayerApi';
import type { PrayerTimes } from '../services/prayerApi';
import { notificationService } from '../services/notificationService';

const DAILY_DHIKRS = [
  "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ",
  "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
  "سُبْحَانَ اللَّهِ الْعَظِيمِ",
  "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
  "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
  "الْحَمْدُ لِلَّهِ حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ",
  "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ",
  "سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ",
  "لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ",
  "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ"
];

const DAILY_DUAS = [
  "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
  "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ",
  "يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ",
  "رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ",
  "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي",
  "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا",
  "اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ",
  "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي",
  "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى",
  "رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ"
];

const getDayOfYear = (): number => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

const parsePrayerTime = (timeStr: string, date: Date = new Date()): Date => {
  if (!timeStr) return new Date();
  // Strip timezone suffix like "(EEST)" or "(EST)" safely
  const cleanTime = timeStr.split(' ')[0].trim();
  const parts = cleanTime.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  const parsed = new Date(date);
  parsed.setHours(hours, minutes, 0, 0);
  return parsed;
};

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [dailyAyah, setDailyAyah] = useState<{ text: string, surah: string }>({ text: '', surah: '' });
  const [dhikrOfDay, setDhikrOfDay] = useState('');
  const [duaOfDay, setDuaOfDay] = useState('');
  const [alertsEnabled, setAlertsEnabled] = useState(() => notificationService.isEnabled());

  // Dynamic Prayer Timer State
  const [prayerTimings, setPrayerTimings] = useState<PrayerTimes | null>(null);
  const [nowDate, setNowDate] = useState(() => new Date());

  // Modal states
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showRamadanModal, setShowRamadanModal] = useState(false);
  const [ramadanCountdown, setRamadanCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // 1-second continuous live clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setNowDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch prayer timings on mount
  useEffect(() => {
    setLastRead(storage.getLastRead());

    const dayIndex = getDayOfYear();
    setDhikrOfDay(DAILY_DHIKRS[dayIndex % DAILY_DHIKRS.length]);
    setDuaOfDay(DAILY_DUAS[dayIndex % DAILY_DUAS.length]);

    notificationService.checkAndTriggerReminder();

    const fetchTimings = async () => {
      try {
        const useLocation = localStorage.getItem('prayer_use_location') !== 'false';
        const selectedCity = localStorage.getItem('prayer_selected_city') || 'Makkah';
        const cityCountry: Record<string, string> = {
          Makkah: 'SA',
          Madinah: 'SA',
          Cairo: 'EG',
          Dubai: 'AE',
          Amman: 'JO',
          Riyadh: 'SA',
        };

        const cachedLat = localStorage.getItem('prayer_lat');
        const cachedLng = localStorage.getItem('prayer_lng');

        let timings: PrayerTimes | null = null;
        if (useLocation && cachedLat && cachedLng) {
          timings = await prayerApi.getTimingsByCoordinates(Number(cachedLat), Number(cachedLng));
        } else {
          timings = await prayerApi.getTimingsByCity(selectedCity, cityCountry[selectedCity] || 'SA');
        }
        setPrayerTimings(timings);
      } catch (error) {
        console.error('Failed to load prayer timings:', error);
      }
    };

    fetchTimings();

    // Ramadan countdown logic
    const updateCountdown = () => {
      const now = new Date().getTime();
      let targetDate = new Date('2027-02-07T00:00:00').getTime();
      if (now > targetDate) {
        targetDate = new Date('2028-01-28T00:00:00').getTime();
      }
      const diff = targetDate - now;

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setRamadanCountdown({ days, hours, minutes, seconds });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    // Set a random daily ayah
    const loadDaily = async () => {
      try {
        const randomSurahNum = Math.floor(Math.random() * 114) + 1;
        const randomSurah = await quranApi.getSurah(randomSurahNum);
        if (randomSurah && randomSurah.ayahs.length > 0) {
          const randomAyah = randomSurah.ayahs[Math.floor(Math.random() * randomSurah.ayahs.length)];
          setDailyAyah({
            text: randomAyah.text,
            surah: `${randomSurah.name} • الآية ${randomAyah.numberInSurah}`
          });
        }
      } catch (error) {
        console.error("Failed to load daily ayah:", error);
      }
    };
    loadDaily();

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Compute next prayer and countdown dynamically every 1s
  const prayerData = useMemo(() => {
    if (!prayerTimings) return null;

    const prayers = [
      { name: 'الفجر', time: prayerTimings.Fajr },
      { name: 'الظهر', time: prayerTimings.Dhuhr },
      { name: 'العصر', time: prayerTimings.Asr },
      { name: 'المغرب', time: prayerTimings.Maghrib },
      { name: 'العشاء', time: prayerTimings.Isha },
    ];

    let nextPrayerItem: { name: string; time: string } | null = null;
    let isTomorrow = false;

    for (const prayer of prayers) {
      const prayerDate = parsePrayerTime(prayer.time, nowDate);
      if (prayerDate > nowDate) {
        nextPrayerItem = prayer;
        break;
      }
    }

    if (!nextPrayerItem) {
      nextPrayerItem = { name: 'الفجر', time: prayers[0].time };
      isTomorrow = true;
    }

    const targetDate = parsePrayerTime(nextPrayerItem.time, nowDate);
    if (isTomorrow) {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    const remainingMs = Math.max(0, targetDate.getTime() - nowDate.getTime());
    const totalSeconds = Math.floor(remainingMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const schedule = prayers.map((p) => ({
      name: p.name,
      time: p.time,
      active: p.name === nextPrayerItem!.name
    }));

    return {
      nextPrayer: {
        name: nextPrayerItem.name,
        time: nextPrayerItem.time,
        hours,
        minutes,
        seconds
      },
      schedule
    };
  }, [prayerTimings, nowDate]);

  const toggleNotifications = async () => {
    if (alertsEnabled) {
      notificationService.setEnabled(false);
      setAlertsEnabled(false);
    } else {
      const granted = await notificationService.requestPermission();
      if (granted) {
        notificationService.setEnabled(true);
        setAlertsEnabled(true);
        notificationService.showNotification(
          "تم تفعيل التنبيهات بنجاح! 🎉",
          "سنقوم بتذكيرك بمواعيد أذكار الصباح والمساء يومياً إن شاء الله.",
          "/adhkar"
        );
      } else {
        alert("يرجى السماح بالتنبيهات من إعدادات المتصفح أولاً.");
      }
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">

      {/* Header section */}
      <section className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary dark:text-primary-light">
            السلام عليكم
          </h1>
          <p className="text-text-muted dark:text-text-darkMuted text-sm flex items-center gap-1 mt-1">
            <Calendar size={14} />
            {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg bg-black/5 dark:bg-white/5 overflow-hidden border border-primary/20">
          <img src="/logo.png" alt="Huda Logo" className="w-full h-full object-cover" />
        </div>
      </section>

      {prayerData?.nextPrayer && (
        <div className="rounded-[28px] border border-primary/30 bg-gradient-to-br from-[#0f2e28] via-[#143a32] to-[#0c221e] p-5 shadow-2xl relative overflow-hidden" dir="rtl">
          {/* Background glow highlights */}
          <div className="absolute -top-12 -left-12 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header Tag */}
          <div className="flex justify-center mb-3 relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-xs font-bold text-primary-light backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              الصلاة القادمة
            </span>
          </div>

          {/* Title */}
          <div className="text-center mb-5 relative z-10">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white font-quran tracking-wide">
              صلاة <span className="text-primary-light drop-shadow-sm">{prayerData.nextPrayer.name}</span>
            </h3>
            <p className="mt-1.5 text-xs text-white/80 font-sans">متبقي على الأذان</p>
          </div>

          {/* Live Dynamic Countdown */}
          <div className="grid grid-cols-3 gap-3 mb-6 relative z-10" dir="rtl">
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md p-3 text-center transition-all hover:border-primary/40">
              <div className="text-3xl font-extrabold text-white font-mono">{String(prayerData.nextPrayer.hours).padStart(2, '0')}</div>
              <div className="mt-1 text-xs font-bold text-primary-light">ساعة</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md p-3 text-center transition-all hover:border-primary/40">
              <div className="text-3xl font-extrabold text-white font-mono">{String(prayerData.nextPrayer.minutes).padStart(2, '0')}</div>
              <div className="mt-1 text-xs font-bold text-primary-light">دقيقة</div>
            </div>
            <div className="rounded-2xl border border-primary/50 bg-primary/15 backdrop-blur-md p-3 text-center transition-all ring-1 ring-primary/30">
              <div className="text-3xl font-extrabold text-primary-light font-mono">{String(prayerData.nextPrayer.seconds).padStart(2, '0')}</div>
              <div className="mt-1 text-xs font-bold text-primary-light">ثانية</div>
            </div>
          </div>

          {/* Bottom Prayer Schedule */}
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-2.5 border border-white/10 flex items-center justify-between gap-1 relative z-10" dir="rtl">
            {prayerData.schedule.map((prayer) => (
              <div
                key={prayer.name}
                className={`flex flex-col items-center gap-1 flex-1 py-1.5 px-1 rounded-xl transition-all ${prayer.active
                    ? 'bg-primary/25 border border-primary/50 text-primary-light font-bold scale-105 shadow-md'
                    : 'text-white/70 hover:text-white'
                  }`}
              >
                <div className={`h-2 w-2 rounded-full ${prayer.active ? 'bg-primary animate-ping' : 'bg-white/30'}`} />
                <span className="font-bold text-[11px]">{prayer.name}</span>
                <span className="text-[10px] opacity-80 font-mono" dir="ltr">{prayer.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Stats (Mini Dashboard) */}
      <div className="grid grid-cols-2 gap-4">
        <Card
          className="p-4 flex items-center gap-4 bg-white dark:bg-card-dark border-0 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all group"
          onClick={() => setShowStreakModal(true)}
        >
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <span className="font-bold text-xl">14</span>
          </div>
          <div>
            <h3 className="font-bold flex items-center gap-1">
              <span>يومي</span>
              <ChevronLeft size={14} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-text-muted">مواظبة 14 يوم</p>
          </div>
        </Card>

        <Card
          className="p-4 flex items-center gap-4 bg-amber-50 dark:bg-amber-900/10 border-0 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all group"
          onClick={() => setShowRamadanModal(true)}
        >
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
            <span className="font-bold text-xl">🌙</span>
          </div>
          <div>
            <h3 className="font-bold text-amber-700 dark:text-amber-500 flex items-center gap-1">
              <span>رمضان</span>
              <ChevronLeft size={14} className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-amber-600/70 dark:text-amber-500/70">المناسبة القادمة</p>
          </div>
        </Card>
      </div>

      {/* Active Time Adhkar Banner (Morning or Evening) */}
      {(() => {
        const hour = new Date().getHours();
        const isMorningTime = hour >= 6 && hour < 11;
        const isEveningTime = hour >= 16 && hour < 20;

        if (isMorningTime) {
          return (
            <Card
              className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30 flex items-center justify-between shadow-sm cursor-pointer hover:border-amber-500/60 transition-all"
              onClick={() => navigate('/adhkar/morning?autoplay=true')}
            >
              <div className="flex items-center gap-3 text-right" dir="rtl">
                <span className="text-3xl animate-bounce">☀️</span>
                <div>
                  <h3 className="font-bold text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <span>حان الآن موعد أذكار الصباح</span>
                  </h3>
                  <p className="text-xs font-quran text-gray-700 dark:text-gray-300 mt-0.5">
                    «أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ...»
                  </p>
                </div>
              </div>
              <Button size="sm" variant="primary" className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 gap-1 text-xs shadow">
                <span>استمع الآن</span>
                <span>🎧</span>
              </Button>
            </Card>
          );
        }

        if (isEveningTime) {
          return (
            <Card
              className="p-4 bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-transparent border-indigo-500/30 flex items-center justify-between shadow-sm cursor-pointer hover:border-indigo-500/60 transition-all"
              onClick={() => navigate('/adhkar/evening?autoplay=true')}
            >
              <div className="flex items-center gap-3 text-right" dir="rtl">
                <span className="text-3xl animate-pulse">🌙</span>
                <div>
                  <h3 className="font-bold text-sm text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                    <span>حان الآن موعد أذكار المساء</span>
                  </h3>
                  <p className="text-xs font-quran text-gray-700 dark:text-gray-300 mt-0.5">
                    «أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ...»
                  </p>
                </div>
              </div>
              <Button size="sm" variant="primary" className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 gap-1 text-xs shadow">
                <span>استمع الآن</span>
                <span>🎧</span>
              </Button>
            </Card>
          );
        }

        return null;
      })()}

      {/* Notification Toggle Card */}
      <Card className="p-4 bg-primary/10 dark:bg-primary-dark/20 border border-primary/20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 text-right" dir="rtl">
          <span className="text-2xl">🔔</span>
          <div>
            <h3 className="font-bold text-sm text-primary dark:text-primary-light">تنبيهات الأذكار التلقائية</h3>
            <p className="text-xs text-text-muted">تنبيه يومي بمواعيد أذكار الصباح والمساء</p>
          </div>
        </div>
        <button
          onClick={toggleNotifications}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${alertsEnabled
            ? 'bg-primary text-white hover:bg-primary-dark'
            : 'bg-black/10 dark:bg-white/10 text-text-muted hover:bg-black/20 dark:hover:bg-white/20'
            }`}
        >
          {alertsEnabled ? 'مفعلة' : 'تفعيل'}
        </button>
      </Card>

      {/* Daily Highlights (إشراقات اليوم) */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold border-r-4 border-primary pr-3">إشراقات اليوم</h2>

        <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-0">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-500 mb-4 font-bold">
            <BookOpen size={20} /> آية من القرآن
          </div>
          <p className="font-quran text-2xl leading-loose text-center text-gray-800 dark:text-gray-200">
            {dailyAyah.text || 'جاري التحميل...'}
          </p>
          <p className="text-center text-sm text-text-muted mt-4">{dailyAyah.surah}</p>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-6 bg-cyan-50 dark:bg-cyan-900/20 border-0 flex flex-col justify-center items-center text-center">
            <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-500 font-bold mb-3">
              <CheckCircle size={18} /> ذكر اليوم
            </div>
            <p className="font-quran text-xl text-gray-800 dark:text-gray-200">{dhikrOfDay || 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ'}</p>
          </Card>

          <Card className="p-6 bg-rose-50 dark:bg-rose-900/20 border-0 flex flex-col justify-center items-center text-center">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-500 font-bold mb-3">
              <Heart size={18} /> دعاء اليوم
            </div>
            <p className="font-quran text-xl text-gray-800 dark:text-gray-200">{duaOfDay || 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً'}</p>
          </Card>
        </div>
      </section>

      {/* Main Categories like Reference App */}
      <section className="space-y-8" dir="rtl">

        {/* Category: كل يوم */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-6 rounded-full bg-primary" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">كل يوم</h2>
          </div>
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <button
              onClick={() => navigate('/duas')}
              className="relative flex flex-col justify-between p-3.5 md:p-5 rounded-[26px] bg-gradient-to-br from-[#ff3a75] via-[#ff4d84] to-[#f42b67] text-white shadow-lg shadow-pink-500/20 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 group overflow-hidden h-32 md:h-36"
            >
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
              <div className="self-end w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-inner group-hover:bg-white/30 transition-all">
                <Heart size={20} className="text-white drop-shadow" />
              </div>
              <span className="font-bold text-sm md:text-base text-white text-right drop-shadow-sm">الأدعية</span>
            </button>

            <button
              onClick={() => navigate('/adhkar')}
              className="relative flex flex-col justify-between p-3.5 md:p-5 rounded-[26px] bg-gradient-to-br from-[#6b72e6] via-[#757ce8] to-[#595fd9] text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 group overflow-hidden h-32 md:h-36"
            >
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
              <div className="self-end w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-inner group-hover:bg-white/30 transition-all">
                <Bookmark size={20} className="text-white drop-shadow" />
              </div>
              <span className="font-bold text-sm md:text-base text-white text-right drop-shadow-sm">الأذكار</span>
            </button>

            <button
              onClick={() => navigate('/prayer')}
              className="relative flex flex-col justify-between p-3.5 md:p-5 rounded-[26px] bg-gradient-to-br from-[#2c8be7] via-[#3a96f0] to-[#1e7ad6] text-white shadow-lg shadow-blue-500/20 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 group overflow-hidden h-32 md:h-36"
            >
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
              <div className="self-end w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-inner group-hover:bg-white/30 transition-all">
                <Clock size={20} className="text-white drop-shadow" />
              </div>
              <span className="font-bold text-sm md:text-base text-white text-right drop-shadow-sm">مواقيت الصلاة</span>
            </button>
          </div>
        </div>

        {/* Category: اسمع وسبح */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-6 rounded-full bg-primary" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">اسمع وسبّح</h2>
          </div>
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <button
              onClick={() => navigate('/tasbih')}
              className="relative flex flex-col justify-between p-3.5 md:p-5 rounded-[26px] bg-gradient-to-br from-[#bd59d4] via-[#c664dd] to-[#ab42c4] text-white shadow-lg shadow-purple-500/20 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 group overflow-hidden h-32 md:h-36"
            >
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
              <div className="self-end w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-inner group-hover:bg-white/30 transition-all">
                <Activity size={20} className="text-white drop-shadow" />
              </div>
              <span className="font-bold text-sm md:text-base text-white text-right drop-shadow-sm">السبحة</span>
            </button>

            <button
              onClick={() => navigate('/radio')}
              className="relative flex flex-col justify-between p-3.5 md:p-5 rounded-[26px] bg-gradient-to-br from-[#38bfa7] via-[#42c9b1] to-[#25a891] text-white shadow-lg shadow-teal-500/20 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 group overflow-hidden h-32 md:h-36"
            >
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
              <div className="self-end w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-inner group-hover:bg-white/30 transition-all">
                <Radio size={20} className="text-white drop-shadow" />
              </div>
              <span className="font-bold text-sm md:text-base text-white text-right drop-shadow-sm">الراديو</span>
            </button>

            <button
              onClick={() => navigate('/quran')}
              className="relative flex flex-col justify-between p-3.5 md:p-5 rounded-[26px] bg-gradient-to-br from-[#1696ab] via-[#20a1b6] to-[#0f8092] text-white shadow-lg shadow-cyan-500/20 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 group overflow-hidden h-32 md:h-36"
            >
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
              <div className="self-end w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-inner group-hover:bg-white/30 transition-all">
                <BookOpen size={20} className="text-white drop-shadow" />
              </div>
              <span className="font-bold text-sm md:text-base text-white text-right drop-shadow-sm">القُراء</span>
            </button>
          </div>
        </div>

        {/* Category: اقرأ وشاهد */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-6 rounded-full bg-primary" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">اقرأ وشاهد</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <button
              onClick={() => navigate('/hadith')}
              className="relative flex flex-col justify-between p-4 md:p-5 rounded-[26px] bg-gradient-to-br from-[#d97706] via-[#f59e0b] to-[#b45309] text-white shadow-lg shadow-amber-500/20 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 group overflow-hidden h-32 md:h-36"
            >
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
              <div className="self-end w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-inner group-hover:bg-white/30 transition-all">
                <BookOpen size={20} className="text-white drop-shadow" />
              </div>
              <span className="font-bold text-base md:text-lg text-white text-right drop-shadow-sm">الأحاديث النبوية</span>
            </button>

            <button
              onClick={() => navigate('/stories')}
              className="relative flex flex-col justify-between p-4 md:p-5 rounded-[26px] bg-gradient-to-br from-[#8b5cf6] via-[#a855f7] to-[#7c3aed] text-white shadow-lg shadow-purple-500/20 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 group overflow-hidden h-32 md:h-36"
            >
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
              <div className="self-end w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-inner group-hover:bg-white/30 transition-all">
                <Bookmark size={20} className="text-white drop-shadow" />
              </div>
              <span className="font-bold text-base md:text-lg text-white text-right drop-shadow-sm">قصص القرآن</span>
            </button>
          </div>
        </div>

        {/* Category: حين تحتاجها */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-6 rounded-full bg-primary" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">حين تحتاجها</h2>
          </div>
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <button
              onClick={() => navigate('/ruqyah')}
              className="relative flex flex-col justify-between p-3.5 md:p-5 rounded-[26px] bg-gradient-to-br from-[#16b59b] via-[#20c0a6] to-[#0fa28a] text-white shadow-lg shadow-teal-500/20 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 group overflow-hidden h-32 md:h-36"
            >
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
              <div className="self-end w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-inner group-hover:bg-white/30 transition-all">
                <ShieldCheck size={20} className="text-white drop-shadow" />
              </div>
              <span className="font-bold text-sm md:text-base text-white text-right drop-shadow-sm">الرقية الشرعية</span>
            </button>

            <button
              onClick={() => navigate('/qibla')}
              className="relative flex flex-col justify-between p-3.5 md:p-5 rounded-[26px] bg-gradient-to-br from-[#ff794d] via-[#ff865c] to-[#f26031] text-white shadow-lg shadow-orange-500/20 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 group overflow-hidden h-32 md:h-36"
            >
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
              <div className="self-end w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-inner group-hover:bg-white/30 transition-all">
                <Compass size={20} className="text-white drop-shadow" />
              </div>
              <span className="font-bold text-sm md:text-base text-white text-right drop-shadow-sm">القبلة</span>
            </button>

            <button
              onClick={() => navigate('/about')}
              className="relative flex flex-col justify-between p-3.5 md:p-5 rounded-[26px] bg-gradient-to-br from-[#3ea647] via-[#49b352] to-[#2e9437] text-white shadow-lg shadow-green-500/20 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 group overflow-hidden h-32 md:h-36"
            >
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />
              <div className="self-end w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-inner group-hover:bg-white/30 transition-all">
                <Heart size={20} className="text-white drop-shadow" />
              </div>
              <span className="font-bold text-sm md:text-base text-white text-right drop-shadow-sm">صدقة جارية</span>
            </button>
          </div>
        </div>

      </section>

      {/* Support & Developer Banner Card */}
      <Card
        className="p-5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 cursor-pointer hover:border-primary/50 transition-all"
        onClick={() => navigate('/about')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 shadow-inner">
              <Heart size={24} className="fill-rose-500/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-primary dark:text-primary-light">عن المطور والدعم (صدقة جارية)</h3>
              </div>
              <p className="text-xs text-text-muted mt-0.5 font-sans">
                تعرف على م. رحاب كمال مطورة المنصة وساهم في استمرار وتطوير الموقع
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-primary">
            <ChevronLeft size={20} />
          </Button>
        </div>
      </Card>

      {/* Continue Reading Card (Moved to bottom like screenshot) */}
      <Card className="bg-primary-dark text-white border-0 shadow-lg cursor-pointer" onClick={() => lastRead ? navigate(`/quran/read/${lastRead.surah}`) : navigate(`/quran`)}>
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm mb-1">متابعة القراءة</p>
            <h3 className="font-bold text-lg">{lastRead ? `سورة ${lastRead.surahName}` : 'ابدأ القراءة الآن'}</h3>
            <p className="text-white/50 text-xs mt-1">{lastRead ? `صفحة ${lastRead.ayah}` : 'اجعل القرآن رفيقك'}</p>
          </div>
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <ChevronLeft size={24} />
          </div>
        </div>
      </Card>

      {/* Streak Modal (مواظبة 14 يوم) */}
      {showStreakModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowStreakModal(false)}>
          <div className="bg-white dark:bg-card-dark rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-primary/20" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between border-b pb-4 border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-emerald-500/30">
                  🔥
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">سجل المواظبة اليومية</h3>
                  <p className="text-xs text-text-muted">أنت مواظب منذ 14 يوماً متتالية!</p>
                </div>
              </div>
              <button onClick={() => setShowStreakModal(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                ✕
              </button>
            </div>

            {/* Streak Grid (Last 14 days) */}
            <div>
              <h4 className="text-sm font-bold mb-3 text-gray-700 dark:text-gray-300">أيام المواظبة الـ 14 الأخيرة:</h4>
              <div className="grid grid-cols-7 gap-2 text-center">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      ✓
                    </div>
                    <span className="text-[10px] text-text-muted">يوم {i + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="space-y-3 bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-500/20">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">📖 القراءة اليومية:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">مكتملة ✨</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">📿 أذكار الصباح والمساء:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">مكتملة ✨</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">⏱️ إجمالي دقائق العبادة:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">45 دقيقة / يوم</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setShowStreakModal(false); navigate('/khatmah'); }}>
                متابعة الختمة 📖
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => { setShowStreakModal(false); navigate('/adhkar'); }}>
                قراءة الأذكار 📿
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Ramadan Modal (رمضان - المناسبة القادمة) */}
      {showRamadanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowRamadanModal(false)}>
          <div className="bg-white dark:bg-card-dark rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-amber-500/30" onClick={(e) => e.stopPropagation()} dir="rtl">

            <div className="flex items-center justify-between border-b pb-4 border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-amber-500/30 animate-pulse">
                  🌙
                </div>
                <div>
                  <h3 className="font-bold text-lg text-amber-700 dark:text-amber-400">العد التنازلي لرمضان المبارك</h3>
                  <p className="text-xs text-text-muted">اللهم بلغنا رمضان ووفقنا فيه للصيام والقيام</p>
                </div>
              </div>
              <button onClick={() => setShowRamadanModal(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                ✕
              </button>
            </div>

            {/* Ramadan Countdown Banner */}
            <div className="bg-gradient-to-br from-amber-500 to-amber-700 text-white p-6 rounded-2xl text-center space-y-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 bottom-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)] pointer-events-none" />
              <p className="text-xs text-amber-100 font-bold">المتبقي على بداية شهر رمضان المبارك (1448 هـ):</p>

              <div className="grid grid-cols-4 gap-2">
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl">
                  <span className="block text-2xl font-bold font-mono">{ramadanCountdown.days}</span>
                  <span className="text-[10px] text-amber-100">يوم</span>
                </div>
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl">
                  <span className="block text-2xl font-bold font-mono">{ramadanCountdown.hours}</span>
                  <span className="text-[10px] text-amber-100">ساعة</span>
                </div>
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl">
                  <span className="block text-2xl font-bold font-mono">{ramadanCountdown.minutes}</span>
                  <span className="text-[10px] text-amber-100">دقيقة</span>
                </div>
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl">
                  <span className="block text-2xl font-bold font-mono">{ramadanCountdown.seconds}</span>
                  <span className="text-[10px] text-amber-100">ثانية</span>
                </div>
              </div>
            </div>

            {/* Upcoming Islamic Occasions */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">المناسبات الإسلامية القادمة:</h4>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-500/20 flex items-center justify-between">
                  <span className="font-bold text-amber-800 dark:text-amber-300">🌙 شهر رمضان المبارك</span>
                  <span className="text-amber-600 dark:text-amber-400">1 رمضان 1448 هـ</span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                  <span className="font-bold text-gray-700 dark:text-gray-300">🕌 عيد الفطر المبارك</span>
                  <span className="text-text-muted">1 شوال 1448 هـ</span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                  <span className="font-bold text-gray-700 dark:text-gray-300">🏔️ يوم عرفة</span>
                  <span className="text-text-muted">9 ذو الحجة 1448 هـ</span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                  <span className="font-bold text-gray-700 dark:text-gray-300">🕋 عيد الأضحى المبارك</span>
                  <span className="text-text-muted">10 ذو الحجة 1448 هـ</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white" onClick={() => { setShowRamadanModal(false); navigate('/khatmah'); }}>
                تجهيز الختمة لرمضان 📖
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => setShowRamadanModal(false)}>
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

// CheckCircle Icon definition (missing in original imports)
const CheckCircle = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);
