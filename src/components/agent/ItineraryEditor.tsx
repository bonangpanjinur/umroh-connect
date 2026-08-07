import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, MapPin, Plus, Route, Trash2 } from 'lucide-react';
import {
  useDeleteItineraryDay,
  useDepartureItinerary,
  useSaveItineraryDay,
} from '@/hooks/useItinerary';

interface ItineraryEditorProps {
  departureId: string;
  departureLabel: string;
}

const ItineraryEditor = ({ departureId, departureLabel }: ItineraryEditorProps) => {
  const [open, setOpen] = useState(false);
  const { data: days, isLoading } = useDepartureItinerary(open ? departureId : undefined);
  const saveDay = useSaveItineraryDay(departureId);
  const deleteDay = useDeleteItineraryDay(departureId);

  const [form, setForm] = useState({
    day_number: '',
    title: '',
    city: '',
    description: '',
    activities: '',
  });

  const resetForm = () =>
    setForm({ day_number: '', title: '', city: '', description: '', activities: '' });

  const handleAdd = async () => {
    const dayNumber = parseInt(form.day_number, 10);
    if (!dayNumber || !form.title.trim()) return;
    await saveDay.mutateAsync({
      day_number: dayNumber,
      title: form.title.trim(),
      city: form.city.trim() || null,
      description: form.description.trim() || null,
      activities: form.activities
        .split('\n')
        .map((a) => a.trim())
        .filter(Boolean),
    });
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
          <Route className="w-3.5 h-3.5" /> Itinerary
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Itinerary Keberangkatan</DialogTitle>
          <DialogDescription>{departureLabel}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {(days || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada hari yang ditambahkan. Itinerary yang Anda simpan langsung terlihat oleh
                jemaah.
              </p>
            ) : (
              (days || []).map((day) => (
                <div key={day.id} className="rounded-lg border border-border p-3 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">
                      Hari {day.day_number} · {day.title}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteDay.mutate(day.id)}
                      disabled={deleteDay.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  {day.city && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {day.city}
                    </p>
                  )}
                  {day.description && (
                    <p className="text-xs text-muted-foreground">{day.description}</p>
                  )}
                  {day.activities && day.activities.length > 0 && (
                    <ul className="list-disc list-inside text-xs text-muted-foreground">
                      {day.activities.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            )}

            <Separator />

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="day-number">Hari</Label>
                  <Input
                    id="day-number"
                    inputMode="numeric"
                    value={form.day_number}
                    onChange={(e) => setForm((p) => ({ ...p, day_number: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="day-title">Judul</Label>
                  <Input
                    id="day-title"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Tiba di Madinah"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="day-city">Kota</Label>
                <Input
                  id="day-city"
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  placeholder="Madinah"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="day-desc">Deskripsi</Label>
                <Textarea
                  id="day-desc"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="day-activities">Kegiatan (satu per baris)</Label>
                <Textarea
                  id="day-activities"
                  rows={3}
                  value={form.activities}
                  onChange={(e) => setForm((p) => ({ ...p, activities: e.target.value }))}
                  placeholder={'Check-in hotel\nShalat di Masjid Nabawi'}
                />
              </div>
              <Button
                className="w-full gap-2"
                onClick={handleAdd}
                disabled={saveDay.isPending || !form.day_number || !form.title.trim()}
              >
                {saveDay.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Simpan Hari
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ItineraryEditor;
