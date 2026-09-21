import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Download, X, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { updateService } from '../../services/updateService';
import type { AppVersionInfo } from '../../services/updateService';

export const UpdatePromptModal: React.FC = () => {
  const [remoteUpdateInfo, setRemoteUpdateInfo] = useState<AppVersionInfo | null>(null);
  const [isTestPrompt, setIsTestPrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Vite PWA Service Worker Hook
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        // Immediate check on app launch
        registration.update().catch(err => console.warn('[PWA] Immediate update check failed:', err));

        // Periodic check every 15 minutes
        const interval = setInterval(() => {
          registration.update().catch(err => console.warn('[PWA] Periodic update check failed:', err));
        }, 15 * 60 * 1000);

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

  // Listen for custom test event triggered from Settings
  useEffect(() => {
    const handleTestOpen = () => setIsTestPrompt(true);
    window.addEventListener('open-update-modal', handleTestOpen);
    return () => window.removeEventListener('open-update-modal', handleTestOpen);
  }, []);

  // Check for remote version update (works in all browsers and APK)
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const result = await updateService.checkForRemoteUpdate();
        if (result.hasUpdate && result.info) {
          if (!updateService.isUpdateDismissed(result.info.version)) {
            setRemoteUpdateInfo(result.info);
          }
        }
      } catch (err) {
        console.warn('[UpdateService] Check failed:', err);
      }
    };

    checkVersion();
  }, []);

  const isNative = updateService.isNativeApp();

  const handleApplyWebUpdate = async () => {
    setIsUpdating(true);
    try {
      if (needRefresh) {
        await updateServiceWorker(true);
      }
      // Clean caches to guarantee fresh bundle
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      window.location.reload();
    } catch (err) {
      console.error('[PWA] Failed to update service worker:', err);
      window.location.reload();
    }
  };

  const handleDownloadApk = () => {
    const downloadUrl = remoteUpdateInfo?.apkDownloadUrl || 'https://github.com/rehabkamal1/quran/releases/tag/apk-latest';
    window.open(downloadUrl, '_blank');
    setRemoteUpdateInfo(null);
    setIsTestPrompt(false);
  };

  const handleDismiss = () => {
    if (remoteUpdateInfo) {
      updateService.dismissUpdate(remoteUpdateInfo.version);
    }
    setNeedRefresh(false);
    setRemoteUpdateInfo(null);
    setIsTestPrompt(false);
  };

  const isOpen = needRefresh || Boolean(remoteUpdateInfo) || isTestPrompt;

  if (!isOpen) {
    return null;
  }

  const newVersionStr = remoteUpdateInfo?.version || (isTestPrompt ? '1.0.2' : 'الجديدة');
  const releaseNotes = remoteUpdateInfo?.notes || (isTestPrompt ? 'تحديث مواقيت الصلاة لتتوافق 100% مع الهيئة المصرية العامة للمساحة، ميزة البحث في إذاعات القرآن الكريم، وتفعيل التنبيهات وسجل المواظبة.' : '');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-300">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 25 }}
          transition={{ type: 'spring', stiffness: 350, damping: 26 }}
          className="relative w-full max-w-md bg-white dark:bg-[#1A2228] rounded-3xl p-6 md:p-8 shadow-2xl border border-primary/30 text-center space-y-6 overflow-hidden"
          dir="rtl"
        >
          {/* Background Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close / Dismiss Button */}
          <button
            onClick={handleDismiss}
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
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-xs font-bold text-primary dark:text-primary-light">
              <CheckCircle2 size={14} />
              <span>إصدار جديد متوفر ({newVersionStr})</span>
            </div>

            <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              {isNative ? 'تحديث جديد لتطبيق أندرويد 📱' : 'تحديث جديد متوفر للمنصة 🚀'}
            </h3>

            <p className="text-sm text-text-muted dark:text-text-darkMuted leading-relaxed">
              تم إصدار نسخة أحدث ومحدثة من منصة وتطبيق هداية تحتوي على تحسينات هامة وميزات جديدة. هل ترغب في التحديث الآن؟
            </p>

            {/* Release notes badge */}
            {releaseNotes && (
              <div className="p-3 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 text-xs text-right space-y-1 mt-2">
                <span className="font-bold text-primary dark:text-primary-light block">✨ ما الجديد في هذا التحديث:</span>
                <span className="text-gray-700 dark:text-gray-300 block leading-relaxed">{releaseNotes}</span>
              </div>
            )}

            {isTestPrompt && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 py-1 px-2.5 rounded-lg font-bold">
                ⚠️ هذه نافذة معاينة تجريبية لاختبار مظهر وتفاعل نظام التحديثات.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            {isNative ? (
              <Button
                variant="primary"
                className="w-full py-3.5 text-sm font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer bg-primary hover:bg-primary-dark text-white"
                onClick={handleDownloadApk}
              >
                <Download size={18} />
                <span>تحميل التحديث (APK) 📥</span>
              </Button>
            ) : (
              <Button
                variant="primary"
                disabled={isUpdating}
                className="w-full py-3.5 text-sm font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer bg-primary hover:bg-primary-dark text-white"
                onClick={handleApplyWebUpdate}
              >
                <RefreshCw size={18} className={isUpdating ? 'animate-spin' : ''} />
                <span>{isUpdating ? 'جاري تطبيق التحديث...' : 'تحديث الآن ✨'}</span>
              </Button>
            )}

            <Button
              variant="secondary"
              className="w-full sm:w-auto py-3.5 px-6 text-sm font-bold hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              onClick={handleDismiss}
            >
              لاحقاً
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
