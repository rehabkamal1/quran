import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Moon, Sun, Headphones, Globe, Trash2, Heart, ChevronLeft, BellRing, 
  Volume2, Smartphone, Download, Share2, MapPin, Compass, Check, AlertTriangle, 
  BookOpen, Type, X, RefreshCw
} from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { audioService, RECITERS } from '../services/audioService';
import { notificationService } from '../services/notificationService';
import { backgroundNotificationService } from '../services/backgroundNotificationService';
import { nativeNotificationService } from '../services/nativeNotificationService';
import { dhikrReminderService } from '../services/dhikrReminderService';
import { updateService } from '../services/updateService';
import { useAdhan } from '../context/AdhanContext';
import { useNavigate } from 'react-router-dom';
import { CITIES } from '../data/cities';

const CALC_METHODS = [
  { id: 'egypt', name: 'الهيئة المصرية العامة للمساحة (الفجر 19.5° - العشاء 17.5°)' },
  { id: 'makkah', name: 'جامعة أم القرى - مكة المكرمة' },
  { id: 'mwl', name: 'رابطة العالم الإسلامي' },
  { id: 'uae', name: 'الهيئة العامة للشؤون الإسلامية (الإمارات)' },
  { id: 'isna', name: 'الجمعية الإسلامية لأمريكا الشمالية (ISNA)' },
  { id: 'kuwait', name: 'الكويت' },
  { id: 'qatar', name: 'قطر' },
];

import { MUEZZINS } from '../data/muezzins';
import { QURAN_FONT_SIZES, setQuranFontSize as saveQuranFontSize } from '../data/quranSettings';

export const Settings: React.FC = () => {
  const { isDark, toggleDarkMode } = useDarkMode();
  const { adhanEnabled, toggleAdhan, audioUnlocked, unlockAudio, playTestAdhan } = useAdhan();
  const navigate = useNavigate();

  // Settings states
  const [selectedReciter, setSelectedReciter] = useState(audioService.getReciter());
  const [adhkarEnabled, setAdhkarEnabled] = useState(() => notificationService.isEnabled());
  
  // Prayer & Location settings
  const [useLocation, setUseLocation] = useState(() => localStorage.getItem('prayer_use_location') !== 'false');
  const [selectedCity, setSelectedCity] = useState(() => localStorage.getItem('prayer_selected_city') || 'Cairo');
  const [calcMethod, setCalcMethod] = useState(() => localStorage.getItem('prayer_calc_method') || 'egypt');
  const [asrMethod, setAsrMethod] = useState(() => localStorage.getItem('prayer_asr_juristic') || 'standard');
  
  // Adhan & Notification custom choices
  const [selectedMuezzin, setSelectedMuezzin] = useState(() => localStorage.getItem('adhan_muezzin_voice') || 'makkah');
  const [testAudioPlaying, setTestAudioPlaying] = useState(false);
  const [audioPlayerInstance, setAudioPlayerInstance] = useState<HTMLAudioElement | null>(null);

  // Periodic Dhikr & Salawat settings
  const [dhikrEnabled, setDhikrEnabled] = useState(() => dhikrReminderService.isEnabled());
  const [dhikrInterval, setDhikrInterval] = useState(() => dhikrReminderService.getIntervalMinutes());
  const [dhikrVoice, setDhikrVoice] = useState(() => dhikrReminderService.isVoiceEnabled());

  // Individual prayer toggles
  const [prayerToggles, setPrayerToggles] = useState(() => {
    try {
      const saved = localStorage.getItem('prayer_individual_toggles');
      return saved ? JSON.parse(saved) : { fajr: true, sunrise: false, dhuhr: true, asr: true, maghrib: true, isha: true };
    } catch {
      return { fajr: true, sunrise: false, dhuhr: true, asr: true, maghrib: true, isha: true };
    }
  });

  // Additional reminders
  const [fridayKahf, setFridayKahf] = useState(() => localStorage.getItem('reminder_kahf_friday') !== 'false');
  const [qiyamNight, setQiyamNight] = useState(() => localStorage.getItem('reminder_qiyam_night') === 'true');

  // Quran Font Size
  const [quranFontSize, setQuranFontSize] = useState(() => localStorage.getItem('quran_font_size') || 'md');

  // Modals & Feedback
  const [showApkGuideModal, setShowApkGuideModal] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const isNative = nativeNotificationService.isNative();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Stop test audio if unmounted
  useEffect(() => {
    return () => {
      if (audioPlayerInstance) {
        audioPlayerInstance.pause();
      }
    };
  }, [audioPlayerInstance]);

  const handleReciterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedReciter(val);
    audioService.setReciter(val);
    showToast('تم تحديث القارئ المفضل بنجاح');
  };

  const handleCityChange = (cityId: string) => {
    setSelectedCity(cityId);
    localStorage.setItem('prayer_selected_city', cityId);
    localStorage.removeItem('prayer_timings_cache');
    showToast(`تم ضبط المدينة على ${CITIES.find(c => c.id === cityId)?.name}`);
  };

  const handleToggleLocation = () => {
    const nextVal = !useLocation;
    setUseLocation(nextVal);
    localStorage.setItem('prayer_use_location', String(nextVal));
    localStorage.removeItem('prayer_timings_cache');
    showToast(nextVal ? 'تم تفعيل التحديد التلقائي للموقع (GPS)' : 'تم الاعتماد على المدينة المحددة يدوياً');
  };

  const handleCalcMethodChange = (methodId: string) => {
    setCalcMethod(methodId);
    localStorage.setItem('prayer_calc_method', methodId);
    localStorage.removeItem('prayer_timings_cache');
    showToast('تم تحديث طريقة الحساب الفلكي');
  };

  const handlePrayerToggleChange = (key: keyof typeof prayerToggles) => {
    const updated = { ...prayerToggles, [key]: !prayerToggles[key] };
    setPrayerToggles(updated);
    localStorage.setItem('prayer_individual_toggles', JSON.stringify(updated));
  };

  const handleMuezzinChange = (muezzinId: string) => {
    if (audioPlayerInstance) {
      audioPlayerInstance.pause();
      setTestAudioPlaying(false);
    }
    setSelectedMuezzin(muezzinId);
    localStorage.setItem('adhan_muezzin_voice', muezzinId);
    const m = MUEZZINS.find(item => item.id === muezzinId);
    showToast(`تم اختيار ${m?.name || 'صوت الأذان'}`);
  };

  const handleTestMuezzinVoice = () => {
    if (testAudioPlaying && audioPlayerInstance) {
      audioPlayerInstance.pause();
      setTestAudioPlaying(false);
      return;
    }

    const muezzin = MUEZZINS.find(m => m.id === selectedMuezzin) || MUEZZINS[0];
    const audio = new Audio(muezzin.url);
    audio.play()
      .then(() => {
        setTestAudioPlaying(true);
        setAudioPlayerInstance(audio);
        audio.onended = () => setTestAudioPlaying(false);
      })
      .catch((err) => {
        console.warn('Local audio test failed, trying backup URL:', err);
        if (muezzin.backupUrl) {
          audio.src = muezzin.backupUrl;
          audio.play()
            .then(() => {
              setTestAudioPlaying(true);
              setAudioPlayerInstance(audio);
              audio.onended = () => setTestAudioPlaying(false);
            })
            .catch(() => {
              setTestAudioPlaying(false);
              showToast('تعذر تشغيل الصوت، يرجى النقر على الشاشة أولاً لتفعيل صلاحيات الصوت');
            });
        } else {
          setTestAudioPlaying(false);
          showToast('تعذر تشغيل الصوت، يرجى النقر على الشاشة أولاً لتفعيل صلاحيات الصوت');
        }
      });
  };

  const handleToggleAdhkarAlerts = async () => {
    if (!adhkarEnabled) {
      const granted = await notificationService.requestPermission();
      if (granted) {
        notificationService.setEnabled(true);
        setAdhkarEnabled(true);
        showToast('تم تفعيل تنبيهات الأذكار اليومية بنجاح 🔔');
      } else {
        alert("يرجى إعطاء الإذن بالإشعارات من إعدادات المتصفح للاستفادة من تنبيهات الأذكار.");
      }
    } else {
      notificationService.setEnabled(false);
      setAdhkarEnabled(false);
      showToast('تم إيقاف تنبيهات الأذكار');
    }
  };

  const handleTestAdhkar = async (type: 'morning' | 'evening') => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }

    if (type === 'morning') {
      notificationService.showNotification(
        "أذكار الصباح ☀️ (اختبار)",
        "«أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ» 🎧 اضغط للاستماع",
        "/adhkar/morning?autoplay=true"
      );
      navigate('/adhkar/morning?autoplay=true');
    } else {
      notificationService.showNotification(
        "أذكار المساء 🌙 (اختبار)",
        "«أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ» 🎧 اضغط للاستماع",
        "/adhkar/evening?autoplay=true"
      );
      navigate('/adhkar/evening?autoplay=true');
    }
  };

  const handleSendTestNotification = async () => {
    if (isNative) {
      const ok = await nativeNotificationService.sendTestNotification();
      if (ok) {
        showToast('تم إرسال إشعار فوري تجريبي لنظام أندرويد 🕌');
      } else {
        alert('يرجى منح صلاحية الإشعارات للتطبيق من إعدادات هاتفك.');
      }
    } else {
      const ok = await backgroundNotificationService.sendTestBackgroundNotification({
        title: 'اختبار إشعار الصلاة 🕌',
        body: 'حان الآن موعد أذان الصلاة — حي على الصلاة حي على الفلاح',
        url: '/prayer'
      });
      if (ok) {
        showToast('تم إرسال إشعار تجريبي بنجاح 🕌');
      } else {
        alert('يرجى السماح بالإشعارات في المتصفح أولاً.');
      }
    }
  };

  const handleToggleDhikr = async () => {
    const next = !dhikrEnabled;
    setDhikrEnabled(next);
    await dhikrReminderService.setEnabled(next);
    showToast(next ? 'تم تفعيل التذكير بالصلاة على النبي والأذكار' : 'تم إيقاف التذكير بالأذكار');
  };

  const handleChangeDhikrInterval = async (val: number) => {
    setDhikrInterval(val);
    await dhikrReminderService.setIntervalMinutes(val);
    const label = val === 60 ? 'ساعة' : val === 30 ? '30 دقيقة' : `${val / 60} ساعات`;
    showToast(`تم ضبط التكرار: كل ${label}`);
  };

  const handleToggleDhikrVoice = (val: boolean) => {
    setDhikrVoice(val);
    dhikrReminderService.setVoiceEnabled(val);
    showToast(val ? 'تم تفعيل الصوت والنطق بالذكر' : 'تم إيقاف الصوت والنطق');
  };

  const handleTestDhikrNow = () => {
    dhikrReminderService.triggerDhikr();
    showToast('تم إرسال إشعار وتجربة صوت الذكر الآن ✨');
  };

  const handleFontSizeChange = (sizeId: string) => {
    setQuranFontSize(sizeId);
    saveQuranFontSize(sizeId as any);
    showToast(`تم تغيير حجم الخط إلى (${QURAN_FONT_SIZES.find(f => f.id === sizeId)?.label})`);
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'هداية — تطبيق القرآن الكريم ومواقيت الصلاة',
      text: 'حمّل واستمتع بتطبيق هداية للقرآن الكريم، مواقيت الصلاة، الأذكار، والقبلة بتجربة موبايل متكاملة (صدقة جارية):',
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled share
      }
    }

    navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
    showToast('تم نسخ رابط التطبيق للمشاركة 📋');
  };

  const handleCheckForUpdates = async () => {
    setCheckingUpdate(true);
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update();
        }
      }

      const res = await updateService.checkForRemoteUpdate();
      if (res.hasUpdate && res.info) {
        window.dispatchEvent(new CustomEvent('open-update-modal'));
        showToast(`تم اكتشاف إصدار جديد (${res.info.version})! 🚀`);
      } else {
        showToast(`أنت تستخدم أحدث إصدار من منصة هداية بالفعل! ✓ (v${updateService.getCurrentVersion()})`);
      }
    } catch {
      showToast(`أنت تستخدم أحدث إصدار من منصة هداية بالفعل! ✓ (v${updateService.getCurrentVersion()})`);
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleResetAllData = () => {
    localStorage.clear();
    setShowResetConfirmModal(false);
    showToast('تمت استعادة الإعدادات الافتراضية بنجاح');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const currentFontSizeObj = QURAN_FONT_SIZES.find(f => f.id === quranFontSize) || QURAN_FONT_SIZES[1];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24">

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-secondary-dark/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-primary/30 flex items-center gap-3 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary-light flex items-center justify-center shrink-0">
            <Check size={14} />
          </div>
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-primary dark:text-primary-light font-quran">
            الإعدادات العامة
          </h1>
          <p className="text-xs text-text-muted mt-1">
            تخصيص تجربة التلاوة، مواقيت الصلاة، وتنبيهات الأذان
          </p>
        </div>

        {/* Platform Badge */}
        <div className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary dark:text-primary-light text-xs font-bold">
          <Smartphone size={14} />
          <span>{isNative ? 'تطبيق أندرويد أصلي (APK)' : 'تطبيق ويب تقدمي (PWA)'}</span>
        </div>
      </div>

      {/* ==========================================
          SECTION 1: APK & APP SHARING BANNER
      ========================================== */}
      <Card className="p-5 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-primary/30 rounded-3xl shadow-soft relative overflow-hidden">
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-primary-light text-white flex items-center justify-center shadow-md shrink-0">
              <Smartphone size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-text-main dark:text-text-darkMain">
                  تطبيق هداية للأندرويد (ملف APK)
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  جاهز للتثبيت
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                تنزيل التطبيق بصيغة APK لتشغيل الأذان في الخلفية بدون قيود المتصفح
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant="primary"
              className="flex-1 sm:flex-initial text-xs gap-1.5 py-2.5 shadow-md"
              onClick={() => setShowApkGuideModal(true)}
            >
              <Download size={15} />
              <span>تحميل الـ APK</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1.5 py-2.5 bg-white dark:bg-card-dark border-primary/30"
              onClick={handleShareApp}
            >
              <Share2 size={15} />
              <span>مشاركة</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* ==========================================
          SECTION 2: PRAYER TIMES & LOCATION
      ========================================== */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-text-muted flex items-center gap-2 px-1">
          <Compass size={16} className="text-primary" />
          <span>مواقيت الصلاة وتحديد الموقع</span>
        </h2>

        <Card className="divide-y divide-black/5 dark:divide-white/5 p-0 rounded-2xl overflow-hidden">
          {/* GPS Toggle */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <MapPin size={18} />
              </div>
              <div>
                <div className="font-bold text-sm">التحديد التلقائي للموقع (GPS)</div>
                <div className="text-xs text-text-muted">حساب المواقيت الدقيقة وفق إحداثيات موقعك الجغرافي الحالي</div>
              </div>
            </div>
            <Button 
              variant={useLocation ? "primary" : "outline"} 
              size="sm" 
              onClick={handleToggleLocation}
              className="text-xs font-bold"
            >
              {useLocation ? 'مفعّل' : 'تفعيل'}
            </Button>
          </div>

          {/* Manual City Select */}
          {!useLocation && (
            <div className="flex items-center justify-between p-4 bg-black/[0.02] dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Globe size={18} />
                </div>
                <div>
                  <div className="font-bold text-sm">المدينة المحددة</div>
                  <div className="text-xs text-text-muted">اختر مدينتك لحساب المواقيت والقبلة</div>
                </div>
              </div>
              <select
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
                className="bg-white dark:bg-card-dark border border-black/10 dark:border-white/10 rounded-xl p-2 text-xs font-bold outline-none cursor-pointer text-text-main dark:text-text-darkMain"
              >
                {CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.country})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Calculation Method */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2">
            <div>
              <div className="font-bold text-sm">طريقة الحساب الفلكي</div>
              <div className="text-xs text-text-muted">المعيار الفلكي المعتمد لزوايا الفجر والعشاء</div>
            </div>
            <select
              value={calcMethod}
              onChange={(e) => handleCalcMethodChange(e.target.value)}
              className="bg-white dark:bg-card-dark border border-black/10 dark:border-white/10 rounded-xl p-2 text-xs font-bold outline-none cursor-pointer text-text-main dark:text-text-darkMain max-w-xs"
            >
              {CALC_METHODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          {calcMethod === 'egypt' && (
            <div className="bg-emerald-500/5 px-4 py-2 border-t border-emerald-500/10 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
              <span>✓</span>
              <span>متوافق تماماً مع توقيتات الهيئة العامة المصرية للمساحة ودار الإفتاء المصرية (الفجر: 19.5°، العشاء: 17.5°).</span>
            </div>
          )}

          {/* Asr Juristic Method */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2">
            <div>
              <div className="font-bold text-sm">حساب صلاة العصر (المذهب الفقهي)</div>
              <div className="text-xs text-text-muted">الجمهور (الشافعي، المالكي، الحنبلي) أو الحنفي</div>
            </div>
            <select
              value={asrMethod}
              onChange={(e) => {
                setAsrMethod(e.target.value);
                localStorage.setItem('prayer_asr_juristic', e.target.value);
                localStorage.removeItem('prayer_timings_cache');
                showToast('تم تحديث مذهب حساب صلاة العصر');
              }}
              className="bg-white dark:bg-card-dark border border-black/10 dark:border-white/10 rounded-xl p-2 text-xs font-bold outline-none cursor-pointer text-text-main dark:text-text-darkMain max-w-xs"
            >
              <option value="standard">الجمهور (شافعي، مالكي، حنبلي)</option>
              <option value="hanafi">المذهب الحنفي</option>
            </select>
          </div>
        </Card>
      </section>

      {/* ==========================================
          SECTION 3: ADHAN & NOTIFICATIONS
      ========================================== */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-text-muted flex items-center gap-2 px-1">
          <BellRing size={16} className="text-primary" />
          <span>الأذان والتنبيهات المتقدمة</span>
        </h2>

        {/* Master Adhan Card */}
        <Card className="p-4 space-y-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Volume2 size={20} />
              </div>
              <div>
                <div className="font-bold text-sm">تشغيل صوت الأذان التلقائي</div>
                <div className="text-xs text-text-muted">
                  {isNative 
                    ? 'منبهات أندرويد دقيقة تعمل في الخلفية حتى مع إغلاق الهاتف' 
                    : 'يصدح صوت الأذان تلقائياً عند دخول وقت كل صلاة'}
                </div>
              </div>
            </div>
            <Button 
              variant={adhanEnabled ? "primary" : "outline"} 
              size="sm" 
              onClick={toggleAdhan}
              className="text-xs font-bold"
            >
              {adhanEnabled ? 'مفعّل' : 'تفعيل الأذان'}
            </Button>
          </div>

          {/* Muezzin Voice Select & Test */}
          <div className="border-t border-black/5 dark:border-white/5 pt-3.5 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs sm:text-sm font-bold text-text-main dark:text-text-darkMain">صوت المؤذن المفضل:</div>
                <div className="text-[11px] text-text-muted dark:text-text-darkMuted">اختر صوت الأذان المعتمد لمواقيت الصلوات</div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedMuezzin}
                  onChange={(e) => handleMuezzinChange(e.target.value)}
                  className="bg-white dark:bg-[#25282F] text-text-main dark:text-white border border-black/10 dark:border-white/10 rounded-xl p-2.5 text-xs font-bold outline-none cursor-pointer shadow-sm hover:border-primary/50 transition-colors max-w-[210px] sm:max-w-none"
                >
                  {MUEZZINS.map((m) => (
                    <option 
                      key={m.id} 
                      value={m.id}
                      className="bg-white text-zinc-900 dark:bg-[#1E232A] dark:text-zinc-100"
                    >
                      {m.name}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant={testAudioPlaying ? "primary" : "outline"}
                  className={`text-xs gap-1 py-2 px-3 shrink-0 ${
                    testAudioPlaying 
                      ? 'bg-primary text-white border-primary shadow-sm animate-pulse' 
                      : 'border-primary/40 dark:border-primary-light/40 dark:text-primary-light hover:bg-primary/10'
                  }`}
                  onClick={handleTestMuezzinVoice}
                >
                  {testAudioPlaying ? 'إيقاف ⏹️' : 'تجربة 🎧'}
                </Button>
              </div>
            </div>
          </div>

          {/* Individual Prayer Toggles */}
          <div className="border-t border-black/5 dark:border-white/5 pt-3">
            <div className="text-xs font-bold text-text-muted dark:text-text-darkMuted mb-2">تخصيص الأذان لكل صلاة:</div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { key: 'fajr', label: 'الفجر' },
                { key: 'sunrise', label: 'الشروق' },
                { key: 'dhuhr', label: 'الظهر' },
                { key: 'asr', label: 'العصر' },
                { key: 'maghrib', label: 'المغرب' },
                { key: 'isha', label: 'العشاء' },
              ].map(({ key, label }) => {
                const isSelected = prayerToggles[key as keyof typeof prayerToggles];
                return (
                  <button
                    key={key}
                    onClick={() => handlePrayerToggleChange(key as keyof typeof prayerToggles)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      isSelected
                        ? 'bg-primary/10 border-primary/40 text-primary dark:text-primary-light shadow-sm'
                        : 'bg-black/5 dark:bg-white/5 border-transparent text-text-muted dark:text-text-darkMuted opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div>{label}</div>
                    <div className="text-[10px] mt-0.5">{isSelected ? '✓ منبه' : 'صامت'}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audio Session & Test Alert */}
          <div className="border-t border-black/5 dark:border-white/5 pt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">حالة النظام:</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${audioUnlocked || isNative ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                {isNative ? '⚡ منبهات أندرويد نشطة' : audioUnlocked ? '🔊 الصوت مفعل' : '⚠️ يحتاج ضغطة لتفعيل الصوت'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {!audioUnlocked && !isNative && (
                <Button size="sm" variant="primary" className="text-xs gap-1" onClick={unlockAudio}>
                  تفعيل الصوت
                </Button>
              )}
              <Button size="sm" variant="outline" className="text-xs gap-1 border-primary/40" onClick={() => playTestAdhan()}>
                🎧 سماع الأذان كاملاً
              </Button>
              <Button size="sm" variant="outline" className="text-xs gap-1 border-primary/40" onClick={handleSendTestNotification}>
                🔔 تجربة إشعار فوري
              </Button>
            </div>
          </div>
        </Card>

        {/* Adhkar & Islamic Reminders Card */}
        <Card className="p-4 space-y-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Sun size={20} />
              </div>
              <div>
                <div className="font-bold text-sm">تنبيهات أذكار الصباح والمساء</div>
                <div className="text-xs text-text-muted">إشعار تفاعلي مع إمكانية الاستماع الفوري للأذكار</div>
              </div>
            </div>
            <Button 
              variant={adhkarEnabled ? "primary" : "outline"} 
              size="sm" 
              onClick={handleToggleAdhkarAlerts}
              className="text-xs font-bold"
            >
              {adhkarEnabled ? 'مفعّلة' : 'تفعيل'}
            </Button>
          </div>

          {/* Friday Kahf and Qiyam Night Reminders */}
          <div className="border-t border-black/5 dark:border-white/5 pt-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-text-main dark:text-text-darkMain">تذكير سورة الكهف يوم الجمعة</div>
                <div className="text-[10px] text-text-muted">إشعار صباح كل جمعة لقراءة سورة الكهف المباركة</div>
              </div>
              <Button
                size="sm"
                variant={fridayKahf ? "primary" : "outline"}
                className="text-xs py-1"
                onClick={() => {
                  const next = !fridayKahf;
                  setFridayKahf(next);
                  localStorage.setItem('reminder_kahf_friday', String(next));
                  showToast(next ? 'تم تفعيل تذكير سورة الكهف' : 'تم إيقاف تذكير سورة الكهف');
                }}
              >
                {fridayKahf ? 'مفعّل ✓' : 'إيقاف'}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-text-main dark:text-text-darkMain">تذكير قيام الليل وصلاة الوتر</div>
                <div className="text-[10px] text-text-muted">تنبيه في الثلث الأخير من الليل لقيام الليل</div>
              </div>
              <Button
                size="sm"
                variant={qiyamNight ? "primary" : "outline"}
                className="text-xs py-1"
                onClick={() => {
                  const next = !qiyamNight;
                  setQiyamNight(next);
                  localStorage.setItem('reminder_qiyam_night', String(next));
                  showToast(next ? 'تم تفعيل تذكير قيام الليل' : 'تم إيقاف تذكير قيام الليل');
                }}
              >
                {qiyamNight ? 'مفعّل ✓' : 'إيقاف'}
              </Button>
            </div>
          </div>

          <div className="border-t border-black/5 dark:border-white/5 pt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-text-muted">اختبار التنبيه الفوري الآن:</span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs gap-1 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                onClick={() => handleTestAdhkar('morning')}
              >
                <Sun size={13} /> ☀️ الصباح
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs gap-1 border-indigo-500/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/10"
                onClick={() => handleTestAdhkar('evening')}
              >
                <Moon size={13} /> 🌙 المساء
              </Button>
            </div>
          </div>
        </Card>

        {/* Periodic Dhikr & Salawat Card */}
        <Card className="p-4 space-y-4 rounded-2xl border-primary/20 shadow-sm bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary dark:text-primary-light flex items-center justify-center font-bold text-lg">
                🌸
              </div>
              <div>
                <div className="font-bold text-sm text-text-primary dark:text-text-dark">
                  التذكير الدوري بالصلاة على النبي ﷺ والأذكار
                </div>
                <div className="text-xs text-text-muted">
                  إشعار صوتي وكتابي متكرر لتعطير لسانك بذكر الله والصلاة على الحبيب
                </div>
              </div>
            </div>
            <Button 
              variant={dhikrEnabled ? "primary" : "outline"} 
              size="sm" 
              onClick={handleToggleDhikr}
              className="text-xs font-bold"
            >
              {dhikrEnabled ? 'مفعّل ✓' : 'إيقاف'}
            </Button>
          </div>

          {dhikrEnabled && (
            <div className="border-t border-black/5 dark:border-white/5 pt-3 space-y-3">
              {/* Interval Selection */}
              <div>
                <span className="text-xs font-bold text-text-muted block mb-2">تكرار الإشعار كل:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 30, label: '30 دقيقة' },
                    { value: 60, label: 'ساعة واحدة (موصى به)' },
                    { value: 120, label: 'ساعتين' },
                    { value: 180, label: '3 ساعات' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleChangeDhikrInterval(option.value)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        dhikrInterval === option.value
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-black/[0.03] dark:bg-white/5 border-transparent text-text-muted hover:border-primary/30'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice and Audio Chime Toggle */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-xs font-bold text-text-main dark:text-text-darkMain">
                    الصوت والتنبيه الصوتي
                  </div>
                  <div className="text-[11px] text-text-muted">
                    تشغيل نغمة تنبيه هادئة والنطق بالصلاة على النبي عند وصول الإشعار
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={dhikrVoice ? "primary" : "outline"}
                  className="text-xs py-1"
                  onClick={() => handleToggleDhikrVoice(!dhikrVoice)}
                >
                  {dhikrVoice ? 'مفعّل 🔊' : 'صامت 🔕'}
                </Button>
              </div>

              {/* Quick Test Button */}
              <div className="border-t border-black/5 dark:border-white/5 pt-3 flex items-center justify-between">
                <span className="text-xs text-text-muted">تجربة الإشعار والصوت الآن:</span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs gap-1.5 border-primary/40 text-primary dark:text-primary-light hover:bg-primary/10"
                  onClick={handleTestDhikrNow}
                >
                  <span>🔔 إرسال ذكر وسماع الصوت</span>
                </Button>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* ==========================================
          SECTION 4: QURAN & RECITATION
      ========================================== */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-text-muted flex items-center gap-2 px-1">
          <BookOpen size={16} className="text-primary" />
          <span>المصحف الشريف والتلاوة</span>
        </h2>

        <Card className="divide-y divide-black/5 dark:divide-white/5 p-0 rounded-2xl overflow-hidden">
          {/* Reciter Selector */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Headphones size={18} />
              </div>
              <div>
                <div className="font-bold text-sm">القارئ المفضل لجميع السور</div>
                <div className="text-xs text-text-muted">الشيخ المعتمد لتلاوة القرآن في المشغل العام</div>
              </div>
            </div>
            <select 
              value={selectedReciter} 
              onChange={handleReciterChange}
              className="bg-white dark:bg-card-dark border border-black/10 dark:border-white/10 rounded-xl p-2 text-xs font-bold outline-none cursor-pointer text-text-main dark:text-text-darkMain max-w-[150px] sm:max-w-none"
            >
              {RECITERS.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Quran Font Size */}
          <div className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Type size={18} />
                </div>
                <div>
                  <div className="font-bold text-sm text-text-main dark:text-text-darkMain">حجم خط الآيات القرآنية</div>
                  <div className="text-xs text-text-muted dark:text-text-darkMuted">تخصيص حجم الخط أثناء تصفح المصحف</div>
                </div>
              </div>
              <div className="grid grid-cols-4 sm:flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl w-full sm:w-auto">
                {QURAN_FONT_SIZES.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleFontSizeChange(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                      quranFontSize === f.id
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-text-muted dark:text-text-darkMuted hover:text-text-main dark:hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Verse Preview Box */}
            <div className="p-3 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/15 text-center">
              <p className="text-[11px] text-text-muted dark:text-text-darkMuted mb-1">معاينة مباشرة لحجم الخط:</p>
              <p className={`font-quran text-primary-dark dark:text-primary-light ${currentFontSizeObj.sizeClass}`}>
                ﴿ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ﴾
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* ==========================================
          SECTION 5: APPEARANCE & GENERAL
      ========================================== */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-text-muted flex items-center gap-2 px-1">
          <Moon size={16} className="text-primary" />
          <span>المظهر واللغة</span>
        </h2>

        <Card className="divide-y divide-black/5 dark:divide-white/5 p-0 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                {isDark ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              <div>
                <div className="font-bold text-sm">الوضع الداكن (Dark Mode)</div>
                <div className="text-xs text-text-muted">مظهر ليلي مريح للعين وتوفير للبطارية</div>
              </div>
            </div>
            <Button 
              variant={isDark ? "primary" : "outline"} 
              size="sm" 
              onClick={toggleDarkMode}
              className="text-xs font-bold"
            >
              {isDark ? 'مفعّل 🌙' : 'تفعيل ☀️'}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Globe size={18} />
              </div>
              <div>
                <div className="font-bold text-sm">لغة التطبيق</div>
                <div className="text-xs text-text-muted">اتجاه عربي أصيل من اليمين لليسار (RTL)</div>
              </div>
            </div>
            <span className="text-xs font-bold text-primary dark:text-primary-light bg-primary/10 px-2.5 py-1 rounded-lg">
              العربية (مكتمل)
            </span>
          </div>

          <div 
            onClick={() => navigate('/about')}
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Heart size={18} className="fill-current" />
              </div>
              <div>
                <div className="font-bold text-sm">عن التطبيق والمطور (صدقة جارية)</div>
                <div className="text-xs text-text-muted">معلومات المشروع والدعاء لمن ساهم فيه</div>
              </div>
            </div>
            <ChevronLeft size={18} className="text-text-muted" />
          </div>

          {/* Check for updates row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <RefreshCw size={18} className={checkingUpdate ? 'animate-spin' : ''} />
              </div>
              <div>
                <div className="font-bold text-sm flex items-center gap-2 flex-wrap">
                  <span className="text-text-main dark:text-text-darkMain">إصدار التطبيق والتحديثات</span>
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full font-mono">
                    v{updateService.getCurrentVersion()}
                  </span>
                </div>
                <div className="text-xs text-text-muted dark:text-text-darkMuted">فحص التحديثات الجديدة لملف الـ APK</div>
              </div>
            </div>
            <div className="self-end sm:self-auto">
              <Button
                size="sm"
                variant="outline"
                disabled={checkingUpdate}
                className="text-xs font-bold border-primary/30 gap-1.5"
                onClick={handleCheckForUpdates}
              >
                <RefreshCw size={14} className={checkingUpdate ? 'animate-spin' : ''} />
                <span>{checkingUpdate ? 'جاري الفحص...' : 'فحص التحديثات'}</span>
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* ==========================================
          SECTION 6: DATA MANAGEMENT
      ========================================== */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-text-muted dark:text-text-darkMuted flex items-center gap-2 px-1">
          <Trash2 size={16} className="text-red-500" />
          <span>إدارة البيانات وضبط المصنع</span>
        </h2>

        <Card className="p-0 rounded-2xl overflow-hidden">
          {/* Reset All Data */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 bg-red-50/50 dark:bg-red-950/15">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                <Trash2 size={18} />
              </div>
              <div>
                <div className="font-bold text-sm">استعادة ضبط المصنع</div>
                <div className="text-xs text-text-muted dark:text-text-darkMuted">مسح كافة المحفوظات، سجل القراءة، والإعدادات المخصصة</div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white text-xs font-bold self-end sm:self-auto"
              onClick={() => setShowResetConfirmModal(true)}
            >
              حذف البيانات
            </Button>
          </div>
        </Card>
      </section>

      {/* ==========================================
          MODAL: APK INSTALL & SHARING GUIDE
      ========================================== */}
      {showApkGuideModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowApkGuideModal(false)}
        >
          <div 
            className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1A1E24] border border-primary/30 shadow-2xl p-6 text-text-main dark:text-text-darkMain space-y-5 relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowApkGuideModal(false)}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 text-text-muted hover:text-text-main flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <Smartphone size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-primary dark:text-primary-light">
                  تثبيت ومشاركة تطبيق هداية للأندرويد
                </h3>
                <p className="text-xs text-text-muted">ملف APK مستقل كامل الميزات لأجهزة أندرويد</p>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-text-muted bg-black/[0.02] dark:bg-white/[0.02] p-4 rounded-2xl border border-black/5 dark:border-white/5">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                <div>
                  <strong className="text-text-main dark:text-text-darkMain block">البناء التلقائي عبر GitHub Actions:</strong>
                  تم إعداد سير عمل سحابي تلقائي؛ بمجرد عمل Push لمشروعك، يتم توليد ملف <code className="text-primary font-bold">app-debug.apk</code> تلقائياً وجاهز للتنزيل بنقرة واحدة من تبويب Actions.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                <div>
                  <strong className="text-text-main dark:text-text-darkMain block">البناء المحلي (Local Build):</strong>
                  إذا كان لديك Android Studio، يمكنك تشغيل الأمر <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded font-mono">npm run build:apk</code> ثم فتح المشروع وتوليد ملف APK مباشرة.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                <div>
                  <strong className="text-text-main dark:text-text-darkMain block">تثبيت سهل ومباشر:</strong>
                  أرسل ملف الـ APK لنفسك أو لأي شخص عبر واتساب أو تليجرام وافتحه على الهاتف لتثبيته في ثوانٍ معدودة.
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <a
                href="https://github.com/rehabkamal1/quran/actions"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all text-center cursor-pointer"
              >
                <Download size={16} />
                <span>صفحة تنزيل الـ APK من GitHub</span>
              </a>
              <Button
                variant="outline"
                className="w-full sm:w-auto py-3 text-xs font-bold"
                onClick={() => setShowApkGuideModal(false)}
              >
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: RESET ALL DATA CONFIRMATION
      ========================================== */}
      {showResetConfirmModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowResetConfirmModal(false)}
        >
          <div 
            className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1C2026] p-6 text-center space-y-4 shadow-2xl border border-black/10 dark:border-white/10 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-text-main dark:text-text-darkMain">
                استعادة ضبط المصنع؟
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                سيتم مسح كافة البيانات والمحفوظات المسجلة ومواقيت الصلاة وإعادة التطبيق إلى حالته الأصلية. هل أنت متأكد؟
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-text-main dark:text-text-darkMain text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleResetAllData}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors shadow-md cursor-pointer"
              >
                نعم، مسح البيانات
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
