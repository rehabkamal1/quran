import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, X, Volume2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dhikrReminderService } from '../../services/dhikrReminderService';
import type { DhikrItem } from '../../services/dhikrReminderService';

export const DhikrToast: React.FC = () => {
  const [currentDhikr, setCurrentDhikr] = useState<DhikrItem | null>(null);
  const [repeated, setRepeated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    dhikrReminderService.setOnDhikrListener((item) => {
      setCurrentDhikr(item);
      setRepeated(false);
    });

    return () => {
      dhikrReminderService.removeOnDhikrListener();
    };
  }, []);

  // Auto-dismiss after 12 seconds
  useEffect(() => {
    if (!currentDhikr) return;
    const timer = setTimeout(() => {
      setCurrentDhikr(null);
    }, 12000);
    return () => clearTimeout(timer);
  }, [currentDhikr]);

  if (!currentDhikr) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -60, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -40, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="fixed top-4 left-4 right-4 md:left-auto md:right-6 md:w-[420px] z-[999] pointer-events-auto"
        dir="rtl"
      >
        <div className="relative overflow-hidden bg-white/95 dark:bg-card-dark/95 backdrop-blur-xl border border-primary/30 dark:border-primary/40 rounded-3xl p-5 shadow-2xl shadow-primary/10">
          
          {/* Subtle Golden Glow Gradient Header */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-primary to-amber-500" />

          {/* Header Row */}
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-primary/15 dark:bg-primary-light/15 text-primary dark:text-primary-light flex items-center justify-center shrink-0">
                <Sparkles size={18} className="animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-text-primary dark:text-text-dark font-quran tracking-wide">
                  {currentDhikr.title}
                </h4>
                <span className="text-[11px] text-text-muted">تذكير روحي مبارك</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => dhikrReminderService.playAlertSound(currentDhikr)}
                title="إعادة سماع الصوت"
                className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-text-muted hover:text-primary transition-colors"
              >
                <Volume2 size={14} />
              </button>
              <button
                onClick={() => setCurrentDhikr(null)}
                className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-text-muted hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Dhikr Content Body */}
          <div className="bg-primary/5 dark:bg-primary-light/5 border border-primary/10 rounded-2xl p-3.5 mb-3 text-center">
            <p className="font-quran text-base sm:text-lg leading-relaxed text-primary-dark dark:text-primary-light font-medium select-text">
              {currentDhikr.body}
            </p>
          </div>

          {/* Quick Action Footer */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={() => setRepeated(true)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                repeated
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-primary text-white hover:bg-primary-dark active:scale-95 shadow-sm'
              }`}
            >
              <Heart size={14} className={repeated ? 'fill-white' : ''} />
              {repeated ? 'كتب الله أجرك ✨' : 'رددتُ الذكر 🤲'}
            </button>

            <button
              onClick={() => {
                setCurrentDhikr(null);
                navigate('/tasbih');
              }}
              className="py-2 px-3 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-muted hover:text-text-primary flex items-center gap-1 transition-colors"
            >
              <span>السبحة</span>
              <ArrowLeft size={13} />
            </button>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};

