import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RotateCcw, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TASBIH_SEQUENCE = [
  { text: 'سُبْحَانَ اللَّهِ', target: 33 },
  { text: 'الْحَمْدُ لِلَّهِ', target: 33 },
  { text: 'اللَّهُ أَكْبَرُ', target: 34 },
  { text: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', target: 1 },
];

export const Tasbih: React.FC = () => {
  const [stage, setStage] = useState(0);
  const [count, setCount] = useState(0);

  const currentDhikr = TASBIH_SEQUENCE[stage];
  const isFinished = stage >= TASBIH_SEQUENCE.length;

  const handleTap = () => {
    if (isFinished) return;

    const newCount = count + 1;
    if (newCount >= currentDhikr.target) {
      // Move to next stage
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]); // Long vibration for stage complete
      setCount(0);
      setStage(s => s + 1);
    } else {
      setCount(newCount);
      if (navigator.vibrate) navigator.vibrate(50); // Short vibration for normal tap
    }
  };

  const reset = () => {
    setCount(0);
    setStage(0);
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  };

  return (
    <div className="max-w-md mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      <div className="text-center space-y-4 min-h-[100px]">
        <h1 className="text-3xl font-bold text-primary dark:text-primary-light mb-4">المسبحة الإلكترونية</h1>
        
        <AnimatePresence mode="wait">
          {isFinished ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-emerald-500 flex flex-col items-center gap-2 font-bold text-xl"
            >
              <CheckCircle size={48} />
              تقبل الله طاعتكم!
            </motion.div>
          ) : (
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="font-quran text-3xl leading-loose text-text-main dark:text-text-darkMain"
            >
              {currentDhikr.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-center mt-12">
        <div className="relative w-64 h-64 md:w-80 md:h-80">
          {/* Decorative Rings */}
          <div className="absolute inset-0 rounded-full border-[8px] border-primary/10"></div>
          
          {/* Tap Area */}
          <motion.button
            whileTap={!isFinished ? { scale: 0.95 } : {}}
            onClick={handleTap}
            disabled={isFinished}
            className={`absolute inset-4 rounded-full shadow-2xl flex flex-col items-center justify-center text-white focus:outline-none transition-colors ${isFinished ? 'bg-black/10 dark:bg-white/10' : 'bg-gradient-to-tr from-primary to-primary-light cursor-pointer'}`}
          >
            {!isFinished && (
              <>
                <span className="text-lg opacity-80 mb-2">الهدف: {currentDhikr.target}</span>
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={count}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-7xl font-bold block"
                  >
                    {count}
                  </motion.span>
                </AnimatePresence>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center gap-2 mt-8">
        {TASBIH_SEQUENCE.map((_, idx) => (
          <div 
            key={idx} 
            className={`w-3 h-3 rounded-full transition-colors duration-300 ${idx < stage ? 'bg-emerald-500' : idx === stage ? 'bg-primary scale-125' : 'bg-black/10 dark:bg-white/10'}`} 
          />
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <Button variant="ghost" onClick={reset} className="gap-2 text-text-muted hover:text-red-500">
          <RotateCcw size={20} />
          إعادة التسبيح
        </Button>
      </div>
      
    </div>
  );
};
