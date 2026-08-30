export const RECITERS = [
  { id: 'ar.alafasy', name: 'مشاري العفاسي' },
  { id: 'ar.abdulbasitmurattal', name: 'عبد الباسط عبد الصمد' },
  { id: 'ar.mahermuaiqly', name: 'ماهر المعيقلي' },
  { id: 'ar.husary', name: 'محمود خليل الحصري' }
];

export const audioService = {
  // Save preferred reciter to local storage
  setReciter: (reciterId: string) => {
    localStorage.setItem('preferred_reciter', reciterId);
  },

  // Get preferred reciter
  getReciter: (): string => {
    return localStorage.getItem('preferred_reciter') || 'ar.alafasy';
  },

  // Get audio URL for a specific ayah
  // The global ayah number is used by api.alquran.cloud for audio
  // However, alquran.cloud CDN provides audio by surah and ayah number as well if needed.
  // We will use the global ayah number since our data has it (or we can calculate it).
  // Actually, standard is: https://cdn.islamic.network/quran/audio/128/{reciter}/{global_ayah_number}.mp3
  getAyahAudioUrl: (globalAyahNumber: number, reciterId?: string): string => {
    const reciter = reciterId || audioService.getReciter();
    return `https://cdn.islamic.network/quran/audio/128/${reciter}/${globalAyahNumber}.mp3`;
  }
};
