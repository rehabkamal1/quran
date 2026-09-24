import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { X, Share, PlusSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';

export const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    // Never show PWA banner inside Capacitor Android APK
    if (Capacitor.isNativePlatform()) {
      return;
    }

    // Never show if already running as installed standalone app
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Check if user has dismissed it within the last 24 hours
      const dismissed = localStorage.getItem('pwa_prompt_dismissed');
      const ONE_DAY = 24 * 60 * 60 * 1000;
      const isDismissedRecently = dismissed && (Date.now() - parseInt(dismissed, 10) < ONE_DAY);

      if (!isDismissedRecently) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Support manual trigger from settings or buttons
    const handleManualTrigger = () => {
      setShowPrompt(true);
    };
    window.addEventListener('show-install-pwa', handleManualTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('show-install-pwa', handleManualTrigger);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instructions for browsers that don't support beforeinstallprompt
      setShowIosInstructions(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for 24 hours
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[100]"
        >
          <Card className="p-4 shadow-2xl border border-primary/20 bg-white/95 dark:bg-card-dark/95 backdrop-blur-md relative overflow-hidden">
            <button 
              onClick={handleDismiss}
              className="absolute top-2 left-2 p-1 text-text-muted hover:text-text-main transition-colors"
            >
              <X size={18} />
            </button>
            
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border border-primary/20 shrink-0 bg-primary/10">
                <img src="/pwa-192x192.png" alt="هداية" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg leading-none">تثبيت تطبيق "هداية"</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  احصل على تجربة أسرع وبدون إنترنت بتثبيت المنصة على جهازك!
                </p>
                {showIosInstructions ? (
                  <div className="bg-primary/10 border border-primary/20 p-2.5 rounded-xl text-xs space-y-1 text-primary-dark dark:text-primary-light">
                    <p className="font-bold">لتثبيت التطبيق يدوياً:</p>
                    <p>1. اضغط على زر المشاركة <Share size={12} className="inline mx-1" /> في شريط المتصفح.</p>
                    <p>2. اختر <strong>"إضافة إلى الشاشة الرئيسية"</strong> <PlusSquare size={12} className="inline mx-1" />.</p>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleInstall} className="py-2 text-sm">
                      تثبيت الآن
                    </Button>
                    <Button onClick={handleDismiss} variant="outline" className="py-2 text-sm">
                      لاحقاً
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
