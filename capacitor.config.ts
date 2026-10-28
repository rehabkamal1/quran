import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hedayah.quran',
  appName: 'هداية - القرآن الكريم',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#C9A45C',
      sound: 'adhan.mp3'
    }
  }
};

export default config;

