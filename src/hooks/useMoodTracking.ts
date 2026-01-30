import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { DefaultHabit, allHabitsByCategory, HabitCategory } from '@/data/defaultHabits';

const MOOD_STORAGE_KEY = 'habit_mood_logs';

export interface MoodLog {
  id: string;
  date: string;
  mood: string;
  moodLevel: number; // 1-5 (1=sad, 5=excellent)
  energyLevel: number; // 1-3 (1=low, 3=high)
  gratitude: string[];
  notes: string;
  timestamp: number;
}

export type MoodType = 'excellent' | 'happy' | 'neutral' | 'tired' | 'sad';

export const moodConfig: Record<MoodType, {
  label: string;
  color: string;
  bg: string;
  level: number;
  energyModifier: number;
  suggestedCategories: HabitCategory[];
  avoidCategories: HabitCategory[];
  message: string;
  tips: string[];
}> = {
  excellent: {
    label: 'Luar Biasa',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    level: 5,
    energyModifier: 1.5,
    suggestedCategories: ['produktivitas', 'belajar', 'kesehatan', 'sosial'],
    avoidCategories: [],
    message: 'Energimu tinggi! Waktunya produktif maksimal 🚀',
    tips: ['Ambil tantangan besar', 'Bantu orang lain', 'Belajar hal baru'],
  },
  happy: {
    label: 'Senang',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    level: 4,
    energyModifier: 1.2,
    suggestedCategories: ['spiritual', 'belajar', 'sosial', 'produktivitas'],
    avoidCategories: [],
    message: 'Mood bagus untuk beraktivitas! 😊',
    tips: ['Manfaatkan momentum', 'Hubungi teman', 'Olahraga ringan'],
  },
  neutral: {
    label: 'Biasa',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    level: 3,
    energyModifier: 1.0,
    suggestedCategories: ['spiritual', 'mental', 'belajar'],
    avoidCategories: [],
    message: 'Hari yang normal, jaga ritme 🌤️',
    tips: ['Fokus pada rutinitas', 'Jangan terlalu memaksa', 'Istirahat cukup'],
  },
  tired: {
    label: 'Lelah',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    level: 2,
    energyModifier: 0.7,
    suggestedCategories: ['spiritual', 'mental', 'kesehatan'],
    avoidCategories: ['produktivitas'],
    message: 'Istirahat dulu, jangan memaksakan diri 💜',
    tips: ['Ibadah ringan', 'Meditasi', 'Tidur cukup', 'Makan bergizi'],
  },
  sad: {
    label: 'Sedih',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    level: 1,
    energyModifier: 0.5,
    suggestedCategories: ['spiritual', 'mental', 'sosial'],
    avoidCategories: ['produktivitas', 'finansial'],
    message: 'Pelan-pelan saja, Allah selalu bersamamu 🤍',
    tips: ['Sholat & doa', 'Cerita ke orang terdekat', 'Jalan-jalan sebentar', 'Jurnal syukur'],
  },
};

export const useMoodTracking = () => {
  const [todayMood, setTodayMood] = useState<MoodLog | null>(null);
  const [moodHistory, setMoodHistory] = useState<MoodLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMoodData();
  }, []);

  const loadMoodData = () => {
    const stored = localStorage.getItem(MOOD_STORAGE_KEY);
    if (stored) {
      const logs: MoodLog[] = JSON.parse(stored);
      setMoodHistory(logs);
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayLog = logs.find(l => l.date === today);
      if (todayLog) {
        setTodayMood(todayLog);
      }
    }
    setIsLoading(false);
  };

  const saveMood = useCallback((moodData: Omit<MoodLog, 'id' | 'date' | 'timestamp'>) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const newLog: MoodLog = {
      id: crypto.randomUUID(),
      date: today,
      ...moodData,
      timestamp: Date.now(),
    };

    const stored = localStorage.getItem(MOOD_STORAGE_KEY);
    let logs: MoodLog[] = stored ? JSON.parse(stored) : [];
    
    // Remove existing today entry if any
    logs = logs.filter(l => l.date !== today);
    logs.unshift(newLog);
    
    // Keep only last 30 days
    logs = logs.slice(0, 30);
    
    localStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify(logs));
    setTodayMood(newLog);
    setMoodHistory(logs);
    
    return newLog;
  }, []);

  const getMoodConfig = useCallback((mood: string) => {
    return moodConfig[mood as MoodType] || moodConfig.neutral;
  }, []);

  return {
    todayMood,
    moodHistory,
    isLoading,
    saveMood,
    getMoodConfig,
  };
};

// Hook untuk mendapatkan habit recommendations berdasarkan mood
export const useMoodBasedHabits = (
  allHabits: DefaultHabit[],
  moodLevel: number,
  energyLevel: number,
  mood: string
) => {
  const [suggestedHabits, setSuggestedHabits] = useState<DefaultHabit[]>([]);
  const [priorityHabits, setPriorityHabits] = useState<DefaultHabit[]>([]);
  const [lightHabits, setLightHabits] = useState<DefaultHabit[]>([]);

  useEffect(() => {
    if (allHabits.length === 0) return;

    const config = moodConfig[mood as MoodType] || moodConfig.neutral;
    
    // Filter habits based on mood
    const suggested = allHabits.filter(habit => 
      config.suggestedCategories.includes(habit.category) &&
      !config.avoidCategories.includes(habit.category)
    );

    const avoided = allHabits.filter(habit =>
      config.avoidCategories.includes(habit.category)
    );

    // Calculate effective energy
    const effectiveEnergy = energyLevel * config.energyModifier;
    
    // Prioritize based on energy
    let priority: DefaultHabit[] = [];
    let light: DefaultHabit[] = [];

    if (effectiveEnergy >= 2.5) {
      // High energy: show all suggested + some challenging ones
      priority = suggested.slice(0, 7);
      light = allHabits.filter(h => !priority.find(p => p.id === h.id)).slice(0, 5);
    } else if (effectiveEnergy >= 1.5) {
      // Medium energy: balanced approach
      priority = suggested.slice(0, 5);
      light = allHabits
        .filter(h => !priority.find(p => p.id === h.id) && !avoided.find(a => a.id === h.id))
        .slice(0, 4);
    } else {
      // Low energy: only light/spiritual habits
      priority = suggested
        .filter(h => h.category === 'spiritual' || h.category === 'mental')
        .slice(0, 4);
      light = suggested
        .filter(h => !priority.find(p => p.id === h.id))
        .slice(0, 3);
    }

    setSuggestedHabits(suggested);
    setPriorityHabits(priority);
    setLightHabits(light);
  }, [allHabits, moodLevel, energyLevel, mood]);

  return {
    suggestedHabits,
    priorityHabits,
    lightHabits,
  };
};

export default useMoodTracking;
