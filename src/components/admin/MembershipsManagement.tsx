import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMemberships, useUpdateMembership } from '@/hooks/useAdminData';
import { 
  CheckCircle2, Clock, XCircle, Building2, Search, 
  Filter, Eye, Crown, Sparkles, Shield, 
  CreditCard, FileCheck, AlertTriangle
} from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';

export const MembershipsManagement = () => {
  const { data: memberships, isLoading } = useMemberships();
  const updateMembership = useUpdateMembership();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMembership, setSelectedMembership] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Aktif</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-500 text-white"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'expired':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Expired</Badge>;
      case 'cancelled':
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'premium':
        return <Crown className="w-4 h-4 text-amber-500" />;
      case 'pro':
        return <Sparkles className="w-4 h-4 text-blue-500" />;
      default:
        return <Shield className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const handleApprove = async (membership: any) => {
    const now = new Date();
    const endDate = addMonths(now, 1);
    
    try {
      await updateMembership.mutateAsync({
        id: membership.id,
        status: 'active',
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
        notes: adminNotes || 'Disetujui oleh admin',
      });
      toast.success('Membership berhasil diaktifkan');
      setShowDetailModal(false);
      setAdminNotes('');
    } catch (error) {
      toast.error('Gagal mengaktifkan membership');
    }
  };

  const handleReject = async (membership: any) => {
    if (!adminNotes) {
      toast.error('Mohon isi alasan penolakan');
      return;
    }
    
    try {
      await updateMembership.mutateAsync({
        id: membership.id,
        status: 'cancelled',
        notes: adminNotes,
      });
      toast.success('Membership ditolak');
      setShowDetailModal(false);
      setAdminNotes('');
    } catch (error) {
      toast.error('Gagal menolak membership');
    }
  };

  const filteredMemberships = memberships?.filter(m => {
    const matchesSearch = 
      m.travel?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.plan_type?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = memberships?.filter(m => m.status === 'pending').length || 0;
  const activeCount = memberships?.filter(m => m.status === 'active').length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Menunggu Verifikasi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Member Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(memberships?.filter(m => m.status === 'active').reduce((sum, m) => sum + (m.amount || 0), 0) || 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Revenue Member Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Manajemen Keanggotaan Agent
          </CardTitle>
          <CardDescription>
            Verifikasi dan kelola keanggotaan travel agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari travel atau plan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Travel</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMemberships?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Tidak ada data membership
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMemberships?.map((membership) => (
                    <TableRow key={membership.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{membership.travel?.name || '-'}</p>
                            <p className="text-xs text-muted-foreground">{membership.travel?.phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPlanIcon(membership.plan_type)}
                          <span className="font-medium capitalize">{membership.plan_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{formatCurrency(membership.amount)}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(membership.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(membership.created_at), 'dd MMM yyyy', { locale: localeId })}</p>
                          {membership.end_date && (
                            <p className="text-xs text-muted-foreground">
                              s.d. {format(new Date(membership.end_date), 'dd MMM yyyy', { locale: localeId })}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedMembership(membership);
                            setAdminNotes(membership.notes || '');
                            setShowDetailModal(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getPlanIcon(selectedMembership?.plan_type)}
              Detail Keanggotaan
            </DialogTitle>
            <DialogDescription>
              Review dan verifikasi pengajuan keanggotaan
            </DialogDescription>
          </DialogHeader>

          {selectedMembership && (
            <div className="space-y-4">
              {/* Travel Info */}
              <div className="bg-muted/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold">{selectedMembership.travel?.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedMembership.travel?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Paket</Label>
                  <p className="font-semibold capitalize flex items-center gap-1">
                    {getPlanIcon(selectedMembership.plan_type)}
                    {selectedMembership.plan_type}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Jumlah</Label>
                  <p className="font-bold text-primary">{formatCurrency(selectedMembership.amount)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedMembership.status)}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Tanggal Pengajuan</Label>
                  <p className="font-medium">
                    {format(new Date(selectedMembership.created_at), 'dd MMM yyyy HH:mm', { locale: localeId })}
                  </p>
                </div>
              </div>

              {/* Payment Proof */}
              {selectedMembership.payment_proof_url && (
                <div>
                  <Label className="text-xs text-muted-foreground">Bukti Pembayaran</Label>
                  <div className="mt-2 border rounded-lg overflow-hidden">
                    <img 
                      src={selectedMembership.payment_proof_url} 
                      alt="Bukti Pembayaran"
                      className="w-full max-h-64 object-contain bg-muted"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto mt-1"
                    onClick={() => window.open(selectedMembership.payment_proof_url, '_blank')}
                  >
                    Lihat ukuran penuh
                  </Button>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <Label>Catatan Admin</Label>
                <Textarea
                  placeholder="Tambahkan catatan (wajib untuk penolakan)..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedMembership?.status === 'pending' && (
              <>
                <Button 
                  variant="destructive"
                  onClick={() => handleReject(selectedMembership)}
                  disabled={updateMembership.isPending}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Tolak
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(selectedMembership)}
                  disabled={updateMembership.isPending}
                >
                  <FileCheck className="w-4 h-4 mr-1" />
                  Setujui & Aktifkan
                </Button>
              </>
            )}
            {selectedMembership?.status !== 'pending' && (
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Tutup
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
