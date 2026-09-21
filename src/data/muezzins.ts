export interface Muezzin {
  id: string;
  name: string;
  subText: string;
  url: string;
  backupUrl?: string;
}

export const MUEZZINS: Muezzin[] = [
  { 
    id: 'makkah', 
    name: 'أذان الحرم المكي الشريف', 
    subText: 'الشيخ علي بن أحمد ملا',
    url: '/audio/adhan_makkah.mp3',
    backupUrl: 'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Ali_Ibn_Ahmad_Mala_HQ.mp3'
  },
  { 
    id: 'madinah', 
    name: 'أذان الحرم المدني الشريف', 
    subText: 'الشيخ عبد المجيد السريحي',
    url: '/audio/adhan_madinah.mp3',
    backupUrl: 'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Abdul_Majid_Al_Surehi_3_(%D8%B9%D8%A8%D8%AF%D8%A7%D9%84%D9%85%D8%AC%D9%8A%D8%AF_%D8%A7%D9%84%D8%B3%D8%B1%D9%8A%D8%AD%D9%8A).mp3'
  },
  { 
    id: 'alaqsa', 
    name: 'أذان المسجد الأقصى المبارك', 
    subText: 'الشيخ ناجي قزاز - القدس الشريف',
    url: '/audio/adhan_alaqsa.mp3',
    backupUrl: 'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Najee_Qazaz_-_Al_Aqsa_Jerusalem_(%D9%86%D8%A7%D8%AC%D9%8A_%D9%82%D8%B2%D8%A7%D8%B2_-_%D8%A7%D9%84%D9%85%D8%B3%D8%AC%D8%AF_%D8%A7%D9%84%D8%A3%D9%82%D8%B5%D9%89_%D8%A7%D9%84%D9%82%D8%AF%D8%B3).mp3'
  },
  { 
    id: 'abdulbasit', 
    name: 'أذان الشيخ عبد الباسط عبد الصمد', 
    subText: 'تلاوة وأذان نادرة وتاريخية',
    url: '/audio/adhan_abdulbasit.mp3',
    backupUrl: 'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Abdulbasit_Abdusamad_3_-_Egypt_(%D8%B9%D8%A8%D8%AF_%D8%A7%D9%84%D8%A8%D8%A7%D8%B3%D8%B7_%D8%B9%D8%A8%D8%AF_%D8%A7%D9%84%D8%B5%D9%85%D8%AF_-_%D9%85%D8%B5%D8%B1).mp3'
  },
  { 
    id: 'alafasy', 
    name: 'أذان الشيخ مشاري راشد العفاسي', 
    subText: 'أذان هادئ وخاشع',
    url: '/audio/adhan_alafasy.mp3',
    backupUrl: 'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Mishary_Rashid_Alafasy_1_-_Kuwait_(%D9%85%D8%B4%D8%A7%D8%B1%D9%8A_%D8%B1%D8%A7%D8%B4%D8%AF_%D8%A7%D9%84%D8%B9%D9%81%D8%A7%D8%B3%D9%8A_-_%D8%A7%D9%84%D9%83%D9%88%D9%8a%D8%AA).mp3'
  },
  { 
    id: 'refaat', 
    name: 'أذان مصر التاريخي (الشيخ محمد رفعت)', 
    subText: 'صوت الإفطار والأصالة المصرية',
    url: '/audio/adhan_refaat.mp3',
    backupUrl: 'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Muhammad_Refaat_-_Cairo_(%D9%85%D8%AD%D9%85%D8%AF_%D8%B1%D9%81%D8%B9%D8%AA_-_%D8%A7%D9%84%D9%82%D8%A7%D9%87%D8%B1%D8%A9).mp3'
  },
  { 
    id: 'cairo', 
    name: 'أذان الفجر (الشيخ نصر الدين طوبار)', 
    subText: 'ابتهال وأذان الفجر بصوت نصر الدين طوبار',
    url: '/audio/adhan_cairo.mp3',
    backupUrl: 'https://raw.githubusercontent.com/Kiwifu/adhan-mp3/main/Fajr_Adhan_by_Nasreddine_Toubar_(%D8%A7%D8%B0%D8%A7%D9%86_%D8%A7%D9%84%D9%81%D8%AC%D8%B1_%D8%A8%D8%B5%D9%88%D8%AA_%D9%86%D8%B5%D8%B1_%D8%A7%D9%84%D8%AF%D9%8A%D9%86_%D8%B7%D9%88%D8%A8%D8%A7%D8%B1).mp3'
  }
];

export const getMuezzinAudioUrl = (muezzinId?: string | null): string => {
  const chosenId = muezzinId || localStorage.getItem('adhan_muezzin_voice') || 'makkah';
  const m = MUEZZINS.find(item => item.id === chosenId);
  return m ? m.url : '/audio/adhan_makkah.mp3';
};

export const getMuezzinById = (muezzinId?: string | null): Muezzin => {
  const chosenId = muezzinId || localStorage.getItem('adhan_muezzin_voice') || 'makkah';
  return MUEZZINS.find(item => item.id === chosenId) || MUEZZINS[0];
};
