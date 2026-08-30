import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { ChevronRight, Bookmark } from 'lucide-react';
import { quranApi } from '../services/quranApi';
import type { SurahMeta } from '../services/quranApi';

// Static mapping of Juz to their containing Surahs
export const JUZ_SURAHS: Record<number, number[]> = {
  1: [1, 2], 2: [2], 3: [2, 3], 4: [3, 4], 5: [4], 6: [4, 5], 7: [5, 6], 8: [6, 7], 9: [7, 8], 10: [8, 9],
  11: [9, 10, 11], 12: [11, 12], 13: [12, 13, 14], 14: [15, 16], 15: [17, 18], 16: [18, 19, 20], 17: [21, 22],
  18: [23, 24, 25], 19: [25, 26, 27], 20: [27, 28, 29], 21: [29, 30, 31, 32, 33], 22: [33, 34, 35, 36],
  23: [36, 37, 38, 39], 24: [39, 40, 41], 25: [41, 42, 43, 44, 45], 26: [46, 47, 48, 49, 50, 51],
  27: [51, 52, 53, 54, 55, 56, 57], 28: [58, 59, 60, 61, 62, 63, 64, 65, 66], 29: [67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77],
  30: [78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114]
};

export const JuzView: React.FC = () => {
  const { juzId } = useParams<{ juzId: string }>();
  const navigate = useNavigate();
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const juzNumber = parseInt(juzId || '1');
  const surahNumbers = JUZ_SURAHS[juzNumber] || [];

  useEffect(() => {
    const loadData = async () => {
      const data = await quranApi.getSurahs();
      // Filter only the surahs that belong to this Juz
      const juzSurahs = data.filter(s => surahNumbers.includes(s.number));
      setSurahs(juzSurahs);
      setLoading(false);
    };
    loadData();
  }, [juzNumber]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/quran')}
          className="p-2 bg-black/5 dark:bg-white/5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <ChevronRight size={24} />
        </button>
        <h1 className="text-2xl font-bold text-primary dark:text-primary-light">
          سور الجزء {juzNumber}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-full bg-black/10 dark:bg-white/10"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-1/2"></div>
              </div>
            </Card>
          ))
        ) : (
          surahs.map((surah) => (
            <Card 
              key={surah.number} 
              className="flex items-center justify-between p-4 cursor-pointer hover:border-primary/50 transition-colors bg-white dark:bg-card-dark"
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
              <div className="text-primary/50">
                <Bookmark size={20} />
              </div>
            </Card>
          ))
        )}
      </div>

    </div>
  );
};
