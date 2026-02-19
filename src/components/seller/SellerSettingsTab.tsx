import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface SellerSettingsTabProps {
  sellerProfile: {
    id: string;
    shop_name: string;
    description?: string | null;
    phone?: string | null;
    city?: string | null;
    is_verified: boolean;
    user_id: string;
  };
  currentPlanName: string;
}

const SellerSettingsTab = ({ sellerProfile, currentPlanName }: SellerSettingsTabProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [shopName, setShopName] = useState(sellerProfile.shop_name);
  const [description, setDescription] = useState(sellerProfile.description || '');
  const [phone, setPhone] = useState(sellerProfile.phone || '');
  const [city, setCity] = useState(sellerProfile.city || '');

  const handleSave = async () => {
    if (!shopName.trim()) {
      toast({ title: 'Nama toko wajib diisi', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('seller_profiles')
      .update({
        shop_name: shopName.trim(),
        description: description.trim() || null,
        phone: phone.trim() || null,
        city: city.trim() || null,
      })
      .eq('id', sellerProfile.id);

    setSaving(false);
    if (error) {
      toast({ title: 'Gagal menyimpan', description: error.message, variant: 'destructive' });
    } else {
      queryClient.invalidateQueries({ queryKey: ['seller-profile'] });
      toast({ title: 'Profil toko berhasil diperbarui ✅' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profil Toko</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Nama Toko</Label>
          <Input value={shopName} onChange={(e) => setShopName(e.target.value)} />
        </div>
        <div>
          <Label>Deskripsi</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tentang toko Anda..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Telepon</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxx" />
          </div>
          <div>
            <Label>Kota</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Jakarta" />
          </div>
        </div>
        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <span className="text-muted-foreground">Membership</span>
          <Badge>{currentPlanName}</Badge>
        </div>
        <Button className="w-full" onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SellerSettingsTab;
