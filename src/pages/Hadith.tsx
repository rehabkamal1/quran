import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { hadithData } from '../data/hadithData';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, Search, Loader2 } from 'lucide-react';

export const Hadith: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kids' | 'teens' | 'general' | 'library'>('kids');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  // Library State
  const [libraryBook, setLibraryBook] = useState<'bukhari' | 'muslim' | 'nawawi'>('bukhari');
  const [libraryData, setLibraryData] = useState<any[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const filteredHadith = hadithData.filter(h => h.ageGroup === activeTab);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const loadLibraryBook = useCallback(async (bookName: string) => {
    setLibraryLoading(true);
    try {
      const res = await fetch(`/data/hadiths/${bookName}.json`);
      const data = await res.json();
      setLibraryData(data.hadiths || []);
      setPage(1);
    } catch (e) {
      console.error('Failed to load book', e);
    }
    setLibraryLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'library') {
      loadLibraryBook(libraryBook);
    }
  }, [activeTab, libraryBook, loadLibraryBook]);

  // Library Pagination and Filtering
  const filteredLibrary = libraryData.filter(h => h.text.includes(searchQuery));
  const displayedLibrary = filteredLibrary.slice(0, page * ITEMS_PER_PAGE);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-primary dark:text-primary-light">الأحاديث النبوية</h1>
        <p className="text-text-muted dark:text-text-darkMuted text-lg">من السيرة العطرة والمكتبة الشاملة</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap bg-black/5 dark:bg-white/5 rounded-xl p-1 mb-8">
        <button
          onClick={() => setActiveTab('kids')}
          className={`flex-1 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === 'kids' ? 'bg-white dark:bg-card-dark shadow-sm text-primary dark:text-primary-light' : 'text-text-muted hover:text-text-main'}`}
        >
          للأطفال (3-7)
        </button>
        <button
          onClick={() => setActiveTab('teens')}
          className={`flex-1 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === 'teens' ? 'bg-white dark:bg-card-dark shadow-sm text-primary dark:text-primary-light' : 'text-text-muted hover:text-text-main'}`}
        >
          للأشبال (8-12)
        </button>
        <button
          onClick={() => setActiveTab('general')}
          className={`flex-1 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === 'general' ? 'bg-white dark:bg-card-dark shadow-sm text-primary dark:text-primary-light' : 'text-text-muted hover:text-text-main'}`}
        >
          مختارات الكبار
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 py-3 rounded-lg text-sm font-bold transition-colors ${activeTab === 'library' ? 'bg-white dark:bg-card-dark shadow-sm text-primary dark:text-primary-light' : 'text-text-muted hover:text-text-main'}`}
        >
          المكتبة الشاملة
        </button>
      </div>

      {/* Library View */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-black/5 dark:bg-white/5 p-4 rounded-xl">
            <div className="flex gap-2">
              <button onClick={() => setLibraryBook('bukhari')} className={`px-4 py-2 rounded-lg font-bold text-sm ${libraryBook === 'bukhari' ? 'bg-primary text-white' : 'bg-white dark:bg-card-dark'}`}>صحيح البخاري</button>
              <button onClick={() => setLibraryBook('muslim')} className={`px-4 py-2 rounded-lg font-bold text-sm ${libraryBook === 'muslim' ? 'bg-primary text-white' : 'bg-white dark:bg-card-dark'}`}>صحيح مسلم</button>
              <button onClick={() => setLibraryBook('nawawi')} className={`px-4 py-2 rounded-lg font-bold text-sm ${libraryBook === 'nawawi' ? 'bg-primary text-white' : 'bg-white dark:bg-card-dark'}`}>الأربعون النووية</button>
            </div>
            <div className="relative w-full md:w-64">
              <input 
                type="text" 
                placeholder="ابحث في المتن..." 
                className="w-full bg-white dark:bg-card-dark rounded-lg px-4 py-2 pr-10 border border-black/10 dark:border-white/10 outline-none focus:border-primary"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              />
              <Search className="absolute right-3 top-2.5 text-text-muted" size={18} />
            </div>
          </div>

          {libraryLoading ? (
            <div className="flex justify-center p-12 text-primary">
              <Loader2 className="animate-spin" size={32} />
            </div>
          ) : (
            <div className="space-y-4">
              {displayedLibrary.map((hadith) => (
                <Card key={hadith.hadithnumber} className="p-6 text-right leading-loose border-0 bg-white dark:bg-card-dark shadow-sm">
                  <div className="flex items-center gap-2 mb-4 text-primary font-bold">
                    <BookOpen size={18} /> رقم الحديث: {hadith.hadithnumber}
                  </div>
                  <p className="font-quran text-xl leading-loose">{hadith.text}</p>
                </Card>
              ))}
              
              {filteredLibrary.length > displayedLibrary.length && (
                <button 
                  onClick={() => setPage(p => p + 1)}
                  className="w-full py-3 text-center text-primary font-bold bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors"
                >
                  تحميل المزيد
                </button>
              )}
              {filteredLibrary.length === 0 && (
                <div className="text-center p-8 text-text-muted">لا توجد نتائج مطابقة للبحث.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Curated Hadith List */}
      {activeTab !== 'library' && (
        <div className="space-y-4">
          {filteredHadith.map((hadith, index) => {
            const isExpanded = expandedId === hadith.id;
            
            return (
              <Card 
                key={hadith.id} 
                className={`p-0 overflow-hidden cursor-pointer transition-all duration-300 border-2 ${isExpanded ? 'border-primary/30 shadow-md' : 'border-transparent hover:border-black/5 dark:hover:border-white/5'}`}
                onClick={() => toggleExpand(hadith.id)}
              >
                <div className="p-6 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                      {index + 1}
                    </div>
                    <h3 className="font-quran text-xl md:text-2xl leading-loose text-primary dark:text-primary-light">
                      {hadith.text}
                    </h3>
                  </div>
                  <ChevronDown 
                    size={24} 
                    className={`text-text-muted transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-180 text-primary' : ''}`} 
                  />
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]"
                    >
                      <div className="p-6 space-y-4">
                        <div className="flex gap-3 text-lg leading-relaxed">
                          <BookOpen size={24} className="text-secondary shrink-0 mt-1" />
                          <p>{hadith.explanation}</p>
                        </div>
                        <div className="text-left text-sm text-text-muted font-bold pt-4">
                          [ {hadith.reference} ]
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
