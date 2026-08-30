export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  numberInSurah: number;
  juz: number;
  text: string;
}

export interface SurahData {
  number: number;
  name: string;
  englishName: string;
  revelationType: string;
  ayahs: Ayah[];
}

export interface TafsirAyah {
  numberInSurah: number;
  text: string;
}

export interface TafsirData {
  number: number;
  ayahs: TafsirAyah[];
}

export const quranApi = {
  // Fetch Surah Metadata list
  getSurahs: async (): Promise<SurahMeta[]> => {
    try {
      const response = await fetch('/data/surahs.json');
      return await response.json();
    } catch (error) {
      console.error("Failed to load surahs metadata:", error);
      return [];
    }
  },

  // Fetch complete Quran data
  getQuran: async (): Promise<SurahData[]> => {
    try {
      const response = await fetch('/data/quran.json');
      return await response.json();
    } catch (error) {
      console.error("Failed to load full quran data:", error);
      return [];
    }
  },

  // Fetch a specific surah by number
  getSurah: async (surahNumber: number): Promise<SurahData | null> => {
    try {
      const quran = await quranApi.getQuran();
      return quran.find(s => s.number === surahNumber) || null;
    } catch (error) {
      console.error(`Failed to load surah ${surahNumber}:`, error);
      return null;
    }
  },

  // Fetch tafsir data for a specific surah
  getTafsir: async (surahNumber: number): Promise<TafsirData | null> => {
    try {
      const response = await fetch('/data/tafsir.json');
      const data: TafsirData[] = await response.json();
      return data.find(s => s.number === surahNumber) || null;
    } catch (error) {
      console.error(`Failed to load tafsir for surah ${surahNumber}:`, error);
      return null;
    }
  },

  // Search Quran text
  searchQuran: async (query: string): Promise<{surah: SurahData, ayah: Ayah}[]> => {
    if (!query || query.trim().length < 2) return [];
    try {
      const quran = await quranApi.getQuran();
      const results: {surah: SurahData, ayah: Ayah}[] = [];
      const searchTerms = query.trim().split(' ');
      
      for (const surah of quran) {
        for (const ayah of surah.ayahs) {
          const matches = searchTerms.every(term => ayah.text.includes(term));
          if (matches) {
            results.push({ surah, ayah });
          }
        }
      }
      return results;
    } catch (error) {
      console.error("Search failed:", error);
      return [];
    }
  }
};
