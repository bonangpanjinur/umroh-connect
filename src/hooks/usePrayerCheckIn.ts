import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export const PRAYER_ORDER = [
  { id: 'fajr', name: 'Subuh' },
  { id: 'dhuhr', name: 'Dzuhur' },
  { id: 'asr', name: 'Ashar' },
  { id: 'maghrib', name: 'Maghrib' },
  { id: 'isha', name: 'Isya' },
] as const;

export type PrayerId = typeof PRAYER_ORDER[number]['id'];

export interface PrayerCheckInEntry {
  prayerId: PrayerId;
  isQadha: boolean;
}

const STORAGE_PREFIX = 'prayer_checkin_';

const localKey = (date: string) => `${STORAGE_PREFIX}${date}`;

const readLocal = (date: string): PrayerCheckInEntry[] => {
  try {
    const raw = localStorage.getItem(localKey(date));
    return raw ? (JSON.parse(raw) as PrayerCheckInEntry[]) : [];
  } catch {
    return [];
  }
};

const writeLocal = (date: string, entries: PrayerCheckInEntry[]) => {
  try {
    localStorage.setItem(localKey(date), JSON.stringify(entries));
  } catch {
    /* ignore */
  }
};

/**
 * Cek apakah satu salat sudah ditandai hari ini.
 * Dipakai pengingat lanjutan agar tidak menegur pengguna yang sudah salat.
 */
export const isPrayerCheckedIn = async (prayerId: PrayerId, userId?: string): Promise<boolean> => {
  const date = format(new Date(), 'yyyy-MM-dd');
  if (readLocal(date).some((e) => e.prayerId === prayerId)) return true;
  if (!userId) return false;
  const { data } = await (supabase as any)
    .from('user_prayer_logs')
    .select('prayer_id')
    .eq('user_id', userId)
    .eq('log_date', date)
    .eq('prayer_id', prayerId)
    .maybeSingle();
  return !!data;
};

/**
 * Check-in salat 5 waktu harian.
 * Tersimpan di database untuk pengguna login, localStorage untuk tamu.
 */

export const usePrayerCheckIn = (date: string = format(new Date(), 'yyyy-MM-dd')) => {
  const { user } = useAuthContext();
  const [entries, setEntries] = useState<PrayerCheckInEntry[]>(() => readLocal(date));
  const [isLoading, setIsLoading] = useState(!!user?.id);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!user?.id) {
        setEntries(readLocal(date));
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const { data, error } = await (supabase as any)
        .from('user_prayer_logs')
        .select('prayer_id, is_qadha')
        .eq('user_id', user.id)
        .eq('log_date', date);

      if (cancelled) return;

      if (error) {
        setEntries(readLocal(date));
      } else {
        const remote: PrayerCheckInEntry[] = (data || []).map((r: any) => ({
          prayerId: r.prayer_id as PrayerId,
          isQadha: !!r.is_qadha,
        }));
        // Migrasi catatan tamu ke akun saat pertama kali login
        const local = readLocal(date);
        const toMigrate = local.filter((l) => !remote.some((r) => r.prayerId === l.prayerId));
        if (toMigrate.length > 0) {
          await (supabase as any).from('user_prayer_logs').upsert(
            toMigrate.map((l) => ({
              user_id: user.id,
              log_date: date,
              prayer_id: l.prayerId,
              is_qadha: l.isQadha,
            })),
            { onConflict: 'user_id,log_date,prayer_id' }
          );
          remote.push(...toMigrate);
          writeLocal(date, []);
        }
        setEntries(remote);
      }
      setIsLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id, date]);

  const togglePrayer = useCallback(
    async (prayerId: PrayerId, isQadha = false) => {
      const existing = entries.find((e) => e.prayerId === prayerId);
      const next = existing
        ? entries.filter((e) => e.prayerId !== prayerId)
        : [...entries, { prayerId, isQadha }];
      setEntries(next);

      if (!user?.id) {
        writeLocal(date, next);
        return;
      }

      if (existing) {
        await (supabase as any)
          .from('user_prayer_logs')
          .delete()
          .eq('user_id', user.id)
          .eq('log_date', date)
          .eq('prayer_id', prayerId);
      } else {
        await (supabase as any).from('user_prayer_logs').upsert(
          { user_id: user.id, log_date: date, prayer_id: prayerId, is_qadha: isQadha },
          { onConflict: 'user_id,log_date,prayer_id' }
        );
      }
    },
    [entries, user?.id, date]
  );

  const completedIds = useMemo(() => new Set(entries.map((e) => e.prayerId)), [entries]);

  return {
    entries,
    completedIds,
    completedCount: completedIds.size,
    total: PRAYER_ORDER.length,
    togglePrayer,
    isLoading,
  };
};
