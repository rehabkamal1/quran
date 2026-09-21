export interface QuranFontSize {
  id: 'sm' | 'md' | 'lg' | 'xl';
  label: string;
  sizeClass: string;
}

export const QURAN_FONT_SIZES: QuranFontSize[] = [
  { id: 'sm', label: 'صغير', sizeClass: 'text-xl sm:text-2xl leading-relaxed' },
  { id: 'md', label: 'متوسط', sizeClass: 'text-2xl sm:text-3xl leading-loose' },
  { id: 'lg', label: 'كبير', sizeClass: 'text-3xl sm:text-4xl leading-loose' },
  { id: 'xl', label: 'كبير جداً', sizeClass: 'text-4xl sm:text-5xl leading-loose' },
];

export const getQuranFontSize = (): 'sm' | 'md' | 'lg' | 'xl' => {
  const saved = localStorage.getItem('quran_font_size') as any;
  if (saved && ['sm', 'md', 'lg', 'xl'].includes(saved)) {
    return saved;
  }
  return 'md';
};

export const setQuranFontSize = (sizeId: 'sm' | 'md' | 'lg' | 'xl'): void => {
  localStorage.setItem('quran_font_size', sizeId);
  window.dispatchEvent(new CustomEvent('quran_font_size_changed', { detail: sizeId }));
};

export const getQuranFontSizeClass = (sizeId?: string | null): string => {
  const activeId = sizeId || getQuranFontSize();
  const found = QURAN_FONT_SIZES.find(f => f.id === activeId);
  return found ? found.sizeClass : QURAN_FONT_SIZES[1].sizeClass;
};
