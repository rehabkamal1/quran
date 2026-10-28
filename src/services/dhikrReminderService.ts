import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface DhikrItem {
  id: number;
  title: string;
  body: string;
  speechText: string;
  category: 'salawat' | 'tasbih' | 'istighfar' | 'dua';
}

export const DHIKR_ITEMS: DhikrItem[] = [
  {
    id: 1,
    title: 'صلِّ على النبي ﷺ 🌸',
    body: '«اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى نَبِيِّنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ أَجْمَعِينَ»',
    speechText: 'اللهم صلِّ وسلم وبارك على نبينا محمد',
    category: 'salawat',
  },
  {
    id: 2,
    title: 'فضل الصلاة على النبي 💚',
    body: 'قال رسول الله ﷺ: «مَنْ صَلَّى عَلَيَّ صَلَاةً صَلَّى اللَّهُ عَلَيْهِ بِهَا عَشْرًا»',
    speechText: 'صلوا على رسول الله، صلى الله عليه وسلم',
    category: 'salawat',
  },
  {
    id: 3,
    title: 'أحب الكلام إلى الله 🌿',
    body: '«سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ»',
    speechText: 'سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر',
    category: 'tasbih',
  },
  {
    id: 4,
    title: 'كنز من كنوز الجنة 💎',
    body: '«لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ»',
    speechText: 'لا حول ولا قوة إلا بالله العلي العظيم',
    category: 'dua',
  },
  {
    id: 5,
    title: 'كلمتان خفيفتان على اللسان ⚖️',
    body: '«سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ»',
    speechText: 'سبحان الله وبحمده، سبحان الله العظيم',
    category: 'tasbih',
  },
  {
    id: 6,
    title: 'سيد الاستغفار والتوبة 🤲',
    body: '«أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ»',
    speechText: 'أستغفر الله العظيم وأتوب إليه',
    category: 'istighfar',
  },
  {
    id: 7,
    title: 'دعاء وتفريج الهم والكرب 🌟',
    body: '«لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ»',
    speechText: 'لا إله إلا أنت سبحانك إني كنت من الظالمين',
    category: 'dua',
  },
  {
    id: 8,
    title: 'حفظ وتوكل على الله 🛡️',
    body: '«حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ»',
    speechText: 'حسبي الله لا إله إلا هو عليه توكلت',
    category: 'dua',
  },
  {
    id: 9,
    title: 'طلب الرحمة والمعونة 🕊️',
    body: '«يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ»',
    speechText: 'يا حي يا قيوم برحمتك أستغيث',
    category: 'dua',
  },
  {
    id: 10,
    title: 'أفضل الذكر والتوحيد 🕌',
    body: '«لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ»',
    speechText: 'لا إله إلا الله وحده لا شريك له',
    category: 'tasbih',
  },
];

export const DHIKR_CHANNEL_ID = 'dhikr_reminders_channel_v1';
const DHIKR_NOTIFICATION_BASE_ID = 50000;

let audioChime: HTMLAudioElement | null = null;
let currentDhikrListener: ((item: DhikrItem) => void) | null = null;

export const dhikrReminderService = {
  isEnabled: (): boolean => {
    const val = localStorage.getItem('dhikr_reminder_enabled');
    return val === null ? true : val === 'true'; // Enabled by default!
  },

  setEnabled: async (enabled: boolean) => {
    localStorage.setItem('dhikr_reminder_enabled', enabled ? 'true' : 'false');
    if (enabled) {
      await dhikrReminderService.rescheduleAll();
    } else {
      await dhikrReminderService.cancelNativeReminders();
    }
  },

  getIntervalMinutes: (): number => {
    const val = localStorage.getItem('dhikr_reminder_interval');
    return val ? parseInt(val, 10) : 60; // Default: every 60 minutes (1 hour)
  },

  setIntervalMinutes: async (minutes: number) => {
    localStorage.setItem('dhikr_reminder_interval', minutes.toString());
    await dhikrReminderService.rescheduleAll();
  },

  isVoiceEnabled: (): boolean => {
    const val = localStorage.getItem('dhikr_reminder_voice');
    return val === null ? true : val === 'true'; // Voice enabled by default!
  },

  setVoiceEnabled: (enabled: boolean) => {
    localStorage.setItem('dhikr_reminder_voice', enabled ? 'true' : 'false');
  },

  setOnDhikrListener: (listener: (item: DhikrItem) => void) => {
    currentDhikrListener = listener;
  },

  removeOnDhikrListener: () => {
    currentDhikrListener = null;
  },

  /**
   * Play the spiritual audio chime and speak dhikr
   */
  playAlertSound: (item?: DhikrItem) => {
    const voiceOn = dhikrReminderService.isVoiceEnabled();

    // 1. Play peaceful chime sound
    try {
      if (!audioChime) {
        audioChime = new Audio('/audio/dhikr.wav');
        audioChime.preload = 'auto';
      }
      audioChime.pause();
      audioChime.currentTime = 0;
      audioChime.volume = 1.0;
      audioChime.play().catch(e => {
        console.warn('[DhikrService] Audio chime play blocked or failed:', e);
      });
    } catch (e) {
      console.warn('[DhikrService] Chime audio error:', e);
    }

    // 2. Play spoken audio via Web Speech Synthesis if enabled
    if (voiceOn && item && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(item.speechText || item.title);
        utterance.lang = 'ar-SA';
        utterance.rate = 0.88; // gentle, reverent cadence
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Try to select an Arabic voice if available
        const voices = window.speechSynthesis.getVoices();
        const arVoice = voices.find(v => v.lang.startsWith('ar'));
        if (arVoice) {
          utterance.voice = arVoice;
        }

        setTimeout(() => {
          window.speechSynthesis.speak(utterance);
        }, 400);
      } catch (err) {
        console.warn('[DhikrService] Speech synthesis failed:', err);
      }
    }
  },

  /**
   * Trigger dhikr alert immediately (used for test and periodic in-app triggers)
   */
  triggerDhikr: (customItem?: DhikrItem) => {
    const item = customItem || DHIKR_ITEMS[Math.floor(Math.random() * DHIKR_ITEMS.length)];

    // Play Sound & Speech
    dhikrReminderService.playAlertSound(item);

    // Notify In-App Toast
    if (currentDhikrListener) {
      currentDhikrListener(item);
    }

    // Also dispatch custom DOM event for any listening UI
    window.dispatchEvent(new CustomEvent('app:dhikr-alert', { detail: item }));

    // Send Web Notification if permitted and not native
    if (!Capacitor.isNativePlatform() && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(item.title, {
          body: item.body,
          icon: '/logo.png',
          tag: `dhikr-${item.id}-${Date.now()}`,
          dir: 'rtl'
        });
      } catch {}
    }
  },

  /**
   * Ensure Android notification channel for Dhikr is configured
   */
  setupNativeChannel: async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.createChannel({
        id: DHIKR_CHANNEL_ID,
        name: 'أذكار وتذكير بالصلاة على النبي ﷺ',
        description: 'إشعارات دورية بالأذكار والصلاة على النبي مع تنبيه صوتي',
        importance: 4, // High importance (heads-up banner + sound)
        visibility: 1, // Public lockscreen
        vibration: true,
        lights: true,
        lightColor: '#C9A45C',
        sound: 'dhikr.wav',
      });
    } catch (e) {
      console.warn('[DhikrService] Error setting up native channel:', e);
    }
  },

  /**
   * Schedule recurring periodic reminders into Android OS alarms (24 reminders ahead)
   */
  scheduleNativeReminders: async () => {
    if (!Capacitor.isNativePlatform()) return;
    if (!dhikrReminderService.isEnabled()) return;

    try {
      const status = await LocalNotifications.checkPermissions();
      if (status.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') return;
      }

      await dhikrReminderService.setupNativeChannel();
      await dhikrReminderService.cancelNativeReminders();

      const intervalMinutes = dhikrReminderService.getIntervalMinutes();
      const notifications: any[] = [];
      const startTime = Date.now();

      // Schedule next 20 reminders across upcoming daytime hours
      const count = 20;
      for (let i = 1; i <= count; i++) {
        const scheduledTime = new Date(startTime + i * intervalMinutes * 60 * 1000);
        const hour = scheduledTime.getHours();

        // Avoid night hours (between 11:30 PM and 6:30 AM) to maintain sleep hygiene
        if (hour >= 23 || hour < 6) {
          continue;
        }

        const dhikrIndex = (i - 1) % DHIKR_ITEMS.length;
        const item = DHIKR_ITEMS[dhikrIndex];

        notifications.push({
          id: DHIKR_NOTIFICATION_BASE_ID + i,
          title: item.title,
          body: item.body,
          schedule: {
            at: scheduledTime,
            allowWhileIdle: true,
          },
          channelId: DHIKR_CHANNEL_ID,
          sound: 'dhikr.wav',
          smallIcon: 'ic_stat_icon_config_sample',
          iconColor: '#C9A45C',
          extra: {
            dhikrId: item.id,
            type: 'dhikr_reminder'
          }
        });
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log(`[DhikrService] Scheduled ${notifications.length} periodic dhikr alarms in Android OS.`);
      }
    } catch (err) {
      console.error('[DhikrService] Error scheduling native dhikr alarms:', err);
    }
  },

  cancelNativeReminders: async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      const pending = await LocalNotifications.getPending();
      const dhikrPending = pending.notifications.filter(n => n.id >= DHIKR_NOTIFICATION_BASE_ID && n.id < DHIKR_NOTIFICATION_BASE_ID + 1000);
      if (dhikrPending.length > 0) {
        await LocalNotifications.cancel({ notifications: dhikrPending });
      }
    } catch (e) {
      console.warn('[DhikrService] Error cancelling pending dhikr:', e);
    }
  },

  rescheduleAll: async () => {
    if (Capacitor.isNativePlatform()) {
      await dhikrReminderService.scheduleNativeReminders();
    }
  },

  /**
   * Start in-app periodic timer for when the application is active in foreground
   */
  startForegroundScheduler: () => {
    let lastTriggerTime = Date.now();

    const checkInterval = () => {
      if (!dhikrReminderService.isEnabled()) return;
      const intervalMs = dhikrReminderService.getIntervalMinutes() * 60 * 1000;
      const now = Date.now();

      if (now - lastTriggerTime >= intervalMs) {
        lastTriggerTime = now;
        dhikrReminderService.triggerDhikr();
      }
    };

    const timerId = window.setInterval(checkInterval, 30000); // Check every 30s

    return () => {
      window.clearInterval(timerId);
    };
  }
};

