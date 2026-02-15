import { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSellerApplication, useSubmitSellerApplication } from '@/hooks/useSeller';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Store, Clock, CheckCircle, XCircle } from 'lucide-react';

const SellerApplicationForm = () => {
  const { user } = useAuthContext();
  const { data: application, isLoading } = useSellerApplication();
  const submitMutation = useSubmitSellerApplication();
  const [form, setForm] = useState({
    shop_name: '',
    description: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (application) {
    const statusConfig = {
      pending: { icon: Clock, label: 'Menunggu Review', color: 'bg-yellow-500', desc: 'Pengajuan Anda sedang ditinjau oleh admin.' },
      approved: { icon: CheckCircle, label: 'Disetujui', color: 'bg-green-500', desc: 'Selamat! Anda sudah bisa mulai berjualan.' },
      rejected: { icon: XCircle, label: 'Ditolak', color: 'bg-destructive', desc: application.admin_notes || 'Maaf, pengajuan Anda tidak disetujui.' },
    };
    const status = statusConfig[application.status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = status.icon;

    return (
      <Card>
        <CardContent className="pt-6 text-center space-y-4">
          <div className={`inline-flex p-3 rounded-full ${status.color}/10`}>
            <Icon className={`h-8 w-8 ${status.color === 'bg-destructive' ? 'text-destructive' : status.color === 'bg-green-500' ? 'text-green-500' : 'text-yellow-500'}`} />
          </div>
          <div>
            <Badge className={status.color}>{status.label}</Badge>
            <p className="text-sm text-muted-foreground mt-2">{status.desc}</p>
          </div>
          <div className="text-left text-sm space-y-1 bg-muted p-3 rounded-lg">
            <p><strong>Nama Toko:</strong> {application.shop_name}</p>
            <p><strong>Tanggal Daftar:</strong> {new Date(application.created_at).toLocaleDateString('id-ID')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    submitMutation.mutate({ ...form, user_id: user.id });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          Daftar Jadi Seller
        </CardTitle>
        <CardDescription>Lengkapi data toko untuk mulai berjualan di marketplace</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Toko *</Label>
            <Input required value={form.shop_name} onChange={e => setForm(f => ({ ...f, shop_name: e.target.value }))} placeholder="Contoh: Toko Oleh-oleh Haji Ahmad" />
          </div>
          <div className="space-y-2">
            <Label>Deskripsi Toko</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Jelaskan produk yang dijual" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>No. Telepon *</Label>
              <Input required value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="08xxx" />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="08xxx" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Alamat</Label>
            <Textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Alamat lengkap toko" />
          </div>
          <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? 'Mendaftar...' : 'Daftar Sebagai Seller'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SellerApplicationForm;
