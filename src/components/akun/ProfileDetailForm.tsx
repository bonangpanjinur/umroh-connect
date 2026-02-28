import { useState, useEffect } from 'react';
import { Save, MapPin, FileText, Phone, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const ProfileDetailForm = () => {
  const { profile, user } = useAuthContext();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    shipping_address: '',
    shipping_city: '',
    shipping_postal_code: '',
    shipping_phone: '',
    passport_number: '',
    passport_expiry: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    umrah_count: 0,
    hajj_count: 0,
  });

  useEffect(() => {
    if (profile) {
      const p = profile as any;
      setForm({
        full_name: p.full_name || '',
        phone: p.phone || '',
        shipping_address: p.shipping_address || '',
        shipping_city: p.shipping_city || '',
        shipping_postal_code: p.shipping_postal_code || '',
        shipping_phone: p.shipping_phone || '',
        passport_number: p.passport_number || '',
        passport_expiry: p.passport_expiry || '',
        emergency_contact_name: p.emergency_contact_name || '',
        emergency_contact_phone: p.emergency_contact_phone || '',
        umrah_count: p.umrah_count || 0,
        hajj_count: p.hajj_count || 0,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name,
          phone: form.phone,
          shipping_address: form.shipping_address,
          shipping_city: form.shipping_city,
          shipping_postal_code: form.shipping_postal_code,
          shipping_phone: form.shipping_phone,
          passport_number: form.passport_number,
          passport_expiry: form.passport_expiry || null,
          emergency_contact_name: form.emergency_contact_name,
          emergency_contact_phone: form.emergency_contact_phone,
          umrah_count: form.umrah_count,
          hajj_count: form.hajj_count,
        } as any)
        .eq('id', profile.id);
      if (error) throw error;
      toast({ title: 'Profil berhasil disimpan!' });
    } catch (err: any) {
      toast({ title: 'Gagal menyimpan', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-4 p-4 pb-24">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-4 w-4" /> Data Pribadi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Nama Lengkap</Label><Input value={form.full_name} onChange={e => update('full_name', e.target.value)} /></div>
          <div><Label>No. Telepon</Label><Input value={form.phone} onChange={e => update('phone', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Riwayat Umroh</Label><Input type="number" min={0} value={form.umrah_count} onChange={e => update('umrah_count', parseInt(e.target.value) || 0)} /></div>
            <div><Label>Riwayat Haji</Label><Input type="number" min={0} value={form.hajj_count} onChange={e => update('hajj_count', parseInt(e.target.value) || 0)} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Alamat Pengiriman Default
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Alamat Lengkap</Label><Textarea value={form.shipping_address} onChange={e => update('shipping_address', e.target.value)} placeholder="Jl. contoh No. 1, RT/RW ..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Kota</Label><Input value={form.shipping_city} onChange={e => update('shipping_city', e.target.value)} /></div>
            <div><Label>Kode Pos</Label><Input value={form.shipping_postal_code} onChange={e => update('shipping_postal_code', e.target.value)} /></div>
          </div>
          <div><Label>No. HP Penerima</Label><Input value={form.shipping_phone} onChange={e => update('shipping_phone', e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Dokumen Perjalanan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div><Label>No. Paspor</Label><Input value={form.passport_number} onChange={e => update('passport_number', e.target.value)} /></div>
          <div><Label>Masa Berlaku Paspor</Label><Input type="date" value={form.passport_expiry} onChange={e => update('passport_expiry', e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Kontak Darurat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Nama</Label><Input value={form.emergency_contact_name} onChange={e => update('emergency_contact_name', e.target.value)} /></div>
          <div><Label>No. Telepon</Label><Input value={form.emergency_contact_phone} onChange={e => update('emergency_contact_phone', e.target.value)} /></div>
        </CardContent>
      </Card>

      <Button className="w-full" size="lg" onClick={handleSave} disabled={saving}>
        <Save className="h-4 w-4 mr-2" />
        {saving ? 'Menyimpan...' : 'Simpan Profil'}
      </Button>
    </div>
  );
};

export default ProfileDetailForm;
