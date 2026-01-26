import { useState, useEffect } from 'react';
import { Reminder, defaultReminders, getCurrentPhase, ReminderPhase } from '@/data/reminderData';

interface UserReminder extends Reminder {
  isCompleted: boolean;
  completedAt?: string;
  notificationEnabled: boolean;
}

interface ReminderState {
  departureDate: Date | null;
  reminders: UserReminder[];
  currentPhase: ReminderPhase;
}

const STORAGE_KEY = 'arah-umroh-reminders';
const DEPARTURE_KEY = 'arah-umroh-departure-date';

export const useReminders = () => {
  const [state, setState] = useState<ReminderState>({
    departureDate: null,
    reminders: [],
    currentPhase: 'H-30'
  });

  // Load from localStorage on mount
  useEffect(() => {
    const savedDeparture = localStorage.getItem(DEPARTURE_KEY);
    const savedReminders = localStorage.getItem(STORAGE_KEY);
    
    let departureDate: Date | null = null;
    if (savedDeparture) {
      departureDate = new Date(savedDeparture);
    }

    let reminders: UserReminder[] = [];
    if (savedReminders) {
      reminders = JSON.parse(savedReminders);
    } else {
      // Initialize with default reminders
      reminders = defaultReminders.map(r => ({
        ...r,
        isCompleted: false,
        notificationEnabled: r.priority === 'high'
      }));
    }

    setState({
      departureDate,
      reminders,
      currentPhase: getCurrentPhase(departureDate)
    });
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (state.reminders.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.reminders));
    }
    if (state.departureDate) {
      localStorage.setItem(DEPARTURE_KEY, state.departureDate.toISOString());
    }
  }, [state.reminders, state.departureDate]);

  // Update current phase periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        currentPhase: getCurrentPhase(prev.departureDate)
      }));
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const setDepartureDate = (date: Date | null) => {
    setState(prev => ({
      ...prev,
      departureDate: date,
      currentPhase: getCurrentPhase(date)
    }));
  };

  const toggleReminderComplete = (reminderId: string) => {
    setState(prev => ({
      ...prev,
      reminders: prev.reminders.map(r =>
        r.id === reminderId
          ? {
              ...r,
              isCompleted: !r.isCompleted,
              completedAt: !r.isCompleted ? new Date().toISOString() : undefined
            }
          : r
      )
    }));
  };

  const toggleReminderNotification = (reminderId: string) => {
    setState(prev => ({
      ...prev,
      reminders: prev.reminders.map(r =>
        r.id === reminderId
          ? { ...r, notificationEnabled: !r.notificationEnabled }
          : r
      )
    }));
  };

  const addCustomReminder = (reminder: Omit<Reminder, 'id' | 'isDefault'>) => {
    const newReminder: UserReminder = {
      ...reminder,
      id: `custom-${Date.now()}`,
      isDefault: false,
      isCompleted: false,
      notificationEnabled: true
    };

    setState(prev => ({
      ...prev,
      reminders: [...prev.reminders, newReminder]
    }));
  };

  const deleteReminder = (reminderId: string) => {
    setState(prev => ({
      ...prev,
      reminders: prev.reminders.filter(r => r.id !== reminderId)
    }));
  };

  const getRemindersByPhase = (phase: ReminderPhase) => {
    return state.reminders.filter(r => r.phase === phase);
  };

  const getUpcomingReminders = (limit: number = 5) => {
    if (!state.departureDate) return [];

    const now = new Date();
    const diffDays = Math.ceil(
      (state.departureDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return state.reminders
      .filter(r => !r.isCompleted && r.daysBeforeDeparture >= diffDays - 3)
      .sort((a, b) => b.daysBeforeDeparture - a.daysBeforeDeparture)
      .slice(0, limit);
  };

  const getProgress = () => {
    const total = state.reminders.length;
    const completed = state.reminders.filter(r => r.isCompleted).length;
    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const getPhaseProgress = (phase: ReminderPhase) => {
    const phaseReminders = state.reminders.filter(r => r.phase === phase);
    const completed = phaseReminders.filter(r => r.isCompleted).length;
    return {
      total: phaseReminders.length,
      completed,
      percentage: phaseReminders.length > 0 ? Math.round((completed / phaseReminders.length) * 100) : 0
    };
  };

  return {
    ...state,
    setDepartureDate,
    toggleReminderComplete,
    toggleReminderNotification,
    addCustomReminder,
    deleteReminder,
    getRemindersByPhase,
    getUpcomingReminders,
    getProgress,
    getPhaseProgress
  };
};
