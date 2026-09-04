import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { useDarkMode } from '../../hooks/useDarkMode';
import { InstallPWA } from '../ui/InstallPWA';
import { AdhkarPromptModal } from '../ui/AdhkarPromptModal';
import { useAdhan } from '../../context/AdhanContext';
import { notificationService } from '../../services/notificationService';

export const Layout: React.FC = () => {
  // Initialize dark mode on app load
  useDarkMode();
  const { isPlaying, currentPrayerName, stopAdhan, adhanEnabled, audioUnlocked, unlockAudio } = useAdhan();

  React.useEffect(() => {
    return notificationService.startReminderScheduler();
  }, []);

  return (
    <div className="min-h-screen pb-16 md:pb-0 flex flex-col relative">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 py-6 md:py-8">
        <Outlet />
      </main>
      <MobileNav />
      <InstallPWA />
      <AdhkarPromptModal />

      {/* Audio Unlock Banner after Page Reload */}
      {adhanEnabled && !audioUnlocked && (
        <div 
          onClick={unlockAudio}
          className="fixed top-20 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/20 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all animate-bounce"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔊</span>
            <div>
              <p className="font-bold text-sm">اضغط لتفعيل الأذان تلقائيًا</p>
              <p className="text-xs opacity-90">تفعيل صلاحية الصوت لجلسة المتصفح الحالية 🕌</p>
            </div>
          </div>
          <button className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg font-bold">
            تأكيد 🔔
          </button>
        </div>
      )}

      {/* Adhan Playing Alert Banner */}
      {isPlaying && (
        <div className="fixed bottom-24 md:bottom-6 left-6 right-6 md:left-auto md:w-96 z-50 bg-primary dark:bg-primary-light text-white dark:text-background-dark p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <div>
              <p className="font-bold text-sm">حان الآن موعد أذان {currentPrayerName}</p>
              <p className="text-xs opacity-80">يصدح الأذان الآن في أرجاء التطبيق</p>
            </div>
          </div>
          <button 
            onClick={stopAdhan}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
          >
            إيقاف
          </button>
        </div>
      )}
    </div>
  );
};
