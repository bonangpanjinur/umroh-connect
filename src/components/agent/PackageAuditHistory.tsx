import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { X, History, Filter, Calendar, ArrowRight, Users, Tag, DollarSign, PlusCircle } from 'lucide-react';
import { Package, Departure } from '@/types/database';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePackageAuditLog, DepartureAuditEntry } from '@/hooks/useDepartureAuditLog';
import { usePackageDepartures } from '@/hooks/useAgentData';
import { useDeparturesRealtime } from '@/hooks/useDeparturesRealtime';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  package: Package;
  onClose: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  available: 'Available',
  limited: 'Limited',
  full: 'Full',
  waitlist: 'Waitlist',
  cancelled: 'Cancelled',
  draft: 'Draft',
};

const STATUS_COLOR: Record<string, string> = {
  available: 'bg-primary/10 text-primary border-primary/20',
  limited: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  full: 'bg-destructive/10 text-destructive border-destructive/20',
  waitlist: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

const CHANGE_META: Record<string, { label: string; icon: any; color: string }> = {
  created: { label: 'Dibuat', icon: PlusCircle, color: 'text-emerald-600' },
  status: { label: 'Status', icon: Tag, color: 'text-blue-600' },
  seats: { label: 'Kuota', icon: Users, color: 'text-amber-600' },
  price: { label: 'Harga', icon: DollarSign, color: 'text-purple-600' },
  mixed: { label: 'Status & Kuota', icon: History, color: 'text-foreground' },
};

const formatIDR = (n: number | null | undefined) =>
  n == null
    ? '-'
    : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const PackageAuditHistory = ({ package: pkg, onClose }: Props) => {
  const { data: log, isLoading } = usePackageAuditLog(pkg.id);
  const { data: departures } = usePackageDepartures(pkg.id);
  useDeparturesRealtime(pkg.id);

  const [filterDeparture, setFilterDeparture] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const departureMap = useMemo(() => {
    const m = new Map<string, Departure>();
    (departures || []).forEach((d) => m.set(d.id, d));
    return m;
  }, [departures]);

  const filtered = useMemo(() => {
    return (log || []).filter((e) => {
      if (filterDeparture !== 'all' && e.departure_id !== filterDeparture) return false;
      if (filterType !== 'all' && e.change_type !== filterType) return false;
      return true;
    });
  }, [log, filterDeparture, filterType]);

  // Group by date (yyyy-MM-dd)
  const grouped = useMemo(() => {
    const groups: Record<string, DepartureAuditEntry[]> = {};
    filtered.forEach((e) => {
      const key = format(new Date(e.created_at), 'yyyy-MM-dd');
      (groups[key] ||= []).push(e);
    });
    return Object.entries(groups);
  }, [filtered]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card w-full max-w-3xl rounded-2xl shadow-float max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-border flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Riwayat Perubahan</p>
            </div>
            <h2 className="font-bold text-lg mt-0.5">{pkg.name}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Audit log kuota dan status setiap jadwal · {filtered.length} entri
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-border bg-secondary/30 flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <Select value={filterDeparture} onValueChange={setFilterDeparture}>
            <SelectTrigger className="h-8 text-xs w-auto min-w-[180px]">
              <SelectValue placeholder="Semua jadwal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua jadwal</SelectItem>
              {(departures || []).map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {format(new Date(d.departure_date), 'd MMM yyyy', { locale: idLocale })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-8 text-xs w-auto min-w-[140px]">
              <SelectValue placeholder="Jenis perubahan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua jenis</SelectItem>
              <SelectItem value="created">Dibuat</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="seats">Kuota</SelectItem>
              <SelectItem value="price">Harga</SelectItem>
              <SelectItem value="mixed">Status & Kuota</SelectItem>
            </SelectContent>
          </Select>
          {(filterDeparture !== 'all' || filterType !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                setFilterDeparture('all');
                setFilterType('all');
              }}
            >
              Reset
            </Button>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : grouped.length === 0 ? (
            <div className="text-center py-16">
              <History className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Belum ada riwayat perubahan</p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(([date, entries]) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-2 sticky top-0 bg-card py-1">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {format(new Date(date), 'EEEE, d MMMM yyyy', { locale: idLocale })}
                    </p>
                  </div>
                  <div className="relative pl-4 space-y-3 border-l-2 border-border">
                    {entries.map((e) => {
                      const meta = CHANGE_META[e.change_type] || CHANGE_META.mixed;
                      const Icon = meta.icon;
                      const dep = departureMap.get(e.departure_id);
                      return (
                        <div key={e.id} className="relative">
                          <span className="absolute -left-[21px] top-2 w-3 h-3 rounded-full bg-primary border-2 border-card" />
                          <div className="rounded-xl border border-border bg-card p-3">
                            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <Icon className={`w-4 h-4 ${meta.color}`} />
                                <span className="text-xs font-semibold">{meta.label}</span>
                                {dep && (
                                  <span className="text-xs text-muted-foreground">
                                    · Jadwal{' '}
                                    {format(new Date(dep.departure_date), 'd MMM yyyy', { locale: idLocale })}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(e.created_at), 'HH:mm')}
                              </span>
                            </div>

                            {/* Status diff */}
                            {e.change_type !== 'created' &&
                              e.old_status !== e.new_status &&
                              e.new_status && (
                                <div className="flex items-center gap-2 text-xs mb-1.5">
                                  <span className="text-muted-foreground">Status:</span>
                                  {e.old_status && (
                                    <Badge
                                      variant="outline"
                                      className={`${STATUS_COLOR[e.old_status] || ''} text-[10px]`}
                                    >
                                      {STATUS_LABEL[e.old_status] || e.old_status}
                                    </Badge>
                                  )}
                                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                  <Badge
                                    variant="outline"
                                    className={`${STATUS_COLOR[e.new_status] || ''} text-[10px]`}
                                  >
                                    {STATUS_LABEL[e.new_status] || e.new_status}
                                  </Badge>
                                </div>
                              )}

                            {/* Seats diff */}
                            {(e.old_available_seats !== e.new_available_seats ||
                              e.old_total_seats !== e.new_total_seats) && (
                              <div className="text-xs text-muted-foreground space-y-0.5">
                                {e.old_total_seats !== e.new_total_seats && (
                                  <div>
                                    Total seat:{' '}
                                    <span className="text-foreground font-medium">
                                      {e.old_total_seats ?? '-'} → {e.new_total_seats ?? '-'}
                                    </span>
                                  </div>
                                )}
                                {e.old_available_seats !== e.new_available_seats && (
                                  <div>
                                    Tersedia:{' '}
                                    <span className="text-foreground font-medium">
                                      {e.old_available_seats ?? '-'} → {e.new_available_seats ?? '-'}
                                    </span>
                                    {e.old_available_seats != null && e.new_available_seats != null && (
                                      <span
                                        className={`ml-2 ${
                                          e.new_available_seats < e.old_available_seats
                                            ? 'text-amber-600'
                                            : 'text-emerald-600'
                                        }`}
                                      >
                                        ({e.new_available_seats < e.old_available_seats ? '−' : '+'}
                                        {Math.abs(e.new_available_seats - e.old_available_seats)} seat
                                        {e.new_available_seats < e.old_available_seats ? ' booking' : ''})
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Price diff */}
                            {e.old_price !== e.new_price && e.change_type !== 'created' && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Harga:{' '}
                                <span className="text-foreground font-medium">
                                  {formatIDR(e.old_price)} → {formatIDR(e.new_price)}
                                </span>
                              </div>
                            )}

                            {/* Created snapshot */}
                            {e.change_type === 'created' && (
                              <div className="text-xs text-muted-foreground">
                                Status:{' '}
                                <span className="text-foreground">
                                  {STATUS_LABEL[e.new_status || ''] || e.new_status}
                                </span>{' '}
                                · {e.new_total_seats} seat · {formatIDR(e.new_price)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PackageAuditHistory;
