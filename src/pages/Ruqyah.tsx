import React from 'react';
import { Card } from '../components/ui/Card';
import { ruqyahData } from '../data/ruqyahData';
import { ShieldCheck } from 'lucide-react';

export const Ruqyah: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-primary dark:text-primary-light flex items-center justify-center gap-2">
          <ShieldCheck size={32} /> الرقية الشرعية
        </h1>
        <p className="text-text-muted dark:text-text-darkMuted text-lg">من الكتاب والسنة النبوية</p>
      </div>

      <div className="space-y-4">
        {ruqyahData.map((item, index) => (
          <Card key={index} className="p-6 border-0 bg-white dark:bg-card-dark shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-primary">{item.title}</h3>
              <span className="text-sm font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
                تكرار: {item.count}
              </span>
            </div>
            <p className="font-quran text-2xl leading-loose text-center text-primary-dark dark:text-primary-light">
              {item.content}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
};
