import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Check if user has already dismissed it recently
      const dismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for 7 days
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
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg">
                <Download size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg leading-none">تثبيت تطبيق "هداية"</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  احصل على تجربة أفضل وبدون إنترنت بتثبيت المنصة على جهازك!
                </p>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleInstall} className="py-2 text-sm">
                    تثبيت الآن
                  </Button>
                  <Button onClick={handleDismiss} variant="outline" className="py-2 text-sm">
                    لاحقاً
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
