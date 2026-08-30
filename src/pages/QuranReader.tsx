import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Play, Pause, Settings, ChevronRight, ChevronLeft, Info, BookmarkCheck, BookOpen } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { quranApi } from '../services/quranApi';
import type { SurahData, Ayah, TafsirData } from '../services/quranApi';
import { audioService } from '../services/audioService';
import { storage } from '../services/storage';
import { motion, AnimatePresence } from 'framer-motion';

export const QuranReader: React.FC = () => {
  const { surahId } = useParams();
  const navigate = useNavigate();
  
  const [surah, setSurah] = useState<SurahData | null>(null);
  const [tafsir, setTafsir] = useState<TafsirData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [activeAyah, setActiveAyah] = useState<number | null>(null);
  const [expandedTafsir, setExpandedTafsir] = useState<number | null>(null);

  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<string[]>([]);
  
  const readerRef = useRef<HTMLDivElement>(null);

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

  const playAyah = (ayah: Ayah) => {
    if (currentAudio) {
      currentAudio.pause();
    }
    const url = audioService.getAyahAudioUrl(ayah.number);
    const audio = new Audio(url);
    
    audio.play();
    setIsPlaying(true);
    setActiveAyah(ayah.numberInSurah);
    setCurrentAudio(audio);

    audio.onended = () => {
      const nextAyah = surah?.ayahs.find(a => a.numberInSurah === ayah.numberInSurah + 1);
      if (nextAyah) {
        playAyah(nextAyah);
      } else {
        setIsPlaying(false);
        setActiveAyah(null);
      }
    };
  };

  const togglePlay = () => {
    if (isPlaying && currentAudio) {
      currentAudio.pause();
      setIsPlaying(false);
    } else if (!isPlaying && activeAyah && surah) {
      const ayah = surah.ayahs.find(a => a.numberInSurah === activeAyah);
      if (ayah) playAyah(ayah);
    } else if (!isPlaying && surah && surah.ayahs.length > 0) {
      playAyah(surah.ayahs[0]);
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

  if (loading) {
    return <div className="flex items-center justify-center h-screen">جاري تحميل السورة...</div>;
  }

  if (!surah) {
    return <div className="flex items-center justify-center h-screen">السورة غير موجودة</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      
      <div className="sticky top-[72px] md:top-20 z-40 bg-background/95 dark:bg-background-dark/95 backdrop-blur-md py-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate('/quran')}>
          <ChevronRight size={24} />
        </Button>
        <div className="text-center">
          <h2 className="font-bold font-quran text-xl text-primary dark:text-primary-light">{surah.name}</h2>
          <p className="text-xs text-text-muted">
            {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {surah.ayahs.length} آيات
          </p>
        </div>
        <Button variant="ghost" size="icon">
          <Settings size={24} />
        </Button>
      </div>

      <Card ref={readerRef} className="min-h-[60vh] p-4 sm:p-8 md:p-12 text-center leading-loose text-2xl md:text-3xl font-quran !rounded-3xl border-0 shadow-lg" dir="rtl">
        {surah.number !== 1 && surah.number !== 9 && (
          <div className="text-center mb-10 text-primary dark:text-primary-light text-3xl">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>
        )}
        
        {surah.ayahs.map(ayah => {
          let ayahText = ayah.text;
          if (surah.number !== 1 && ayah.numberInSurah === 1 && ayahText.startsWith('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ')) {
            ayahText = ayahText.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '').trim();
          }

          const isBookmarked = bookmarkedAyahs.includes(`${surah.number}-${ayah.numberInSurah}`);
          const isActive = activeAyah === ayah.numberInSurah;
          const isTafsirOpen = expandedTafsir === ayah.numberInSurah;
          const tafsirText = tafsir?.ayahs.find(t => t.numberInSurah === ayah.numberInSurah)?.text;

          return (
            <React.Fragment key={ayah.numberInSurah}>
              <span 
                className={`hover:bg-primary/10 rounded px-1 transition-colors cursor-pointer relative group inline-block py-1
                  ${isActive ? 'bg-primary/20 dark:bg-primary/30 text-primary-dark dark:text-primary-light' : ''}
                `}
                onClick={() => playAyah(ayah)}
              >
                {ayahText} 
                <span 
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-primary/30 text-lg mx-2 text-primary relative"
                >
                  {ayah.numberInSurah}
                  {/* Actions inside the number circle when hovered or active */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 bg-white dark:bg-gray-800 shadow-md p-1 rounded-full z-10">
                    <button onClick={(e) => { e.stopPropagation(); handleBookmark(ayah); }} className="p-1 hover:text-primary">
                      {isBookmarked ? <BookmarkCheck size={16} /> : <BookmarkCheck size={16} className="opacity-50" />}
                    </button>
                    <button onClick={(e) => toggleTafsir(ayah.numberInSurah, e)} className="p-1 hover:text-primary">
                      <BookOpen size={16} />
                    </button>
                  </div>
                  
                  {isBookmarked && (
                    <div className="absolute -top-1 -right-1 text-secondary">
                      <BookmarkCheck size={14} fill="currentColor" />
                    </div>
                  )}
                </span>
              </span>
              
              {/* Tafsir Block */}
              <AnimatePresence>
                {isTafsirOpen && tafsirText && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="block w-full text-right bg-black/5 dark:bg-white/5 p-4 rounded-xl my-4 text-lg font-sans leading-relaxed border-r-4 border-primary"
                  >
                    <div className="flex items-center gap-2 mb-2 text-primary font-bold">
                      <BookOpen size={18} /> التفسير الميسر:
                    </div>
                    {tafsirText}
                  </motion.div>
                )}
              </AnimatePresence>
            </React.Fragment>
          );
        })}
      </Card>

      <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-card dark:bg-card-dark shadow-2xl rounded-full p-2 flex items-center justify-between border border-black/5 dark:border-white/10 z-50">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Info size={20} />
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
          onClick={togglePlay}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
        </Button>

        <Button 
          variant="ghost" size="icon" className="rounded-full"
          onClick={() => surah.number > 1 && navigate(`/quran/read/${surah.number - 1}`)}
        >
          <ChevronLeft size={20} />
        </Button>

        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate('/settings')}>
          <Settings size={20} />
        </Button>
      </div>

    </div>
  );
};
