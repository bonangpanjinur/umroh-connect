import { useState } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  X, Users, TrendingUp, AlertCircle, FileSpreadsheet, FileText,
  CheckCircle2, XCircle, Ban, Loader2, DollarSign, RotateCcw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Package, Departure } from '@/types/database';
import { usePackageDepartures, useUpdateDeparture } from '@/hooks/useAgentData';
import { useDeparturesRealtime } from '@/hooks/useDeparturesRealtime';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

interface PackageQuotaDetailProps {
  package: Package;
  onClose: () => void;
}

type DepartureLifecycleStatus = 'available' | 'full' | 'cancelled';

const STATUS_META: Record<Departure['status'], { label: string; color: string; bg: string }> = {
  available: { label: 'Available', color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
  limited:   { label: 'Limited',   color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/20' },
  full:      { label: 'Full',      color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
  waitlist:  { label: 'Waitlist',  color: 'text-blue-600', bg: 'bg-blue-500/10 border-blue-500/20' },
  cancelled: { label: 'Cancelled', color: 'text-muted-foreground', bg: 'bg-muted border-border' },
};

const formatIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const PackageQuotaDetail = ({ package: pkg, onClose }: PackageQuotaDetailProps) => {
  const { data: departures, isLoading } = usePackageDepartures(pkg.id);
  const updateDeparture = useUpdateDeparture();
  useDeparturesRealtime(pkg.id);

  const [pendingAction, setPendingAction] = useState<{
    departure: Departure;
    target: DepartureLifecycleStatus;
  } | null>(null);
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);

  const list = departures || [];
  const totalSeats = list.reduce((s, d) => s + d.total_seats, 0);
  const availableSeats = list.reduce((s, d) => s + (d.status !== 'cancelled' ? d.available_seats : 0), 0);
  const bookedSeats = totalSeats - availableSeats;

  const statusCounts = list.reduce(
    (acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    },
    {} as Record<Departure['status'], number>
  );

  // Revenue breakdown per status
  const revenueByStatus = list.reduce(
    (acc, d) => {
      const booked = d.total_seats - d.available_seats;
      const potential = d.total_seats * d.price;
      const earned = booked * d.price;
      if (!acc[d.status]) {
        acc[d.status] = { potential: 0, earned: 0, seats: 0 };
      }
      acc[d.status].potential += potential;
      acc[d.status].earned += earned;
      acc[d.status].seats += d.total_seats;
      return acc;
    },
    {} as Record<Departure['status'], { potential: number; earned: number; seats: number }>
  );

  const totalPotentialRevenue = list.reduce((s, d) => s + d.total_seats * d.price, 0);
  const totalEarnedRevenue = list.reduce(
    (s, d) => s + (d.status !== 'cancelled' ? (d.total_seats - d.available_seats) * d.price : 0),
    0
  );
  const occupancyPct = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

  // -------- Quick status action validation + execute --------
  const validateTransition = (
    d: Departure,
    target: DepartureLifecycleStatus
  ): string | null => {
    if (d.status === target) return 'Status saat ini sudah sama.';
    if (d.status === 'cancelled' && target !== 'available') {
      return 'Jadwal yang dibatalkan hanya bisa diaktifkan kembali.';
    }
    if (target === 'available') {
      if (d.available_seats === 0) {
        return 'Tidak bisa diaktifkan: kursi tersisa 0. Tambah kapasitas dulu.';
      }
    }
    if (target === 'cancelled') {
      const booked = d.total_seats - d.available_seats;
      if (booked > 0 && d.status !== 'cancelled') {
        // Allow but warn — handled via confirmation dialog text
      }
    }
    return null;
  };

  const handleStatusChange = async () => {
    if (!pendingAction) return;
    const { departure, target } = pendingAction;
    const err = validateTransition(departure, target);
    if (err) {
      toast({ title: 'Tidak dapat mengubah status', description: err, variant: 'destructive' });
      setPendingAction(null);
      return;
    }
    try {
      await updateDeparture.mutateAsync({ id: departure.id, status: target });
      toast({ title: 'Status jadwal diperbarui' });
    } finally {
      setPendingAction(null);
    }
  };

  // -------- Export handlers --------
  const handleExportExcel = async () => {
    if (exporting) return;
    setExporting('excel');
    try {
    const XLSX = await import('xlsx');
    const summarySheet = [
      ['Paket', pkg.name],
      ['Durasi', `${pkg.duration_days} hari`],
      ['Total Jadwal', list.length],
      ['Total Seat', totalSeats],
      ['Tersedia', availableSeats],
      ['Terisi', bookedSeats],
      ['Okupansi (%)', occupancyPct],
      ['Estimasi Pendapatan Maks', totalPotentialRevenue],
      ['Pendapatan Aktual (terisi)', totalEarnedRevenue],
    ];

    const breakdownSheet = [
      ['Status', 'Jumlah Jadwal', 'Total Seat', 'Estimasi Pendapatan Maks', 'Pendapatan Aktual'],
      ...(Object.keys(STATUS_META) as Departure['status'][]).map((s) => [
        STATUS_META[s].label,
        statusCounts[s] || 0,
        revenueByStatus[s]?.seats || 0,
        revenueByStatus[s]?.potential || 0,
        revenueByStatus[s]?.earned || 0,
      ]),
    ];

    const detailSheet = [
      ['Tanggal Berangkat', 'Tanggal Pulang', 'Status', 'Total Seat', 'Tersedia', 'Terisi', 'Harga/Seat', 'Total Pendapatan Aktual'],
      ...list.map((d) => [
        format(new Date(d.departure_date), 'yyyy-MM-dd'),
        format(new Date(d.return_date), 'yyyy-MM-dd'),
        STATUS_META[d.status].label,
        d.total_seats,
        d.available_seats,
        d.total_seats - d.available_seats,
        d.price,
        (d.total_seats - d.available_seats) * d.price,
      ]),
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summarySheet), 'Ringkasan');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(breakdownSheet), 'Breakdown Status');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(detailSheet), 'Rincian Jadwal');
    XLSX.writeFile(wb, `Kuota_${pkg.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    toast({ title: 'Export Excel berhasil' });
    } catch (e) {
      toast({ title: 'Export Excel gagal', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    if (exporting) return;
    setExporting('pdf');
    try {
    const { default: jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text(`Rekap Kuota Paket: ${pkg.name}`, 14, 18);
    doc.setFontSize(10);
    doc.text(`Tanggal cetak: ${format(new Date(), 'd MMM yyyy', { locale: idLocale })}`, 14, 25);

    autoTable(doc, {
      startY: 32,
      head: [['Metrik', 'Nilai']],
      body: [
        ['Total Jadwal', String(list.length)],
        ['Total Seat', String(totalSeats)],
        ['Tersedia', String(availableSeats)],
        ['Terisi', `${bookedSeats} (${occupancyPct}%)`],
        ['Estimasi Pendapatan Maks', formatIDR(totalPotentialRevenue)],
        ['Pendapatan Aktual (terisi)', formatIDR(totalEarnedRevenue)],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [40, 60, 100] },
    });

    autoTable(doc, {
      head: [['Status', 'Jumlah Jadwal', 'Seat', 'Maks Pendapatan', 'Aktual']],
      body: (Object.keys(STATUS_META) as Departure['status'][]).map((s) => [
        STATUS_META[s].label,
        String(statusCounts[s] || 0),
        String(revenueByStatus[s]?.seats || 0),
        formatIDR(revenueByStatus[s]?.potential || 0),
        formatIDR(revenueByStatus[s]?.earned || 0),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [40, 60, 100] },
    });

    autoTable(doc, {
      head: [['Berangkat', 'Pulang', 'Status', 'Seat', 'Tersedia', 'Harga', 'Pendapatan']],
      body: list.map((d) => [
        format(new Date(d.departure_date), 'd MMM yyyy', { locale: idLocale }),
        format(new Date(d.return_date), 'd MMM yyyy', { locale: idLocale }),
        STATUS_META[d.status].label,
        String(d.total_seats),
        String(d.available_seats),
        formatIDR(d.price),
        formatIDR((d.total_seats - d.available_seats) * d.price),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [40, 60, 100] },
    });

    doc.save(`Kuota_${pkg.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    toast({ title: 'Export PDF berhasil' });
    } catch (e) {
      toast({ title: 'Export PDF gagal', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setExporting(null);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card w-full max-w-3xl rounded-2xl shadow-float max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-5 border-b border-border flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Detail Kuota Paket</p>
              <h2 className="font-bold text-lg mt-0.5">{pkg.name}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {list.length} jadwal keberangkatan · {pkg.duration_days} hari · live update
              </p>
            </div>
            <div className="flex items-center gap-1">
              {list.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={!!exporting} className="hidden sm:flex">
                    {exporting === 'excel' ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />} Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={!!exporting} className="hidden sm:flex">
                    {exporting === 'pdf' ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-1" />} PDF
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="sm:hidden" disabled={!!exporting}>
                        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Export'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleExportExcel} disabled={!!exporting}>
                        <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel (.xlsx)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportPDF} disabled={!!exporting}>
                        <FileText className="w-4 h-4 mr-2" /> PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
              <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto p-5 space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : list.length === 0 ? (
              <div className="text-center py-16">
                <AlertCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Belum ada jadwal keberangkatan</p>
              </div>
            ) : (
              <>
                {/* Aggregate Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-border p-3 bg-secondary/30">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase text-muted-foreground">
                      <Users className="w-3 h-3" /> Total Seat
                    </div>
                    <div className="text-2xl font-bold mt-1">{totalSeats}</div>
                  </div>
                  <div className="rounded-xl border border-primary/20 p-3 bg-primary/5">
                    <div className="text-[10px] uppercase text-muted-foreground">Tersedia</div>
                    <div className="text-2xl font-bold mt-1 text-primary">{availableSeats}</div>
                  </div>
                  <div className="rounded-xl border border-border p-3 bg-secondary/30">
                    <div className="text-[10px] uppercase text-muted-foreground">Terisi</div>
                    <div className="text-2xl font-bold mt-1">{bookedSeats}</div>
                  </div>
                  <div className="rounded-xl border border-border p-3 bg-secondary/30">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase text-muted-foreground">
                      <TrendingUp className="w-3 h-3" /> Okupansi
                    </div>
                    <div className="text-2xl font-bold mt-1">{occupancyPct}%</div>
                    <Progress value={occupancyPct} className="h-1.5 mt-2" />
                  </div>
                </div>

                {/* Revenue Estimation */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold">Estimasi Pendapatan</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">Pendapatan Aktual</p>
                      <p className="text-lg font-bold text-emerald-600">{formatIDR(totalEarnedRevenue)}</p>
                      <p className="text-[10px] text-muted-foreground">{bookedSeats} seat terisi</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground">Potensi Maksimum</p>
                      <p className="text-lg font-bold">{formatIDR(totalPotentialRevenue)}</p>
                      <p className="text-[10px] text-muted-foreground">jika semua seat terjual</p>
                    </div>
                  </div>
                </div>

                {/* Status Breakdown w/ revenue */}
                <div>
                  <h3 className="text-sm font-bold mb-2">Breakdown per Status Jadwal</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                    {(Object.keys(STATUS_META) as Departure['status'][]).map((s) => {
                      const meta = STATUS_META[s];
                      return (
                        <div key={s} className={`rounded-lg border p-2.5 text-center ${meta.bg}`}>
                          <div className={`text-lg font-bold ${meta.color}`}>{statusCounts[s] || 0}</div>
                          <div className="text-[10px] text-muted-foreground uppercase">{meta.label}</div>
                          <div className="text-[10px] mt-1 font-medium">
                            {revenueByStatus[s]?.seats || 0} seat
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {formatIDR(revenueByStatus[s]?.earned || 0)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Per-Departure Detail with quick actions */}
                <div>
                  <h3 className="text-sm font-bold mb-2">Rincian per Keberangkatan</h3>
                  <div className="space-y-2">
                    {list.map((d) => {
                      const meta = STATUS_META[d.status];
                      const booked = d.total_seats - d.available_seats;
                      const occ = d.total_seats > 0
                        ? Math.round((booked / d.total_seats) * 100)
                        : 0;
                      const rowRevenue = booked * d.price;
                      const isCancelled = d.status === 'cancelled';
                      return (
                        <div key={d.id} className="rounded-xl border border-border p-3 bg-card">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold">
                                {format(new Date(d.departure_date), 'd MMM yyyy', { locale: idLocale })}
                                {' → '}
                                {format(new Date(d.return_date), 'd MMM yyyy', { locale: idLocale })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatIDR(d.price)} / seat
                              </p>
                            </div>
                            <Badge variant="outline" className={`${meta.bg} ${meta.color} border shrink-0`}>
                              {meta.label}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" disabled={updateDeparture.isPending}>
                                  {updateDeparture.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    'Aksi'
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!isCancelled && (
                                  <DropdownMenuItem
                                    onClick={() => setPendingAction({ departure: d, target: 'available' })}
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-2 text-primary" /> Aktifkan
                                  </DropdownMenuItem>
                                )}
                                {!isCancelled && d.status !== 'full' && (
                                  <DropdownMenuItem
                                    onClick={() => setPendingAction({ departure: d, target: 'full' })}
                                  >
                                    <XCircle className="w-4 h-4 mr-2 text-amber-600" /> Tandai Penuh / Tutup pendaftaran
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => setPendingAction({ departure: d, target: 'cancelled' })}
                                  className={isCancelled ? '' : 'text-destructive focus:text-destructive'}
                                >
                                  {isCancelled ? (
                                    <>
                                      <CheckCircle2 className="w-4 h-4 mr-2" /> Aktifkan kembali
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="w-4 h-4 mr-2" /> Batalkan
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">
                              {d.available_seats} / {d.total_seats} tersedia
                            </span>
                            <span>·</span>
                            <span>{occ}% terisi</span>
                            <span>·</span>
                            <span className="text-emerald-600 font-medium">{formatIDR(rowRevenue)}</span>
                          </div>
                          <Progress value={occ} className="h-1.5 mt-2" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Confirm Status Change */}
      <AlertDialog open={!!pendingAction} onOpenChange={(o) => !o && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Perubahan Status</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction && (() => {
                const { departure, target } = pendingAction;
                const err = validateTransition(departure, target);
                if (err) return <span className="text-destructive">{err}</span>;
                const booked = departure.total_seats - departure.available_seats;
                const labels: Record<string, string> = {
                  available: 'Aktifkan (available)',
                  full: 'Penuh / Tutup pendaftaran',
                  cancelled: 'Batalkan',
                };
                return (
                  <>
                    Ubah status jadwal{' '}
                    <strong>
                      {format(new Date(departure.departure_date), 'd MMM yyyy', { locale: idLocale })}
                    </strong>{' '}
                    menjadi <strong>{labels[target]}</strong>?
                    {target === 'cancelled' && booked > 0 && (
                      <span className="block mt-2 text-destructive">
                        ⚠️ Ada {booked} seat sudah terisi pada jadwal ini.
                      </span>
                    )}
                  </>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChange}
              disabled={
                !!pendingAction && !!validateTransition(pendingAction.departure, pendingAction.target)
              }
            >
              Konfirmasi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PackageQuotaDetail;
