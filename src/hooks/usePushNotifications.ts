import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotifications } from './useNotifications';
import { useReminders } from './useReminders';
import { differenceInDays, format, subDays } from 'date-fns';
import { id } from 'date-fns/locale';

// Notification types for different reminders
export type NotificationType = 
  | 'departure' 
  | 'payment' 
  | 'document' 
  | 'preparation' 
  | 'reminder';

interface ScheduledNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  scheduledTime: Date;
  timeoutId?: number;
}

interface NotificationPreferences {
  enabled: boolean;
  departureReminders: boolean;
  paymentReminders: boolean;
  documentReminders: boolean;
  preparationReminders: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

const PREFERENCES_KEY = 'arah-umroh-notification-preferences';
const SCHEDULED_KEY = 'arah-umroh-scheduled-notifications';

const defaultPreferences: NotificationPreferences = {
  enabled: true,
  departureReminders: true,
  paymentReminders: true,
  documentReminders: true,
  preparationReminders: true,
  soundEnabled: true,
  vibrationEnabled: true,
};

// Notification templates
const notificationTemplates = {
  departure: {
    'H-30': {
      title: '30 Hari Menuju Keberangkatan 🕌',
      body: 'Waktunya mempersiapkan dokumen dan perlengkapan umroh Anda!'
    },
    'H-14': {
      title: '2 Minggu Lagi! ✈️',
      body: 'Pastikan passport, visa, dan tiket sudah siap'
    },
    'H-7': {
      title: 'Seminggu Menuju Tanah Suci 🕋',
      body: 'Periksa kembali checklist perlengkapan Anda'
    },
    'H-3': {
      title: '3 Hari Lagi! 🌙',
      body: 'Siapkan pakaian ihram dan perlengkapan sholat'
    },
    'H-1': {
      title: 'Besok Berangkat! 🤲',
      body: 'Istirahat yang cukup dan baca doa safar'
    },
    'H-0': {
      title: 'Hari Keberangkatan! ✨',
      body: 'Bismillah, semoga perjalanan Anda berkah dan lancar'
    }
  },
  payment: {
    reminder: {
      title: 'Pengingat Pembayaran 💳',
      body: 'Jangan lupa cek jadwal pelunasan paket umroh Anda'
    },
    deadline: {
      title: 'Batas Pembayaran! ⚠️',
      body: 'Segera lakukan pelunasan untuk mengamankan kursi Anda'
    }
  },
  document: {
    passport: {
      title: 'Periksa Passport 📘',
      body: 'Pastikan passport masih berlaku minimal 7 bulan'
    },
    visa: {
      title: 'Proses Visa 📋',
      body: 'Segera lengkapi dokumen untuk pengajuan visa umroh'
    },
    incomplete: {
      title: 'Dokumen Belum Lengkap 📄',
      body: 'Ada dokumen yang perlu dilengkapi. Buka checklist Anda'
    }
  },
  preparation: {
    health: {
      title: 'Persiapan Kesehatan 🏥',
      body: 'Lakukan vaksinasi dan medical checkup'
    },
    packing: {
      title: 'Waktunya Packing! 🧳',
      body: 'Siapkan koper dan perlengkapan umroh Anda'
    },
    manasik: {
      title: 'Ikuti Manasik 📖',
      body: 'Pelajari tata cara ibadah umroh sebelum berangkat'
    }
  }
};

export const usePushNotifications = () => {
  const { 
    isSupported, 
    permission, 
    requestPermission, 
    showNotification,
    scheduleNotification: scheduleSystemNotification,
    cancelScheduledNotification: cancelSystemNotification
  } = useNotifications();
  
  const { departureDate } = useReminders();
  
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const scheduledTimeoutsRef = useRef<Map<string, number>>(new Map());

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(PREFERENCES_KEY);
    if (saved) {
      setPreferences({ ...defaultPreferences, ...JSON.parse(saved) });
    }
  }, []);

  // Save preferences to localStorage
  const updatePreferences = useCallback((updates: Partial<NotificationPreferences>) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, ...updates };
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(newPrefs));
      return newPrefs;
    });
  }, []);

  // Clear all scheduled notifications
  const clearAllScheduled = useCallback(() => {
    scheduledTimeoutsRef.current.forEach((timeoutId) => {
      cancelSystemNotification(timeoutId);
    });
    scheduledTimeoutsRef.current.clear();
    setScheduledNotifications([]);
    localStorage.removeItem(SCHEDULED_KEY);
  }, [cancelSystemNotification]);

  // Schedule a single notification
  const scheduleNotification = useCallback((
    notification: Omit<ScheduledNotification, 'timeoutId'>
  ): boolean => {
    if (!isSupported || permission !== 'granted' || !preferences.enabled) {
      return false;
    }

    const delay = notification.scheduledTime.getTime() - Date.now();
    if (delay <= 0) {
      // Already passed, show immediately
      showNotification(notification.title, { 
        body: notification.body,
        tag: notification.id,
      });
      return true;
    }

    const timeoutId = scheduleSystemNotification(notification.title, {
      body: notification.body,
      tag: notification.id,
      scheduledTime: notification.scheduledTime,
    });

    if (timeoutId) {
      scheduledTimeoutsRef.current.set(notification.id, timeoutId);
      setScheduledNotifications(prev => [...prev, { ...notification, timeoutId }]);
      return true;
    }

    return false;
  }, [isSupported, permission, preferences, showNotification, scheduleSystemNotification]);

  // Cancel a specific notification
  const cancelNotification = useCallback((notificationId: string) => {
    const timeoutId = scheduledTimeoutsRef.current.get(notificationId);
    if (timeoutId) {
      cancelSystemNotification(timeoutId);
      scheduledTimeoutsRef.current.delete(notificationId);
      setScheduledNotifications(prev => prev.filter(n => n.id !== notificationId));
    }
  }, [cancelSystemNotification]);

  // Schedule departure countdown notifications
  const scheduleDepartureReminders = useCallback(() => {
    if (!departureDate || !preferences.departureReminders) return;

    const departureDays = [30, 14, 7, 3, 1, 0];
    
    departureDays.forEach(days => {
      const notificationDate = subDays(departureDate, days);
      const now = new Date();
      
      // Only schedule future notifications
      if (notificationDate > now) {
        const key = `H-${days}` as keyof typeof notificationTemplates.departure;
        const template = notificationTemplates.departure[key];
        
        if (template) {
          // Schedule for 8 AM on that day
          notificationDate.setHours(8, 0, 0, 0);
          
          scheduleNotification({
            id: `departure-${days}-${departureDate.toISOString()}`,
            type: 'departure',
            title: template.title,
            body: template.body,
            scheduledTime: notificationDate,
          });
        }
      }
    });
  }, [departureDate, preferences.departureReminders, scheduleNotification]);

  // Schedule document reminder notifications
  const scheduleDocumentReminders = useCallback(() => {
    if (!departureDate || !preferences.documentReminders) return;

    // Schedule passport check H-60
    const passportDate = subDays(departureDate, 60);
    if (passportDate > new Date()) {
      passportDate.setHours(9, 0, 0, 0);
      scheduleNotification({
        id: `document-passport-${departureDate.toISOString()}`,
        type: 'document',
        title: notificationTemplates.document.passport.title,
        body: notificationTemplates.document.passport.body,
        scheduledTime: passportDate,
      });
    }

    // Schedule visa reminder H-45
    const visaDate = subDays(departureDate, 45);
    if (visaDate > new Date()) {
      visaDate.setHours(9, 0, 0, 0);
      scheduleNotification({
        id: `document-visa-${departureDate.toISOString()}`,
        type: 'document',
        title: notificationTemplates.document.visa.title,
        body: notificationTemplates.document.visa.body,
        scheduledTime: visaDate,
      });
    }
  }, [departureDate, preferences.documentReminders, scheduleNotification]);

  // Schedule preparation reminder notifications
  const schedulePreparationReminders = useCallback(() => {
    if (!departureDate || !preferences.preparationReminders) return;

    // Health check H-45
    const healthDate = subDays(departureDate, 45);
    if (healthDate > new Date()) {
      healthDate.setHours(10, 0, 0, 0);
      scheduleNotification({
        id: `prep-health-${departureDate.toISOString()}`,
        type: 'preparation',
        title: notificationTemplates.preparation.health.title,
        body: notificationTemplates.preparation.health.body,
        scheduledTime: healthDate,
      });
    }

    // Manasik reminder H-21
    const manasikDate = subDays(departureDate, 21);
    if (manasikDate > new Date()) {
      manasikDate.setHours(10, 0, 0, 0);
      scheduleNotification({
        id: `prep-manasik-${departureDate.toISOString()}`,
        type: 'preparation',
        title: notificationTemplates.preparation.manasik.title,
        body: notificationTemplates.preparation.manasik.body,
        scheduledTime: manasikDate,
      });
    }

    // Packing reminder H-5
    const packingDate = subDays(departureDate, 5);
    if (packingDate > new Date()) {
      packingDate.setHours(10, 0, 0, 0);
      scheduleNotification({
        id: `prep-packing-${departureDate.toISOString()}`,
        type: 'preparation',
        title: notificationTemplates.preparation.packing.title,
        body: notificationTemplates.preparation.packing.body,
        scheduledTime: packingDate,
      });
    }
  }, [departureDate, preferences.preparationReminders, scheduleNotification]);

  // Send immediate notification for incomplete documents
  const notifyIncompleteDocuments = useCallback((count: number) => {
    if (!preferences.documentReminders) return false;
    
    return showNotification(
      notificationTemplates.document.incomplete.title,
      {
        body: `Anda memiliki ${count} dokumen yang belum lengkap`,
        tag: 'incomplete-docs',
      }
    );
  }, [preferences.documentReminders, showNotification]);

  // Send payment reminder
  const sendPaymentReminder = useCallback((message?: string) => {
    if (!preferences.paymentReminders) return false;
    
    return showNotification(
      notificationTemplates.payment.reminder.title,
      {
        body: message || notificationTemplates.payment.reminder.body,
        tag: 'payment-reminder',
      }
    );
  }, [preferences.paymentReminders, showNotification]);

  // Initialize all reminders when departure date changes
  useEffect(() => {
    if (departureDate && permission === 'granted' && preferences.enabled) {
      // Clear existing scheduled notifications first
      clearAllScheduled();
      
      // Schedule all types of reminders
      scheduleDepartureReminders();
      scheduleDocumentReminders();
      schedulePreparationReminders();
    }
  }, [
    departureDate, 
    permission, 
    preferences.enabled,
    clearAllScheduled,
    scheduleDepartureReminders,
    scheduleDocumentReminders,
    schedulePreparationReminders
  ]);

  // Get departure countdown info
  const getDepartureCountdown = useCallback(() => {
    if (!departureDate) return null;
    
    const days = differenceInDays(departureDate, new Date());
    return {
      days,
      formattedDate: format(departureDate, 'EEEE, dd MMMM yyyy', { locale: id }),
      phase: days > 30 ? 'early' : days > 7 ? 'H-30' : days > 1 ? 'H-7' : days >= 0 ? 'H-1' : 'departed'
    };
  }, [departureDate]);

  return {
    // State
    isSupported,
    permission,
    preferences,
    scheduledNotifications,
    departureDate,
    
    // Actions
    requestPermission,
    updatePreferences,
    scheduleNotification,
    cancelNotification,
    clearAllScheduled,
    
    // Notification triggers
    notifyIncompleteDocuments,
    sendPaymentReminder,
    scheduleDepartureReminders,
    scheduleDocumentReminders,
    schedulePreparationReminders,
    
    // Helpers
    getDepartureCountdown,
    notificationTemplates,
  };
};
