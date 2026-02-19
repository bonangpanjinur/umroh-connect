import React, { useState, useEffect } from 'react';
import { Crown, Check, X, Eye, ExternalLink, Search, Filter, Settings, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useAllSubscriptions, 
  useVerifySubscription, 
} from '@/hooks/usePremiumSubscription';
import {
  usePremiumPlanConfig,
  useSavePremiumPlanConfig,
  usePremiumTrialConfig,
  useSavePremiumTrialConfig,
  type PremiumPlanConfig,
  type PremiumTrialConfig,
} from '@/hooks/usePremiumConfig';
import { toast } from 'sonner';

const SubscriptionsManagement: React.FC = () => {
  const { data: subscriptions, isLoading } = useAllSubscriptions();
  const verifySubscription = useVerifySubscription();

  // Config hooks
  const { data: planConfig, isLoading: planLoading } = usePremiumPlanConfig();
  const { data: trialConfig, isLoading: trialLoading } = usePremiumTrialConfig();
  const savePlanConfig = useSavePremiumPlanConfig();
  const saveTrialConfig = useSavePremiumTrialConfig();

  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Settings form state
  const [planForm, setPlanForm] = useState<PremiumPlanConfig>({
    name: '', description: '', priceYearly: 0, features: [],
  });
  const [trialForm, setTrialForm] = useState<PremiumTrialConfig>({
    enabled: true, durationDays: 30,
  });

  useEffect(() => {
    if (planConfig) setPlanForm(planConfig);
  }, [planConfig]);

  useEffect(() => {
    if (trialConfig) setTrialForm(trialConfig);
  }, [trialConfig]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500">Aktif</Badge>;
      case 'pending': return <Badge variant="outline" className="border-amber-500 text-amber-500">Menunggu</Badge>;
      case 'expired': return <Badge variant="secondary">Kadaluarsa</Badge>;
      case 'rejected': return <Badge variant="destructive">Ditolak</Badge>;
      case 'trial': return <Badge variant="outline" className="border-violet-500 text-violet-500">Trial</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleVerify = async (approved: boolean) => {
    if (!selectedSub) return;
    await verifySubscription.mutateAsync({ subscriptionId: selectedSub.id, approved, adminNotes });
    setVerifyModalOpen(false);
    setSelectedSub(null);
    setAdminNotes('');
  };

  const handleSaveSettings = async () => {
    try {
      await Promise.all([
        savePlanConfig.mutateAsync(planForm),
        saveTrialConfig.mutateAsync(trialForm),
      ]);
      toast.success('Pengaturan berhasil disimpan');
    } catch {
      toast.error('Gagal menyimpan pengaturan');
    }
  };

  const filteredSubscriptions = subscriptions?.filter(sub => {
    if (filterStatus !== 'all' && sub.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const name = sub.profile?.full_name?.toLowerCase() || '';
      const email = sub.profile?.email?.toLowerCase() || '';
      return name.includes(query) || email.includes(query) || sub.user_id?.toLowerCase().includes(query);
    }
    return true;
  }) || [];

  const pendingCount = subscriptions?.filter(s => s.status === 'pending').length || 0;
  const activeCount = subscriptions?.filter(s => s.status === 'active').length || 0;
  const trialCount = subscriptions?.filter(s => s.status === 'trial').length || 0;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="subscribers">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="subscribers">
            <Crown className="h-4 w-4 mr-2" />
            Subscriber
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Pengaturan
          </TabsTrigger>
        </TabsList>

        {/* ── Subscribers Tab ── */}
        <TabsContent value="subscribers" className="space-y-4 mt-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-primary">{subscriptions?.length || 0}</div>
                <p className="text-sm text-muted-foreground">Total</p>
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
                <p className="text-sm text-muted-foreground">Menunggu</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-violet-500">{trialCount}</div>
                <p className="text-sm text-muted-foreground">Trial</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, email, atau user ID..."
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
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="expired">Kadaluarsa</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Belum ada subscriber
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
                          <p className="font-medium text-sm">
                            {sub.profile?.full_name || sub.profile?.email || sub.user_id.slice(0, 8) + '...'}
                          </p>
                          {getStatusBadge(sub.status)}
                        </div>
                        {sub.profile?.email && sub.profile?.full_name && (
                          <p className="text-xs text-muted-foreground">{sub.profile.email}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {sub.plan?.name || 'Premium'} • {formatPrice(sub.payment_amount || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {sub.payment_date
                            ? `Bayar: ${new Date(sub.payment_date).toLocaleDateString('id-ID')}`
                            : 'Belum bayar'}
                          {sub.end_date && ` • Exp: ${new Date(sub.end_date).toLocaleDateString('id-ID')}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {sub.payment_proof_url && (
                          <Button variant="outline" size="sm" onClick={() => window.open(sub.payment_proof_url, '_blank')}>
                            <Eye className="h-4 w-4 mr-1" /> Bukti
                          </Button>
                        )}
                        {sub.status === 'pending' && (
                          <Button size="sm" onClick={() => { setSelectedSub(sub); setVerifyModalOpen(true); }}>
                            Verifikasi
                          </Button>
                        )}
                      </div>
                    </div>
                    {sub.admin_notes && (
                      <p className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded">Catatan: {sub.admin_notes}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Settings Tab ── */}
        <TabsContent value="settings" className="space-y-6 mt-4">
          {(planLoading || trialLoading) ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Plan Config */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pengaturan Plan Premium</CardTitle>
                  <CardDescription>Konfigurasi nama, deskripsi, harga, dan fitur yang tampil di modal upgrade user</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nama Plan</Label>
                      <Input
                        value={planForm.name}
                        onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Premium Ibadah Tracker"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Harga Tahunan (Rp)</Label>
                      <Input
                        type="number"
                        value={planForm.priceYearly}
                        onChange={(e) => setPlanForm(prev => ({ ...prev, priceYearly: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Deskripsi</Label>
                    <Input
                      value={planForm.description}
                      onChange={(e) => setPlanForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Akses penuh fitur cloud & statistik"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Daftar Fitur (satu per baris)</Label>
                    <Textarea
                      value={planForm.features.join('\n')}
                      onChange={(e) => setPlanForm(prev => ({
                        ...prev,
                        features: e.target.value.split('\n').filter(f => f.trim() !== ''),
                      }))}
                      rows={5}
                      placeholder="Sync data ke cloud&#10;Backup otomatis&#10;Akses multi-device"
                    />
                    <p className="text-[10px] text-muted-foreground">Fitur ini tampil di modal upgrade & banner trial</p>
                  </div>
                </CardContent>
              </Card>

              {/* Trial Config */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pengaturan Trial Gratis</CardTitle>
                  <CardDescription>Atur durasi dan ketersediaan trial gratis untuk pengguna baru</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Aktifkan Trial Gratis</Label>
                      <p className="text-xs text-muted-foreground">Jika dinonaktifkan, banner trial tidak akan tampil</p>
                    </div>
                    <Switch
                      checked={trialForm.enabled}
                      onCheckedChange={(checked) => setTrialForm(prev => ({ ...prev, enabled: checked }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Durasi Trial (hari)</Label>
                    <Input
                      type="number"
                      value={trialForm.durationDays}
                      onChange={(e) => setTrialForm(prev => ({ ...prev, durationDays: parseInt(e.target.value) || 7 }))}
                      min={1}
                      max={365}
                      disabled={!trialForm.enabled}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Default: 30 hari. Perubahan hanya berlaku untuk trial baru.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={handleSaveSettings}
                className="w-full"
                disabled={savePlanConfig.isPending || saveTrialConfig.isPending}
              >
                {(savePlanConfig.isPending || saveTrialConfig.isPending) ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Simpan Pengaturan
              </Button>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Verify Modal */}
      <Dialog open={verifyModalOpen} onOpenChange={setVerifyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verifikasi Pembayaran</DialogTitle>
          </DialogHeader>
          {selectedSub && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-1">
                <p className="text-sm">
                  <strong>User:</strong> {selectedSub.profile?.full_name || selectedSub.profile?.email || selectedSub.user_id}
                </p>
                <p className="text-sm"><strong>Jumlah:</strong> {formatPrice(selectedSub.payment_amount || 0)}</p>
                <p className="text-sm">
                  <strong>Tanggal:</strong> {selectedSub.payment_date
                    ? new Date(selectedSub.payment_date).toLocaleString('id-ID')
                    : '-'}
                </p>
              </div>
              {selectedSub.payment_proof_url && (
                <Button variant="outline" className="w-full" onClick={() => window.open(selectedSub.payment_proof_url, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" /> Lihat Bukti Transfer
                </Button>
              )}
              <div>
                <Label>Catatan Admin (opsional)</Label>
                <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Tambahkan catatan jika perlu..." />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="destructive" onClick={() => handleVerify(false)} disabled={verifySubscription.isPending}>
              <X className="h-4 w-4 mr-1" /> Tolak
            </Button>
            <Button onClick={() => handleVerify(true)} disabled={verifySubscription.isPending}>
              <Check className="h-4 w-4 mr-1" /> Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionsManagement;
