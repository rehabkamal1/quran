import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { 
  Search, Play, Pause, Bookmark, Download, BookOpenText, Grid2x2, 
  Trash2, Copy, Check, Share2, Sparkles, BookOpen, 
  ChevronLeft, ArrowUpDown, X, Volume2, BookmarkX,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { quranApi } from '../services/quranApi';
import type { SurahMeta } from '../services/quranApi';
import { useGlobalPlayer } from '../context/GlobalPlayerContext';
import { audioService } from '../services/audioService';
import { storage } from '../services/storage';
import type { Bookmark as BookmarkType, LastRead } from '../services/storage';

const downloadSurahMp3 = async (surahNumber: number, surahName: string) => {
  const sourceUrl = audioService.getSurahAudioUrl(surahNumber);
  const fileName = `${surahName}.mp3`;

  try {
    const response = await fetch(sourceUrl, { mode: 'cors' });
    if (!response.ok) throw new Error('Audio fetch failed');

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  } catch {
    const link = document.createElement('a');
    link.href = sourceUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const formatRelativeTime = (isoString?: string) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays === 1) return 'أمس';
    if (diffDays < 30) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

export const Quran: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'surah' | 'juz' | 'saved'>(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'saved' || tabParam === 'juz' || tabParam === 'surah') {
      return tabParam;
    }
    return 'surah';
  });

  const [savedFilter, setSavedFilter] = useState<'all' | 'ayahs' | 'surahs' | 'cards'>('all');
  const [savedSort, setSavedSort] = useState<'newest' | 'quran'>('newest');
  
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedSurahIds, setBookmarkedSurahIds] = useState<number[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [lastRead, setLastRead] = useState<LastRead | null>(null);

  // Modals & Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedAyahForCard, setSelectedAyahForCard] = useState<BookmarkType | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activePlayingAyahId, setActivePlayingAyahId] = useState<string | null>(null);

  const navigate = useNavigate();
  const { 
    playFullSurah, 
    isPlaying, 
    surahNumber: globalSurahNumber, 
    isFullSurahMode, 
    togglePlayPause,
    playAudioUrl
  } = useGlobalPlayer();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2600);
  };

  const handleTabChange = (tab: 'surah' | 'juz' | 'saved') => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === 'surah') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', tab);
    }
    window.history.replaceState({}, '', url.toString());
  };

  useEffect(() => {
    const loadData = async () => {
      const data = await quranApi.getSurahs();
      setSurahs(data);
      
      const saved = storage.getBookmarks();
      setBookmarks(saved);
      
      const surahSavedIds = saved
        .filter((bookmark) => bookmark.id.startsWith('surah-') || bookmark.ayah === 0)
        .map((bookmark) => bookmark.surah);
      setBookmarkedSurahIds(surahSavedIds);
      
      setLastRead(storage.getLastRead());
      setLoading(false);
    };
    loadData();
  }, []);

  const toggleSurahBookmark = (surahNumber: number, surahName: string) => {
    const id = `surah-${surahNumber}`;
    const isSaved = storage.isBookmarked(id);
    const totalAyahs = surahs.find((surah) => surah.number === surahNumber)?.numberOfAyahs ?? 0;

    if (isSaved) {
      storage.removeBookmark(id);
      setBookmarkedSurahIds((prev) => prev.filter((item) => item !== surahNumber));
      setBookmarks(storage.getBookmarks());
      showToast('تمت إزالة السورة من المحفوظات');
      return;
    }

    const newBookmark: BookmarkType = {
      id,
      surah: surahNumber,
      ayah: totalAyahs,
      surahName,
      text: `سورة ${surahName}`,
      dateAdded: new Date().toISOString(),
    };
    storage.addBookmark(newBookmark);
    setBookmarkedSurahIds((prev) => [...prev, surahNumber]);
    setBookmarks(storage.getBookmarks());
    showToast('تمت إضافة السورة إلى المحفوظات 🔖');
  };

  const handleDeleteBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    storage.removeBookmark(id);
    const updated = storage.getBookmarks();
    setBookmarks(updated);
    setBookmarkedSurahIds((prev) => prev.filter((num) => `surah-${num}` !== id));
    showToast('تمت الإزالة من المحفوظات');
  };

  const handleClearAllBookmarks = () => {
    storage.clearBookmarks();
    setBookmarks([]);
    setBookmarkedSurahIds([]);
    setShowClearConfirm(false);
    showToast('تم مسح جميع المحفوظات بنجاح');
  };

  const handleCopyAyah = (text: string, surahName: string, ayah: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const formatted = `﴿ ${text} ﴾\n[سورة ${surahName} - آية ${ayah}]`;
    navigator.clipboard.writeText(formatted);
    showToast('تم نسخ نص الآية الكريمة بنجاح');
  };

  const handleShareAyah = async (text: string, surahName: string, ayah: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const formatted = `﴿ ${text} ﴾\n[سورة ${surahName} - آية ${ayah}]\nتمت المشاركة من تطبيق القرآن الكريم`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `سورة ${surahName} - آية ${ayah}`,
          text: formatted,
        });
        return;
      } catch {
        // Ignored if user dismissed share dialog
      }
    }
    navigator.clipboard.writeText(formatted);
    showToast('تم نسخ نص الآية للمشاركة');
  };

  const handlePlayAyahAudio = (bookmark: BookmarkType, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url = audioService.getAyahAudioUrl(1, undefined, bookmark.surah, bookmark.ayah);
    const title = `سورة ${bookmark.surahName}`;
    const sub = `الآية ${bookmark.ayah}`;

    if (activePlayingAyahId === bookmark.id && isPlaying) {
      togglePlayPause();
    } else {
      setActivePlayingAyahId(bookmark.id);
      playAudioUrl(url, title, sub);
    }
  };

  // Helper categorization
  const isSurahBookmark = (b: BookmarkType) => b.id.startsWith('surah-') || b.ayah === 0;

  const ayahBookmarks = useMemo(() => bookmarks.filter((b) => !isSurahBookmark(b)), [bookmarks]);
  const surahBookmarks = useMemo(() => bookmarks.filter((b) => isSurahBookmark(b)), [bookmarks]);

  // Filtered Surahs for the "surah" tab
  const filteredSurahs = useMemo(() => {
    return surahs.filter(s => 
      s.name.includes(searchQuery) || 
      s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(s.number) === searchQuery.trim()
    );
  }, [surahs, searchQuery]);

  // Filtered and Sorted Bookmarks for the "saved" tab
  const filteredSavedItems = useMemo(() => {
    let result = bookmarks;

    if (savedFilter === 'ayahs') {
      result = ayahBookmarks;
    } else if (savedFilter === 'surahs') {
      result = surahBookmarks;
    } else if (savedFilter === 'cards') {
      result = ayahBookmarks;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(b => 
        b.surahName.toLowerCase().includes(q) ||
        b.text.toLowerCase().includes(q) ||
        String(b.ayah) === q
      );
    }

    return [...result].sort((a, b) => {
      if (savedSort === 'newest') {
        const dateA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
        const dateB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
        return dateB - dateA;
      } else {
        if (a.surah !== b.surah) return a.surah - b.surah;
        return a.ayah - b.ayah;
      }
    });
  }, [bookmarks, savedFilter, searchQuery, savedSort, ayahBookmarks, surahBookmarks]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-secondary-dark/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-primary/30 flex items-center gap-3 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary-light flex items-center justify-center shrink-0">
            <Check size={14} />
          </div>
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header & Search */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-primary dark:text-primary-light font-quran">
              القرآن الكريم
            </h1>
            <p className="text-xs md:text-sm text-text-muted mt-1">
              {activeTab === 'saved' 
                ? 'آياتك وسورك المحفوظة لتيسير الحفظ والمراجعة والتدبر' 
                : 'رتل وتدبر آيات الذكر الحكيم واستمع لأشهر القراء'}
            </p>
          </div>

          {activeTab === 'saved' && bookmarks.length > 0 && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs bg-primary/10 text-primary dark:text-primary-light px-3 py-1.5 rounded-full font-bold border border-primary/20">
                {bookmarks.length} محفوظات
              </span>
            </div>
          )}
        </div>

        <Input 
          type="text" 
          placeholder={
            activeTab === 'saved'
              ? "ابحث في المحفوظات (اسم السورة، نص الآية، رقم الآية)..."
              : activeTab === 'juz'
              ? "ابحث في الأجزاء..."
              : "ابحث عن سورة بالاسم أو الرقم..."
          }
          icon={Search} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </section>

      {/* Main Tabs */}
      <div className="flex w-full bg-black/5 dark:bg-white/5 rounded-2xl p-1.5 gap-1.5 border border-black/5 dark:border-white/5">
        <button
          onClick={() => handleTabChange('surah')}
          className={`flex-1 min-h-[48px] rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'surah' 
              ? 'bg-white dark:bg-card-dark shadow-sm text-primary dark:text-primary-light ring-1 ring-black/5 dark:ring-white/5' 
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          <BookOpenText size={18} />
          <span>السور</span>
        </button>

        <button
          onClick={() => handleTabChange('juz')}
          className={`flex-1 min-h-[48px] rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'juz' 
              ? 'bg-white dark:bg-card-dark shadow-sm text-primary dark:text-primary-light ring-1 ring-black/5 dark:ring-white/5' 
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          <Grid2x2 size={18} />
          <span>الأجزاء</span>
        </button>

        <button
          onClick={() => handleTabChange('saved')}
          className={`flex-1 min-h-[48px] rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 relative ${
            activeTab === 'saved' 
              ? 'bg-white dark:bg-card-dark shadow-sm text-primary dark:text-primary-light ring-1 ring-black/5 dark:ring-white/5' 
              : 'text-text-muted hover:text-text-main'
          }`}
        >
          <Bookmark size={18} className={bookmarks.length > 0 ? "fill-primary/20" : ""} />
          <span>المحفوظات</span>
          {bookmarks.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center">
              {bookmarks.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        // Loading Skeletons
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i} className="animate-pulse flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-full bg-black/10 dark:bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-1/2" />
                <div className="h-3 bg-black/10 dark:bg-white/10 rounded w-1/4" />
              </div>
            </Card>
          ))}
        </div>
      ) : activeTab === 'surah' ? (
        // SURAHS LIST
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSurahs.map((surah) => {
            const isPlayingThisSurah = globalSurahNumber === surah.number && isFullSurahMode && isPlaying;

            return (
              <Card 
                key={surah.number} 
                className={`flex items-center justify-between p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isPlayingThisSurah ? 'border-2 border-primary bg-primary/5' : 'hover:border-primary/50'
                }`}
                onClick={() => navigate(`/quran/read/${surah.number}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {surah.number}
                  </div>
                  <div>
                    <h3 className="font-bold font-quran text-lg">{surah.name}</h3>
                    <p className="text-xs text-text-muted">
                      {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {surah.numberOfAyahs} آيات
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSurahBookmark(surah.number, surah.name);
                    }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      bookmarkedSurahIds.includes(surah.number)
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-black/5 dark:bg-white/5 text-text-muted hover:text-primary hover:bg-primary/10'
                    }`}
                    title={bookmarkedSurahIds.includes(surah.number) ? 'إزالة من المحفوظات' : 'حفظ السورة'}
                    aria-label={bookmarkedSurahIds.includes(surah.number) ? 'إزالة من المحفوظات' : 'حفظ السورة'}
                  >
                    <Bookmark size={18} className={bookmarkedSurahIds.includes(surah.number) ? 'fill-current' : ''} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadSurahMp3(surah.number, surah.name);
                    }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/5 text-text-muted hover:text-primary hover:bg-primary/10 transition-all"
                    title="تحميل بصوت الشيخ"
                    aria-label="تحميل بصوت الشيخ"
                  >
                    <Download size={18} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isPlayingThisSurah) {
                        togglePlayPause();
                      } else {
                        playFullSurah(surah.number, surah.name);
                      }
                    }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      isPlayingThisSurah 
                        ? 'bg-primary text-white shadow-md' 
                        : 'bg-black/5 dark:bg-white/5 text-text-muted hover:text-primary hover:bg-primary/10'
                    }`}
                    title="تشغيل السورة كاملة"
                  >
                    {isPlayingThisSurah ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : activeTab === 'juz' ? (
        // JUZ LIST
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {JUZ_DATA.map((juz) => {
            const juzSurahsList = JUZ_SURAHS[juz.number] || [];
            return (
              <Card 
                key={juz.number}
                className="flex items-center justify-between p-4 cursor-pointer hover:border-primary/50 transition-all bg-white dark:bg-card-dark"
                onClick={() => navigate(`/quran/juz/${juz.number}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {juz.number}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">الجزء {juz.number}</h3>
                    <p className="text-xs text-text-muted">يحتوي على {juzSurahsList.length} سورة</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const firstSurahNumber = juzSurahsList[0] || 1;
                      const firstSurahName = surahs.find((item) => item.number === firstSurahNumber)?.name || `الجزء ${juz.number}`;
                      downloadSurahMp3(firstSurahNumber, firstSurahName);
                    }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/5 text-text-muted hover:text-primary hover:bg-primary/10 transition-all"
                    title="تحميل جزء بصوت الشيخ"
                    aria-label="تحميل جزء بصوت الشيخ"
                  >
                    <Download size={18} />
                  </button>
                  <div className="text-primary/50">
                    <Bookmark size={20} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        // ==========================================
        // SAVED (المحفوظات) - REDESIGNED PREMIUM VIEW
        // ==========================================
        <div className="space-y-6">

          {/* Quick Continue Reading Banner */}
          {lastRead && (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border border-primary/20 p-5 md:p-6 shadow-soft transition-all">
              <div className="absolute top-0 left-0 -mt-10 -ml-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-primary-light text-white flex items-center justify-center shadow-md shrink-0">
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary dark:text-primary-light">
                      <span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping" />
                      آخر موضع قراءة
                    </div>
                    <h2 className="text-xl md:text-2xl font-black font-quran text-text-main dark:text-text-darkMain mt-0.5">
                      سورة {lastRead.surahName}
                    </h2>
                    <p className="text-xs text-text-muted">
                      توقفت عند الآية رقم {lastRead.ayah}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/quran/read/${lastRead.surah}?ayah=${lastRead.ayah}`)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <span>متابعة القراءة</span>
                  <ChevronLeft size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Control Bar: Filters, Sort & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-card-dark p-2.5 rounded-2xl border border-black/5 dark:border-white/10 shadow-soft">
            
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setSavedFilter('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  savedFilter === 'all'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 text-text-muted hover:text-text-main'
                }`}
              >
                <span>الكل</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  savedFilter === 'all' ? 'bg-white/20 text-white' : 'bg-black/10 dark:bg-white/10'
                }`}>
                  {bookmarks.length}
                </span>
              </button>

              <button
                onClick={() => setSavedFilter('ayahs')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  savedFilter === 'ayahs'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 text-text-muted hover:text-text-main'
                }`}
              >
                <FileText size={14} />
                <span>الآيات</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  savedFilter === 'ayahs' ? 'bg-white/20 text-white' : 'bg-black/10 dark:bg-white/10'
                }`}>
                  {ayahBookmarks.length}
                </span>
              </button>

              <button
                onClick={() => setSavedFilter('surahs')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  savedFilter === 'surahs'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 text-text-muted hover:text-text-main'
                }`}
              >
                <BookOpenText size={14} />
                <span>السور</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  savedFilter === 'surahs' ? 'bg-white/20 text-white' : 'bg-black/10 dark:bg-white/10'
                }`}>
                  {surahBookmarks.length}
                </span>
              </button>

              <button
                onClick={() => setSavedFilter('cards')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  savedFilter === 'cards'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 text-text-muted hover:text-text-main'
                }`}
              >
                <Sparkles size={14} />
                <span>بطاقات الاقتباس</span>
              </button>
            </div>

            {/* Sort & Clear Actions */}
            <div className="flex items-center gap-2 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-black/5 dark:border-white/5">
              <button
                onClick={() => setSavedSort(prev => prev === 'newest' ? 'quran' : 'newest')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-black/5 dark:bg-white/5 text-text-muted hover:text-text-main transition-colors flex items-center gap-1.5 cursor-pointer"
                title="تغيير طريقة الترتيب"
              >
                <ArrowUpDown size={13} />
                <span>{savedSort === 'newest' ? 'الأحدث أولاً' : 'ترتيب المصحف'}</span>
              </button>

              {bookmarks.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-1 cursor-pointer"
                  title="مسح جميع المحفوظات"
                >
                  <Trash2 size={14} />
                  <span>مسح الكل</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Result Status */}
          {searchQuery.trim() && (
            <div className="flex items-center justify-between text-xs text-text-muted bg-primary/5 dark:bg-primary/10 px-4 py-2 rounded-xl border border-primary/10">
              <span>نتائج البحث عن "{searchQuery}": {filteredSavedItems.length} عنصر</span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <X size={13} />
                <span>إلغاء البحث</span>
              </button>
            </div>
          )}

          {/* Empty States */}
          {bookmarks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-black/10 dark:border-white/10 bg-white dark:bg-card-dark p-10 text-center space-y-4 shadow-soft">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
                <BookmarkX size={32} />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-xl font-bold text-text-main dark:text-text-darkMain">
                  قائمة المحفوظات فارغة
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  لم تقم بحفظ أي آيات أو سور بعد. يمكنك الضغط على علامة الحفظ (🔖) أثناء قراءة القرآن الكريم للرجوع إلى آياتك المفضلة هنا في أي وقت.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('surah')}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer inline-flex items-center gap-2"
              >
                <BookOpenText size={16} />
                <span>تصفح سور القرآن الكريم</span>
              </button>
            </div>
          ) : filteredSavedItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-black/10 dark:border-white/10 bg-white dark:bg-card-dark p-10 text-center space-y-3 shadow-soft">
              <div className="w-14 h-14 rounded-full bg-black/5 dark:bg-white/5 text-text-muted flex items-center justify-center mx-auto">
                <Search size={26} />
              </div>
              <h3 className="text-lg font-bold text-text-main dark:text-text-darkMain">
                لم يتم العثور على نتائج تطابق بحثك
              </h3>
              <p className="text-xs text-text-muted max-w-xs mx-auto">
                جرّب البحث بكلمة أخرى أو تغيير التصفية لعرض عناصر أخرى.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSavedFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-primary hover:text-white text-xs font-bold transition-colors cursor-pointer inline-block"
              >
                عرض كل المحفوظات
              </button>
            </div>
          ) : savedFilter === 'cards' ? (
            // ===================================
            // CARDS POSTER VIEW (بطاقات الاقتباس)
            // ===================================
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredSavedItems.map((bookmark) => (
                <div 
                  key={bookmark.id}
                  className="relative group rounded-3xl overflow-hidden bg-gradient-to-br from-[#1E232A] via-[#16191E] to-[#111417] text-white p-6 md:p-7 border border-primary/30 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-primary/60 flex flex-col justify-between"
                >
                  {/* Decorative Background Pattern Accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Top Quote Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-primary/20 text-primary-light flex items-center justify-center text-xs font-bold">
                        {bookmark.ayah}
                      </span>
                      <span className="text-sm font-bold text-primary-light">
                        سورة {bookmark.surahName}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/50">
                      {formatRelativeTime(bookmark.dateAdded)}
                    </span>
                  </div>

                  {/* Basmalah & Verse Body */}
                  <div className="py-6 text-center space-y-3">
                    <p className="text-xs text-primary/70 font-quran">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
                    <p className="font-quran text-2xl md:text-3xl leading-loose text-white/95 px-2 select-text">
                      ﴿ {bookmark.text} ﴾
                    </p>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => navigate(`/quran/read/${bookmark.surah}?ayah=${bookmark.ayah}`)}
                      className="px-3.5 py-2 rounded-xl bg-primary/20 hover:bg-primary text-primary-light hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <BookOpen size={14} />
                      <span>قراءة في المصحف</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleCopyAyah(bookmark.text, bookmark.surahName, bookmark.ayah, e)}
                        className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                        title="نسخ الآية"
                      >
                        <Copy size={15} />
                      </button>
                      <button
                        onClick={(e) => handleShareAyah(bookmark.text, bookmark.surahName, bookmark.ayah, e)}
                        className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                        title="مشاركة الآية"
                      >
                        <Share2 size={15} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteBookmark(bookmark.id, e)}
                        className="w-8 h-8 rounded-xl bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-white/70 flex items-center justify-center transition-colors cursor-pointer"
                        title="حذف من المحفوظات"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // ==========================================
            // STANDARD LUXURY BOOKMARKS GRID
            // ==========================================
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSavedItems.map((bookmark) => {
                const isSurah = isSurahBookmark(bookmark);
                const surahMeta = surahs.find(s => s.number === bookmark.surah);
                const isPlayingThisSurah = isSurah && globalSurahNumber === bookmark.surah && isFullSurahMode && isPlaying;
                const isPlayingThisAyah = !isSurah && activePlayingAyahId === bookmark.id && isPlaying;

                if (isSurah) {
                  // Surah Bookmark Card
                  return (
                    <Card
                      key={bookmark.id}
                      className="p-5 bg-white dark:bg-card-dark rounded-2xl border border-black/5 dark:border-white/10 hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                            {bookmark.surah}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold font-quran text-xl text-primary dark:text-primary-light">
                                سورة {bookmark.surahName}
                              </h3>
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold">
                                سورة كاملة
                              </span>
                            </div>
                            <p className="text-xs text-text-muted mt-0.5">
                              {surahMeta?.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {surahMeta?.numberOfAyahs ?? bookmark.ayah} آية
                              {bookmark.dateAdded && ` • أضيفت ${formatRelativeTime(bookmark.dateAdded)}`}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDeleteBookmark(bookmark.id, e)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="إزالة من المحفوظات"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2">
                        <button
                          onClick={() => navigate(`/quran/read/${bookmark.surah}`)}
                          className="flex-1 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary hover:text-white text-primary text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <BookOpenText size={15} />
                          <span>قراءة السورة</span>
                        </button>

                        <button
                          onClick={() => {
                            if (isPlayingThisSurah) {
                              togglePlayPause();
                            } else {
                              playFullSurah(bookmark.surah, bookmark.surahName);
                            }
                          }}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                            isPlayingThisSurah
                              ? 'bg-primary text-white shadow-md'
                              : 'bg-black/5 dark:bg-white/5 text-text-muted hover:text-primary hover:bg-primary/10'
                          }`}
                          title="استماع للسورة"
                        >
                          {isPlayingThisSurah ? <Pause size={17} /> : <Play size={17} className="ml-0.5" />}
                        </button>

                        <button
                          onClick={() => downloadSurahMp3(bookmark.surah, bookmark.surahName)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/5 text-text-muted hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
                          title="تحميل السورة MP3"
                        >
                          <Download size={17} />
                        </button>
                      </div>
                    </Card>
                  );
                }

                // Ayah Bookmark Card
                return (
                  <Card
                    key={bookmark.id}
                    className="p-5 bg-white dark:bg-card-dark rounded-2xl border border-black/5 dark:border-white/10 hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    {/* Header */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary dark:text-primary-light flex items-center justify-center font-bold text-xs">
                            {bookmark.ayah}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-base text-primary dark:text-primary-light">
                                سورة {bookmark.surahName}
                              </h3>
                              {surahMeta?.revelationType && (
                                <span className="text-[10px] text-text-muted bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">
                                  {surahMeta.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-text-muted">
                              الآية رقم {bookmark.ayah} {bookmark.dateAdded && `• ${formatRelativeTime(bookmark.dateAdded)}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedAyahForCard(bookmark)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            title="عرض كبطاقة مشاركة"
                          >
                            <Sparkles size={16} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteBookmark(bookmark.id, e)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="إزالة من المحفوظات"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Verse Body */}
                      <div className="py-2.5 px-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 mb-4">
                        <p className="font-quran text-xl md:text-2xl text-right leading-loose text-text-main dark:text-text-darkMain select-text">
                          ﴿ {bookmark.text} ﴾
                        </p>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2">
                      <button
                        onClick={() => navigate(`/quran/read/${bookmark.surah}?ayah=${bookmark.ayah}`)}
                        className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <BookOpen size={14} />
                        <span>فتح في المصحف</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => handlePlayAyahAudio(bookmark, e)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                            isPlayingThisAyah
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-black/5 dark:bg-white/5 text-text-muted hover:text-primary hover:bg-primary/10'
                          }`}
                          title="استماع لتلاوة الآية"
                        >
                          {isPlayingThisAyah ? <Pause size={14} /> : <Volume2 size={15} />}
                        </button>

                        <button
                          onClick={(e) => handleCopyAyah(bookmark.text, bookmark.surahName, bookmark.ayah, e)}
                          className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 text-text-muted hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-colors cursor-pointer"
                          title="نسخ الآية"
                        >
                          <Copy size={15} />
                        </button>

                        <button
                          onClick={(e) => handleShareAyah(bookmark.text, bookmark.surahName, bookmark.ayah, e)}
                          className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 text-text-muted hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-colors cursor-pointer"
                          title="مشاركة الآية"
                        >
                          <Share2 size={15} />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          MODAL: AYAH QUOTE CARD PREVIEW
      ========================================== */}
      {selectedAyahForCard && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedAyahForCard(null)}
        >
          <div 
            className="w-full max-w-lg rounded-3xl bg-[#171A1F] border border-primary/40 shadow-2xl p-6 md:p-8 text-white space-y-6 relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedAyahForCard(null)}
              className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Poster Card */}
            <div className="rounded-2xl border-2 border-primary/40 p-6 md:p-8 text-center bg-gradient-to-b from-primary/10 via-transparent to-primary/5 space-y-4 relative overflow-hidden">
              <div className="text-primary text-xs font-bold tracking-widest">
                ❖ بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ❖
              </div>

              <div className="py-4">
                <p className="font-quran text-2xl md:text-3xl text-primary-light leading-loose select-text">
                  ﴿ {selectedAyahForCard.text} ﴾
                </p>
              </div>

              <div className="pt-3 border-t border-primary/20 flex items-center justify-center gap-2 text-xs text-primary-light/80 font-bold">
                <span>سورة {selectedAyahForCard.surahName}</span>
                <span>•</span>
                <span>الآية {selectedAyahForCard.ayah}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  handleCopyAyah(selectedAyahForCard.text, selectedAyahForCard.surahName, selectedAyahForCard.ayah);
                  setSelectedAyahForCard(null);
                }}
                className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                <Copy size={16} />
                <span>نسخ نص البطاقة</span>
              </button>

              <button
                onClick={() => {
                  handleShareAyah(selectedAyahForCard.text, selectedAyahForCard.surahName, selectedAyahForCard.ayah);
                  setSelectedAyahForCard(null);
                }}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Share2 size={16} />
                <span>مشاركة الآية</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: CLEAR ALL CONFIRMATION
      ========================================== */}
      {showClearConfirm && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowClearConfirm(false)}
        >
          <div 
            className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1C2026] p-6 text-center space-y-4 shadow-2xl border border-black/10 dark:border-white/10 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <Trash2 size={26} />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-text-main dark:text-text-darkMain">
                مسح جميع المحفوظات؟
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                هل أنت متأكد من رغبتك في حذف جميع المحفوظات ({bookmarks.length} عنصر)؟ لن تتمكن من التراجع عن هذه الخطوة.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-text-main dark:text-text-darkMain text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleClearAllBookmarks}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors shadow-md cursor-pointer"
              >
                نعم، مسح الكل
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Static mapping of Juz to their containing Surahs
const JUZ_SURAHS: Record<number, number[]> = {
  1: [1, 2],
  2: [2],
  3: [2, 3],
  4: [3, 4],
  5: [4],
  6: [4, 5],
  7: [5, 6],
  8: [6, 7],
  9: [7, 8],
  10: [8, 9],
  11: [9, 10, 11],
  12: [11, 12],
  13: [12, 13, 14],
  14: [15, 16],
  15: [17, 18],
  16: [18, 19, 20],
  17: [21, 22],
  18: [23, 24, 25],
  19: [25, 26, 27],
  20: [27, 28, 29],
  21: [29, 30, 31, 32, 33],
  22: [33, 34, 35, 36],
  23: [36, 37, 38, 39],
  24: [39, 40, 41],
  25: [41, 42, 43, 44, 45],
  26: [46, 47, 48, 49, 50, 51],
  27: [51, 52, 53, 54, 55, 56, 57],
  28: [58, 59, 60, 61, 62, 63, 64, 65, 66],
  29: [67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77],
  30: [78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114]
};

const JUZ_DATA = Object.keys(JUZ_SURAHS).map(num => ({ number: parseInt(num) }));
