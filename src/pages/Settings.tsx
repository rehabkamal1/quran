import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Moon, Sun, Headphones, Globe, Trash2, Heart, ChevronLeft } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { audioService, RECITERS } from '../services/audioService';
import { useNavigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const { isDark, toggleDarkMode } = useDarkMode();
  const [selectedReciter, setSelectedReciter] = useState(audioService.getReciter());
  const navigate = useNavigate();

  const handleReciterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedReciter(val);
    audioService.setReciter(val);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <h1 className="text-3xl font-bold text-primary dark:text-primary-light mb-8">الإعدادات</h1>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-text-muted">المظهر والصوت</h2>
        <Card className="divide-y divide-black/5 dark:divide-white/5 p-0">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {isDark ? <Moon size={20} className="text-primary" /> : <Sun size={20} className="text-primary" />}
              <span className="font-semibold">الوضع الداكن</span>
            </div>
            <Button variant={isDark ? "primary" : "outline"} size="sm" onClick={toggleDarkMode}>
              {isDark ? 'مفعل' : 'تفعيل'}
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Headphones size={20} className="text-primary" />
              <span className="font-semibold">القارئ المفضل</span>
            </div>
            <select 
              value={selectedReciter} 
              onChange={handleReciterChange}
              className="bg-black/5 dark:bg-white/10 border-0 rounded-lg p-2 outline-none cursor-pointer text-sm"
            >
              {RECITERS.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-text-muted">عام</h2>
        <Card className="divide-y divide-black/5 dark:divide-white/5 p-0">
          <div 
            onClick={() => navigate('/about')}
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Heart size={20} className="text-rose-500 fill-rose-500/20" />
              <span className="font-semibold">عن المطور والدعم (صدقة جارية)</span>
            </div>
            <ChevronLeft size={20} className="text-text-muted" />
          </div>

          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <Globe size={20} className="text-primary" />
              <span className="font-semibold">اللغة</span>
            </div>
            <span className="text-sm text-text-muted">العربية</span>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-red-500">منطقة الخطر</h2>
        <Card className="p-0 border-red-200 dark:border-red-900 overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <Trash2 size={20} />
              <span className="font-semibold">حذف جميع البيانات</span>
            </div>
            <Button variant="outline" size="sm" className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50">
              حذف
            </Button>
          </div>
        </Card>
        <p className="text-xs text-text-muted px-2">سيتم حذف جميع إعداداتك ومفضلاتك وآخر موضع قراءة.</p>
      </section>

    </div>
  );
};
