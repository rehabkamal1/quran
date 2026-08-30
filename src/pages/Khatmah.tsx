import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ProgressBar } from '../components/ui/ProgressBar';
import { BookOpen, Calendar, CheckCircle } from 'lucide-react';

interface KhatmahPlan {
  days: number;
  pagesPerDay: number;
  startDate: string;
  completedPages: number;
}

export const Khatmah: React.FC = () => {
  const [plan, setPlan] = useState<KhatmahPlan | null>(null);
  const [targetDays, setTargetDays] = useState('30');
  const TOTAL_PAGES = 604;

  useEffect(() => {
    const saved = localStorage.getItem('khatmah_plan');
    if (saved) {
      setPlan(JSON.parse(saved));
    }
  }, []);

  const createPlan = () => {
    const days = parseInt(targetDays);
    if (isNaN(days) || days <= 0) return;
    
    const newPlan: KhatmahPlan = {
      days,
      pagesPerDay: Math.ceil(TOTAL_PAGES / days),
      startDate: new Date().toISOString(),
      completedPages: 0
    };
    
    setPlan(newPlan);
    localStorage.setItem('khatmah_plan', JSON.stringify(newPlan));
  };

  const addProgress = (pages: number) => {
    if (!plan) return;
    const updated = {
      ...plan,
      completedPages: Math.min(plan.completedPages + pages, TOTAL_PAGES)
    };
    setPlan(updated);
    localStorage.setItem('khatmah_plan', JSON.stringify(updated));
  };

  const deletePlan = () => {
    setPlan(null);
    localStorage.removeItem('khatmah_plan');
  };

  if (!plan) {
    return (
      <div className="max-w-md mx-auto space-y-6 animate-in fade-in duration-500 pb-20 text-center mt-12">
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <BookOpen size={40} />
        </div>
        <h1 className="text-3xl font-bold text-primary dark:text-primary-light mb-2">خطة ختم القرآن</h1>
        <p className="text-text-muted mb-8">حدد عدد الأيام التي ترغب في ختم القرآن خلالها، وسنقوم بحساب الورد اليومي لك.</p>
        
        <Card className="p-6 space-y-6">
          <div className="text-right">
            <label className="block text-sm font-bold mb-2">المدة (بالأيام)</label>
            <Input 
              type="number" 
              value={targetDays}
              onChange={(e) => setTargetDays(e.target.value)}
              icon={Calendar}
              min="1"
            />
          </div>
          
          <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl flex justify-between items-center">
            <span className="font-bold">الورد اليومي:</span>
            <span className="text-xl font-bold text-primary dark:text-primary-light">
              {Math.ceil(TOTAL_PAGES / (parseInt(targetDays) || 30))} صفحات
            </span>
          </div>

          <Button className="w-full" onClick={createPlan}>
            إنشاء الخطة
          </Button>
        </Card>
      </div>
    );
  }

  const progressPercentage = (plan.completedPages / TOTAL_PAGES) * 100;
  const todayTarget = plan.pagesPerDay;

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-primary dark:text-primary-light">خطة الختمة</h1>
        <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={deletePlan}>
          إلغاء الخطة
        </Button>
      </div>

      <Card className="bg-gradient-to-br from-primary to-primary-light text-white border-0 shadow-lg p-8">
        <div className="text-center space-y-2 mb-8">
          <p className="text-white/80">نسبة الإنجاز الإجمالية</p>
          <h2 className="text-5xl font-bold" dir="ltr">{Math.round(progressPercentage)}%</h2>
        </div>
        
        <ProgressBar progress={progressPercentage} color="secondary" className="bg-white/20 h-3" />
        
        <div className="flex justify-between mt-4 text-sm text-white/90">
          <span>{plan.completedPages} صفحة مقروءة</span>
          <span>المتبقي {TOTAL_PAGES - plan.completedPages}</span>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center p-6 bg-black/5 dark:bg-white/5 border-0">
          <p className="text-text-muted mb-2">الورد اليومي</p>
          <p className="text-3xl font-bold text-primary dark:text-primary-light">{plan.pagesPerDay}</p>
          <p className="text-sm text-text-muted mt-1">صفحات</p>
        </Card>
        
        <Card className="text-center p-6 bg-black/5 dark:bg-white/5 border-0">
          <p className="text-text-muted mb-2">المدة المتبقية</p>
          <p className="text-3xl font-bold text-primary dark:text-primary-light">
            {Math.ceil((TOTAL_PAGES - plan.completedPages) / plan.pagesPerDay)}
          </p>
          <p className="text-sm text-text-muted mt-1">يوم</p>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="font-bold text-lg border-b border-black/5 dark:border-white/5 pb-4">تحديث الإنجاز اليومي</h3>
        <p className="text-text-muted text-sm">كم صفحة قرأت اليوم؟</p>
        
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => addProgress(1)}>+1</Button>
          <Button variant="outline" className="flex-1" onClick={() => addProgress(5)}>+5</Button>
          <Button variant="primary" className="flex-1 gap-2" onClick={() => addProgress(todayTarget)}>
            <CheckCircle size={18} /> الورد كاملاً
          </Button>
        </div>
      </Card>
    </div>
  );
};
