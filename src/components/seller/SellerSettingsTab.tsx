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
import { ImageUpload } from '@/components/common/ImageUpload';

interface SellerSettingsTabProps {
  sellerProfile: {
    id: string;
    shop_name: string;
    description?: string | null;
    shop_description?: string | null;
    phone?: string | null;
    city?: string | null;
    whatsapp?: string | null;
    logo_url?: string | null;
    banner_url?: string | null;
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
  const [description, setDescription] = useState(sellerProfile.shop_description || sellerProfile.description || '');
  const [phone, setPhone] = useState(sellerProfile.phone || '');
  const [city, setCity] = useState(sellerProfile.city || '');
  const [whatsapp, setWhatsapp] = useState(sellerProfile.whatsapp || '');
  const [logoUrl, setLogoUrl] = useState(sellerProfile.logo_url || '');
  const [bannerUrl, setBannerUrl] = useState(sellerProfile.banner_url || '');

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
        shop_description: description.trim() || null,
        phone: phone.trim() || null,
        city: city.trim() || null,
        whatsapp: whatsapp.trim() || null,
        logo_url: logoUrl || null,
        banner_url: bannerUrl || null,
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
    <div className="space-y-4">
      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branding Toko</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Logo Toko</Label>
            <p className="text-xs text-muted-foreground mb-2">Ukuran ideal: 200x200 piksel</p>
            <ImageUpload
              bucket="shop-images"
              folder="logos"
              currentUrl={logoUrl || null}
              onUpload={(url) => setLogoUrl(url)}
              onRemove={() => setLogoUrl('')}
              aspectRatio="square"
            />
          </div>
          <div>
            <Label>Banner Toko</Label>
            <p className="text-xs text-muted-foreground mb-2">Ukuran ideal: 800x300 piksel</p>
            <ImageUpload
              bucket="shop-images"
              folder="banners"
              currentUrl={bannerUrl || null}
              onUpload={(url) => setBannerUrl(url)}
              onRemove={() => setBannerUrl('')}
              aspectRatio="landscape"
            />
          </div>
        </CardContent>
      </Card>

      {/* Profile */}
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
            <Label>Deskripsi Toko</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tentang toko Anda..." rows={3} />
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
          <div>
            <Label>WhatsApp</Label>
            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="628xxxx (format internasional)" />
            <p className="text-xs text-muted-foreground mt-1">Gunakan format 628xxx agar bisa dihubungi langsung</p>
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
    </div>
  );
};

export default SellerSettingsTab;
