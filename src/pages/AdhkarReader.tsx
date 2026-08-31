import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import { adhkarApi } from '../services/adhkarApi';
import type { Dhikr } from '../services/adhkarApi';
import { motion, AnimatePresence } from 'framer-motion';

export const AdhkarReader: React.FC = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  
  const [adhkarList, setAdhkarList] = useState<Dhikr[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadData = async () => {
      if (!categoryId) return;
      setLoading(true);
      const list = await adhkarApi.getAdhkarByCategory(categoryId);
      setAdhkarList(list);
      
      const initialCounts = list.reduce((acc, dhikr) => ({
        ...acc,
        [dhikr.id]: dhikr.count
      }), {} as Record<string, number>);
      
      setCounts(initialCounts);
      setLoading(false);
    };
    loadData();
  }, [categoryId]);

  const getCategoryName = (id: string) => {
    switch(id) {
      case 'morning': return 'أذكار الصباح';
      case 'evening': return 'أذكار المساء';
      case 'sleep': return 'أذكار النوم';
      case 'wake': return 'أذكار الاستيقاظ';
      case 'after-prayer': return 'أذكار بعد الصلاة';
      case 'tasbih': return 'تسابيح';
      case 'quranic-duas': return 'أدعية قرآنية';
      case 'prophetic-duas': return 'أدعية الأنبياء';
      default: return 'الأذكار';
    }
  };

  const handleTap = (id: string) => {
    setCounts(prev => {
      const current = prev[id];
      if (current > 0) {
        if (navigator.vibrate) navigator.vibrate(50);
        return { ...prev, [id]: current - 1 };
      }
      return prev;
    });
  };

  const isCompleted = (id: string) => counts[id] === 0;
  const allCompleted = adhkarList.length > 0 && adhkarList.every(d => isCompleted(d.id));

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24">
      
      {/* Header */}
      <div className="sticky top-0 md:top-20 z-40 bg-background/95 dark:bg-background-dark/95 backdrop-blur-md py-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate('/adhkar')}>
          <ChevronRight size={24} />
        </Button>
        <h2 className="font-bold text-xl text-primary dark:text-primary-light">
          {getCategoryName(categoryId || '')}
        </h2>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      {/* Completion Banner */}
      <AnimatePresence>
        {allCompleted && adhkarList.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl flex items-center gap-3"
          >
            <CheckCircle2 size={24} />
            <span className="font-bold">بارك الله فيك، لقد أتممت الأذكار!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Adhkar List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-12 text-primary">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <>
            {adhkarList.map(dhikr => (
              <motion.div
                key={dhikr.id}
                layout
                initial={{ opacity: 1 }}
                animate={{ opacity: isCompleted(dhikr.id) ? 0.6 : 1 }}
              >
                <Card 
                  className={`p-6 md:p-8 text-center cursor-pointer select-none transition-all duration-300 ${isCompleted(dhikr.id) ? 'bg-black/5 dark:bg-white/5 border-transparent shadow-none' : 'hover:border-primary/50'}`}
                  onClick={() => handleTap(dhikr.id)}
                >
                  <p className="font-quran text-2xl md:text-3xl leading-loose mb-6 whitespace-pre-line">
                    {dhikr.text}
                  </p>

                  {dhikr.description && (
                    <p className="text-sm text-amber-700 dark:text-amber-500 bg-amber-500/5 p-3 rounded-xl mb-4 font-sans leading-relaxed">
                      {dhikr.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between border-t border-black/10 dark:border-white/10 pt-4 mt-4">
                    <span className="text-sm text-text-muted">{dhikr.reference}</span>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-bold text-text-muted">
                        المطلوب: {dhikr.count}
                      </div>
                      
                      <motion.div 
                        key={counts[dhikr.id]}
                        initial={{ scale: 1.2, color: '#176B5B' }}
                        animate={{ scale: 1, color: isCompleted(dhikr.id) ? '#10B981' : '' }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-inner
                          ${isCompleted(dhikr.id) ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-primary text-white'}
                        `}
                      >
                        {isCompleted(dhikr.id) ? <CheckCircle2 size={20} /> : counts[dhikr.id]}
                      </motion.div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
            
            {adhkarList.length === 0 && (
              <div className="text-center p-12 text-text-muted">
                سيتم إضافة أذكار هذا القسم قريباً.
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};
