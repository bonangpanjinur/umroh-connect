import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  History, CheckCircle2, XCircle, RotateCcw, Pencil, Plus, Trash2, Loader2, User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  useManifestAuditLog, useManifestAuditCount, useAuditActorNames,
  MANIFEST_AUDIT_LABEL, MANIFEST_FIELD_LABEL, ManifestAuditAction,
} from '@/hooks/useManifestAuditLog';

const ACTION_META: Record<ManifestAuditAction, { icon: typeof CheckCircle2; className: string }> = {
  created: { icon: Plus, className: 'bg-primary/10 text-primary' },
  updated: { icon: Pencil, className: 'bg-muted text-muted-foreground' },
  approved: { icon: CheckCircle2, className: 'bg-emerald-500/10 text-emerald-600' },
  rejected: { icon: XCircle, className: 'bg-destructive/10 text-destructive' },
  reset_pending: { icon: RotateCcw, className: 'bg-amber-500/10 text-amber-600' },
  deleted: { icon: Trash2, className: 'bg-destructive/10 text-destructive' },
};

interface Props {
  departureId?: string;
}

export const ManifestAuditLog = ({ departureId }: Props) => {
  const [limit, setLimit] = useState(100);
  const [actionFilter, setActionFilter] = useState<'all' | ManifestAuditAction>('all');
  const [search, setSearch] = useState('');

  const { data: entries, isLoading } = useManifestAuditLog(departureId, limit);
  const { data: total } = useManifestAuditCount(departureId);
  const { data: actors } = useAuditActorNames((entries || []).map((e) => e.changed_by || ''));

  const filtered = useMemo(() => {
    return (entries || []).filter((e) => {
      if (actionFilter !== 'all' && e.action !== actionFilter) return false;
      if (search.trim() && !(e.pilgrim_name || '').toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [entries, actionFilter, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach((e) => {
      const key = format(new Date(e.created_at), 'yyyy-MM-dd');
      map.set(key, [...(map.get(key) || []), e]);
    });
    return Array.from(map.entries());
  }, [filtered]);

  if (!departureId) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Pilih jadwal keberangkatan untuk melihat riwayat perubahan manifest.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <History className="w-4 h-4" />
          {total ?? 0} aktivitas tercatat
        </div>
        <div className="flex-1" />
        <Input
          placeholder="Cari nama jemaah..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-xl sm:max-w-[220px]"
        />
        <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as any)}>
          <SelectTrigger className="rounded-xl sm:w-[200px]">
            <SelectValue placeholder="Semua aktivitas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua aktivitas</SelectItem>
            {(Object.keys(MANIFEST_AUDIT_LABEL) as ManifestAuditAction[]).map((a) => (
              <SelectItem key={a} value={a}>{MANIFEST_AUDIT_LABEL[a]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Belum ada aktivitas manifest untuk filter ini.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([day, items]) => (
            <div key={day} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {format(new Date(day), 'EEEE, dd MMMM yyyy', { locale: idLocale })}
              </p>
              <div className="space-y-2">
                {items.map((e) => {
                  const meta = ACTION_META[e.action] || ACTION_META.updated;
                  const Icon = meta.icon;
                  return (
                    <div key={e.id} className="flex gap-3 rounded-xl border border-border bg-card p-3">
                      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', meta.className)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="rounded-md">
                            {MANIFEST_AUDIT_LABEL[e.action] || e.action}
                          </Badge>
                          <span className="font-medium text-sm truncate">{e.pilgrim_name || 'Jemaah'}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(e.created_at), 'HH:mm')}
                          </span>
                        </div>

                        {e.action === 'updated' && e.changed_fields?.length ? (
                          <p className="text-xs text-muted-foreground">
                            Field diubah: {e.changed_fields.map((f) => MANIFEST_FIELD_LABEL[f] || f).join(', ')}
                          </p>
                        ) : null}

                        {e.old_approval_status && e.new_approval_status && e.old_approval_status !== e.new_approval_status ? (
                          <p className="text-xs text-muted-foreground">
                            Status: {e.old_approval_status} → {e.new_approval_status}
                          </p>
                        ) : null}

                        {e.rejection_reason ? (
                          <p className="text-xs text-destructive">Alasan: {e.rejection_reason}</p>
                        ) : null}

                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {e.changed_by ? (actors?.[e.changed_by] || 'Pengguna') : 'Sistem'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {(entries?.length || 0) >= limit && (total || 0) > limit && (
        <div className="flex justify-center">
          <Button variant="outline" className="rounded-xl" onClick={() => setLimit((l) => l + 100)}>
            Muat 100 entri lagi
          </Button>
        </div>
      )}
    </div>
  );
};

export default ManifestAuditLog;
