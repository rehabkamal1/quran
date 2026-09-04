export const RECITERS = [
  { id: 'ar.alafasy', name: 'مشاري العفاسي' },
  { id: 'ar.mahermuaiqly', name: 'ماهر المعيقلي' },
  { id: 'ar.husary', name: 'محمود خليل الحصري' }
];

export const ADHAKAR_RECITERS = [
  { id: 'ar.alafasy', name: 'مشاري العفاسي' },
  { id: 'ar.farisabbad', name: 'فارس عباد' },
  { id: 'ar.mahermuaiqly', name: 'ماهر المعيقلي (غير متوفر للأذكار - سيتم التشغيل بصوت العفاسي)' },
  { id: 'ar.husary', name: 'محمود خليل الحصري (غير متوفر للأذكار - سيتم التشغيل بصوت العفاسي)' }
];

export const audioService = {
  // Save preferred reciter to local storage
  setReciter: (reciterId: string) => {
    localStorage.setItem('preferred_reciter', reciterId);
  },

  // Get preferred reciter
  getReciter: (): string => {
    const reciter = localStorage.getItem('preferred_reciter') || 'ar.alafasy';
    if (reciter === 'ar.abdulbasitmurattal' || reciter === 'ar.abdulsamad') {
      audioService.setReciter('ar.alafasy');
      return 'ar.alafasy';
    }
    return reciter;
  },

  // Save preferred Adhkar reciter
  setAdhkarReciter: (reciterId: string) => {
    localStorage.setItem('preferred_adhkar_reciter', reciterId);
  },

  // Get preferred Adhkar reciter
  getAdhkarReciter: (): string => {
    return localStorage.getItem('preferred_adhkar_reciter') || 'ar.alafasy';
  },

  // Get primary audio URL for a specific ayah (EveryAyah high performance audio CDN)
  getAyahAudioUrl: (globalAyahNumber: number, reciterId?: string, surahNumber?: number, ayahNumberInSurah?: number): string => {
    const reciter = reciterId || audioService.getReciter();
    if (surahNumber && ayahNumberInSurah) {
      const sStr = String(surahNumber).padStart(3, '0');
      const aStr = String(ayahNumberInSurah).padStart(3, '0');
      if (reciter === 'ar.mahermuaiqly') {
        return `https://everyayah.com/data/MaherAlMuaiqly128kbps/${sStr}${aStr}.mp3`;
      }
      if (reciter === 'ar.husary') {
        return `https://everyayah.com/data/Husary_128kbps/${sStr}${aStr}.mp3`;
      }
      return `https://everyayah.com/data/Alafasy_128kbps/${sStr}${aStr}.mp3`;
    }
    return `https://cdn.islamic.network/quran/audio/128/${reciter}/${globalAyahNumber}.mp3`;
  },

  // Get fallback audio URL for a specific ayah (Islamic Network CDN)
  getAyahAudioFallbackUrl: (globalAyahNumber: number, reciterId?: string): string => {
    const reciter = reciterId || audioService.getReciter();
    return `https://cdn.islamic.network/quran/audio/128/${reciter}/${globalAyahNumber}.mp3`;
  },


  // Get full continuous Surah MP3 URL
  getSurahAudioUrl: (surahNumber: number, reciterId?: string): string => {
    const reciter = reciterId || audioService.getReciter();
    const padded = surahNumber.toString().padStart(3, '0');
    if (reciter === 'ar.mahermuaiqly') {
      return `https://server12.mp3quran.net/maher/${padded}.mp3`;
    }
    if (reciter === 'ar.husary') {
      return `https://server13.mp3quran.net/husr/${padded}.mp3`;
    }
    // Default Alafasy
    return `https://server8.mp3quran.net/afs/${padded}.mp3`;
  },

  // Get continuous audio URL for Adhkar category
  getAdhkarCategoryAudioUrl: (categoryId: string, reciterId?: string): string | null => {
    const reciter = reciterId || audioService.getAdhkarReciter();
    
    // Faris Abbad selection
    if (reciter === 'ar.farisabbad') {
      if (categoryId === 'morning') return 'https://hisnmuslim.com/audio/ar/27.mp3';
      if (categoryId === 'evening') return 'https://hisnmuslim.com/audio/ar/28.mp3';
      if (categoryId === 'sleep') return 'https://hisnmuslim.com/audio/ar/29.mp3';
      if (categoryId === 'wake') return 'https://hisnmuslim.com/audio/ar/1.mp3';
      if (categoryId === 'after-prayer') return 'https://hisnmuslim.com/audio/ar/66.mp3';
      return null;
    }

    // Default/Fallback (Alafasy or Faris Abbad)
    if (categoryId === 'morning') {
      return 'https://archive.org/download/sheikh-mishary-rashid-alafasy-azkar/Sheikh%20Mishary%20Rashid%20Alafasy%20-%20%D8%A3%D8%B0%D9%83%D8%A7%D8%B1%20%D8%A7%D9%84%D8%B5%D8%A8%D8%A7%D8%AD.mp3';
    }
    if (categoryId === 'evening') {
      return 'https://archive.org/download/sheikh-mishary-rashid-alafasy-azkar/Sheikh%20Mishary%20Rashid%20Alafasy%20-%20%D8%A3%D8%B0%D9%83%D8%A7%D8%B1%20%D8%A7%D9%84%D9%85%D8%B3%D8%A7%D8%A1.mp3';
    }
    if (categoryId === 'sleep') return 'https://hisnmuslim.com/audio/ar/29.mp3';
    if (categoryId === 'wake') return 'https://hisnmuslim.com/audio/ar/1.mp3';
    if (categoryId === 'after-prayer') return 'https://hisnmuslim.com/audio/ar/66.mp3';

    return null;
  }
};
