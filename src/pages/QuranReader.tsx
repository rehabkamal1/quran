import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Play, Pause, Settings, ChevronRight, ChevronLeft, Bookmark, BookOpen, Share2, Check, Repeat, Disc } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { quranApi } from '../services/quranApi';
import type { SurahData, Ayah, TafsirData } from '../services/quranApi';
import { audioService, RECITERS } from '../services/audioService';
import { storage } from '../services/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalPlayer } from '../context/GlobalPlayerContext';

export const QuranReader: React.FC = () => {
  const { surahId } = useParams();
  const navigate = useNavigate();
  
  const [surah, setSurah] = useState<SurahData | null>(null);
  const [tafsir, setTafsir] = useState<TafsirData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [expandedTafsir, setExpandedTafsir] = useState<number | null>(null);
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<string[]>([]);
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
  
  const [showReciterMenu, setShowReciterMenu] = useState(false);
  const [currentReciter, setCurrentReciter] = useState(() => audioService.getReciter());
  
  const readerRef = useRef<HTMLDivElement>(null);

  // Global Player Context for Background Playback & Full Surah
  const { 
    isPlaying, 
    surahNumber: globalSurahNumber, 
    activeAyahNumber, 
    isFullSurahMode, 
    isRepeating, 
    playFullSurah, 
    playAyah, 
    togglePlayPause,
    toggleRepeat 
  } = useGlobalPlayer();

  useEffect(() => {
    const loadData = async () => {
      if (!surahId) return;
      setLoading(true);
      const surahData = await quranApi.getSurah(parseInt(surahId));
      const tafsirData = await quranApi.getTafsir(parseInt(surahId));
      
      setSurah(surahData);
      setTafsir(tafsirData);
      
      const bks = storage.getBookmarks().map(b => b.id);
      setBookmarkedAyahs(bks);
      
      setLoading(false);
    };
    loadData();
  }, [surahId]);

  useEffect(() => {
    if (!surah) return;
    const handleScroll = () => {
      if (!readerRef.current) return;
      storage.saveLastRead({
        surah: surah.number,
        ayah: 1,
        surahName: surah.name
      });
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [surah]);

  const changeReciter = (reciterId: string) => {
    audioService.setReciter(reciterId);
    setCurrentReciter(reciterId);
    setShowReciterMenu(false);
    
    // If currently playing in this surah, restart playback with the new reciter!
    if (surah) {
      if (isFullSurahMode) {
        playFullSurah(surah.number, surah.name, reciterId);
      } else if (activeAyahNumber) {
        const ayah = surah.ayahs.find(a => a.numberInSurah === activeAyahNumber);
        if (ayah) playAyah(surah.number, surah.name, ayah, surah.ayahs, reciterId);
      }
    }
  };

  const handleBookmark = (ayah: Ayah) => {
    if (!surah) return;
    const id = `${surah.number}-${ayah.numberInSurah}`;
    if (storage.isBookmarked(id)) {
      storage.removeBookmark(id);
      setBookmarkedAyahs(prev => prev.filter(b => b !== id));
    } else {
      storage.addBookmark({
        id,
        surah: surah.number,
        ayah: ayah.numberInSurah,
        surahName: surah.name,
        text: ayah.text,
        dateAdded: new Date().toISOString()
      });
      setBookmarkedAyahs(prev => [...prev, id]);
    }
  };

  const toggleTafsir = (ayahNumber: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTafsir(expandedTafsir === ayahNumber ? null : ayahNumber);
  };

  const handleShare = (text: string, surahName: string, ayahNumber: number) => {
    const shareText = `«${text}»\n[سورة ${surahName} - آية ${ayahNumber}]`;
    navigator.clipboard.writeText(shareText);
    setCopiedAyah(ayahNumber);
    setTimeout(() => setCopiedAyah(null), 2000);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">جاري تحميل السورة...</div>;
  }

  if (!surah) {
    return <div className="flex items-center justify-center h-screen">السورة غير موجودة</div>;
  }

  const isCurrentSurahActive = globalSurahNumber === surah.number;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28">
      
      {/* Sticky Header */}
      <div className="sticky top-0 md:top-20 z-40 bg-background/95 dark:bg-background-dark/95 backdrop-blur-md py-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate('/quran')}>
          <ChevronRight size={24} />
        </Button>
        <div className="text-center">
          <h2 className="font-bold font-quran text-xl text-primary dark:text-primary-light">{surah.name}</h2>
          <p className="text-xs text-text-muted">
            {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {surah.ayahs.length} آيات
          </p>
        </div>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      {/* Full Surah Play Bar */}
      <Card className="p-4 bg-gradient-to-r from-emerald-500/10 via-primary/10 to-transparent border-primary/20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 text-right" dir="rtl">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-md">
            <Disc size={20} className={isCurrentSurahActive && isFullSurahMode && isPlaying ? 'animate-spin' : ''} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-primary dark:text-primary-light">تشغيل السورة كاملة 🎧</h3>
            <p className="text-xs text-text-muted">استماع متواصل للسورة كاملة بدون انقطاع</p>
          </div>
        </div>
        <Button 
          size="sm" 
          variant="primary" 
          className="bg-primary hover:bg-primary-dark text-white text-xs gap-1.5 shadow"
          onClick={() => {
            if (isCurrentSurahActive && isFullSurahMode) {
              togglePlayPause();
            } else {
              playFullSurah(surah.number, surah.name, currentReciter);
            }
          }}
        >
          {isCurrentSurahActive && isFullSurahMode && isPlaying ? <Pause size={16} /> : <Play size={16} />}
          <span>{isCurrentSurahActive && isFullSurahMode && isPlaying ? 'إيقاف مؤقت' : 'تشغيل كامل السورة'}</span>
        </Button>
      </Card>

      {/* Bismillah Header Card */}
      {surah.number !== 1 && surah.number !== 9 && (
        <div className="text-center py-6 text-primary dark:text-primary-light text-3xl font-quran bg-white dark:bg-card-dark rounded-2xl shadow-soft border border-black/5 dark:border-white/5">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>
      )}

      {/* Verse Cards List */}
      <div ref={readerRef} className="space-y-4" dir="rtl">
        {surah.ayahs.map(ayah => {
          let ayahText = ayah.text;
          if (surah.number !== 1 && ayah.numberInSurah === 1 && ayahText.startsWith('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ')) {
            ayahText = ayahText.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '').trim();
          }

          const isBookmarked = bookmarkedAyahs.includes(`${surah.number}-${ayah.numberInSurah}`);
          const isActive = isCurrentSurahActive && !isFullSurahMode && activeAyahNumber === ayah.numberInSurah;
          const isTafsirOpen = expandedTafsir === ayah.numberInSurah;
          const tafsirText = tafsir?.ayahs.find(t => t.numberInSurah === ayah.numberInSurah)?.text;

          return (
            <Card 
              key={ayah.numberInSurah} 
              className={`p-5 sm:p-6 flex flex-col justify-between border-0 shadow-soft bg-white dark:bg-card-dark rounded-2xl relative transition-all duration-300 ${
                isActive ? 'ring-2 ring-primary/50 bg-primary/5 dark:bg-primary-dark/5' : ''
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between text-text-muted dark:text-text-darkMuted text-xs mb-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light flex items-center justify-center font-bold font-sans">
                  {ayah.numberInSurah}
                </div>
                <div className="flex items-center gap-2">
                  {isRepeating && isActive && (
                    <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 animate-pulse">
                      <Repeat size={12} />
                      تكرار الآية
                    </span>
                  )}
                  <div className="bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full font-sans">
                    جـ {ayah.juz}
                  </div>
                </div>
              </div>

              {/* Card Content - Verse Text */}
              <div className="text-center py-4">
                <p className={`font-quran text-2xl md:text-3xl leading-loose text-text-main dark:text-text-darkMain ${
                  isActive ? 'text-primary-dark dark:text-primary-light' : ''
                }`}>
                  {ayahText}
                </p>
              </div>

              {/* Tafsir Block */}
              <AnimatePresence>
                {isTafsirOpen && tafsirText && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="block w-full text-right bg-black/5 dark:bg-white/5 p-4 rounded-xl mb-4 text-base md:text-lg font-sans leading-relaxed border-r-4 border-primary overflow-hidden"
                  >
                    <div className="flex items-center gap-2 mb-2 text-primary font-bold">
                      <BookOpen size={18} /> التفسير الميسر:
                    </div>
                    {tafsirText}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Card Actions Footer */}
              <div className="border-t border-black/5 dark:border-white/5 pt-4 mt-2 flex items-center justify-around">
                {/* Play Button */}
                <button 
                  onClick={() => {
                    if (isActive && isPlaying) {
                      togglePlayPause();
                    } else {
                      playAyah(surah.number, surah.name, ayah, surah.ayahs, currentReciter);
                    }
                  }} 
                  className={`flex flex-col items-center gap-1 text-[10px] sm:text-xs font-semibold transition-colors w-14 ${
                    isActive && isPlaying ? 'text-primary dark:text-primary-light font-bold' : 'text-text-muted dark:text-text-darkMuted hover:text-text-main'
                  }`}
                >
                  {isActive && isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  <span>{isActive && isPlaying ? 'إيقاف' : 'تشغيل'}</span>
                </button>

                {/* Repeat Button */}
                <button 
                  onClick={() => {
                    if (!isActive) {
                      playAyah(surah.number, surah.name, ayah, surah.ayahs, currentReciter);
                    }
                    toggleRepeat();
                  }} 
                  className={`flex flex-col items-center gap-1 text-[10px] sm:text-xs font-semibold transition-colors w-14 ${
                    isRepeating && isActive ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-text-muted dark:text-text-darkMuted hover:text-text-main'
                  }`}
                >
                  <Repeat size={18} />
                  <span>تكرار</span>
                </button>

                {/* Tafsir Button */}
                <button 
                  onClick={(e) => toggleTafsir(ayah.numberInSurah, e)} 
                  className={`flex flex-col items-center gap-1 text-[10px] sm:text-xs font-semibold transition-colors w-14 ${
                    isTafsirOpen ? 'text-primary dark:text-primary-light font-bold' : 'text-text-muted dark:text-text-darkMuted hover:text-text-main'
                  }`}
                >
                  <BookOpen size={18} />
                  <span>تفسير</span>
                </button>

                {/* Share / Copy Button */}
                <button 
                  onClick={() => handleShare(ayahText, surah.name, ayah.numberInSurah)} 
                  className={`flex flex-col items-center gap-1 text-[10px] sm:text-xs font-semibold transition-colors w-14 ${
                    copiedAyah === ayah.numberInSurah ? 'text-emerald-500 font-bold' : 'text-text-muted dark:text-text-darkMuted hover:text-text-main'
                  }`}
                >
                  {copiedAyah === ayah.numberInSurah ? <Check size={18} /> : <Share2 size={18} />}
                  <span>{copiedAyah === ayah.numberInSurah ? 'تم النسخ' : 'مشاركة'}</span>
                </button>

                {/* Bookmark Button */}
                <button 
                  onClick={() => handleBookmark(ayah)} 
                  className={`flex flex-col items-center gap-1 text-[10px] sm:text-xs font-semibold transition-colors w-14 ${
                    isBookmarked ? 'text-primary dark:text-primary-light font-bold' : 'text-text-muted dark:text-text-darkMuted hover:text-text-main'
                  }`}
                >
                  <Bookmark size={18} className={isBookmarked ? 'fill-primary text-primary' : ''} />
                  <span>{isBookmarked ? 'محفوظة' : 'حفظ'}</span>
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Overlay Backdrop to close menu when clicking outside */}
      {showReciterMenu && (
        <div 
          className="fixed inset-0 z-45 bg-transparent" 
          onClick={() => setShowReciterMenu(false)}
        />
      )}

      {/* Floating Reciters Popover Menu */}
      <AnimatePresence>
        {showReciterMenu && (
          <div className="fixed bottom-36 md:bottom-24 left-[5%] md:left-[calc(50%-210px)] z-50 w-[90%] max-w-[260px]">
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 1 }}
              className="bg-white dark:bg-card-dark shadow-2xl rounded-2xl p-3 border border-black/5 dark:border-white/10 flex flex-col gap-1 w-full text-right"
              dir="rtl"
            >
              <div className="text-xs font-bold text-text-muted px-3 py-2 border-b border-black/5 dark:border-white/5 text-right font-sans">
                اختر القارئ:
              </div>
              {RECITERS.map(reciter => (
                <button
                  key={reciter.id}
                  onClick={() => changeReciter(reciter.id)}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-right text-sm font-semibold transition-colors font-sans ${
                    currentReciter === reciter.id
                      ? 'bg-primary text-white'
                      : 'text-text-main dark:text-text-darkMain hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <span>{reciter.name}</span>
                  {currentReciter === reciter.id && <Check size={16} />}
                </button>
              ))}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Bottom Audio Control Bar */}
      <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-card dark:bg-card-dark shadow-2xl rounded-full p-2 px-4 flex items-center justify-between border border-black/5 dark:border-white/10 z-50">
        
        {/* Repeat Toggle Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className={`rounded-full transition-colors ${isRepeating ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold' : 'text-text-muted'}`}
          onClick={toggleRepeat}
          title={isRepeating ? 'إيقاف تكرار الآية' : 'تفعيل تكرار الآية'}
        >
          <Repeat size={20} />
        </Button>
        
        <Button 
          variant="ghost" size="icon" className="rounded-full"
          onClick={() => surah.number < 114 && navigate(`/quran/read/${surah.number + 1}`)}
        >
          <ChevronRight size={20} />
        </Button>

        <Button 
          variant="primary" 
          size="icon" 
          className="rounded-full w-14 h-14 shadow-lg scale-110"
          onClick={() => {
            if (isCurrentSurahActive) {
              togglePlayPause();
            } else {
              playFullSurah(surah.number, surah.name, currentReciter);
            }
          }}
        >
          {isCurrentSurahActive && isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
        </Button>

        <Button 
          variant="ghost" size="icon" className="rounded-full"
          onClick={() => surah.number > 1 && navigate(`/quran/read/${surah.number - 1}`)}
        >
          <ChevronLeft size={20} />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className={`rounded-full transition-colors ${showReciterMenu ? 'text-primary' : ''}`} 
          onClick={() => setShowReciterMenu(!showReciterMenu)}
        >
          <Settings size={20} />
        </Button>
      </div>

    </div>
  );
};
