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

// In-memory cache variables to optimize repeated requests
let surahsCache: SurahMeta[] | null = null;
let quranCache: SurahData[] | null = null;
const tafsirCache: Record<number, TafsirData> = {};
const splitSurahCache: Record<number, SurahData> = {};

export const quranApi = {
  // Fetch Surah Metadata list
  getSurahs: async (): Promise<SurahMeta[]> => {
    if (surahsCache) return surahsCache;
    try {
      const response = await fetch('/data/surahs.json');
      surahsCache = await response.json();
      return surahsCache || [];
    } catch (error) {
      console.error("Failed to load surahs metadata:", error);
      return [];
    }
  },

  // Fetch complete Quran data (only used when searching or if split files fail)
  getQuran: async (): Promise<SurahData[]> => {
    if (quranCache) return quranCache;
    try {
      const response = await fetch('/data/quran.json');
      quranCache = await response.json();
      return quranCache || [];
    } catch (error) {
      console.error("Failed to load full quran data:", error);
      return [];
    }
  },

  // Fetch a specific surah by number (uses split file and caching)
  getSurah: async (surahNumber: number): Promise<SurahData | null> => {
    // 1. Check in-memory caches
    if (splitSurahCache[surahNumber]) {
      return splitSurahCache[surahNumber];
    }
    if (quranCache) {
      const surah = quranCache.find(s => s.number === surahNumber);
      if (surah) return surah;
    }
    
    // 2. Fetch specific split file
    try {
      const response = await fetch(`/data/quran/${surahNumber}.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      splitSurahCache[surahNumber] = data;
      return data;
    } catch (error) {
      console.warn(`Failed to load split surah ${surahNumber}, falling back to full Quran:`, error);
      const quran = await quranApi.getQuran();
      return quran.find(s => s.number === surahNumber) || null;
    }
  },

  // Fetch tafsir data for a specific surah (uses split file and caching)
  getTafsir: async (surahNumber: number): Promise<TafsirData | null> => {
    // 1. Check in-memory cache
    if (tafsirCache[surahNumber]) {
      return tafsirCache[surahNumber];
    }

    // 2. Fetch specific split file
    try {
      const response = await fetch(`/data/tafsir/${surahNumber}.json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      tafsirCache[surahNumber] = data;
      return data;
    } catch (error) {
      console.warn(`Failed to load split tafsir ${surahNumber}, falling back to full Tafsir:`, error);
      try {
        const response = await fetch('/data/tafsir.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data: TafsirData[] = await response.json();
        const surahTafsir = data.find(s => s.number === surahNumber) || null;
        if (surahTafsir) {
          tafsirCache[surahNumber] = surahTafsir;
        }
        return surahTafsir;
      } catch (e) {
        console.error(`Failed to load fallback tafsir for surah ${surahNumber}:`, e);
        return null;
      }
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
