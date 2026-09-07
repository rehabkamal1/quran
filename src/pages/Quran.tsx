import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Search, Play, Pause, Bookmark, Download, BookOpenText, Grid2x2, ImageIcon, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { quranApi } from '../services/quranApi';
import type { SurahMeta } from '../services/quranApi';
import { useGlobalPlayer } from '../context/GlobalPlayerContext';
import { audioService } from '../services/audioService';
import { storage } from '../services/storage';

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
  } catch (error) {
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

export const Quran: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'surah' | 'juz' | 'saved'>('surah');
  const [savedSectionTab, setSavedSectionTab] = useState<'images' | 'ayahs'>('images');
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedSurahIds, setBookmarkedSurahIds] = useState<number[]>([]);

  const savedBookmarks = storage.getBookmarks();

  const navigate = useNavigate();
  const { playFullSurah, isPlaying, surahNumber: globalSurahNumber, isFullSurahMode, togglePlayPause } = useGlobalPlayer();

  useEffect(() => {
    const loadData = async () => {
      const data = await quranApi.getSurahs();
      setSurahs(data);
      const saved = storage.getBookmarks();
      const surahSavedIds = saved
        .filter((bookmark) => bookmark.id.startsWith('surah-') || bookmark.ayah === 0)
        .map((bookmark) => bookmark.surah);
      setBookmarkedSurahIds(surahSavedIds);
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
      return;
    }

    storage.addBookmark({
      id,
      surah: surahNumber,
      ayah: totalAyahs,
      surahName,
      text: `${surahName} - سورة ${surahName}`,
      dateAdded: new Date().toISOString(),
    });
    setBookmarkedSurahIds((prev) => [...prev, surahNumber]);
  };

  const filteredSurahs = surahs.filter(s => 
    s.name.includes(searchQuery) || s.englishName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Header & Search */}
      <section className="space-y-4">
        <h1 className="text-3xl font-bold text-primary dark:text-primary-light">القرآن الكريم</h1>
        <Input 
          type="text" 
          placeholder="ابحث عن سورة..." 
          icon={Search} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </section>

      {/* Tabs */}
      <div className="flex w-full bg-black/5 dark:bg-white/5 rounded-xl p-1 gap-1">
        <button
          onClick={() => setActiveTab('surah')}
          className={`w-full min-h-[48px] rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === 'surah' ? 'bg-white dark:bg-card-dark shadow-sm text-primary dark:text-primary-light' : 'text-text-muted hover:text-text-main'}`}
        >
          <BookOpenText size={16} />
          <span>السور</span>
        </button>
        <button
          onClick={() => setActiveTab('juz')}
          className={`w-full min-h-[48px] rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === 'juz' ? 'bg-white dark:bg-card-dark shadow-sm text-primary dark:text-primary-light' : 'text-text-muted hover:text-text-main'}`}
        >
          <Grid2x2 size={16} />
          <span>الأجزاء</span>
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`w-full min-h-[48px] rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === 'saved' ? 'bg-white dark:bg-card-dark shadow-sm text-primary dark:text-primary-light' : 'text-text-muted hover:text-text-main'}`}
        >
          <Bookmark size={16} />
          <span>المحفوظات</span>
        </button>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          // Skeletons
          Array.from({ length: 9 }).map((_, i) => (
            <Card key={i} className="animate-pulse flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-full bg-black/10 dark:bg-white/10"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-1/2"></div>
                <div className="h-3 bg-black/10 dark:bg-white/10 rounded w-1/4"></div>
              </div>
            </Card>
          ))
        ) : activeTab === 'surah' ? (
          filteredSurahs.map((surah) => {
            const isPlayingThisSurah = globalSurahNumber === surah.number && isFullSurahMode && isPlaying;

            return (
              <Card 
                key={surah.number} 
                className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
                  isPlayingThisSurah ? 'border-2 border-primary bg-primary/5' : 'hover:border-primary/50'
                }`}
                onClick={() => navigate(`/quran/read/${surah.number}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
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
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      bookmarkedSurahIds.includes(surah.number)
                        ? 'bg-primary/10 text-primary'
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
                    className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/5 text-text-muted hover:text-primary hover:bg-primary/10 transition-all"
                    title="تحميل بصوت الشيخ"
                    aria-label="تحميل بصوت الشيخ"
                  >
                    <Download size={18} />
                  </button>

                  {/* Quick Play Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isPlayingThisSurah) {
                        togglePlayPause();
                      } else {
                        playFullSurah(surah.number, surah.name);
                      }
                    }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
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
          })
        ) : activeTab === 'juz' ? (
          JUZ_DATA.map((juz) => {
            const juzSurahsList = JUZ_SURAHS[juz.number] || [];
            return (
              <Card 
                key={juz.number}
                className="flex items-center justify-between p-4 cursor-pointer hover:border-primary/50 transition-all bg-white dark:bg-card-dark"
                onClick={() => navigate(`/quran/juz/${juz.number}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
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
                    className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/5 text-text-muted hover:text-primary hover:bg-primary/10 transition-all"
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
          })
        ) : (
          <div className="space-y-4">
            <div className="flex w-full bg-black/5 dark:bg-white/5 rounded-xl p-1 gap-1">
              <button
                onClick={() => setSavedSectionTab('images')}
                className={`w-full min-h-[48px] rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 ${savedSectionTab === 'images' ? 'bg-white dark:bg-card-dark shadow-sm text-primary dark:text-primary-light' : 'text-text-muted hover:text-text-main'}`}
              >
                <ImageIcon size={16} />
                <span>الصور</span>
              </button>
              <button
                onClick={() => setSavedSectionTab('ayahs')}
                className={`w-full min-h-[48px] rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 ${savedSectionTab === 'ayahs' ? 'bg-white dark:bg-card-dark shadow-sm text-primary dark:text-primary-light' : 'text-text-muted hover:text-text-main'}`}
              >
                <FileText size={16} />
                <span>الآيات</span>
              </button>
            </div>

            {savedSectionTab === 'images' ? (
              <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-8 text-center text-text-muted dark:text-text-darkMuted">
                لا توجد صور محفوظة بعد.
              </div>
            ) : savedBookmarks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-8 text-center text-text-muted dark:text-text-darkMuted">
                لا توجد آيات محفوظة بعد.
              </div>
            ) : (
              savedBookmarks.map((bookmark) => (
                <Card
                  key={bookmark.id}
                  className="overflow-hidden cursor-pointer hover:border-primary/50 transition-all bg-white dark:bg-card-dark"
                  onClick={() => navigate(`/quran/read/${bookmark.surah}`)}
                >
                  <div className="flex items-start gap-3 p-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                      <div className="text-center">
                        <div className="text-xl font-black text-primary dark:text-primary-light">{bookmark.ayah}</div>
                        <div className="text-[10px] text-text-muted">آية</div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="font-bold text-lg text-primary dark:text-primary-light truncate">{bookmark.surahName}</h3>
                        <Bookmark size={16} className="text-primary shrink-0" />
                      </div>

                      <p className="text-sm leading-relaxed text-text-main dark:text-text-darkMain line-clamp-4 border-r-2 border-primary/20 pr-2">
                        {bookmark.text}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
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
