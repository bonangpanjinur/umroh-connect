import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotifications } from './useNotifications';
import { usePrayerTimes } from './usePrayerTimes';
import { PrayerTimes } from '@/types';

export type PrayerId = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

interface AdzanPreferences {
  enabled: boolean;
  prayers: Record<PrayerId, boolean>;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  reminderMinutes: number; // Minutes before adzan to remind
}

interface ScheduledAdzan {
  prayerId: PrayerId;
  prayerName: string;
  scheduledTime: Date;
  timeoutId: number;
  isReminder: boolean;
}

const STORAGE_KEY = 'arah-umroh-adzan-preferences';

const DEFAULT_PREFERENCES: AdzanPreferences = {
  enabled: true,
  prayers: {
    fajr: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  },
  soundEnabled: true,
  vibrationEnabled: true,
  reminderMinutes: 5,
};

const PRAYER_NAMES: Record<PrayerId, { name: string; arabic: string; emoji: string }> = {
  fajr: { name: 'Subuh', arabic: 'الفجر', emoji: '🌅' },
  dhuhr: { name: 'Dzuhur', arabic: 'الظهر', emoji: '☀️' },
  asr: { name: 'Ashar', arabic: 'العصر', emoji: '🌤️' },
  maghrib: { name: 'Maghrib', arabic: 'المغرب', emoji: '🌅' },
  isha: { name: 'Isya', arabic: 'العشاء', emoji: '🌙' },
};

export const useAdzanNotifications = () => {
  const { 
    isSupported, 
    permission, 
    requestPermission, 
    showNotification,
    registerBackgroundSync 
  } = useNotifications();
  const { times, location, loading: timesLoading } = usePrayerTimes();
  
  const [preferences, setPreferences] = useState<AdzanPreferences>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_PREFERENCES;
      }
    }
    return DEFAULT_PREFERENCES;
  });

  const [scheduledAdzans, setScheduledAdzans] = useState<ScheduledAdzan[]>([]);
  const scheduledTimeoutsRef = useRef<Map<string, number>>(new Map());

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  // Clear all scheduled notifications
  const clearAllScheduled = useCallback(() => {
    scheduledTimeoutsRef.current.forEach(timeoutId => {
      window.clearTimeout(timeoutId);
    });
    scheduledTimeoutsRef.current.clear();
    setScheduledAdzans([]);
  }, []);

  // Schedule a single adzan notification
  const scheduleAdzanNotification = useCallback((
    prayerId: PrayerId,
    prayerTime: string,
    isReminder: boolean = false
  ): ScheduledAdzan | null => {
    if (!isSupported || permission !== 'granted') return null;
    if (!preferences.enabled || !preferences.prayers[prayerId]) return null;

    const now = new Date();
    const [hours, minutes] = prayerTime.split(':').map(Number);
    
    let scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If reminder, subtract reminder minutes
    if (isReminder && preferences.reminderMinutes > 0) {
      scheduledTime = new Date(scheduledTime.getTime() - preferences.reminderMinutes * 60 * 1000);
    }

    // If time has passed, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const delay = scheduledTime.getTime() - now.getTime();
    const key = `${prayerId}-${isReminder ? 'reminder' : 'adzan'}`;

    // Clear existing timeout for this prayer
    const existingTimeout = scheduledTimeoutsRef.current.get(key);
    if (existingTimeout) {
      window.clearTimeout(existingTimeout);
    }

    const prayerInfo = PRAYER_NAMES[prayerId];
    
    const timeoutId = window.setTimeout(() => {
      const title = isReminder 
        ? `${preferences.reminderMinutes} Menit Menuju ${prayerInfo.name} ${prayerInfo.emoji}`
        : `Waktu ${prayerInfo.name} ${prayerInfo.emoji}`;
      
      const body = isReminder
        ? `Bersiaplah untuk sholat ${prayerInfo.name} (${prayerInfo.arabic})`
        : `Hayya 'alas sholah - Mari menunaikan sholat ${prayerInfo.name}`;

      showNotification(title, {
        body,
        tag: `adzan-${prayerId}`,
        requireInteraction: !isReminder,
        data: {
          type: 'adzan',
          prayerId,
          isReminder,
          time: prayerTime,
        },
      });

      // Trigger vibration as feedback
      if (preferences.soundEnabled && !isReminder) {
        if ('vibrate' in navigator && preferences.vibrationEnabled) {
          navigator.vibrate([200, 100, 200, 100, 200, 100, 200]);
        }
      }

      // Remove from scheduled list
      scheduledTimeoutsRef.current.delete(key);
      setScheduledAdzans(prev => prev.filter(s => !(s.prayerId === prayerId && s.isReminder === isReminder)));

      // Reschedule for tomorrow
      setTimeout(() => {
        scheduleAdzanNotification(prayerId, prayerTime, isReminder);
      }, 1000);

    }, delay);

    scheduledTimeoutsRef.current.set(key, timeoutId);

    return {
      prayerId,
      prayerName: prayerInfo.name,
      scheduledTime,
      timeoutId,
      isReminder,
    };
  }, [isSupported, permission, preferences, showNotification]);

  // Schedule all adzan notifications
  const scheduleAllAdzans = useCallback((prayerTimes: PrayerTimes) => {
    clearAllScheduled();

    if (!preferences.enabled || permission !== 'granted') return;

    const newScheduled: ScheduledAdzan[] = [];
    const prayerIds: PrayerId[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

    prayerIds.forEach(prayerId => {
      if (preferences.prayers[prayerId]) {
        // Schedule reminder
        if (preferences.reminderMinutes > 0) {
          const reminder = scheduleAdzanNotification(prayerId, prayerTimes[prayerId], true);
          if (reminder) newScheduled.push(reminder);
        }

        // Schedule main adzan
        const adzan = scheduleAdzanNotification(prayerId, prayerTimes[prayerId], false);
        if (adzan) newScheduled.push(adzan);
      }
    });

    setScheduledAdzans(newScheduled);
  }, [clearAllScheduled, preferences, permission, scheduleAdzanNotification]);

  // Reschedule when times or preferences change
  useEffect(() => {
    if (times && !timesLoading && permission === 'granted') {
      scheduleAllAdzans(times);
      
      // Register background sync to keep times updated
      if (preferences.enabled) {
        registerBackgroundSync('update-prayer-times');
      }
    }
  }, [times, timesLoading, permission, scheduleAllAdzans, preferences.enabled, registerBackgroundSync]);

  // Update preferences
  const updatePreferences = useCallback((updates: Partial<AdzanPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  }, []);

  // Toggle specific prayer notification
  const togglePrayer = useCallback((prayerId: PrayerId, enabled: boolean) => {
    setPreferences(prev => ({
      ...prev,
      prayers: {
        ...prev.prayers,
        [prayerId]: enabled,
      },
    }));
  }, []);

  // Enable all adzan notifications
  const enableAll = useCallback(async () => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    setPreferences(prev => ({
      ...prev,
      enabled: true,
      prayers: {
        fajr: true,
        dhuhr: true,
        asr: true,
        maghrib: true,
        isha: true,
      },
    }));

    return true;
  }, [permission, requestPermission]);

  // Disable all adzan notifications
  const disableAll = useCallback(() => {
    clearAllScheduled();
    setPreferences(prev => ({ ...prev, enabled: false }));
  }, [clearAllScheduled]);

  // Get next scheduled adzan
  const nextScheduledAdzan = scheduledAdzans
    .filter(s => !s.isReminder)
    .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())[0] || null;

  // Send test notification
  const sendTestNotification = useCallback(async (prayerId: PrayerId = 'asr') => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    const prayerInfo = PRAYER_NAMES[prayerId];
    
    await showNotification(`Test: Waktu ${prayerInfo.name} ${prayerInfo.emoji}`, {
      body: `Hayya 'alas sholah - Mari menunaikan sholat ${prayerInfo.name}`,
      tag: 'adzan-test',
    });

    if ('vibrate' in navigator && preferences.vibrationEnabled) {
      navigator.vibrate([200, 100, 200]);
    }

    return true;
  }, [permission, preferences.vibrationEnabled, requestPermission, showNotification]);

  return {
    // State
    isSupported,
    permission,
    preferences,
    scheduledAdzans,
    nextScheduledAdzan,
    location,
    timesLoading,
    prayerNames: PRAYER_NAMES,

    // Actions
    requestPermission,
    updatePreferences,
    togglePrayer,
    enableAll,
    disableAll,
    clearAllScheduled,
    sendTestNotification,
    scheduleAllAdzans,
  };
};
