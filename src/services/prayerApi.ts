import { Coordinates, CalculationMethod, Madhab, PrayerTimes as AdhanPrayerTimes, Qibla as AdhanQibla } from 'adhan';
import { findCity } from '../data/cities';

export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export interface CalcMethodInfo {
  id: string;
  name: string;
  apiMethodId: number;
  description: string;
}

export const CALC_METHODS_CONFIG: Record<string, CalcMethodInfo> = {
  egypt: {
    id: 'egypt',
    name: 'الهيئة المصرية العامة للمساحة',
    apiMethodId: 5,
    description: 'زاوية الفجر 19.5°، زاوية العشاء 17.5° (التوقيت الرسمي المعتمد في جمهورية مصر العربية)'
  },
  makkah: {
    id: 'makkah',
    name: 'جامعة أم القرى - مكة المكرمة',
    apiMethodId: 4,
    description: 'زاوية الفجر 18.5°، العشاء بعد المغرب بـ 90 دقيقة'
  },
  mwl: {
    id: 'mwl',
    name: 'رابطة العالم الإسلامي',
    apiMethodId: 3,
    description: 'زاوية الفجر 18°، زاوية العشاء 17°'
  },
  uae: {
    id: 'uae',
    name: 'الهيئة العامة للشؤون الإسلامية (الإمارات)',
    apiMethodId: 16,
    description: 'زاوية الفجر 18.2°، زاوية العشاء 18.2°'
  },
  isna: {
    id: 'isna',
    name: 'الجمعية الإسلامية لأمريكا الشمالية (ISNA)',
    apiMethodId: 2,
    description: 'زاوية الفجر 15°، زاوية العشاء 15°'
  },
  kuwait: {
    id: 'kuwait',
    name: 'الكويت',
    apiMethodId: 9,
    description: 'زاوية الفجر 18°، زاوية العشاء 17.5°'
  },
  qatar: {
    id: 'qatar',
    name: 'قطر',
    apiMethodId: 10,
    description: 'زاوية الفجر 18°، العشاء بعد المغرب بـ 90 دقيقة'
  }
};

export function getCurrentCalculationMethodId(): string {
  return localStorage.getItem('prayer_calc_method') || 'egypt';
}

export function getCurrentAsrJuristic(): string {
  return localStorage.getItem('prayer_asr_juristic') || 'standard';
}

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function calculatePrayerTimesOffline(
  lat: number,
  lng: number,
  date: Date = new Date(),
  methodKey?: string,
  asrSchool?: string
): PrayerTimes {
  const method = methodKey || getCurrentCalculationMethodId();
  const school = asrSchool || getCurrentAsrJuristic();
  const coordinates = new Coordinates(lat, lng);

  let params;
  switch (method) {
    case 'makkah':
      params = CalculationMethod.UmmAlQura();
      break;
    case 'mwl':
      params = CalculationMethod.MuslimWorldLeague();
      break;
    case 'uae':
      params = CalculationMethod.Dubai();
      break;
    case 'isna':
      params = CalculationMethod.NorthAmerica();
      break;
    case 'kuwait':
      params = CalculationMethod.Kuwait();
      break;
    case 'qatar':
      params = CalculationMethod.Qatar();
      break;
    case 'egypt':
    default:
      // الهيئة المصرية العامة للمساحة: زاوية الفجر 19.5°، زاوية العشاء 17.5°
      params = CalculationMethod.Egyptian();
      break;
  }

  // المذهب الفقهي لحساب صلاة العصر: الشافعي/الجمهور (ظل المثل 1:1) أو الحنفي (ظل المثلين 2:1)
  params.madhab = school === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;

  const prayerTimes = new AdhanPrayerTimes(coordinates, date, params);

  return {
    Fajr: formatTime(prayerTimes.fajr),
    Sunrise: formatTime(prayerTimes.sunrise),
    Dhuhr: formatTime(prayerTimes.dhuhr),
    Asr: formatTime(prayerTimes.asr),
    Maghrib: formatTime(prayerTimes.maghrib),
    Isha: formatTime(prayerTimes.isha),
  };
}

export function calculateQiblaOffline(lat: number, lng: number): number {
  const coordinates = new Coordinates(lat, lng);
  return AdhanQibla(coordinates);
}

export const prayerApi = {
  getTimingsByCoordinates: async (
    lat: number,
    lng: number,
    methodKey?: string,
    asrSchool?: string
  ): Promise<PrayerTimes> => {
    const method = methodKey || getCurrentCalculationMethodId();
    const school = asrSchool || getCurrentAsrJuristic();
    const apiMethodId = CALC_METHODS_CONFIG[method]?.apiMethodId || 5; // 5 = Egyptian Survey Authority
    const apiSchoolId = school === 'hanafi' ? 1 : 0; // 0 = Standard (Shafi'i/Egyptian Survey)

    if (!navigator.onLine) {
      return calculatePrayerTimesOffline(lat, lng, new Date(), method, school);
    }
    try {
      const response = await fetch(
        `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=${apiMethodId}&school=${apiSchoolId}`
      );
      if (!response.ok) throw new Error('API response not ok');
      const data = await response.json();
      if (data && data.data && data.data.timings) {
        return data.data.timings;
      }
      throw new Error('Invalid timing payload');
    } catch (e) {
      console.warn('Network request failed or offline. Using offline prayer calculation (Egyptian Survey):', e);
      return calculatePrayerTimesOffline(lat, lng, new Date(), method, school);
    }
  },

  getTimingsByCity: async (
    cityIdOrName: string,
    country?: string,
    methodKey?: string,
    asrSchool?: string
  ): Promise<PrayerTimes> => {
    const cityInfo = findCity(cityIdOrName);
    const resolvedCountry = country || cityInfo.countryCode || 'EG';
    const method = methodKey || getCurrentCalculationMethodId();
    const school = asrSchool || getCurrentAsrJuristic();
    const apiMethodId = CALC_METHODS_CONFIG[method]?.apiMethodId || 5;
    const apiSchoolId = school === 'hanafi' ? 1 : 0;

    if (!navigator.onLine) {
      return calculatePrayerTimesOffline(cityInfo.lat, cityInfo.lng, new Date(), method, school);
    }
    try {
      const response = await fetch(
        `https://api.aladhan.com/v1/timingsByCity?city=${cityInfo.id}&country=${resolvedCountry}&method=${apiMethodId}&school=${apiSchoolId}`
      );
      if (!response.ok) throw new Error('API response not ok');
      const data = await response.json();
      if (data && data.data && data.data.timings) {
        return data.data.timings;
      }
      throw new Error('Invalid timing payload');
    } catch (e) {
      console.warn('Network request failed or offline. Using offline city calculation (Egyptian Survey):', e);
      return calculatePrayerTimesOffline(cityInfo.lat, cityInfo.lng, new Date(), method, school);
    }
  },

  getQibla: async (lat: number, lng: number): Promise<number> => {
    if (!navigator.onLine) {
      return calculateQiblaOffline(lat, lng);
    }
    try {
      const response = await fetch(`https://api.aladhan.com/v1/qibla/${lat}/${lng}`);
      if (!response.ok) throw new Error('API response not ok');
      const data = await response.json();
      if (data && data.data && typeof data.data.direction === 'number') {
        return data.data.direction;
      }
      throw new Error('Invalid qibla payload');
    } catch (e) {
      console.warn('Network request failed or offline. Using offline Qibla calculation:', e);
      return calculateQiblaOffline(lat, lng);
    }
  }
};
