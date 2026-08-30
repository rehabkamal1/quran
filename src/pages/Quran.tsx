import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Search, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { quranApi } from '../services/quranApi';
import type { SurahMeta } from '../services/quranApi';

export const Quran: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'surah' | 'juz'>('surah');
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedJuz, setExpandedJuz] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      const data = await quranApi.getSurahs();
      setSurahs(data);
      setLoading(false);
    };
    loadData();
  }, []);

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
      <div className="flex bg-black/5 dark:bg-white/5 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('surah')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'surah' ? 'bg-white dark:bg-card-dark shadow-sm text-primary dark:text-primary-light' : 'text-text-muted hover:text-text-main'}`}
        >
          السور
        </button>
        <button
          onClick={() => setActiveTab('juz')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'juz' ? 'bg-white dark:bg-card-dark shadow-sm text-primary dark:text-primary-light' : 'text-text-muted hover:text-text-main'}`}
        >
          الأجزاء
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
          filteredSurahs.map((surah) => (
            <Card 
              key={surah.number} 
              className="flex items-center justify-between p-4 cursor-pointer hover:border-primary/50 transition-colors"
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
              <div className="text-text-muted">
                <Bookmark size={20} />
              </div>
            </Card>
          ))
        ) : (
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
                <div className="text-primary/50">
                  <Bookmark size={20} />
                </div>
              </Card>
            );
          })
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
