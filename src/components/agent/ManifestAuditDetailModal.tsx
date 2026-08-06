import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { ArrowRight, User } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ManifestAuditEntry, MANIFEST_AUDIT_LABEL, MANIFEST_FIELD_LABEL,
} from '@/hooks/useManifestAuditLog';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu verifikasi',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    try {
      return format(new Date(str), 'dd MMMM yyyy', { locale: idLocale });
    } catch {
      return str;
    }
  }
  if (str === 'male' || str === 'L') return 'Laki-laki';
  if (str === 'female' || str === 'P') return 'Perempuan';
  return str;
};

interface Props {
  entry: ManifestAuditEntry | null;
  actorName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ManifestAuditDetailModal = ({ entry, actorName, open, onOpenChange }: Props) => {
  if (!entry) return null;

  const fields = entry.changed_fields || [];
  const statusChanged =
    !!entry.old_approval_status &&
    !!entry.new_approval_status &&
    entry.old_approval_status !== entry.new_approval_status;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            Detail Perubahan Manifest
            <Badge variant="outline" className="rounded-md">
              {MANIFEST_AUDIT_LABEL[entry.action] || entry.action}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {entry.pilgrim_name || 'Jemaah'} •{' '}
            {format(new Date(entry.created_at), 'dd MMMM yyyy, HH:mm', { locale: idLocale })}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-3">
          <div className="space-y-4">
            {statusChanged && (
              <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Perubahan status verifikasi
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {STATUS_LABEL[entry.old_approval_status!] || entry.old_approval_status}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-medium">
                    {STATUS_LABEL[entry.new_approval_status!] || entry.new_approval_status}
                  </span>
                </div>
              </div>
            )}

            {entry.rejection_reason && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
                  Alasan penolakan
                </p>
                <p className="text-sm text-destructive whitespace-pre-wrap">{entry.rejection_reason}</p>
              </div>
            )}

            {fields.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Field yang diubah ({fields.length})
                </p>
                <div className="space-y-2">
                  {fields.map((f) => (
                    <div key={f} className="rounded-xl border border-border p-3 space-y-1.5">
                      <p className="text-sm font-medium">{MANIFEST_FIELD_LABEL[f] || f}</p>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground line-through">
                          {formatValue(entry.old_values?.[f])}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary">
                          {formatValue(entry.new_values?.[f])}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : !statusChanged && !entry.rejection_reason ? (
              <p className="text-sm text-muted-foreground">
                Tidak ada detail perubahan field yang tercatat untuk aktivitas ini.
              </p>
            ) : null}

            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3" />
              Oleh {entry.changed_by ? actorName || 'Pengguna' : 'Sistem'}
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ManifestAuditDetailModal;
