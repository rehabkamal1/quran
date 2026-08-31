import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, CheckCircle2, Sparkles, X } from 'lucide-react';
import { Button } from './Button';
import { notificationService } from '../../services/notificationService';

export const AdhkarPromptModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already been prompted or enabled/disabled alerts
    const hasBeenPrompted = localStorage.getItem('adhkar_prompt_dismissed');
    const alertsSet = localStorage.getItem('adhkar_alerts_enabled');

    if (!hasBeenPrompted && alertsSet === null) {
      // Delay prompt slightly for better user onboarding experience
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    const granted = await notificationService.requestPermission();
    localStorage.setItem('adhkar_prompt_dismissed', 'true');

    if (granted) {
      notificationService.setEnabled(true);
      setIsOpen(false);
      
      // Show confirmation test notification
      notificationService.showNotification(
        "تم تفعيل التنبيهات بنجاح! 🎉",
        "سنقوم بتذكيرك بمواعيد أذكار الصباح والمساء يومياً إن شاء الله.",
        "/adhkar"
      );
    } else {
      alert("يرجى إعطاء الإذن للتنبيهات من إعدادات المتصفح لتمكين هذه الميزة.");
      setIsOpen(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('adhkar_prompt_dismissed', 'true');
    notificationService.setEnabled(false);
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="relative w-full max-w-md bg-white dark:bg-card-dark rounded-3xl p-6 md:p-8 shadow-2xl border border-primary/20 text-center space-y-6 overflow-hidden"
            dir="rtl"
          >
            {/* Background Accent Glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 left-4 p-2 text-text-muted hover:text-text-main dark:hover:text-white transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/5"
            >
              <X size={20} />
            </button>

            {/* Header Icon */}
            <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center shadow-lg shadow-primary/30">
              <Bell size={36} className="animate-bounce" />
              <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 rounded-full p-1 shadow-md">
                <Sparkles size={16} />
              </div>
            </div>

            {/* Text Content */}
            <div className="space-y-2">
              <h3 className="text-xl md:text-2xl font-bold text-primary dark:text-primary-light">
                تفعيل تنبيهات الأذكار Daily Adhkar
              </h3>
              <p className="text-sm md:text-base text-text-muted dark:text-text-darkMuted leading-relaxed">
                هل ترغب في استقبال تنبيهات بمواعيد أذكار الصباح والمساء يومياً مع الصوت والمحتوى الكامل؟
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button
                variant="primary"
                className="w-full py-3.5 text-base font-bold shadow-md hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                onClick={handleEnable}
              >
                <CheckCircle2 size={20} />
                <span>نعم، فعّل التنبيهات</span>
              </Button>

              <Button
                variant="outline"
                className="w-full py-3.5 text-base font-semibold border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center gap-2"
                onClick={handleDismiss}
              >
                <BellOff size={18} />
                <span>ليس الآن</span>
              </Button>
            </div>

            {/* Footer hint */}
            <p className="text-xs text-text-muted/80 font-sans">
              يمكنك تغيير هدا الخيار في أي وقت من الإعدادات أو الصفحة الرئيسية.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
