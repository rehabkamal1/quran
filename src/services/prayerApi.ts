export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export const prayerApi = {
  getTimingsByCoordinates: async (lat: number, lng: number): Promise<PrayerTimes | null> => {
    try {
      const response = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=4`);
      const data = await response.json();
      return data.data.timings;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  getTimingsByCity: async (city: string, country: string): Promise<PrayerTimes | null> => {
    try {
      const response = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=4`);
      const data = await response.json();
      return data.data.timings;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  getQibla: async (lat: number, lng: number): Promise<number | null> => {
    try {
      const response = await fetch(`https://api.aladhan.com/v1/qibla/${lat}/${lng}`);
      const data = await response.json();
      return data.data.direction;
    } catch (e) {
      console.error(e);
      return null;
    }
  }
};
