import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Download, X } from 'lucide-react';
import { Button } from './Button';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { updateService } from '../../services/updateService';
import type { AppVersionInfo } from '../../services/updateService';

export const UpdatePromptModal: React.FC = () => {
  const [remoteApkUpdate, setRemoteApkUpdate] = useState<AppVersionInfo | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Vite PWA Service Worker Hook
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        // Immediate check on app mount
        registration.update().catch(err => console.warn('[PWA] Immediate update check failed:', err));

        // Periodic check every 20 minutes
        const interval = setInterval(() => {
          registration.update().catch(err => console.warn('[PWA] Periodic update check failed:', err));
        }, 20 * 60 * 1000);

        // Check whenever the user refocuses the app/tab
        const onVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(err => console.warn('[PWA] Visibility update check failed:', err));
          }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('focus', onVisibilityChange);

        return () => {
          clearInterval(interval);
          document.removeEventListener('visibilitychange', onVisibilityChange);
          window.removeEventListener('focus', onVisibilityChange);
        };
      }
    },
    onRegisterError(error) {
      console.warn('[PWA] Registration error:', error);
    }
  });

  // Check for remote APK version update (for native APK users or web users wanting the APK)
  useEffect(() => {
    const checkApk = async () => {
      try {
        const result = await updateService.checkForRemoteUpdate();
        if (result.hasUpdate && result.info) {
          if (!updateService.isUpdateDismissed(result.info.version)) {
            setRemoteApkUpdate(result.info);
          }
        }
      } catch (err) {
        console.warn('[UpdateService] Check failed:', err);
      }
    };

    checkApk();
  }, []);

  const handleApplyWebUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateServiceWorker(true);
    } catch (err) {
      console.error('[PWA] Failed to update service worker:', err);
      window.location.reload();
    }
  };

  const handleDismissWebUpdate = () => {
    setNeedRefresh(false);
  };

  const handleDownloadApk = () => {
    if (remoteApkUpdate) {
      window.open(remoteApkUpdate.apkDownloadUrl, '_blank');
      setRemoteApkUpdate(null);
    }
  };

  const handleDismissApk = () => {
    if (remoteApkUpdate) {
      updateService.dismissUpdate(remoteApkUpdate.version);
      setRemoteApkUpdate(null);
    }
  };

  // Determine which update modal to show (PWA web update has priority)
  const showWebModal = needRefresh;
  const showApkModal = !needRefresh && Boolean(remoteApkUpdate);

  if (!showWebModal && !showApkModal) {
    return null;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 25 }}
          transition={{ type: 'spring', stiffness: 350, damping: 26 }}
          className="relative w-full max-w-md bg-white dark:bg-card-dark rounded-3xl p-6 md:p-8 shadow-2xl border border-primary/20 text-center space-y-6 overflow-hidden"
          dir="rtl"
        >
          {/* Background Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Close / Dismiss Button */}
          <button
            onClick={showWebModal ? handleDismissWebUpdate : handleDismissApk}
            className="absolute top-4 left-4 p-2 text-text-muted hover:text-text-main dark:hover:text-white transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            title="إغلاق والتذكير لاحقاً"
          >
            <X size={20} />
          </button>

          {/* Header Icon */}
          <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-primary via-[#1a7765] to-primary-dark text-white flex items-center justify-center shadow-xl shadow-primary/25">
            <RefreshCw size={36} className={`text-white ${isUpdating ? 'animate-spin' : 'animate-bounce'}`} />
            <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 rounded-full p-1.5 shadow-md">
              <Sparkles size={16} />
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-2">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              {showWebModal ? 'تحديث جديد متوفر للتطبيق 🚀' : 'تحديث جديد متوفر للتطبيق (APK) 📱'}
            </h3>
            <p className="text-sm text-text-muted dark:text-text-darkMuted leading-relaxed">
              {showWebModal
                ? 'تم إصدار نسخة أحدث ومحدثة من منصة هداية تحتوي على تحسينات جديدة وإصلاحات هامة. هل ترغب في التحديث الآن؟'
                : `يتوفر إصدار جديد من تطبيق هداية (الإصدار ${remoteApkUpdate?.version}). يتضمن تحسينات لمواقيت الصلاة ومنبهات الأذان.`}
            </p>

            {/* Release notes badge if APK update */}
            {showApkModal && remoteApkUpdate?.notes && (
              <div className="p-3 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 text-xs text-right space-y-1">
                <span className="font-bold text-primary dark:text-primary-light block">✨ ما الجديد في هذا الإصدار:</span>
                <span className="text-gray-700 dark:text-gray-300 block">{remoteApkUpdate.notes}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            {showWebModal ? (
              <Button
                variant="primary"
                disabled={isUpdating}
                className="w-full py-3.5 text-sm font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer bg-primary hover:bg-primary-dark text-white"
                onClick={handleApplyWebUpdate}
              >
                <RefreshCw size={18} className={isUpdating ? 'animate-spin' : ''} />
                <span>{isUpdating ? 'جاري تطبيق التحديث...' : 'تحديث الآن ✨'}</span>
              </Button>
            ) : (
              <Button
                variant="primary"
                className="w-full py-3.5 text-sm font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer bg-primary hover:bg-primary-dark text-white"
                onClick={handleDownloadApk}
              >
                <Download size={18} />
                <span>تحميل التحديث (APK) 📥</span>
              </Button>
            )}

            <Button
              variant="secondary"
              className="w-full sm:w-auto py-3.5 px-5 text-sm font-bold hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              onClick={showWebModal ? handleDismissWebUpdate : handleDismissApk}
            >
              لاحقاً
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
