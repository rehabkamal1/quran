export interface CityInfo {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
}

export const CITIES: CityInfo[] = [
  // المدن والمحافظات المصرية (الهيئة المصرية العامة للمساحة)
  { id: 'Cairo', name: 'القاهرة', country: 'مصر', countryCode: 'EG', lat: 30.0444, lng: 31.2357 },
  { id: 'Alexandria', name: 'الإسكندرية', country: 'مصر', countryCode: 'EG', lat: 31.2001, lng: 29.9187 },
  { id: 'Giza', name: 'الجيزة', country: 'مصر', countryCode: 'EG', lat: 30.0131, lng: 31.2089 },
  { id: 'PortSaid', name: 'بورسعيد', country: 'مصر', countryCode: 'EG', lat: 31.2653, lng: 32.3019 },
  { id: 'Suez', name: 'السويس', country: 'مصر', countryCode: 'EG', lat: 29.9668, lng: 32.5498 },
  { id: 'Ismailia', name: 'الإسماعيلية', country: 'مصر', countryCode: 'EG', lat: 30.5965, lng: 32.2715 },
  { id: 'Mansoura', name: 'المنصورة (الدقهلية)', country: 'مصر', countryCode: 'EG', lat: 31.0409, lng: 31.3785 },
  { id: 'Tanta', name: 'طنطا (الغربية)', country: 'مصر', countryCode: 'EG', lat: 30.7865, lng: 31.0004 },
  { id: 'Zagazig', name: 'الزقازيق (الشرقية)', country: 'مصر', countryCode: 'EG', lat: 30.5765, lng: 31.5041 },
  { id: 'Damietta', name: 'دمياط', country: 'مصر', countryCode: 'EG', lat: 31.4175, lng: 31.8144 },
  { id: 'KafrElSheikh', name: 'كفر الشيخ', country: 'مصر', countryCode: 'EG', lat: 31.1107, lng: 30.9388 },
  { id: 'Faiyum', name: 'الفيوم', country: 'مصر', countryCode: 'EG', lat: 29.3084, lng: 30.8428 },
  { id: 'BeniSuef', name: 'بني سويف', country: 'مصر', countryCode: 'EG', lat: 29.0661, lng: 31.0994 },
  { id: 'Minya', name: 'المنيا', country: 'مصر', countryCode: 'EG', lat: 28.1099, lng: 30.7503 },
  { id: 'Asyut', name: 'أسيوط', country: 'مصر', countryCode: 'EG', lat: 27.1783, lng: 31.1859 },
  { id: 'Sohag', name: 'سوهاج', country: 'مصر', countryCode: 'EG', lat: 26.5569, lng: 31.6948 },
  { id: 'Qena', name: 'قنا', country: 'مصر', countryCode: 'EG', lat: 26.1551, lng: 32.7160 },
  { id: 'Luxor', name: 'الأقصر', country: 'مصر', countryCode: 'EG', lat: 25.6872, lng: 32.6396 },
  { id: 'Aswan', name: 'أسوان', country: 'مصر', countryCode: 'EG', lat: 24.0889, lng: 32.8998 },
  { id: 'Hurghada', name: 'الغردقة (البحر الأحمر)', country: 'مصر', countryCode: 'EG', lat: 27.2579, lng: 33.8116 },
  { id: 'SharmElSheikh', name: 'شرم الشيخ (جنوب سيناء)', country: 'مصر', countryCode: 'EG', lat: 27.9158, lng: 34.3299 },
  { id: 'Arish', name: 'العريش (شمال سيناء)', country: 'مصر', countryCode: 'EG', lat: 31.1321, lng: 33.8034 },
  { id: 'Matrouh', name: 'مرسى مطروح', country: 'مصر', countryCode: 'EG', lat: 31.3543, lng: 27.2373 },

  // كبرى المدن والعواصم الإسلامية
  { id: 'Makkah', name: 'مكة المكرمة', country: 'السعودية', countryCode: 'SA', lat: 21.4225, lng: 39.8262 },
  { id: 'Madinah', name: 'المدينة المنورة', country: 'السعودية', countryCode: 'SA', lat: 24.4672, lng: 39.6112 },
  { id: 'Riyadh', name: 'الرياض', country: 'السعودية', countryCode: 'SA', lat: 24.7136, lng: 46.6753 },
  { id: 'Jerusalem', name: 'القدس الشريف', country: 'فلسطين', countryCode: 'PS', lat: 31.7683, lng: 35.2137 },
  { id: 'Dubai', name: 'دبي', country: 'الإمارات', countryCode: 'AE', lat: 25.2048, lng: 55.2708 },
  { id: 'AbuDhabi', name: 'أبو ظبي', country: 'الإمارات', countryCode: 'AE', lat: 24.4539, lng: 54.3773 },
  { id: 'Amman', name: 'عمان', country: 'الأردن', countryCode: 'JO', lat: 31.9539, lng: 35.9106 },
  { id: 'Beirut', name: 'بيروت', country: 'لبنان', countryCode: 'LB', lat: 33.8938, lng: 35.5018 },
  { id: 'Kuwait', name: 'الكويت', country: 'الكويت', countryCode: 'KW', lat: 29.3759, lng: 47.9774 },
  { id: 'Doha', name: 'الدوحة', country: 'قطر', countryCode: 'QA', lat: 25.2854, lng: 51.5310 },
  { id: 'Istanbul', name: 'إسطنبول', country: 'تركيا', countryCode: 'TR', lat: 41.0082, lng: 28.9784 },
];

export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = CITIES.reduce((acc, city) => {
  acc[city.id] = { lat: city.lat, lng: city.lng };
  return acc;
}, {} as Record<string, { lat: number; lng: number }>);

export const DEFAULT_CITY = CITIES[0]; // القاهرة (Cairo)

export function findCity(idOrName?: string | null): CityInfo {
  if (!idOrName) return DEFAULT_CITY;
  const found = CITIES.find(c => c.id.toLowerCase() === idOrName.toLowerCase() || c.name === idOrName);
  return found || DEFAULT_CITY;
}
