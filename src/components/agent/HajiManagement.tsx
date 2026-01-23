import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, Filter, ChevronDown, ChevronUp, 
  FileCheck, Clock, Plane, XCircle, Eye, Edit2,
  Phone, Mail, Calendar, MapPin, Hash, FileText,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  useAgentHajiRegistrations, 
  useUpdateHajiRegistration,
  useHajiStats,
  HajiRegistration,
  packageTypeLabels,
  packageTypeColors,
} from '@/hooks/useHaji';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface HajiManagementProps {
  travelId?: string;
}

const statusConfig = {
  pending: { label: 'Menunggu Verifikasi', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  verified: { label: 'Terverifikasi', color: 'bg-blue-100 text-blue-800', icon: FileCheck },
  waiting: { label: 'Antrian Porsi', color: 'bg-purple-100 text-purple-800', icon: Users },
  departed: { label: 'Sudah Berangkat', color: 'bg-green-100 text-green-800', icon: Plane },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export const HajiManagement = ({ travelId }: HajiManagementProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRegistration, setSelectedRegistration] = useState<HajiRegistration | null>(null);
  const [showDocuments, setShowDocuments] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Edit form state
  const [editStatus, setEditStatus] = useState<string>('');
  const [editPorsiNumber, setEditPorsiNumber] = useState('');
  const [editEstimatedYear, setEditEstimatedYear] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const { data: registrations, isLoading } = useAgentHajiRegistrations(travelId);
  const { data: stats } = useHajiStats(travelId);
  const updateRegistration = useUpdateHajiRegistration();

  // Filter registrations
  const filteredRegistrations = registrations?.filter(reg => {
    const matchesSearch = 
      reg.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.nik.includes(searchQuery) ||
      reg.phone.includes(searchQuery) ||
      (reg.porsi_number && reg.porsi_number.includes(searchQuery));
    
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleViewDetails = (registration: HajiRegistration) => {
    setSelectedRegistration(registration);
    setEditMode(false);
    setShowDocuments(false);
  };

  const handleEditRegistration = (registration: HajiRegistration) => {
    setSelectedRegistration(registration);
    setEditStatus(registration.status);
    setEditPorsiNumber(registration.porsi_number || '');
    setEditEstimatedYear(registration.estimated_departure_year?.toString() || '');
    setEditNotes(registration.agent_notes || '');
    setEditMode(true);
    setShowDocuments(false);
  };

  const handleSaveChanges = async () => {
    if (!selectedRegistration) return;

    try {
      await updateRegistration.mutateAsync({
        registrationId: selectedRegistration.id,
        updates: {
          status: editStatus as HajiRegistration['status'],
          porsi_number: editPorsiNumber || null,
          estimated_departure_year: editEstimatedYear ? parseInt(editEstimatedYear) : null,
          agent_notes: editNotes || null,
        },
      });

      toast({
        title: 'Berhasil',
        description: 'Data pendaftaran berhasil diperbarui',
      });

      setSelectedRegistration(null);
      setEditMode(false);
    } catch (error: any) {
      toast({
        title: 'Gagal',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getSignedUrl = async (path: string) => {
    const { data } = await supabase.storage
      .from('haji-documents')
      .createSignedUrl(path, 300);
    return data?.signedUrl;
  };

  const handleViewDocument = async (docPath: string) => {
    const url = await getSignedUrl(docPath);
    if (url) {
      window.open(url, '_blank');
    } else {
      toast({
        title: 'Gagal',
        description: 'Tidak dapat membuka dokumen',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200 text-center">
            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
            <p className="text-[10px] text-yellow-600">Pending</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 border border-green-200 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.verified + stats.waiting}</p>
            <p className="text-[10px] text-green-600">Aktif</p>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, NIK, HP, atau No. Porsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]">
            <Filter className="w-4 h-4 mr-1" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            {Object.entries(statusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Registration List */}
      {filteredRegistrations.length === 0 ? (
        <div className="bg-card rounded-2xl border-2 border-dashed border-border p-8 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h4 className="font-medium mb-1">Belum Ada Pendaftaran</h4>
          <p className="text-sm text-muted-foreground">
            {searchQuery || statusFilter !== 'all' 
              ? 'Tidak ada data yang sesuai filter'
              : 'Pendaftaran haji jamaah akan muncul di sini'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRegistrations.map((reg) => {
            const StatusIcon = statusConfig[reg.status as keyof typeof statusConfig]?.icon || Clock;
            const statusInfo = statusConfig[reg.status as keyof typeof statusConfig];
            
            return (
              <motion.div
                key={reg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{reg.full_name}</h4>
                    <p className="text-xs text-muted-foreground">NIK: {reg.nik}</p>
                  </div>
                  <Badge className={`${statusInfo?.color} text-xs`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusInfo?.label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    {reg.phone}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(reg.created_at), 'dd MMM yyyy', { locale: localeId })}
                  </div>
                  {reg.porsi_number && (
                    <div className="flex items-center gap-1 text-primary font-medium">
                      <Hash className="w-3 h-3" />
                      Porsi: {reg.porsi_number}
                    </div>
                  )}
                  {reg.estimated_departure_year && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Plane className="w-3 h-3" />
                      Est. {reg.estimated_departure_year}
                    </div>
                  )}
                </div>

                {reg.package && (
                  <Badge 
                    variant="outline" 
                    className={`${packageTypeColors[reg.package.package_type]} mb-3`}
                  >
                    {packageTypeLabels[reg.package.package_type]} - {reg.package.name}
                  </Badge>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewDetails(reg)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Detail
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditRegistration(reg)}
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Kelola
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail/Edit Dialog */}
      <Dialog 
        open={!!selectedRegistration} 
        onOpenChange={(open) => !open && setSelectedRegistration(null)}
      >
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editMode ? 'Kelola Pendaftaran' : showDocuments ? 'Dokumen' : 'Detail Pendaftaran'}
            </DialogTitle>
          </DialogHeader>

          {selectedRegistration && (
            <div className="space-y-4">
              {/* Tab Buttons */}
              <div className="flex gap-2">
                <Button
                  variant={!editMode && !showDocuments ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setEditMode(false); setShowDocuments(false); }}
                >
                  Info
                </Button>
                <Button
                  variant={showDocuments ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setEditMode(false); setShowDocuments(true); }}
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Dokumen
                </Button>
                <Button
                  variant={editMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleEditRegistration(selectedRegistration)}
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Kelola
                </Button>
              </div>

              {/* Info View */}
              {!editMode && !showDocuments && (
                <div className="space-y-3">
                  <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Nama</span>
                      <span className="text-sm font-medium">{selectedRegistration.full_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">NIK</span>
                      <span className="text-sm font-medium">{selectedRegistration.nik}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Telepon</span>
                      <span className="text-sm font-medium">{selectedRegistration.phone}</span>
                    </div>
                    {selectedRegistration.email && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Email</span>
                        <span className="text-sm font-medium">{selectedRegistration.email}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tanggal Lahir</span>
                      <span className="text-sm font-medium">
                        {format(new Date(selectedRegistration.birth_date), 'dd MMMM yyyy', { locale: localeId })}
                      </span>
                    </div>
                    {selectedRegistration.address && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Alamat</span>
                        <span className="text-sm font-medium text-right max-w-[60%]">{selectedRegistration.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-primary/5 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge className={statusConfig[selectedRegistration.status as keyof typeof statusConfig]?.color}>
                        {statusConfig[selectedRegistration.status as keyof typeof statusConfig]?.label}
                      </Badge>
                    </div>
                    {selectedRegistration.porsi_number && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">No. Porsi</span>
                        <span className="text-sm font-bold text-primary">{selectedRegistration.porsi_number}</span>
                      </div>
                    )}
                    {selectedRegistration.estimated_departure_year && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Estimasi Berangkat</span>
                        <span className="text-sm font-medium">{selectedRegistration.estimated_departure_year}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Terdaftar</span>
                      <span className="text-sm font-medium">
                        {format(new Date(selectedRegistration.created_at), 'dd MMM yyyy', { locale: localeId })}
                      </span>
                    </div>
                  </div>

                  {selectedRegistration.agent_notes && (
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <p className="text-xs text-yellow-700 font-medium mb-1">Catatan Agent:</p>
                      <p className="text-sm text-yellow-800">{selectedRegistration.agent_notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Documents View */}
              {showDocuments && (
                <div className="space-y-3">
                  {selectedRegistration.documents && Object.keys(selectedRegistration.documents).length > 0 ? (
                    Object.entries(selectedRegistration.documents).map(([key, path]) => {
                      const docLabels: Record<string, string> = {
                        ktp: 'KTP',
                        kk: 'Kartu Keluarga',
                        passport: 'Passport',
                        photo: 'Pas Foto',
                        health_certificate: 'Surat Keterangan Sehat',
                        meningitis_vaccine: 'Sertifikat Vaksin Meningitis',
                        marriage_certificate: 'Buku Nikah/Akta Lahir',
                      };

                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between bg-secondary/50 rounded-lg p-3"
                        >
                          <div className="flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-green-600" />
                            <span className="text-sm">{docLabels[key] || key}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDocument(path as string)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Lihat
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Belum ada dokumen yang diunggah</p>
                    </div>
                  )}
                </div>
              )}

              {/* Edit Mode */}
              {editMode && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Status</label>
                    <Select value={editStatus} onValueChange={setEditStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <config.icon className="w-4 h-4" />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Nomor Porsi</label>
                    <Input
                      placeholder="Masukkan nomor porsi haji"
                      value={editPorsiNumber}
                      onChange={(e) => setEditPorsiNumber(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Nomor antrian dari Kemenag
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Estimasi Tahun Keberangkatan</label>
                    <Input
                      type="number"
                      placeholder="Contoh: 2045"
                      value={editEstimatedYear}
                      onChange={(e) => setEditEstimatedYear(e.target.value)}
                      min={new Date().getFullYear()}
                      max={new Date().getFullYear() + 50}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Catatan Agent</label>
                    <Textarea
                      placeholder="Tambahkan catatan untuk jamaah..."
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={handleSaveChanges}
                    disabled={updateRegistration.isPending}
                  >
                    {updateRegistration.isPending ? (
                      <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Simpan Perubahan
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
