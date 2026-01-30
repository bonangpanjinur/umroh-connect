import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Check, X, Eye, ExternalLink, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useAllSubscriptions, 
  useVerifySubscription, 
  useSubscriptionPriceSetting,
  useUpdateSubscriptionPrice 
} from '@/hooks/usePremiumSubscription';

const SubscriptionsManagement: React.FC = () => {
  const { data: subscriptions, isLoading } = useAllSubscriptions();
  const { data: priceSetting } = useSubscriptionPriceSetting();
  const verifySubscription = useVerifySubscription();
  const updatePrice = useUpdateSubscriptionPrice();

  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Aktif</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Menunggu</Badge>;
      case 'expired':
        return <Badge variant="secondary">Kadaluarsa</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleVerify = async (approved: boolean) => {
    if (!selectedSub) return;
    
    await verifySubscription.mutateAsync({
      subscriptionId: selectedSub.id,
      approved,
      adminNotes,
    });
    
    setVerifyModalOpen(false);
    setSelectedSub(null);
    setAdminNotes('');
  };

  const handleUpdatePrice = async () => {
    const price = parseInt(newPrice.replace(/\D/g, ''));
    if (isNaN(price) || price <= 0) return;
    
    await updatePrice.mutateAsync(price);
    setPriceModalOpen(false);
    setNewPrice('');
  };

  const filteredSubscriptions = subscriptions?.filter(sub => {
    if (filterStatus !== 'all' && sub.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return sub.user_id?.toLowerCase().includes(query);
    }
    return true;
  }) || [];

  const pendingCount = subscriptions?.filter(s => s.status === 'pending').length || 0;
  const activeCount = subscriptions?.filter(s => s.status === 'active').length || 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">{subscriptions?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Total Subscriber</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-500">{activeCount}</div>
            <p className="text-sm text-muted-foreground">Aktif</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-500">{pendingCount}</div>
            <p className="text-sm text-muted-foreground">Menunggu Verifikasi</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => {
          setNewPrice(priceSetting?.value?.toString() || '');
          setPriceModalOpen(true);
        }}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {formatPrice(parseInt(priceSetting?.value?.toString() || '0'))}
            </div>
            <p className="text-sm text-muted-foreground">Harga/Tahun (klik untuk ubah)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari user ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Menunggu</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="expired">Kadaluarsa</SelectItem>
            <SelectItem value="rejected">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subscriptions List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : filteredSubscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Belum ada subscription
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSubscriptions.map((sub) => (
            <Card key={sub.id} className={sub.status === 'pending' ? 'border-amber-500/50' : ''}>
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm">{sub.user_id.slice(0, 8)}...</p>
                      {getStatusBadge(sub.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {sub.plan?.name || 'Premium'} • {formatPrice(sub.payment_amount || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sub.payment_date 
                        ? `Bayar: ${new Date(sub.payment_date).toLocaleDateString('id-ID')}`
                        : 'Belum bayar'
                      }
                      {sub.end_date && ` • Exp: ${new Date(sub.end_date).toLocaleDateString('id-ID')}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {sub.payment_proof_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(sub.payment_proof_url, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Bukti
                      </Button>
                    )}
                    {sub.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedSub(sub);
                          setVerifyModalOpen(true);
                        }}
                      >
                        Verifikasi
                      </Button>
                    )}
                  </div>
                </div>

                {sub.admin_notes && (
                  <p className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded">
                    Catatan: {sub.admin_notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Verify Modal */}
      <Dialog open={verifyModalOpen} onOpenChange={setVerifyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verifikasi Pembayaran</DialogTitle>
          </DialogHeader>
          
          {selectedSub && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm"><strong>User ID:</strong> {selectedSub.user_id}</p>
                <p className="text-sm"><strong>Jumlah:</strong> {formatPrice(selectedSub.payment_amount || 0)}</p>
                <p className="text-sm">
                  <strong>Tanggal:</strong> {selectedSub.payment_date 
                    ? new Date(selectedSub.payment_date).toLocaleString('id-ID')
                    : '-'
                  }
                </p>
              </div>

              {selectedSub.payment_proof_url && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(selectedSub.payment_proof_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Lihat Bukti Transfer
                </Button>
              )}

              <div>
                <Label>Catatan Admin (opsional)</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Tambahkan catatan jika perlu..."
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => handleVerify(false)}
              disabled={verifySubscription.isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Tolak
            </Button>
            <Button
              onClick={() => handleVerify(true)}
              disabled={verifySubscription.isPending}
            >
              <Check className="h-4 w-4 mr-1" />
              Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Price Modal */}
      <Dialog open={priceModalOpen} onOpenChange={setPriceModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Harga Langganan</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Harga Langganan Tahunan (Rp)</Label>
              <Input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="99000"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Harga baru akan berlaku untuk langganan yang dibuat setelah perubahan ini.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPriceModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={handleUpdatePrice}
              disabled={updatePrice.isPending}
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionsManagement;
