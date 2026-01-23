import { useState, useEffect, useCallback } from 'react';

interface NotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  isLoading: boolean;
}

export const useNotifications = () => {
  const [state, setState] = useState<NotificationState>({
    isSupported: false,
    permission: 'default',
    isLoading: true
  });

  useEffect(() => {
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    
    setState({
      isSupported,
      permission: isSupported ? Notification.permission : 'denied',
      isLoading: false
    });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      console.log('Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [state.isSupported]);

  const showNotification = useCallback(async (
    title: string,
    options?: NotificationOptions
  ): Promise<boolean> => {
    if (!state.isSupported || state.permission !== 'granted') {
      console.log('Cannot show notification: not supported or permission not granted');
      return false;
    }

    try {
      // Try to use service worker notification first
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        ...options
      });
      return true;
    } catch (error) {
      // Fallback to regular notification
      try {
        new Notification(title, {
          icon: '/pwa-192x192.png',
          ...options
        });
        return true;
      } catch (fallbackError) {
        console.error('Error showing notification:', fallbackError);
        return false;
      }
    }
  }, [state.isSupported, state.permission]);

  const scheduleNotification = useCallback((
    title: string,
    options: NotificationOptions & { scheduledTime: Date }
  ): number | null => {
    if (!state.isSupported || state.permission !== 'granted') {
      return null;
    }

    const now = new Date();
    const delay = options.scheduledTime.getTime() - now.getTime();
    
    if (delay <= 0) {
      showNotification(title, options);
      return null;
    }

    const timeoutId = window.setTimeout(() => {
      showNotification(title, options);
    }, delay);

    return timeoutId;
  }, [state.isSupported, state.permission, showNotification]);

  const cancelScheduledNotification = useCallback((timeoutId: number) => {
    window.clearTimeout(timeoutId);
  }, []);

  return {
    ...state,
    requestPermission,
    showNotification,
    scheduleNotification,
    cancelScheduledNotification
  };
};
