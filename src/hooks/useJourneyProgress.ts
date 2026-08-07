import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

const STORAGE_KEY = 'journey_progress_tasks';

const readLocal = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

const writeLocal = (tasks: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    /* ignore */
  }
};

/**
 * Progres checklist persiapan perjalanan.
 * Tersimpan di database untuk pengguna login, localStorage untuk tamu.
 */
export const useJourneyProgress = () => {
  const { user } = useAuthContext();
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set(readLocal()));
  const [isLoading, setIsLoading] = useState(!!user?.id);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!user?.id) {
        setCompletedTasks(new Set(readLocal()));
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const { data, error } = await (supabase as any)
        .from('user_journey_progress')
        .select('task_id')
        .eq('user_id', user.id);

      if (cancelled) return;
      if (error) {
        setCompletedTasks(new Set(readLocal()));
      } else {
        const remote = new Set<string>((data || []).map((r: any) => r.task_id));
        const local = readLocal();
        // Migrasi progres tamu ke akun saat pertama kali login
        const toMigrate = local.filter((t) => !remote.has(t));
        if (toMigrate.length > 0) {
          await (supabase as any).from('user_journey_progress').upsert(
            toMigrate.map((task_id) => ({ user_id: user.id, task_id })),
            { onConflict: 'user_id,task_id' }
          );
          toMigrate.forEach((t) => remote.add(t));
          writeLocal([]);
        }
        setCompletedTasks(remote);
      }
      setIsLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const toggleTask = useCallback(
    async (taskId: string) => {
      const isDone = completedTasks.has(taskId);
      const next = new Set(completedTasks);
      if (isDone) next.delete(taskId);
      else next.add(taskId);
      setCompletedTasks(next);

      if (!user?.id) {
        writeLocal(Array.from(next));
        return;
      }

      if (isDone) {
        await (supabase as any)
          .from('user_journey_progress')
          .delete()
          .eq('user_id', user.id)
          .eq('task_id', taskId);
      } else {
        await (supabase as any)
          .from('user_journey_progress')
          .upsert({ user_id: user.id, task_id: taskId }, { onConflict: 'user_id,task_id' });
      }
    },
    [completedTasks, user?.id]
  );

  return { completedTasks, toggleTask, isLoading };
};
