import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { duasData } from '../data/duasData';
import { Heart, Copy, CheckCircle } from 'lucide-react';

export const Duas: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-primary dark:text-primary-light">الأدعية الجامعة</h1>
        <p className="text-text-muted dark:text-text-darkMuted text-lg">وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ</p>
      </div>

      {duasData.map((category) => (
        <section key={category.id} className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Heart className="text-rose-500" size={24} />
            {category.title}
          </h2>
          <div className="grid gap-4">
            {category.duas.map((dua, index) => (
              <Card key={index} className="p-6 relative group border-0 bg-white dark:bg-card-dark shadow-sm hover:shadow-md transition-shadow">
                <p className="font-quran text-2xl leading-loose text-center text-primary-dark dark:text-primary-light">{dua}</p>
                <button 
                  onClick={() => copyToClipboard(dua)}
                  className="absolute top-2 left-2 p-2 rounded-full bg-black/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-primary"
                  title="نسخ الدعاء"
                >
                  {copied === dua ? <CheckCircle size={18} className="text-emerald-500" /> : <Copy size={18} />}
                </button>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
