import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Compass, MapPin } from 'lucide-react';
import { prayerApi } from '../services/prayerApi';

export const Qibla: React.FC = () => {
  const [qiblaDirection, setQiblaDirection] = useState<number | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get Qibla angle from location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const dir = await prayerApi.getQibla(position.coords.latitude, position.coords.longitude);
          if (dir) setQiblaDirection(dir);
          setLoading(false);
        },
        () => {
          setError('يرجى تفعيل صلاحية الموقع لحساب اتجاه القبلة.');
          setLoading(false);
        }
      );
    } else {
      setError('المتصفح لا يدعم تحديد الموقع.');
      setLoading(false);
    }

    // Handle device orientation for compass
    const handleOrientation = (event: DeviceOrientationEvent) => {
      // Different browsers handle this differently, simple fallback logic
      let heading = 0;
      if ((event as any).webkitCompassHeading) {
        heading = (event as any).webkitCompassHeading;
      } else if (event.alpha !== null) {
        // Simple conversion, might need more math for true north
        heading = 360 - event.alpha;
      }
      setDeviceHeading(heading);
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  // Calculate rotation for the compass needle
  const rotation = qiblaDirection !== null ? qiblaDirection - deviceHeading : 0;

  return (
    <div className="space-y-6 max-w-xl mx-auto animate-in fade-in duration-500 pb-20 text-center">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-primary dark:text-primary-light">اتجاه القبلة</h1>
        <p className="text-text-muted dark:text-text-darkMuted text-lg">فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ</p>
      </div>

      {error ? (
        <Card className="p-8 text-center text-red-500 border-red-500/20 bg-red-500/5">
          <MapPin size={48} className="mx-auto mb-4 opacity-50" />
          <p className="font-bold">{error}</p>
        </Card>
      ) : loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : (
        <div className="relative w-72 h-72 mx-auto mt-12">
          {/* Compass Outer Ring */}
          <div className="absolute inset-0 rounded-full border-[12px] border-black/5 dark:border-white/5 flex items-center justify-center">
            <span className="absolute top-2 font-bold text-black/20 dark:text-white/20">N</span>
            <span className="absolute bottom-2 font-bold text-black/20 dark:text-white/20">S</span>
            <span className="absolute right-2 font-bold text-black/20 dark:text-white/20">E</span>
            <span className="absolute left-2 font-bold text-black/20 dark:text-white/20">W</span>
          </div>

          {/* Compass Needle to Qibla */}
          <div 
            className="absolute inset-0 transition-transform duration-300 ease-out flex items-center justify-center"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <div className="w-1 h-32 bg-primary rounded-full relative bottom-16">
              <div className="absolute -top-4 -left-[14px] text-primary">
                <Compass size={32} />
              </div>
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-primary rounded-full shadow-lg z-10"></div>
          </div>
        </div>
      )}

      {qiblaDirection && !error && (
        <Card className="mt-12 p-6 bg-black/5 dark:bg-white/5 border-0">
          <p className="text-text-muted mb-2">زاوية القبلة من موقعك</p>
          <p className="text-3xl font-bold" dir="ltr">{Math.round(qiblaDirection)}°</p>
        </Card>
      )}

    </div>
  );
};
