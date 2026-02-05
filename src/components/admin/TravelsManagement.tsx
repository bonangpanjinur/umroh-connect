import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllTravels, useVerifyTravel, useDeleteTravel, useSuspendTravel } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Search, Building2, CheckCircle, XCircle, Star, Trash2, Pencil, Ban, Clock, ShieldCheck } from 'lucide-react';
import { AddTravelForm } from './AddTravelForm';
import { EditTravelForm } from './EditTravelForm';
import { Travel, TravelStatus } from '@/types/database';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export const TravelsManagement = () => {
  const { data: travels, isLoading } = useAllTravels();
  const verifyTravel = useVerifyTravel();
  const deleteTravel = useDeleteTravel();
  const suspendTravel = useSuspendTravel();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TravelStatus | 'unverified'>('all');
  const [editingTravel, setEditingTravel] = useState<any>(null);
  const [verifyDialog, setVerifyDialog] = useState<{ open: boolean; travel: any; action: 'verify' | 'unverify' }>({
    open: false,
    travel: null,
    action: 'verify'
  });
  const [approvalNotes, setApprovalNotes] = useState('');

  const filteredTravels = travels?.filter(travel => {
    const matchesSearch =
      travel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      travel.phone?.includes(searchTerm);
    
    let matchesStatus = true;
    if (statusFilter === 'unverified') {
      matchesStatus = !travel.verified;
    } else if (statusFilter !== 'all') {
      matchesStatus = travel.status === statusFilter;
    }
    
    return matchesSearch && matchesStatus;
  });

  const handleVerify = async () => {
    if (!verifyDialog.travel) return;
    
    try {
      const isVerifying = verifyDialog.action === 'verify';
      await verifyTravel.mutateAsync({ 
        id: verifyDialog.travel.id, 
        verified: isVerifying,
        approval_notes: approvalNotes || null
      });
      toast.success(isVerifying ? 'Travel berhasil diverifikasi' : 'Verifikasi dicabut');
      setVerifyDialog({ open: false, travel: null, action: 'verify' });
      setApprovalNotes('');
    } catch (error) {
      toast.error('Gagal mengupdate verifikasi');
    }
  };

  const handleSuspend = async (id: string, status: TravelStatus) => {
    try {
      await suspendTravel.mutateAsync({ id, status });
      toast.success(status === 'suspended' ? 'Travel berhasil disuspend' : 'Travel berhasil diaktifkan');
    } catch (error) {
      toast.error('Gagal mengupdate status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTravel.mutateAsync(id);
      toast.success('Travel berhasil dihapus');
    } catch (error) {
      toast.error('Gagal menghapus travel');
    }
  };

  const getStatusBadge = (travel: any) => {
    if (travel.status === 'suspended') {
      return (
        <Badge variant="destructive" className="gap-1">
          <Ban className="h-3 w-3" />
          Suspended
        </Badge>
      );
    }
    if (!travel.verified) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Belum Verified
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="gap-1 bg-green-500">
        <ShieldCheck className="h-3 w-3" />
        Verified
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const verifiedCount = travels?.filter(t => t.verified).length || 0;
  const unverifiedCount = travels?.filter(t => !t.verified).length || 0;
  const suspendedCount = travels?.filter(t => t.status === 'suspended').length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Manajemen Travel Agency
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="unverified">Belum Verified</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <AddTravelForm />
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex gap-4 text-sm flex-wrap">
            <div className="bg-secondary px-3 py-1.5 rounded-lg">
              Total: <span className="font-semibold">{travels?.length || 0}</span>
            </div>
            <div className="bg-green-500/10 text-green-600 px-3 py-1.5 rounded-lg">
              Verified: <span className="font-semibold">{verifiedCount}</span>
            </div>
            {unverifiedCount > 0 && (
              <div className="bg-amber-500/10 text-amber-600 px-3 py-1.5 rounded-lg">
                Pending: <span className="font-semibold">{unverifiedCount}</span>
              </div>
            )}
            {suspendedCount > 0 && (
              <div className="bg-destructive/10 text-destructive px-3 py-1.5 rounded-lg">
                Suspended: <span className="font-semibold">{suspendedCount}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Travel</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>URL Custom</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terdaftar</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTravels?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Tidak ada travel ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                filteredTravels?.map((travel) => (
                  <TableRow key={travel.id} className={travel.status === 'suspended' ? 'opacity-60' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {travel.logo_url ? (
                          <img 
                            src={travel.logo_url} 
                            alt={travel.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {travel.name}
                            {travel.verified && <ShieldCheck className="h-4 w-4 text-green-500" />}
                          </p>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {travel.address || 'Alamat belum diisi'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {travel.owner?.full_name || 'Belum ada owner'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{travel.phone || '-'}</p>
                        <p className="text-muted-foreground">{travel.whatsapp || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span>{travel.rating || 0}</span>
                        <span className="text-muted-foreground">({travel.review_count || 0})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {travel.status === 'verified' ? (
                          <>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 w-fit">Terverifikasi</Badge>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground w-fit">Pending</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStatusBadge(travel)}
                        {travel.verified_at && (
                          <p className="text-[10px] text-muted-foreground">
                            {format(new Date(travel.verified_at), 'dd MMM yyyy', { locale: id })}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(travel.created_at), 'dd MMM yyyy', { locale: id })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingTravel(travel)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        
                        {/* Verify/Unverify Button */}
                        {travel.verified ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setVerifyDialog({ open: true, travel, action: 'unverify' })}
                            title="Cabut verifikasi"
                          >
                            <XCircle className="h-4 w-4 text-amber-500" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setVerifyDialog({ open: true, travel, action: 'verify' })}
                            title="Verifikasi"
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                        
                        {/* Suspend/Activate Button */}
                        {travel.status === 'suspended' ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSuspend(travel.id, 'active')}
                            title="Aktifkan"
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSuspend(travel.id, 'suspended')}
                            title="Suspend"
                          >
                            <Ban className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Travel</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus "{travel.name}"? 
                                Tindakan ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(travel.id)}>
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Edit Travel Modal */}
      {editingTravel && (
        <EditTravelForm
          travel={editingTravel}
          open={!!editingTravel}
          onOpenChange={(open) => !open && setEditingTravel(null)}
        />
      )}

      {/* Verify Dialog */}
      <Dialog open={verifyDialog.open} onOpenChange={(open) => !open && setVerifyDialog({ open: false, travel: null, action: 'verify' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {verifyDialog.action === 'verify' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Verifikasi Travel
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-amber-500" />
                  Cabut Verifikasi
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {verifyDialog.action === 'verify' 
                ? `Travel "${verifyDialog.travel?.name}" akan diverifikasi dan dapat dilihat oleh jamaah.`
                : `Verifikasi "${verifyDialog.travel?.name}" akan dicabut. Travel tidak akan muncul di marketplace.`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (opsional)</Label>
            <Textarea
              id="notes"
              placeholder="Tuliskan catatan verifikasi..."
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialog({ open: false, travel: null, action: 'verify' })}>
              Batal
            </Button>
            <Button
              variant={verifyDialog.action === 'verify' ? 'default' : 'secondary'}
              onClick={handleVerify}
              disabled={verifyTravel.isPending}
            >
              {verifyTravel.isPending ? 'Memproses...' : verifyDialog.action === 'verify' ? 'Verifikasi' : 'Cabut Verifikasi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
