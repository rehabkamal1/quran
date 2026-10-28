import { Capacitor } from '@capacitor/core';

export interface AppVersionInfo {
  version: string;
  versionCode: number;
  appName: string;
  releaseDate: string;
  title: string;
  notes: string;
  apkDownloadUrl: string;
  releaseUrl: string;
}

export const APP_CURRENT_VERSION: AppVersionInfo = {
  version: '1.0.3',
  versionCode: 4,
  appName: 'هداية - منصة قرآنية',
  releaseDate: '2026-10-28',
  title: 'إصدار جديد متوفر للتطبيق ✨',
  notes: 'إضافة التذكير الصوتي والكتابي الدوري بالصلاة على النبي والأذكار، وإصلاح تشغيل صوت الأذان داخل التطبيق وفي الخلفية.',
  apkDownloadUrl: 'https://github.com/rehabkamal1/quran/releases/download/apk-latest/app-release.apk',
  releaseUrl: 'https://github.com/rehabkamal1/quran/releases/tag/apk-latest'
};

const DISMISSED_KEY = 'hedayah_update_dismissed_version';
const DISMISSED_TIME_KEY = 'hedayah_update_dismissed_time';

export const updateService = {
  getCurrentVersion: (): string => {
    return APP_CURRENT_VERSION.version;
  },

  getCurrentVersionCode: (): number => {
    return APP_CURRENT_VERSION.versionCode;
  },

  isNativeApp: (): boolean => {
    return Capacitor.isNativePlatform();
  },

  checkForRemoteUpdate: async (): Promise<{ hasUpdate: boolean; info?: AppVersionInfo }> => {
    const endpoints = [
      `https://raw.githubusercontent.com/rehabkamal1/quran/main/public/version.json?t=${Date.now()}`,
      `/version.json?t=${Date.now()}`
    ];

    for (const url of endpoints) {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (response.ok) {
          const remote: AppVersionInfo = await response.json();
          if (remote && (remote.versionCode > APP_CURRENT_VERSION.versionCode || remote.version !== APP_CURRENT_VERSION.version)) {
            return { hasUpdate: true, info: remote };
          }
        }
      } catch (err) {
        console.warn(`[UpdateService] Failed to check update from ${url}:`, err);
      }
    }

    return { hasUpdate: false };
  },

  dismissUpdate: (version: string) => {
    try {
      localStorage.setItem(DISMISSED_KEY, version);
      localStorage.setItem(DISMISSED_TIME_KEY, Date.now().toString());
    } catch {}
  },

  isUpdateDismissed: (version: string): boolean => {
    try {
      const dismissedVer = localStorage.getItem(DISMISSED_KEY);
      const dismissedTime = localStorage.getItem(DISMISSED_TIME_KEY);
      if (dismissedVer === version && dismissedTime) {
        const elapsed = Date.now() - Number(dismissedTime);
        // Prompt again after 12 hours
        if (elapsed < 12 * 60 * 60 * 1000) {
          return true;
        }
      }
    } catch {}
    return false;
  }
};

