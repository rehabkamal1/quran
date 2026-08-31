export interface Dhikr {
  id: string;
  category: string;
  text: string;
  count: number;
  description: string;
  reference: string;
}

const CATEGORY_MAP: Record<string, string> = {
  'morning': 'أذكار الصباح',
  'evening': 'أذكار المساء',
  'after-prayer': 'أذكار بعد السلام من الصلاة المفروضة',
  'sleep': 'أذكار النوم',
  'wake': 'أذكار الاستيقاظ',
  'tasbih': 'تسابيح',
  'quranic-duas': 'أدعية قرآنية',
  'prophetic-duas': 'أدعية الأنبياء',
};

class AdhkarApi {
  private cache: Record<string, Dhikr[]> | null = null;

  async loadAll(): Promise<Record<string, Dhikr[]>> {
    if (this.cache) return this.cache;

    try {
      const response = await fetch('/data/adhkar.json');
      const rawData = await response.json() as Record<string, any[]>;

      const parsed: Record<string, Dhikr[]> = {};

      for (const [key, items] of Object.entries(rawData)) {
        // Map the category key to its English ID for easier routing mapping
        const englishId = Object.keys(CATEGORY_MAP).find(k => CATEGORY_MAP[k] === key) || key;
        
        const flatItems: any[] = [];
        for (const item of items) {
          if (item && typeof item === 'object' && ('0' in item)) {
            // It has nested numerical keys, let's extract them in order
            const keys = Object.keys(item).filter(k => /^\d+$/.test(k)).sort((a, b) => parseInt(a) - parseInt(b));
            for (const subKey of keys) {
              flatItems.push(item[subKey]);
            }
          } else {
            flatItems.push(item);
          }
        }

        parsed[englishId] = flatItems
          .filter(item => item && item.content && item.content !== 'stop')
          .map((item, index) => ({
            id: `${englishId}-${index}`,
            category: item.category || key,
            text: item.content || '',
            count: parseInt(item.count) || 1,
            description: item.description || '',
            reference: item.reference || '',
          }));
      }

      this.cache = parsed;
      return parsed;
    } catch (error) {
      console.error('Failed to load Adhkar data', error);
      return {};
    }
  }

  async getAdhkarByCategory(categoryId: string): Promise<Dhikr[]> {
    const data = await this.loadAll();
    return data[categoryId] || [];
  }
}

export const adhkarApi = new AdhkarApi();
