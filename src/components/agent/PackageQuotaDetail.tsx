import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { X, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Package, Departure } from '@/types/database';
import { usePackageDepartures } from '@/hooks/useAgentData';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface PackageQuotaDetailProps {
  package: Package;
  onClose: () => void;
}

const STATUS_META: Record<Departure['status'], { label: string; color: string; bg: string }> = {
  available: { label: 'Available', color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
  limited:   { label: 'Limited',   color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/20' },
  full:      { label: 'Full',      color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
  waitlist:  { label: 'Waitlist',  color: 'text-blue-600', bg: 'bg-blue-500/10 border-blue-500/20' },
  cancelled: { label: 'Cancelled', color: 'text-muted-foreground', bg: 'bg-muted border-border' },
};

const PackageQuotaDetail = ({ package: pkg, onClose }: PackageQuotaDetailProps) => {
  const { data: departures, isLoading } = usePackageDepartures(pkg.id);

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

  const occupancyPct = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

  return (
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
              {list.length} jadwal keberangkatan · {pkg.duration_days} hari
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
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

              {/* Status Breakdown */}
              <div>
                <h3 className="text-sm font-bold mb-2">Breakdown per Status Jadwal</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {(Object.keys(STATUS_META) as Departure['status'][]).map((s) => {
                    const meta = STATUS_META[s];
                    return (
                      <div key={s} className={`rounded-lg border p-2.5 text-center ${meta.bg}`}>
                        <div className={`text-lg font-bold ${meta.color}`}>{statusCounts[s] || 0}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">{meta.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Per-Departure Detail */}
              <div>
                <h3 className="text-sm font-bold mb-2">Rincian per Keberangkatan</h3>
                <div className="space-y-2">
                  {list.map((d) => {
                    const meta = STATUS_META[d.status];
                    const occ = d.total_seats > 0
                      ? Math.round(((d.total_seats - d.available_seats) / d.total_seats) * 100)
                      : 0;
                    return (
                      <div key={d.id} className="rounded-xl border border-border p-3 bg-card">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <p className="text-sm font-semibold">
                              {format(new Date(d.departure_date), 'd MMM yyyy', { locale: idLocale })}
                              {' → '}
                              {format(new Date(d.return_date), 'd MMM yyyy', { locale: idLocale })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Rp {d.price.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <Badge variant="outline" className={`${meta.bg} ${meta.color} border`}>
                            {meta.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {d.available_seats} / {d.total_seats} seat tersedia
                          </span>
                          <span>·</span>
                          <span>{occ}% terisi</span>
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
  );
};

export default PackageQuotaDetail;
