import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMemberships, useUpdateMembership } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import { format, addMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { Search, CreditCard, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { MembershipStatus } from '@/types/database';

export const MembershipsManagement = () => {
  const { data: memberships, isLoading } = useMemberships();
  const updateMembership = useUpdateMembership();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMembership, setSelectedMembership] = useState<any>(null);
  const [notes, setNotes] = useState('');

  const filteredMemberships = memberships?.filter(m => 
    m.travel?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleApprove = async (membership: any) => {
    try {
      const startDate = new Date();
      const endDate = addMonths(startDate, 1);
      
      await updateMembership.mutateAsync({
        id: membership.id,
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        notes: notes || 'Approved by admin'
      });
      toast.success('Keanggotaan berhasil diaktifkan');
      setSelectedMembership(null);
      setNotes('');
    } catch (error) {
      toast.error('Gagal mengaktifkan keanggotaan');
    }
  };

  const handleReject = async (membership: any) => {
    try {
      await updateMembership.mutateAsync({
        id: membership.id,
        status: 'cancelled',
        notes: notes || 'Rejected by admin'
      });
      toast.success('Keanggotaan ditolak');
      setSelectedMembership(null);
      setNotes('');
    } catch (error) {
      toast.error('Gagal menolak keanggotaan');
    }
  };

  const getStatusBadge = (status: MembershipStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Aktif</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Ditolak</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return <Badge className="bg-purple-500">Enterprise</Badge>;
      case 'premium':
        return <Badge className="bg-amber-500">Premium</Badge>;
      default:
        return <Badge variant="outline">Basic</Badge>;
    }
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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Manajemen Keanggotaan
          </CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama travel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Travel</TableHead>
                <TableHead>Paket</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Bukti</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMemberships?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Tidak ada keanggotaan ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                filteredMemberships?.map((membership) => (
                  <TableRow key={membership.id}>
                    <TableCell className="font-medium">
                      {membership.travel?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>{getPlanBadge(membership.plan_type)}</TableCell>
                    <TableCell>{formatCurrency(membership.amount)}</TableCell>
                    <TableCell>{getStatusBadge(membership.status)}</TableCell>
                    <TableCell>
                      {membership.start_date && membership.end_date ? (
                        <div className="text-sm">
                          <p>{format(new Date(membership.start_date), 'dd MMM yyyy', { locale: id })}</p>
                          <p className="text-muted-foreground">
                            s/d {format(new Date(membership.end_date), 'dd MMM yyyy', { locale: id })}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {membership.payment_proof_url ? (
                        <a 
                          href={membership.payment_proof_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          Lihat <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {membership.status === 'pending' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedMembership(membership)}
                            >
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Review Keanggotaan</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <p className="font-medium">{membership.travel?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Paket: {membership.plan_type} - {formatCurrency(membership.amount)}
                                </p>
                              </div>
                              
                              {membership.payment_proof_url && (
                                <div>
                                  <Label>Bukti Pembayaran</Label>
                                  <a 
                                    href={membership.payment_proof_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline flex items-center gap-1 mt-1"
                                  >
                                    Lihat bukti <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              )}
                              
                              <div>
                                <Label>Catatan Admin</Label>
                                <Textarea
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                  placeholder="Tambahkan catatan..."
                                  className="mt-1"
                                />
                              </div>
                              
                              <div className="flex gap-2">
                                <Button 
                                  className="flex-1 bg-green-500 hover:bg-green-600"
                                  onClick={() => handleApprove(membership)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  className="flex-1"
                                  onClick={() => handleReject(membership)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
