import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Moon, Sun, Headphones, Globe, Trash2, Heart, ChevronLeft, BellRing, Volume2 } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { audioService, RECITERS } from '../services/audioService';
import { notificationService } from '../services/notificationService';
import { backgroundNotificationService } from '../services/backgroundNotificationService';
import { useAdhan } from '../context/AdhanContext';
import { useNavigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const { isDark, toggleDarkMode } = useDarkMode();
  const { adhanEnabled, toggleAdhan, audioUnlocked, unlockAudio, playTestAdhan } = useAdhan();
  const [selectedReciter, setSelectedReciter] = useState(audioService.getReciter());
  const [adhkarEnabled, setAdhkarEnabled] = useState(() => notificationService.isEnabled());
  const navigate = useNavigate();

  const handleReciterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedReciter(val);
    audioService.setReciter(val);
  };

  const handleToggleAdhkarAlerts = async () => {
    if (!adhkarEnabled) {
      const granted = await notificationService.requestPermission();
      if (granted) {
        notificationService.setEnabled(true);
        setAdhkarEnabled(true);
      } else {
        alert("يرجى إعطاء الإذن بالإشعارات من إعدادات المتصفح للاستفادة من تنبيهات الأذكار.");
      }
    } else {
      notificationService.setEnabled(false);
      setAdhkarEnabled(false);
    }
  };

  const handleTestAdhkar = async (type: 'morning' | 'evening') => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }

    if (type === 'morning') {
      notificationService.showNotification(
        "أذكار الصباح ☀️ (اختبار)",
        "«أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ» 🎧 اضغط للاستماع المباشر للأذكار",
        "/adhkar/morning?autoplay=true"
      );
      navigate('/adhkar/morning?autoplay=true');
    } else {
      notificationService.showNotification(
        "أذكار المساء 🌙 (اختبار)",
        "«أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ» 🎧 اضغط للاستماع المباشر للأذكار",
        "/adhkar/evening?autoplay=true"
      );
      navigate('/adhkar/evening?autoplay=true');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <h1 className="text-3xl font-bold text-primary dark:text-primary-light mb-8">الإعدادات</h1>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-text-muted">المظهر والصوت</h2>
        <Card className="divide-y divide-black/5 dark:divide-white/5 p-0">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {isDark ? <Moon size={20} className="text-primary" /> : <Sun size={20} className="text-primary" />}
              <span className="font-semibold">الوضع الداكن</span>
            </div>
            <Button variant={isDark ? "primary" : "outline"} size="sm" onClick={toggleDarkMode}>
              {isDark ? 'مفعل' : 'تفعيل'}
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Headphones size={20} className="text-primary" />
              <span className="font-semibold">القارئ المفضل</span>
            </div>
            <select 
              value={selectedReciter} 
              onChange={handleReciterChange}
              className="bg-black/5 dark:bg-white/10 border-0 rounded-lg p-2 outline-none cursor-pointer text-sm"
            >
              {RECITERS.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-text-muted">إشعارات الأذكار ومواقيت الصلاة</h2>
        
        {/* Layer 1 Adhan Audio Settings */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 size={20} className="text-primary" />
              <div>
                <div className="font-semibold">الأذان الصوتي الفوري (Layer 1)</div>
                <div className="text-xs text-text-muted">تشغيل صوت الأذان كاملاً تلقائياً طالما الصفحة مفتوحة</div>
              </div>
            </div>
            <Button 
              variant={adhanEnabled ? "primary" : "outline"} 
              size="sm" 
              onClick={toggleAdhan}
            >
              {adhanEnabled ? 'مفعّل' : 'تفعيل الأذان'}
            </Button>
          </div>

          <div className="border-t border-black/5 dark:border-white/5 pt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">صلاحية الصوت للجلسة:</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${audioUnlocked ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                {audioUnlocked ? '🔊 مفعلة وموثوقة' : '⚠️ تحتاج تأكيد التفاعل'}
              </span>
            </div>
            <div className="flex gap-2">
              {!audioUnlocked && (
                <Button size="sm" variant="primary" className="text-xs gap-1" onClick={unlockAudio}>
                  🔔 تفعيل الصوت الآن
                </Button>
              )}
              <Button size="sm" variant="outline" className="text-xs gap-1 border-primary/40" onClick={() => playTestAdhan()}>
                🎧 سماع الأذان (تجربة)
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BellRing size={20} className="text-primary" />
              <div>
                <div className="font-semibold">تنبيهات أذكار الصباح والمساء</div>
                <div className="text-xs text-text-muted">إرسال إشعار تفاعلي مع إمكانية الاستماع الفوري</div>
              </div>
            </div>
            <Button 
              variant={adhkarEnabled ? "primary" : "outline"} 
              size="sm" 
              onClick={handleToggleAdhkarAlerts}
            >
              {adhkarEnabled ? 'مفعّلة' : 'تفعيل الإشعارات'}
            </Button>
          </div>

          <div className="border-t border-black/5 dark:border-white/5 pt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-text-muted">اختبار التنبيه الفوري الآن:</span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs gap-1 border-amber-500/50 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                onClick={() => handleTestAdhkar('morning')}
              >
                <Sun size={14} /> ☀️ أذكار الصباح
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs gap-1 border-indigo-500/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/10"
                onClick={() => handleTestAdhkar('evening')}
              >
                <Moon size={14} /> 🌙 أذكار المساء
              </Button>
            </div>
          </div>
        </Card>

        {/* Background Notifications (Layer 2) */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BellRing size={20} className="text-amber-600 dark:text-amber-400" />
              <div>
                <div className="font-semibold">إشعارات مواقيت الصلاة في الخلفية (Layer 2)</div>
                <div className="text-xs text-text-muted">تنبيهات منبثقة عند دخول وقت الصلاة عبر الـ Service Worker</div>
              </div>
            </div>
            <Button 
              variant={backgroundNotificationService.isBackgroundEnabled() ? "primary" : "outline"} 
              size="sm" 
              onClick={async () => {
                if (backgroundNotificationService.isBackgroundEnabled()) {
                  await backgroundNotificationService.unsubscribeFromPush();
                } else {
                  await backgroundNotificationService.subscribeToPush();
                }
                window.location.reload();
              }}
            >
              {backgroundNotificationService.isBackgroundEnabled() ? 'مفعّلة' : 'تفعيل إشعارات الخلفية'}
            </Button>
          </div>

          <div className="border-t border-black/5 dark:border-white/5 pt-3 flex items-center justify-between">
            <span className="text-xs text-text-muted">اختبار إشعار الخلفية (Service Worker Notification)</span>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs border-primary/40"
              onClick={async () => {
                const ok = await backgroundNotificationService.sendTestBackgroundNotification({
                  title: 'اختبار إشعار الصلاة في الخلفية 🕌',
                  body: 'هذا إشعار تجريبي عبر Service Worker مستقل لتنبيهات الخلفية',
                  url: '/prayer'
                });
                if (!ok) alert('يرجى السماح بالإشعارات في المتصفح أولاً.');
              }}
            >
              🔔 إرسال إشعار تجريبي
            </Button>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-text-muted">عام</h2>
        <Card className="divide-y divide-black/5 dark:divide-white/5 p-0">
          <div 
            onClick={() => navigate('/about')}
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Heart size={20} className="text-rose-500 fill-rose-500/20" />
              <span className="font-semibold">عن المطور والدعم (صدقة جارية)</span>
            </div>
            <ChevronLeft size={20} className="text-text-muted" />
          </div>

          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <Globe size={20} className="text-primary" />
              <span className="font-semibold">اللغة</span>
            </div>
            <span className="text-sm text-text-muted">العربية</span>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-red-500">منطقة الخطر</h2>
        <Card className="p-0 border-red-200 dark:border-red-900 overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <Trash2 size={20} />
              <span className="font-semibold">حذف جميع البيانات</span>
            </div>
            <Button variant="outline" size="sm" className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50">
              حذف
            </Button>
          </div>
        </Card>
        <p className="text-xs text-text-muted px-2">سيتم حذف جميع إعداداتك ومفضلاتك وآخر موضع قراءة.</p>
      </section>

    </div>
  );
};
