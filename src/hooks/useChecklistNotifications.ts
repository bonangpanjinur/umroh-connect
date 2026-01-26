import { useEffect } from 'react';
import { usePushNotifications } from './usePushNotifications';
import { useChecklistStats } from './useChecklist';
import { useAuthContext } from '@/contexts/AuthContext';

/**
 * Hook to integrate push notifications with checklist data
 * Automatically notifies users about incomplete documents
 */
export const useChecklistNotifications = () => {
  const { user } = useAuthContext();
  const { stats } = useChecklistStats(user?.id);
  const { 
    preferences,
    notifyIncompleteDocuments,
    permission,
  } = usePushNotifications();

  // Check for incomplete documents and send reminder
  useEffect(() => {
    if (!user?.id || permission !== 'granted' || !preferences.documentReminders) {
      return;
    }

    const documentStats = stats.byCategory.dokumen;
    const incompleteCount = documentStats.total - documentStats.completed;

    // Only notify if there are incomplete documents and user hasn't completed all
    if (incompleteCount > 0 && documentStats.completed > 0) {
      // Check if we've already notified today
      const lastNotifiedKey = 'arah-umroh-doc-notified';
      const lastNotified = localStorage.getItem(lastNotifiedKey);
      const today = new Date().toDateString();

      if (lastNotified !== today) {
        // Wait a bit before showing notification (don't overwhelm on load)
        const timeoutId = setTimeout(() => {
          notifyIncompleteDocuments(incompleteCount);
          localStorage.setItem(lastNotifiedKey, today);
        }, 5000);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [user?.id, stats, permission, preferences.documentReminders, notifyIncompleteDocuments]);

  return {
    incompleteDocuments: stats.byCategory.dokumen.total - stats.byCategory.dokumen.completed,
    totalDocuments: stats.byCategory.dokumen.total,
    completedDocuments: stats.byCategory.dokumen.completed,
  };
};
