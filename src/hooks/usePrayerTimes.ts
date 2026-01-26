import { useState, useEffect, useCallback, useMemo } from 'react';
import { useGeolocation } from './useGeolocation';
import { PrayerTimes, CurrentPrayer } from '@/types';

interface PrayerTimesState {
  times: PrayerTimes | null;
  location: {
    city: string;
    country: string;
  } | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface AladhanResponse {
  code: number;
  status: string;
  data: {
    timings: {
      Fajr: string;
      Sunrise: string;
      Dhuhr: string;
      Asr: string;
      Sunset: string;
      Maghrib: string;
      Isha: string;
      Imsak: string;
      Midnight: string;
    };
    date: {
      readable: string;
      timestamp: string;
      hijri: {
        date: string;
        month: { number: number; en: string; ar: string };
        year: string;
      };
      gregorian: {
        date: string;
        month: { number: number; en: string };
        year: string;
      };
    };
    meta: {
      latitude: number;
      longitude: number;
      timezone: string;
      method: { id: number; name: string };
    };
  };
}

const PRAYER_NAMES: Record<keyof PrayerTimes, { id: string; name: string; arabic: string }> = {
  fajr: { id: 'fajr', name: 'Subuh', arabic: 'الفجر' },
  dhuhr: { id: 'dhuhr', name: 'Dzuhur', arabic: 'الظهر' },
  asr: { id: 'asr', name: 'Ashar', arabic: 'العصر' },
  maghrib: { id: 'maghrib', name: 'Maghrib', arabic: 'المغرب' },
  isha: { id: 'isha', name: 'Isya', arabic: 'العشاء' },
};

const STORAGE_KEY = 'arah-umroh-prayer-times';
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

export const usePrayerTimes = () => {
  const { latitude, longitude, loading: geoLoading, error: geoError } = useGeolocation();
  
  const [state, setState] = useState<PrayerTimesState>({
    times: null,
    location: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  // Load cached data on mount
  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const cacheTime = new Date(parsed.lastUpdated).getTime();
        const now = Date.now();
        
        if (now - cacheTime < CACHE_DURATION) {
          setState({
            times: parsed.times,
            location: parsed.location,
            loading: false,
            error: null,
            lastUpdated: new Date(parsed.lastUpdated),
          });
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const fetchPrayerTimes = useCallback(async (lat: number, lng: number) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const today = new Date();
      const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
      
      // Use Aladhan API with Indonesian calculation method (Kemenag)
      const response = await fetch(
        `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=20`
      );

      if (!response.ok) {
        throw new Error('Gagal mengambil jadwal sholat');
      }

      const data: AladhanResponse = await response.json();

      if (data.code !== 200) {
        throw new Error('API error: ' + data.status);
      }

      const times: PrayerTimes = {
        fajr: data.data.timings.Fajr.split(' ')[0],
        dhuhr: data.data.timings.Dhuhr.split(' ')[0],
        asr: data.data.timings.Asr.split(' ')[0],
        maghrib: data.data.timings.Maghrib.split(' ')[0],
        isha: data.data.timings.Isha.split(' ')[0],
      };

      // Reverse geocode to get city name
      let location = { city: 'Lokasi Anda', country: '' };
      try {
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=id`
        );
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          location = {
            city: geoData.address?.city || geoData.address?.town || geoData.address?.village || 'Lokasi Anda',
            country: geoData.address?.country_code?.toUpperCase() || '',
          };
        }
      } catch {
        // Ignore geocoding errors
      }

      const newState = {
        times,
        location,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      };

      setState(newState);

      // Cache the result
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        times,
        location,
        lastUpdated: new Date().toISOString(),
        latitude: lat,
        longitude: lng,
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Gagal mengambil jadwal sholat',
      }));
    }
  }, []);

  // Fetch when location is available
  useEffect(() => {
    if (latitude && longitude && !geoLoading) {
      fetchPrayerTimes(latitude, longitude);
    }
  }, [latitude, longitude, geoLoading, fetchPrayerTimes]);

  // Handle geolocation error
  useEffect(() => {
    if (geoError && !geoLoading) {
      // Use default location (Makkah) if geolocation fails
      fetchPrayerTimes(21.4225, 39.8262);
    }
  }, [geoError, geoLoading, fetchPrayerTimes]);

  // Get current prayer info
  const currentPrayer = useMemo((): CurrentPrayer | null => {
    if (!state.times) return null;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const prayerOrder: (keyof PrayerTimes)[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    
    const prayerMinutes = prayerOrder.map(prayer => {
      const [hours, minutes] = state.times![prayer].split(':').map(Number);
      return { prayer, minutes: hours * 60 + minutes };
    });

    // Find current and next prayer
    let currentPrayerKey: keyof PrayerTimes = 'isha';
    let nextPrayerKey: keyof PrayerTimes = 'fajr';
    let nextPrayerMinutes = prayerMinutes[0].minutes + 24 * 60; // Fajr next day

    for (let i = 0; i < prayerMinutes.length; i++) {
      const current = prayerMinutes[i];
      const next = prayerMinutes[i + 1];

      if (next) {
        if (currentMinutes >= current.minutes && currentMinutes < next.minutes) {
          currentPrayerKey = current.prayer;
          nextPrayerKey = next.prayer;
          nextPrayerMinutes = next.minutes;
          break;
        }
      } else {
        // After Isha
        if (currentMinutes >= current.minutes) {
          currentPrayerKey = 'isha';
          nextPrayerKey = 'fajr';
          nextPrayerMinutes = prayerMinutes[0].minutes + 24 * 60;
        } else if (currentMinutes < prayerMinutes[0].minutes) {
          // Before Fajr
          currentPrayerKey = 'isha';
          nextPrayerKey = 'fajr';
          nextPrayerMinutes = prayerMinutes[0].minutes;
        }
      }
    }

    // Calculate countdown
    let remainingMinutes = nextPrayerMinutes - currentMinutes;
    if (remainingMinutes < 0) remainingMinutes += 24 * 60;

    const hours = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;
    const countdown = hours > 0 
      ? `-${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`
      : `-00:${String(mins).padStart(2, '0')}:00`;

    return {
      name: PRAYER_NAMES[currentPrayerKey].name,
      time: state.times[currentPrayerKey],
      nextPrayer: PRAYER_NAMES[nextPrayerKey].name,
      nextPrayerTime: state.times[nextPrayerKey],
      countdown,
    };
  }, [state.times]);

  // Get all prayers with status
  const prayerList = useMemo(() => {
    if (!state.times) return [];

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const prayerOrder: (keyof PrayerTimes)[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

    return prayerOrder.map(prayer => {
      const [hours, minutes] = state.times![prayer].split(':').map(Number);
      const prayerMinutes = hours * 60 + minutes;
      
      return {
        id: prayer,
        name: PRAYER_NAMES[prayer].name,
        arabic: PRAYER_NAMES[prayer].arabic,
        time: state.times![prayer],
        passed: currentMinutes > prayerMinutes,
        active: currentPrayer?.name === PRAYER_NAMES[prayer].name,
      };
    });
  }, [state.times, currentPrayer]);

  const refresh = useCallback(() => {
    if (latitude && longitude) {
      fetchPrayerTimes(latitude, longitude);
    }
  }, [latitude, longitude, fetchPrayerTimes]);

  return {
    ...state,
    currentPrayer,
    prayerList,
    prayerNames: PRAYER_NAMES,
    refresh,
    coordinates: { latitude, longitude },
  };
};
