import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Button } from '../components/ui/Button';
import { 
  BookOpen, Compass, Heart, Activity, Bookmark, Clock, 
  Radio, ShieldCheck, Play, ChevronLeft, Calendar 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../services/storage';
import type { LastRead } from '../services/storage';
import { quranApi } from '../services/quranApi';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [khatmahPlan, setKhatmahPlan] = useState<any>(null);
  const [dailyAyah, setDailyAyah] = useState<{text: string, surah: string}>({text: '', surah: ''});

  useEffect(() => {
    setLastRead(storage.getLastRead());
    const savedKhatmah = localStorage.getItem('khatmah_plan');
    if (savedKhatmah) {
      setKhatmahPlan(JSON.parse(savedKhatmah));
    }
    
    // Set a random daily ayah
    const loadDaily = async () => {
      const quran = await quranApi.getQuran();
      if (quran.length > 0) {
        const randomSurah = quran[Math.floor(Math.random() * 114)];
        const randomAyah = randomSurah.ayahs[Math.floor(Math.random() * randomSurah.ayahs.length)];
        setDailyAyah({
          text: randomAyah.text,
          surah: `${randomSurah.name} • الآية ${randomAyah.numberInSurah}`
        });
      }
    };
    loadDaily();
  }, []);

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

      {/* Daily Stats (Mini Dashboard) */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 flex items-center gap-4 bg-white dark:bg-card-dark border-0 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
            <span className="font-bold text-xl">14</span>
          </div>
          <div>
            <h3 className="font-bold">يومي</h3>
            <p className="text-xs text-text-muted">مواظبة 14 يوم</p>
          </div>
        </Card>
        
        <Card className="p-4 flex items-center gap-4 bg-amber-50 dark:bg-amber-900/10 border-0 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
            <span className="font-bold text-xl">🌙</span>
          </div>
          <div>
            <h3 className="font-bold text-amber-700 dark:text-amber-500">رمضان</h3>
            <p className="text-xs text-amber-600/70 dark:text-amber-500/70">المناسبة القادمة</p>
          </div>
        </Card>
      </div>

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
            <p className="font-quran text-xl text-gray-800 dark:text-gray-200">أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ</p>
          </Card>
          
          <Card className="p-6 bg-rose-50 dark:bg-rose-900/20 border-0 flex flex-col justify-center items-center text-center">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-500 font-bold mb-3">
              <Heart size={18} /> دعاء اليوم
            </div>
            <p className="font-quran text-xl text-gray-800 dark:text-gray-200">رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً</p>
          </Card>
        </div>
      </section>

      {/* Main Categories like Original App */}
      <section className="space-y-6">
        
        {/* Category: كل يوم */}
        <div>
          <h2 className="text-2xl font-bold border-r-4 border-primary pr-3 mb-4">كل يوم</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
            <button onClick={() => navigate('/prayer')} className="flex flex-col items-center justify-center p-4 md:p-6 bg-blue-500 text-white rounded-2xl shadow-md hover:scale-105 transition-all h-32 md:h-40 group">
              <Clock size={32} className="mb-2 md:mb-3 md:w-10 md:h-10 text-[#FCD34D] drop-shadow-md group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm md:text-base">مواقيت الصلاة</span>
            </button>
            <button onClick={() => navigate('/adhkar')} className="flex flex-col items-center justify-center p-4 md:p-6 bg-indigo-500 text-white rounded-2xl shadow-md hover:scale-105 transition-all h-32 md:h-40 group">
              <Heart size={32} className="mb-2 md:mb-3 md:w-10 md:h-10 text-[#FCD34D] drop-shadow-md group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm md:text-base">الأذكار</span>
            </button>
            <button onClick={() => navigate('/duas')} className="flex flex-col items-center justify-center p-4 md:p-6 bg-rose-500 text-white rounded-2xl shadow-md hover:scale-105 transition-all h-32 md:h-40 group">
              <Heart size={32} className="mb-2 md:mb-3 md:w-10 md:h-10 text-[#FCD34D] drop-shadow-md group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm md:text-base">الأدعية</span>
            </button>
          </div>
        </div>

        {/* Category: اسمع وسبح */}
        <div>
          <h2 className="text-2xl font-bold border-r-4 border-primary pr-3 mb-4">اسمع وسبح</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
            <button onClick={() => navigate('/quran')} className="flex flex-col items-center justify-center p-4 md:p-6 bg-emerald-500 text-white rounded-2xl shadow-md hover:scale-105 transition-all h-32 md:h-40 group">
              <BookOpen size={32} className="mb-2 md:mb-3 md:w-10 md:h-10 text-[#FCD34D] drop-shadow-md group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm md:text-base">القرآن</span>
            </button>
            <button onClick={() => navigate('/radio')} className="flex flex-col items-center justify-center p-4 md:p-6 bg-teal-500 text-white rounded-2xl shadow-md hover:scale-105 transition-all h-32 md:h-40 group">
              <Radio size={32} className="mb-2 md:mb-3 md:w-10 md:h-10 text-[#FCD34D] drop-shadow-md group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm md:text-base">الراديو</span>
            </button>
            <button onClick={() => navigate('/tasbih')} className="flex flex-col items-center justify-center p-4 md:p-6 bg-fuchsia-500 text-white rounded-2xl shadow-md hover:scale-105 transition-all h-32 md:h-40 group">
              <Activity size={32} className="mb-2 md:mb-3 md:w-10 md:h-10 text-[#FCD34D] drop-shadow-md group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm md:text-base">السبحة</span>
            </button>
          </div>
        </div>

        {/* Category: اقرأ وشاهد */}
        <div>
          <h2 className="text-2xl font-bold border-r-4 border-primary pr-3 mb-4">اقرأ وشاهد</h2>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <button onClick={() => navigate('/hadith')} className="flex flex-col items-center justify-center p-6 bg-amber-700 text-white rounded-2xl shadow-md hover:scale-105 transition-all h-32 md:h-40 group">
              <BookOpen size={36} className="mb-3 md:w-12 md:h-12 text-[#FCD34D] drop-shadow-md group-hover:scale-110 transition-transform" />
              <span className="font-bold text-lg md:text-xl">الأحاديث</span>
            </button>
            <button onClick={() => navigate('/stories')} className="flex flex-col items-center justify-center p-6 bg-slate-600 text-white rounded-2xl shadow-md hover:scale-105 transition-all h-32 md:h-40 group">
              <Bookmark size={36} className="mb-3 md:w-12 md:h-12 text-[#FCD34D] drop-shadow-md group-hover:scale-110 transition-transform" />
              <span className="font-bold text-lg md:text-xl">قصص القرآن</span>
            </button>
          </div>
        </div>

        {/* Category: حين تحتاجها */}
        <div>
          <h2 className="text-2xl font-bold border-r-4 border-primary pr-3 mb-4">حين تحتاجها</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
            <button onClick={() => navigate('/qibla')} className="flex flex-col items-center justify-center p-4 md:p-6 bg-orange-500 text-white rounded-2xl shadow-md hover:scale-105 transition-all h-32 md:h-40 group">
              <Compass size={32} className="mb-2 md:mb-3 md:w-10 md:h-10 text-[#FCD34D] drop-shadow-md group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm md:text-base">القبلة</span>
            </button>
            <button onClick={() => navigate('/ruqyah')} className="flex flex-col items-center justify-center p-4 md:p-6 bg-cyan-600 text-white rounded-2xl shadow-md hover:scale-105 transition-all h-32 md:h-40 group">
              <ShieldCheck size={32} className="mb-2 md:mb-3 md:w-10 md:h-10 text-[#FCD34D] drop-shadow-md group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm md:text-base">الرقية الشرعية</span>
            </button>
            <button onClick={() => navigate('/khatmah')} className="flex flex-col items-center justify-center p-4 md:p-6 bg-primary text-white rounded-2xl shadow-md hover:scale-105 transition-all h-32 md:h-40 group">
              <BookOpen size={32} className="mb-2 md:mb-3 md:w-10 md:h-10 text-[#FCD34D] drop-shadow-md group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm md:text-base">خطة الختمة</span>
            </button>
          </div>
        </div>

      </section>

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
