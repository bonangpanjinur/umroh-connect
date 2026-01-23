import { motion } from 'framer-motion';
import { 
  Clock, CheckCircle, AlertCircle, Plane, XCircle, 
  FileText, Calendar, Phone, Hash, ChevronRight 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  HajiRegistration, 
  PackageType, 
  packageTypeLabels, 
  packageTypeColors,
  getHajiSeasonInfo 
} from '@/hooks/useHaji';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface HajiRegistrationStatusProps {
  registration: HajiRegistration;
  onViewDetails?: () => void;
}

const statusConfig: Record<string, {
  label: string;
  color: string;
  icon: React.ElementType;
  description: string;
}> = {
  pending: {
    label: 'Menunggu Verifikasi',
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    icon: Clock,
    description: 'Data Anda sedang diverifikasi oleh travel agent',
  },
  verified: {
    label: 'Terverifikasi',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    icon: CheckCircle,
    description: 'Data telah diverifikasi, menunggu proses antrian',
  },
  waiting: {
    label: 'Dalam Antrian',
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    icon: AlertCircle,
    description: 'Anda masuk dalam daftar tunggu keberangkatan',
  },
  departed: {
    label: 'Sudah Berangkat',
    color: 'bg-green-500/10 text-green-600 border-green-500/20',
    icon: Plane,
    description: 'Selamat menunaikan ibadah haji!',
  },
  cancelled: {
    label: 'Dibatalkan',
    color: 'bg-red-500/10 text-red-600 border-red-500/20',
    icon: XCircle,
    description: 'Pendaftaran dibatalkan',
  },
};

export const HajiRegistrationStatus = ({
  registration,
  onViewDetails,
}: HajiRegistrationStatusProps) => {
  const status = statusConfig[registration.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const hajiSeason = getHajiSeasonInfo();
  const packageType = (registration.package?.package_type || 'haji_reguler') as PackageType;

  // Calculate estimated years
  const estimatedYearsRemaining = registration.estimated_departure_year 
    ? registration.estimated_departure_year - new Date().getFullYear()
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden">
        {/* Status Banner */}
        <div className={`p-4 ${status.color} border-b`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-background/50 flex items-center justify-center">
              <StatusIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{status.label}</h3>
              <p className="text-xs opacity-80">{status.description}</p>
            </div>
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Package Info */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Paket</p>
              <p className="font-medium text-foreground">
                {registration.package?.name || 'Paket Haji'}
              </p>
            </div>
            <Badge className={packageTypeColors[packageType]}>
              {packageTypeLabels[packageType]}
            </Badge>
          </div>

          {/* Key Details */}
          <div className="grid grid-cols-2 gap-3">
            {registration.porsi_number && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Hash className="w-4 h-4" />
                  <span className="text-xs">Nomor Porsi</span>
                </div>
                <p className="font-bold text-foreground">{registration.porsi_number}</p>
              </div>
            )}

            {registration.registration_year && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs">Tahun Daftar</span>
                </div>
                <p className="font-bold text-foreground">{registration.registration_year}</p>
              </div>
            )}

            {registration.estimated_departure_year && (
              <div className="p-3 bg-primary/5 rounded-lg col-span-2">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Plane className="w-4 h-4" />
                  <span className="text-xs">Estimasi Keberangkatan</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="font-bold text-xl text-foreground">
                    {registration.estimated_departure_year}
                  </p>
                  {estimatedYearsRemaining && estimatedYearsRemaining > 0 && (
                    <span className="text-sm text-muted-foreground">
                      (~{estimatedYearsRemaining} tahun lagi)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Registration Info */}
          <div className="pt-3 border-t border-border space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Nama Jamaah</span>
              <span className="font-medium text-foreground">{registration.full_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">NIK</span>
              <span className="font-medium text-foreground">
                {registration.nik.slice(0, 4)}****{registration.nik.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tanggal Daftar</span>
              <span className="font-medium text-foreground">
                {format(new Date(registration.created_at), 'dd MMM yyyy', { locale: id })}
              </span>
            </div>
            {registration.dp_amount && registration.dp_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">DP Dibayar</span>
                <span className="font-medium text-primary">
                  Rp {registration.dp_amount.toLocaleString('id-ID')}
                </span>
              </div>
            )}
          </div>

          {/* Agent Notes */}
          {registration.agent_notes && (
            <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
              <p className="text-xs text-blue-600 font-medium mb-1">Catatan dari Travel:</p>
              <p className="text-sm text-foreground">{registration.agent_notes}</p>
            </div>
          )}

          {/* Action Button */}
          {onViewDetails && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={onViewDetails}
            >
              Lihat Detail
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
