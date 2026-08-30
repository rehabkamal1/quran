import React from 'react';
import { Card } from '../components/ui/Card';
import { Sun, Moon, Star, Shield, Heart } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

export const Adhkar: React.FC = () => {
  const navigate = useNavigate();
  
  const categories = [
    { id: 'morning', title: 'أذكار الصباح', icon: Sun, color: 'text-amber-500 bg-amber-500/10' },
    { id: 'evening', title: 'أذكار المساء', icon: Moon, color: 'text-indigo-500 bg-indigo-500/10' },
    { id: 'sleep', title: 'أذكار النوم', icon: Star, color: 'text-purple-500 bg-purple-500/10' },
    { id: 'prayer', title: 'أذكار بعد الصلاة', icon: Heart, color: 'text-emerald-500 bg-emerald-500/10' },
    { id: 'wake', title: 'أذكار الاستيقاظ', icon: Sun, color: 'text-orange-500 bg-orange-500/10' },
    { id: 'ruqyah', title: 'الرقية الشرعية', icon: Shield, color: 'text-teal-500 bg-teal-500/10' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-primary dark:text-primary-light">حصن المسلم</h1>
        <p className="text-text-muted dark:text-text-darkMuted text-lg">أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {categories.map((cat, idx) => (
          <Card 
            key={idx} 
            className="flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1"
            onClick={() => navigate(`/adhkar/${cat.id}`)}
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
