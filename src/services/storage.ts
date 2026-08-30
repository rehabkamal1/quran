export interface LastRead {
  surah: number;
  ayah: number;
  surahName: string;
}

export interface Bookmark {
  id: string; // surah-ayah e.g. "2-255"
  surah: number;
  ayah: number;
  surahName: string;
  text: string;
  dateAdded: string;
}

const STORAGE_KEYS = {
  LAST_READ: 'quran_last_read',
  BOOKMARKS: 'quran_bookmarks',
};

export const storage = {
  // Last Read
  saveLastRead: (data: LastRead) => {
    localStorage.setItem(STORAGE_KEYS.LAST_READ, JSON.stringify(data));
  },
  
  getLastRead: (): LastRead | null => {
    const data = localStorage.getItem(STORAGE_KEYS.LAST_READ);
    return data ? JSON.parse(data) : null;
  },

  // Bookmarks
  getBookmarks: (): Bookmark[] => {
    const data = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    return data ? JSON.parse(data) : [];
  },

  addBookmark: (bookmark: Bookmark) => {
    const bookmarks = storage.getBookmarks();
    if (!bookmarks.find(b => b.id === bookmark.id)) {
      bookmarks.push(bookmark);
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    }
  },

  removeBookmark: (id: string) => {
    const bookmarks = storage.getBookmarks().filter(b => b.id !== id);
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
  },

  isBookmarked: (id: string): boolean => {
    return storage.getBookmarks().some(b => b.id === id);
  }
};
