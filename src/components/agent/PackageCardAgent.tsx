import { useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, MoreVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Package, Departure } from '@/types/database';
import { usePackageDepartures, useDeletePackage, useDeleteDeparture } from '@/hooks/useAgentData';
import DepartureForm from './DepartureForm';
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

interface PackageCardAgentProps {
  package: Package;
  onEdit: () => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

const PackageCardAgent = ({ package: pkg, onEdit }: PackageCardAgentProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDepartureForm, setShowDepartureForm] = useState(false);
  const [editingDeparture, setEditingDeparture] = useState<Departure | null>(null);
  const [deletePackageDialog, setDeletePackageDialog] = useState(false);
  const [deleteDepartureId, setDeleteDepartureId] = useState<string | null>(null);

  const { data: departures, isLoading: departuresLoading } = usePackageDepartures(
    isExpanded ? pkg.id : undefined
  );
  const deletePackage = useDeletePackage();
  const deleteDeparture = useDeleteDeparture();

  const handleDeletePackage = async () => {
    await deletePackage.mutateAsync(pkg.id);
    setDeletePackageDialog(false);
  };

  const handleDeleteDeparture = async () => {
    if (deleteDepartureId) {
      await deleteDeparture.mutateAsync(deleteDepartureId);
      setDeleteDepartureId(null);
    }
  };

  const statusColors: Record<Departure['status'], string> = {
    available: 'bg-primary/10 text-primary border-primary/20',
    limited: 'bg-accent/10 text-accent border-accent/20',
    full: 'bg-destructive/10 text-destructive border-destructive/20',
    waitlist: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    cancelled: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
      >
        {/* Header */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  pkg.is_active ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'
                }`}>
                  {pkg.is_active ? 'AKTIF' : 'NONAKTIF'}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {pkg.duration_days} Hari
                </span>
              </div>
              <h3 className="font-bold text-foreground">{pkg.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {pkg.description || 'Tidak ada deskripsi'}
              </p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit2 className="mr-2 h-4 w-4" /> Edit Paket
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setDeletePackageDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Hapus Paket
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Package Info */}
          <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground mt-3">
            <span className="bg-secondary px-2 py-1 rounded">⭐ {pkg.hotel_star}</span>
            <span className="bg-secondary px-2 py-1 rounded">{pkg.airline || 'N/A'}</span>
            <span className="bg-secondary px-2 py-1 rounded">
              {pkg.flight_type === 'direct' ? 'Direct' : 'Transit'}
            </span>
            <span className="bg-secondary px-2 py-1 rounded">
              {pkg.meal_type === 'fullboard' ? 'Fullboard' : pkg.meal_type === 'halfboard' ? 'Halfboard' : 'Breakfast'}
            </span>
          </div>
        </div>

        {/* Departures Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 bg-secondary/50 border-t border-border flex items-center justify-between text-sm font-medium hover:bg-secondary transition-colors"
        >
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Jadwal Keberangkatan
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Departures List */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-3 bg-secondary/30">
                {departuresLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : departures && departures.length > 0 ? (
                  departures.map((departure) => (
                    <div
                      key={departure.id}
                      className="bg-card p-3 rounded-xl border border-border flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${statusColors[departure.status]}`}>
                            {departure.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm font-medium">
                          {format(new Date(departure.departure_date), 'd MMM yyyy', { locale: id })}
                          {' - '}
                          {format(new Date(departure.return_date), 'd MMM yyyy', { locale: id })}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{formatPrice(departure.price)}</span>
                          <span>{departure.available_seats}/{departure.total_seats} Seat</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingDeparture(departure)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteDepartureId(departure.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    Belum ada jadwal keberangkatan
                  </p>
                )}

                <Button
                  onClick={() => setShowDepartureForm(true)}
                  variant="outline"
                  className="w-full border-dashed"
                >
                  <Plus className="w-4 h-4 mr-2" /> Tambah Jadwal
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Departure Form Modal */}
      <AnimatePresence>
        {(showDepartureForm || editingDeparture) && (
          <DepartureForm
            packageId={pkg.id}
            departure={editingDeparture}
            onClose={() => {
              setShowDepartureForm(false);
              setEditingDeparture(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete Package Dialog */}
      <AlertDialog open={deletePackageDialog} onOpenChange={setDeletePackageDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Paket?</AlertDialogTitle>
            <AlertDialogDescription>
              Paket "{pkg.name}" dan semua jadwal keberangkatannya akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePackage} className="bg-destructive text-destructive-foreground">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Departure Dialog */}
      <AlertDialog open={!!deleteDepartureId} onOpenChange={() => setDeleteDepartureId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Jadwal?</AlertDialogTitle>
            <AlertDialogDescription>
              Jadwal keberangkatan ini akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDeparture} className="bg-destructive text-destructive-foreground">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PackageCardAgent;
