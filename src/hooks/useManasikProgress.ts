import { useSyncExternalStore, useCallback } from 'react';

const STORAGE_KEY = 'manasik_completed';

const subscribers = new Set<() => void>();

function subscribe(callback: () => void) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

function getSnapshot(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function notifyAll() {
  for (const cb of subscribers) cb();
}

let cachedSnapshot: string[] = getSnapshot();

function getStableSnapshot() {
  const fresh = getSnapshot();
  if (JSON.stringify(fresh) !== JSON.stringify(cachedSnapshot)) {
    cachedSnapshot = fresh;
  }
  return cachedSnapshot;
}

export function setManasikCompleted(steps: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(steps));
  cachedSnapshot = steps;
  notifyAll();
}

export function useManasikProgress() {
  const completedSteps = useSyncExternalStore(subscribe, getStableSnapshot, () => []);

  const toggleStep = useCallback((id: string) => {
    const current = getSnapshot();
    const updated = current.includes(id)
      ? current.filter(s => s !== id)
      : [...current, id];
    setManasikCompleted(updated);
  }, []);

  return { completedSteps, toggleStep };
}
