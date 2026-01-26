import { motion } from 'framer-motion';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { HajiRegistrationStatus } from './HajiRegistrationStatus';
import { useUserHajiRegistrations, HajiRegistration } from '@/hooks/useHaji';
import { useNavigate } from 'react-router-dom';

interface HajiRegistrationListProps {
  onNewRegistration?: () => void;
}

export const HajiRegistrationList = ({ onNewRegistration }: HajiRegistrationListProps) => {
  const { data: registrations, isLoading, error } = useUserHajiRegistrations();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-64 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Gagal memuat data pendaftaran</p>
      </div>
    );
  }

  if (!registrations || registrations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Belum Ada Pendaftaran Haji
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
          Anda belum mendaftar paket haji. Temukan paket haji yang sesuai dengan kebutuhan Anda.
        </p>
        <Button onClick={() => navigate('/?tab=paket')}>
          <Plus className="w-4 h-4 mr-2" />
          Cari Paket Haji
        </Button>
      </motion.div>
    );
  }

  // Group by status
  const activeRegistrations = registrations.filter(r => 
    ['pending', 'verified', 'waiting'].includes(r.status)
  );
  const historyRegistrations = registrations.filter(r => 
    ['departed', 'cancelled'].includes(r.status)
  );

  return (
    <div className="space-y-6">
      {/* Active Registrations */}
      {activeRegistrations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Pendaftaran Aktif
          </h3>
          {activeRegistrations.map((registration, index) => (
            <motion.div
              key={registration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <HajiRegistrationStatus registration={registration} />
            </motion.div>
          ))}
        </div>
      )}

      {/* History */}
      {historyRegistrations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Riwayat
          </h3>
          {historyRegistrations.map((registration, index) => (
            <motion.div
              key={registration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <HajiRegistrationStatus registration={registration} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
