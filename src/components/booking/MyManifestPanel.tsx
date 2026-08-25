import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  BedDouble,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Pencil,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  EditableManifestFields,
  JamaahManifestEntry,
  REQUIRED_MANIFEST_FIELDS,
  getManifestCompletion,
  useMyManifest,
  useUpdateMyManifest,
} from '@/hooks/useJamaahManifest';

const statusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return { label: 'Terverifikasi', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: ShieldCheck };
    case 'rejected':
      return { label: 'Perlu diperbaiki', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: AlertTriangle };
    default:
      return { label: 'Menunggu verifikasi', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: ClipboardList };
  }
};

interface EntryFormProps {
  entry: JamaahManifestEntry;
  bookingId: string;
  onDone: () => void;
}

const EntryForm = ({ entry, bookingId, onDone }: EntryFormProps) => {
  const [form, setForm] = useState<EditableManifestFields>({
    full_name: entry.full_name,
    gender: entry.gender,
    birth_date: entry.birth_date,
    nik: entry.nik,
    passport_number: entry.passport_number,
    passport_expiry: entry.passport_expiry,
    phone: entry.phone,
    mahram_name: entry.mahram_name,
    notes: entry.notes,
  });
  const update = useUpdateMyManifest(bookingId);

  const set = (key: keyof EditableManifestFields, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value || null }));

  const handleSave = async () => {
    await update.mutateAsync({
      id: entry.id,
      values: form,
      resetRejection: entry.approval_status === 'rejected',
    });
    onDone();
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`name-${entry.id}`}>Nama sesuai paspor</Label>
          <Input
            id={`name-${entry.id}`}
            value={form.full_name || ''}
            onChange={(e) => set('full_name', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Jenis kelamin</Label>
          <Select value={form.gender || ''} onValueChange={(v) => set('gender', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="L">Laki-laki</SelectItem>
              <SelectItem value="P">Perempuan</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`birth-${entry.id}`}>Tanggal lahir</Label>
          <Input
            id={`birth-${entry.id}`}
            type="date"
            value={form.birth_date || ''}
            onChange={(e) => set('birth_date', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`nik-${entry.id}`}>NIK</Label>
          <Input
            id={`nik-${entry.id}`}
            inputMode="numeric"
            value={form.nik || ''}
            onChange={(e) => set('nik', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`phone-${entry.id}`}>Nomor telepon</Label>
          <Input
            id={`phone-${entry.id}`}
            value={form.phone || ''}
            onChange={(e) => set('phone', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`passport-${entry.id}`}>Nomor paspor</Label>
          <Input
            id={`passport-${entry.id}`}
            value={form.passport_number || ''}
            onChange={(e) => set('passport_number', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`expiry-${entry.id}`}>Masa berlaku paspor</Label>
          <Input
            id={`expiry-${entry.id}`}
            type="date"
            value={form.passport_expiry || ''}
            onChange={(e) => set('passport_expiry', e.target.value)}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`mahram-${entry.id}`}>Nama mahram (opsional)</Label>
          <Input
            id={`mahram-${entry.id}`}
            value={form.mahram_name || ''}
            onChange={(e) => set('mahram_name', e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={update.isPending} className="flex-1">
          {update.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Simpan Data
        </Button>
        <Button variant="outline" onClick={onDone} disabled={update.isPending}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const ReadOnlyRow = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex justify-between gap-3 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={`font-medium text-right ${value ? '' : 'text-muted-foreground italic'}`}>
      {value || 'Belum diisi'}
    </span>
  </div>
);

interface MyManifestPanelProps {
  bookingId: string;
}

const MyManifestPanel = ({ bookingId }: MyManifestPanelProps) => {
  const { data: entries, isLoading } = useMyManifest(bookingId);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Data Keberangkatan Saya
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Travel belum membuat data manifest untuk booking ini. Data akan muncul di sini setelah
            travel menyiapkannya.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          Data Keberangkatan Saya
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.map((entry) => {
          const badge = statusBadge(entry.approval_status);
          const BadgeIcon = badge.icon;
          const completion = getManifestCompletion(entry);
          const canEdit = entry.approval_status !== 'approved';

          return (
            <div key={entry.id} className="rounded-xl border border-border p-3 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{entry.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.gender === 'P' ? 'Perempuan' : 'Laki-laki'}
                  </p>
                </div>
                <Badge className={badge.className}>
                  <BadgeIcon className="h-3 w-3 mr-1" />
                  {badge.label}
                </Badge>
              </div>

              {entry.approval_status === 'rejected' && entry.rejection_reason && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 text-xs">
                  <p className="font-medium text-red-700 dark:text-red-400 mb-1">
                    Alasan penolakan travel
                  </p>
                  <p className="text-red-600 dark:text-red-300">{entry.rejection_reason}</p>
                </div>
              )}

              {!completion.isComplete && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Kelengkapan dokumen</span>
                    <span className="font-medium">{completion.percent}%</span>
                  </div>
                  <Progress value={completion.percent} className="h-2" />
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Belum lengkap: {completion.missing.map((m) => m.label).join(', ')}
                  </p>
                </div>
              )}

              {completion.isComplete && entry.approval_status === 'approved' && (
                <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Data lengkap dan sudah diverifikasi travel
                </div>
              )}

              {editingId === entry.id ? (
                <EntryForm entry={entry} bookingId={bookingId} onDone={() => setEditingId(null)} />
              ) : (
                <>
                  <Separator />
                  <div className="space-y-1.5">
                    {REQUIRED_MANIFEST_FIELDS.filter((f) => f.key !== 'full_name' && f.key !== 'gender').map(
                      (f) => (
                        <ReadOnlyRow
                          key={f.key}
                          label={f.label}
                          value={entry[f.key] as string | null}
                        />
                      )
                    )}
                    <ReadOnlyRow label="Mahram" value={entry.mahram_name} />
                  </div>

                  {entry.approval_status === 'approved' && (
                    <>
                      <Separator />
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <BedDouble className="h-3.5 w-3.5" />
                          Info dari travel
                        </div>
                        <ReadOnlyRow label="Tipe kamar" value={entry.room_type} />
                        <ReadOnlyRow label="Nomor kamar" value={entry.room_number} />
                        <ReadOnlyRow label="Nomor bus" value={entry.bus_number} />
                      </div>
                    </>
                  )}

                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => setEditingId(entry.id)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      {completion.isComplete ? 'Perbarui Data' : 'Lengkapi Data'}
                    </Button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default MyManifestPanel;
