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

  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
      
      let currentRegistration = null;
      if (isSupported) {
        currentRegistration = await navigator.serviceWorker.ready;
        setRegistration(currentRegistration);
      }

      setState({
        isSupported,
        permission: isSupported ? Notification.permission : 'denied',
        isLoading: false
      });
    };

    checkSupport();
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

  const subscribeToPush = useCallback(async (userId: string): Promise<boolean> => {
    if (!state.isSupported || state.permission !== 'granted') {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // VAPID public key from environment or constant
      const vapidPublicKey = 'BMYnnHrzSXdRMBTVXxKfrf3_8uyCutC6ZgR3HWVdyia5DoPAncRcbazKYjHLceyQ7HwaWWx-IEltdCJsxkAiDM8';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      // Send subscription to backend (Supabase)
      const { supabase } = await import('@/integrations/supabase/client');
      
      const subJson = subscription.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error('Invalid subscription object');
      }

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: subJson.endpoint,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'endpoint'
        });

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  }, [state.isSupported, state.permission]);

  const registerBackgroundSync = useCallback(async (tag: string) => {
    if (!registration || !('sync' in registration)) return false;
    
    try {
      await (registration as any).sync.register(tag);
      return true;
    } catch (error) {
      console.error('Background sync registration error:', error);
      return false;
    }
  }, [registration]);

  return {
    ...state,
    registration,
    requestPermission,
    showNotification,
    scheduleNotification,
    cancelScheduledNotification,
    subscribeToPush,
    registerBackgroundSync
  };
};
