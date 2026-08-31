import { Coordinates, CalculationMethod, PrayerTimes as AdhanPrayerTimes, Qibla as AdhanQibla } from 'adhan';

export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Makkah: { lat: 21.4225, lng: 39.8262 },
  Madinah: { lat: 24.4672, lng: 39.6112 },
  Cairo: { lat: 30.0444, lng: 31.2357 },
  Dubai: { lat: 25.2048, lng: 55.2708 },
  Amman: { lat: 31.9539, lng: 35.9106 },
  Riyadh: { lat: 24.7136, lng: 46.6753 },
};

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function calculatePrayerTimesOffline(lat: number, lng: number, date: Date = new Date()): PrayerTimes {
  const coordinates = new Coordinates(lat, lng);
  let params = CalculationMethod.Egyptian();
  if (lat > 16 && lat < 33 && lng > 34 && lng < 55) {
    params = CalculationMethod.UmmAlQura();
  }
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
  getTimingsByCoordinates: async (lat: number, lng: number): Promise<PrayerTimes> => {
    if (!navigator.onLine) {
      return calculatePrayerTimesOffline(lat, lng);
    }
    try {
      const response = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=4`);
      if (!response.ok) throw new Error('API response not ok');
      const data = await response.json();
      if (data && data.data && data.data.timings) {
        return data.data.timings;
      }
      throw new Error('Invalid timing payload');
    } catch (e) {
      console.warn('Network request failed or offline. Using offline prayer calculation:', e);
      return calculatePrayerTimesOffline(lat, lng);
    }
  },

  getTimingsByCity: async (city: string, country: string): Promise<PrayerTimes> => {
    if (!navigator.onLine) {
      const coords = CITY_COORDINATES[city] || CITY_COORDINATES['Makkah'];
      return calculatePrayerTimesOffline(coords.lat, coords.lng);
    }
    try {
      const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=4`);
      if (!response.ok) throw new Error('API response not ok');
      const data = await response.json();
      if (data && data.data && data.data.timings) {
        return data.data.timings;
      }
      throw new Error('Invalid timing payload');
    } catch (e) {
      console.warn('Network request failed or offline. Using offline city calculation:', e);
      const coords = CITY_COORDINATES[city] || CITY_COORDINATES['Makkah'];
      return calculatePrayerTimesOffline(coords.lat, coords.lng);
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

