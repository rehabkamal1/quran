import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Sun, Moon, Star, Shield, Heart, Compass, Activity, BookOpen, Bookmark, BellRing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/notificationService';

export const Adhkar: React.FC = () => {
  const navigate = useNavigate();
  
  const categories = [
    { id: 'morning', title: 'أذكار الصباح', icon: Sun, color: 'text-amber-500 bg-amber-500/10' },
    { id: 'evening', title: 'أذكار المساء', icon: Moon, color: 'text-indigo-500 bg-indigo-500/10' },
    { id: 'sleep', title: 'أذكار النوم', icon: Star, color: 'text-purple-500 bg-purple-500/10' },
    { id: 'wake', title: 'أذكار الاستيقاظ', icon: Compass, color: 'text-orange-500 bg-orange-500/10' },
    { id: 'after-prayer', title: 'أذكار بعد الصلاة', icon: Heart, color: 'text-emerald-500 bg-emerald-500/10' },
    { id: 'tasbih', title: 'تسابيح', icon: Activity, color: 'text-rose-500 bg-rose-500/10' },
    { id: 'quranic-duas', title: 'أدعية قرآنية', icon: BookOpen, color: 'text-blue-500 bg-blue-500/10' },
    { id: 'prophetic-duas', title: 'أدعية الأنبياء', icon: Bookmark, color: 'text-red-500 bg-red-500/10' },
    { id: 'ruqyah', title: 'الرقية الشرعية', icon: Shield, color: 'text-teal-500 bg-teal-500/10' },
  ];

  const handleTestAdhkar = async (type: 'morning' | 'evening') => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }

    if (type === 'morning') {
      notificationService.showNotification(
        "أذكار الصباح ☀️ (اختبار)",
        "«أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ» 🎧 اضغط للاستماع المباشر للأذكار",
        "/adhkar/morning?autoplay=true"
      );
      navigate('/adhkar/morning?autoplay=true');
    } else {
      notificationService.showNotification(
        "أذكار المساء 🌙 (اختبار)",
        "«أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ» 🎧 اضغط للاستماع المباشر للأذكار",
        "/adhkar/evening?autoplay=true"
      );
      navigate('/adhkar/evening?autoplay=true');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-3xl font-bold text-primary dark:text-primary-light">حصن المسلم</h1>
        <p className="text-text-muted dark:text-text-darkMuted text-lg">أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ</p>
      </div>

      {/* Test Adhkar Notifications Card */}
      <Card className="p-4 bg-gradient-to-r from-amber-500/10 via-primary/10 to-indigo-500/10 border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 text-right" dir="rtl">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold shrink-0 shadow-md">
            <BellRing size={20} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-primary dark:text-primary-light">اختبار إشعارات وتلاوة الأذكار 🔔</h3>
            <p className="text-xs text-text-muted">تجربة إرسال إشعار التنبيه والاستماع الفوري لأذكار الصباح والمساء الآن</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 sm:flex-none text-xs gap-1.5 border-amber-500/50 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 font-bold"
            onClick={() => handleTestAdhkar('morning')}
          >
            <Sun size={16} /> ☀️ تجربة أذكار الصباح
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 sm:flex-none text-xs gap-1.5 border-indigo-500/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/10 font-bold"
            onClick={() => handleTestAdhkar('evening')}
          >
            <Moon size={16} /> 🌙 تجربة أذكار المساء
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {categories.map((cat, idx) => (
          <Card 
            key={idx} 
            className="flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1"
            onClick={() => cat.id === 'ruqyah' ? navigate('/ruqyah') : navigate(`/adhkar/${cat.id}`)}
          >
            <div className={`p-4 rounded-2xl mb-4 ${cat.color}`}>
              <cat.icon size={32} />
            </div>
            <h3 className="font-bold text-lg">{cat.title}</h3>
          </Card>
        ))}
      </div>
    </div>
  );
};

