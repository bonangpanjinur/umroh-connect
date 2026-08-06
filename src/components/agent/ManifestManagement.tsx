import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  Users, Plus, Download, FileSpreadsheet, FileText, BedDouble,
  Wand2, Pencil, Trash2, Bus, Loader2, Import, ShieldCheck,
  CheckCircle2, XCircle, RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  useAgentDepartures, useManifestPilgrims, useDepartureBookings,
  useSaveManifestPilgrim, useDeleteManifestPilgrim, useBulkInsertManifest,
  useBulkUpdateRooming, useSetManifestApproval, buildRoomingAssignments,
  ROOM_CAPACITY, APPROVAL_LABEL, isApproved,
  ManifestPilgrim, RoomType, Gender, ApprovalStatus,
} from '@/hooks/useManifest';

interface Props {
  travelId?: string;
}

const emptyForm = {
  id: undefined as string | undefined,
  booking_id: '',
  full_name: '',
  gender: 'L' as Gender,
  birth_date: '',
  nik: '',
  passport_number: '',
  passport_expiry: '',
  phone: '',
  mahram_name: '',
  room_type: 'quad' as RoomType,
  room_number: '',
  bus_number: '',
  notes: '',
};

export const ManifestManagement = ({ travelId }: Props) => {
  const { data: departures, isLoading: loadingDepartures } = useAgentDepartures(travelId);
  const [departureId, setDepartureId] = useState<string>('');
  const selectedDeparture = useMemo(
    () => (departures || []).find((d) => d.id === departureId),
    [departures, departureId]
  );

  const { data: pilgrims, isLoading } = useManifestPilgrims(departureId);
  const { data: bookings } = useDepartureBookings(departureId);

  const savePilgrim = useSaveManifestPilgrim();
  const deletePilgrim = useDeleteManifestPilgrim();
  const bulkInsert = useBulkInsertManifest();
  const bulkRooming = useBulkUpdateRooming();
  const setApproval = useSetManifestApproval();

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [roomType, setRoomType] = useState<RoomType>('quad');
  const [exporting, setExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | ApprovalStatus>('all');
  const [rejectTarget, setRejectTarget] = useState<ManifestPilgrim | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const list = pilgrims || [];
  // Only approved pilgrims flow into rooming list & exported documents
  const approvedList = useMemo(() => list.filter(isApproved), [list]);
  const pendingList = list.filter((p) => p.approval_status === 'pending');
  const rejectedCount = list.filter((p) => p.approval_status === 'rejected').length;
  const visibleList = statusFilter === 'all' ? list : list.filter((p) => p.approval_status === statusFilter);

  const totalSeatsBooked = (bookings || []).reduce((s: number, b: any) => s + (b.number_of_pilgrims || 0), 0);
  const maleCount = approvedList.filter((p) => p.gender === 'L').length;
  const femaleCount = approvedList.filter((p) => p.gender === 'P').length;
  const missingPassport = list.filter((p) => !p.passport_number).length;

  const rooms = useMemo(() => {
    const map = new Map<string, ManifestPilgrim[]>();
    approvedList.forEach((p) => {
      const key = p.room_number || 'Belum ditentukan';
      map.set(key, [...(map.get(key) || []), p]);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [approvedList]);

  const openCreate = () => {
    setForm({ ...emptyForm, booking_id: (bookings || [])[0]?.id || '', room_type: roomType });
    setFormOpen(true);
  };

  const openEdit = (p: ManifestPilgrim) => {
    setForm({
      id: p.id,
      booking_id: p.booking_id,
      full_name: p.full_name,
      gender: p.gender,
      birth_date: p.birth_date || '',
      nik: p.nik || '',
      passport_number: p.passport_number || '',
      passport_expiry: p.passport_expiry || '',
      phone: p.phone || '',
      mahram_name: p.mahram_name || '',
      room_type: p.room_type || 'quad',
      room_number: p.room_number || '',
      bus_number: p.bus_number || '',
      notes: p.notes || '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!travelId || !form.booking_id || !form.full_name.trim()) return;
    await savePilgrim.mutateAsync({
      id: form.id,
      travel_id: travelId,
      departure_id: departureId,
      booking_id: form.booking_id,
      full_name: form.full_name.trim(),
      gender: form.gender,
      birth_date: form.birth_date || null,
      nik: form.nik || null,
      passport_number: form.passport_number || null,
      passport_expiry: form.passport_expiry || null,
      phone: form.phone || null,
      mahram_name: form.mahram_name || null,
      room_type: form.room_type,
      room_number: form.room_number || null,
      bus_number: form.bus_number || null,
      notes: form.notes || null,
    } as any);
    setFormOpen(false);
  };

  const handleImportFromBookings = async () => {
    if (!travelId || !departureId) return;
    const existingByBooking = new Map<string, number>();
    list.forEach((p) => existingByBooking.set(p.booking_id, (existingByBooking.get(p.booking_id) || 0) + 1));

    const rows: any[] = [];
    (bookings || []).forEach((b: any) => {
      const already = existingByBooking.get(b.id) || 0;
      const missing = Math.max(0, (b.number_of_pilgrims || 1) - already);
      for (let i = 0; i < missing; i++) {
        rows.push({
          travel_id: travelId,
          departure_id: departureId,
          booking_id: b.id,
          full_name: already + i === 0 ? b.contact_name : `${b.contact_name} - Jemaah ${already + i + 1}`,
          gender: 'L',
          phone: already + i === 0 ? b.contact_phone : null,
          room_type: roomType,
        });
      }
    });
    await bulkInsert.mutateAsync(rows);
  };

  const handleAutoRooming = async () => {
    // Rooming list is built strictly from approved manifest entries
    const updates = buildRoomingAssignments(approvedList, roomType);
    await bulkRooming.mutateAsync(updates);
  };

  const handleApproveAllPending = async () => {
    await setApproval.mutateAsync({ ids: pendingList.map((p) => p.id), status: 'approved' });
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    await setApproval.mutateAsync({ ids: [rejectTarget.id], status: 'rejected', reason: rejectReason.trim() || null });
    setRejectTarget(null);
    setRejectReason('');
  };

  const exportRows = () =>
    approvedList.map((p, i) => [
      i + 1,
      p.full_name,
      p.gender === 'L' ? 'Laki-laki' : 'Perempuan',
      p.birth_date ? format(new Date(p.birth_date), 'dd/MM/yyyy') : '-',
      p.nik || '-',
      p.passport_number || '-',
      p.passport_expiry ? format(new Date(p.passport_expiry), 'dd/MM/yyyy') : '-',
      p.phone || '-',
      p.mahram_name || '-',
      p.room_type,
      p.room_number || '-',
      p.bus_number || '-',
      p.booking?.booking_code || '-',
    ]);

  const headers = ['No', 'Nama Lengkap', 'Gender', 'Tgl Lahir', 'NIK', 'No Paspor', 'Exp Paspor', 'Telepon', 'Mahram', 'Tipe Kamar', 'Kamar', 'Bus', 'Kode Booking'];
  const fileLabel = `Manifest_${(selectedDeparture?.package_name || 'Paket').replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}`;

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet([headers, ...exportRows()]),
        'Manifest'
      );
      const roomingSheet: any[][] = [['Kamar', 'Tipe', 'Jumlah', 'Jemaah']];
      rooms.forEach(([room, members]) => {
        roomingSheet.push([room, members[0]?.room_type || '-', members.length, members.map((m) => m.full_name).join(', ')]);
      });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(roomingSheet), 'Rooming List');
      XLSX.writeFile(wb, `${fileLabel}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(14);
      doc.text('Manifest Jemaah', 14, 15);
      doc.setFontSize(10);
      doc.text(
        `${selectedDeparture?.package_name || '-'} · Berangkat ${
          selectedDeparture ? format(new Date(selectedDeparture.departure_date), 'dd MMM yyyy', { locale: idLocale }) : '-'
        } · ${approvedList.length} jemaah disetujui`,
        14,
        22
      );
      autoTable(doc, { startY: 28, head: [headers], body: exportRows() as any, styles: { fontSize: 7 } });
      const y = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text('Rooming List', 14, y);
      autoTable(doc, {
        startY: y + 4,
        head: [['Kamar', 'Tipe', 'Jumlah', 'Jemaah']],
        body: rooms.map(([room, members]) => [room, members[0]?.room_type || '-', members.length, members.map((m) => m.full_name).join(', ')]) as any,
        styles: { fontSize: 8 },
      });
      doc.save(`${fileLabel}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-2xl">Manifest & Rooming List</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola data jemaah per keberangkatan dan susun pembagian kamar
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-xl gap-2" disabled={!departureId || approvedList.length === 0 || exporting}>
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Ekspor
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPdf}>
                <FileText className="w-4 h-4 mr-2" /> PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={openCreate} disabled={!departureId || (bookings || []).length === 0} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Tambah Jemaah
          </Button>
        </div>
      </div>

      {/* Departure selector */}
      <Card className="rounded-2xl">
        <CardContent className="pt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Keberangkatan</Label>
            <Select value={departureId} onValueChange={setDepartureId}>
              <SelectTrigger>
                <SelectValue placeholder={loadingDepartures ? 'Memuat…' : 'Pilih jadwal keberangkatan'} />
              </SelectTrigger>
              <SelectContent>
                {(departures || []).map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.package_name} · {format(new Date(d.departure_date), 'dd MMM yyyy', { locale: idLocale })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipe kamar default</Label>
            <Select value={roomType} onValueChange={(v) => setRoomType(v as RoomType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="double">Double (2 orang)</SelectItem>
                <SelectItem value="triple">Triple (3 orang)</SelectItem>
                <SelectItem value="quad">Quad (4 orang)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!departureId ? (
        <div className="text-center py-20 bg-secondary/20 rounded-3xl border-2 border-dashed border-border">
          <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="font-semibold">Pilih jadwal keberangkatan</p>
          <p className="text-sm text-muted-foreground mt-1">Manifest jemaah dikelola per keberangkatan</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total data manifest', value: `${list.length}${totalSeatsBooked ? ` / ${totalSeatsBooked}` : ''}` },
              { label: 'Disetujui (final)', value: approvedList.length },
              { label: 'Menunggu verifikasi', value: pendingList.length },
              { label: 'Paspor belum lengkap', value: missingPassport },
            ].map((s) => (
              <Card key={s.label} className="rounded-2xl">
                <CardContent className="pt-6">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {pendingList.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">{pendingList.length} jemaah menunggu persetujuan travel</p>
                  <p className="text-xs text-muted-foreground">
                    Data belum disetujui tidak masuk rooming list maupun dokumen ekspor.
                  </p>
                </div>
              </div>
              <Button size="sm" className="rounded-xl gap-2" onClick={handleApproveAllPending} disabled={setApproval.isPending}>
                {setApproval.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Setujui semua
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-xl gap-2" onClick={handleImportFromBookings} disabled={bulkInsert.isPending || (bookings || []).length === 0}>
              {bulkInsert.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Import className="w-4 h-4" />} Import dari booking
            </Button>
            <Button variant="outline" className="rounded-xl gap-2" onClick={handleAutoRooming} disabled={bulkRooming.isPending || approvedList.length === 0}>
              {bulkRooming.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Susun rooming otomatis
            </Button>
          </div>

          {/* Approval status filter */}
          <div className="flex flex-wrap gap-2">
            {([
              { v: 'all', l: 'Semua', c: list.length },
              { v: 'pending', l: '⏳ Menunggu', c: pendingList.length },
              { v: 'approved', l: '✅ Disetujui', c: approvedList.length },
              { v: 'rejected', l: '⛔ Ditolak', c: rejectedCount },
            ] as const).map((opt) => (
              <button
                key={opt.v}
                onClick={() => setStatusFilter(opt.v as any)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium border transition-colors',
                  statusFilter === opt.v
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:bg-secondary'
                )}
              >
                {opt.l} <span className="ml-1 text-xs opacity-70">({opt.c})</span>
              </button>
            ))}
          </div>


          <Tabs defaultValue="manifest">
            <TabsList>
              <TabsTrigger value="manifest" className="gap-2"><Users className="w-4 h-4" /> Manifest</TabsTrigger>
              <TabsTrigger value="rooming" className="gap-2"><BedDouble className="w-4 h-4" /> Rooming List</TabsTrigger>
              <TabsTrigger value="audit" className="gap-2"><History className="w-4 h-4" /> Riwayat Audit</TabsTrigger>
            </TabsList>


            <TabsContent value="manifest" className="mt-4">
              <Card className="rounded-2xl overflow-hidden">
                <CardContent className="p-0 overflow-x-auto">
                  {isLoading ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : list.length === 0 ? (
                    <div className="text-center py-16">
                      <p className="font-semibold">Manifest masih kosong</p>
                      <p className="text-sm text-muted-foreground mt-1">Gunakan "Import dari booking" untuk mengisi cepat</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama</TableHead>
                          <TableHead>Gender</TableHead>
                          <TableHead>Paspor</TableHead>
                          <TableHead>Telepon</TableHead>
                          <TableHead>Kamar</TableHead>
                          <TableHead>Bus</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Booking</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleList.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.full_name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{p.gender === 'L' ? 'L' : 'P'}</Badge>
                            </TableCell>
                            <TableCell className={!p.passport_number ? 'text-destructive text-sm' : 'text-sm'}>
                              {p.passport_number || 'Belum ada'}
                            </TableCell>
                            <TableCell className="text-sm">{p.phone || '-'}</TableCell>
                            <TableCell className="text-sm">
                              {p.room_number ? `${p.room_number} (${p.room_type})` : '-'}
                            </TableCell>
                            <TableCell className="text-sm">{p.bus_number || '-'}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  p.approval_status === 'approved'
                                    ? 'default'
                                    : p.approval_status === 'rejected'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                                className="text-[10px]"
                              >
                                {APPROVAL_LABEL[p.approval_status]}
                              </Badge>
                              {p.approval_status === 'rejected' && p.rejection_reason && (
                                <p className="text-[10px] text-muted-foreground mt-1 max-w-[160px]">{p.rejection_reason}</p>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{p.booking?.booking_code || '-'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {p.approval_status !== 'approved' ? (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    title="Setujui"
                                    disabled={setApproval.isPending}
                                    onClick={() => setApproval.mutate({ ids: [p.id], status: 'approved' })}
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    title="Batalkan persetujuan"
                                    disabled={setApproval.isPending}
                                    onClick={() => setApproval.mutate({ ids: [p.id], status: 'pending' })}
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </Button>
                                )}
                                {p.approval_status !== 'rejected' && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    title="Tolak"
                                    onClick={() => { setRejectTarget(p); setRejectReason(''); }}
                                  >
                                    <XCircle className="w-4 h-4 text-destructive" />
                                  </Button>
                                )}
                                <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => deletePilgrim.mutate(p.id)}>
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rooming" className="mt-4">
              {approvedList.length === 0 ? (
                <div className="text-center py-16 bg-secondary/20 rounded-3xl border-2 border-dashed border-border">
                  <BedDouble className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
                  <p className="font-semibold">Belum ada jemaah yang disetujui</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Setujui data manifest terlebih dahulu agar bisa dibagi ke kamar
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="sm:col-span-2 lg:col-span-3 text-xs text-muted-foreground">
                    Menampilkan {approvedList.length} jemaah yang telah disetujui ({maleCount} laki-laki · {femaleCount} perempuan).
                  </div>

                  {rooms.map(([room, members]) => {
                    const capacity = ROOM_CAPACITY[(members[0]?.room_type || roomType) as RoomType];
                    const over = room !== 'Belum ditentukan' && members.length > capacity;
                    return (
                      <Card key={room} className="rounded-2xl">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <BedDouble className="w-4 h-4 text-primary" /> {room}
                            </span>
                            <Badge variant={over ? 'destructive' : 'secondary'}>
                              {members.length}/{room === 'Belum ditentukan' ? '-' : capacity}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {members.map((m) => (
                            <div key={m.id} className="flex items-center justify-between text-sm">
                              <span>{m.full_name}</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px]">{m.gender}</Badge>
                                {m.bus_number && (
                                  <span className="flex items-center gap-1"><Bus className="w-3 h-3" />{m.bus_number}</span>
                                )}
                              </span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="audit" className="mt-4">
              <ManifestAuditLog departureId={departureId} />
            </TabsContent>
          </Tabs>

        </>
      )}

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tolak Data Manifest</DialogTitle>
            <DialogDescription>
              {rejectTarget?.full_name} tidak akan masuk rooming list maupun dokumen ekspor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Alasan penolakan (opsional)</Label>
            <Textarea
              rows={3}
              placeholder="Contoh: paspor kedaluwarsa, nama tidak sesuai paspor"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleReject} disabled={setApproval.isPending}>
              {setApproval.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit Data Jemaah' : 'Tambah Jemaah'}</DialogTitle>
            <DialogDescription>Lengkapi data untuk manifest dan rooming list.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Booking</Label>
              <Select value={form.booking_id} onValueChange={(v) => setForm({ ...form, booking_id: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih booking" /></SelectTrigger>
                <SelectContent>
                  {(bookings || []).map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.booking_code} · {b.contact_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Nama lengkap (sesuai paspor)</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as Gender })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Laki-laki</SelectItem>
                  <SelectItem value="P">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tanggal lahir</Label>
              <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>NIK</Label>
              <Input value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Telepon</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>No. paspor</Label>
              <Input value={form.passport_number} onChange={(e) => setForm({ ...form, passport_number: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Masa berlaku paspor</Label>
              <Input type="date" value={form.passport_expiry} onChange={(e) => setForm({ ...form, passport_expiry: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Mahram</Label>
              <Input value={form.mahram_name} onChange={(e) => setForm({ ...form, mahram_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tipe kamar</Label>
              <Select value={form.room_type} onValueChange={(v) => setForm({ ...form, room_type: v as RoomType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="double">Double</SelectItem>
                  <SelectItem value="triple">Triple</SelectItem>
                  <SelectItem value="quad">Quad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>No. kamar</Label>
              <Input value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>No. bus</Label>
              <Input value={form.bus_number} onChange={(e) => setForm({ ...form, bus_number: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Catatan</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={savePilgrim.isPending || !form.full_name.trim() || !form.booking_id}>
              {savePilgrim.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManifestManagement;
