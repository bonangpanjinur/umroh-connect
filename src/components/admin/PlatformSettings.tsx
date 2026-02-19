import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlatformSettings, useUpdatePlatformSetting } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import { Settings, Save, Sparkles, Layout, CreditCard } from 'lucide-react';
import { MembershipConfigPanel } from './MembershipConfigPanel';

export const PlatformSettings = () => {
  const { data: settings, isLoading } = usePlatformSettings();
  const updateSetting = useUpdatePlatformSetting();
  
  
  const [creditPrices, setCreditPrices] = useState({
    '1': 50000,
    '5': 200000,
    '10': 350000,
    '25': 750000
  });
  
  const [freeCredits, setFreeCredits] = useState({
    enabled: true,
    amount: 3
  });

  const [featuredPricing, setFeaturedPricing] = useState({
    daily_credits: 5,
    weekly_credits: 25,
    monthly_credits: 80,
    positions: {
      home: 1.5,
      category: 1.0,
      search: 1.2
    }
  });

  const [featuredLimits, setFeaturedLimits] = useState({
    max_per_travel: 3,
    max_home_total: 6,
    max_category_total: 10
  });

  const [whitelabelSettings, setWhitelabelSettings] = useState({
    site_name: 'Arah Umroh',
    site_description: 'Platform Koneksi Umroh Terpercaya',
    logo_url: '',
    favicon_url: '',
    primary_color: '#8B5CF6',
    contact_email: '',
    contact_phone: '',
    whatsapp_number: '',
    footer_text: '© 2024 Arah Umroh. All rights reserved.'
  });

  useEffect(() => {
    if (settings) {
      const creditSetting = settings.find(s => s.key === 'credit_prices');
      const freeCreditSetting = settings.find(s => s.key === 'free_credits_on_register');
      const featuredPricingSetting = settings.find(s => s.key === 'featured_package_pricing');
      const featuredLimitsSetting = settings.find(s => s.key === 'featured_package_limits');
      const whitelabelSetting = settings.find(s => s.key === 'whitelabel_settings');
      
      if (creditSetting) setCreditPrices(creditSetting.value as any);
      if (freeCreditSetting) setFreeCredits(freeCreditSetting.value as any);
      if (featuredPricingSetting) setFeaturedPricing(featuredPricingSetting.value as any);
      if (featuredLimitsSetting) setFeaturedLimits(featuredLimitsSetting.value as any);
      if (whitelabelSetting) setWhitelabelSettings(whitelabelSetting.value as any);
    }
  }, [settings]);

  const handleSaveCredits = async () => {
    try {
      await updateSetting.mutateAsync({
        key: 'credit_prices',
        value: creditPrices
      });
      toast.success('Harga kredit berhasil disimpan');
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan');
    }
  };

  const handleSaveFreeCredits = async () => {
    try {
      await updateSetting.mutateAsync({
        key: 'free_credits_on_register',
        value: freeCredits
      });
      toast.success('Pengaturan kredit gratis berhasil disimpan');
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan');
    }
  };

  const handleSaveFeaturedPricing = async () => {
    try {
      await updateSetting.mutateAsync({
        key: 'featured_package_pricing',
        value: featuredPricing
      });
      toast.success('Harga featured package berhasil disimpan');
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan');
    }
  };

  const handleSaveFeaturedLimits = async () => {
    try {
      await updateSetting.mutateAsync({
        key: 'featured_package_limits',
        value: featuredLimits
      });
      toast.success('Limit featured package berhasil disimpan');
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan');
    }
  };

  const handleSaveWhitelabel = async () => {
    try {
      await updateSetting.mutateAsync({
        key: 'whitelabel_settings',
        value: whitelabelSettings
      });
      toast.success('Pengaturan whitelabel berhasil disimpan');
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan');
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
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Pengaturan Platform</h2>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Umum & Harga
          </TabsTrigger>
          <TabsTrigger value="featured" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Featured
          </TabsTrigger>
          <TabsTrigger value="whitelabel" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Whitelabel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {/* Full Membership Config Panel */}
          <MembershipConfigPanel />

          {/* Credit Prices */}
          <Card>
            <CardHeader>
              <CardTitle>Harga Kredit</CardTitle>
              <CardDescription>
                Atur harga pembelian paket kredit untuk agen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                {Object.entries(creditPrices).map(([amount, price]) => (
                  <div key={amount} className="space-y-2">
                    <Label>{amount} Kredit</Label>
                    <Input 
                      type="number" 
                      value={price} 
                      onChange={(e) => setCreditPrices({
                        ...creditPrices, 
                        [amount]: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                ))}
              </div>
              <Button onClick={handleSaveCredits}>
                <Save className="h-4 w-4 mr-2" />
                Simpan Harga Kredit
              </Button>
            </CardContent>
          </Card>

          {/* Free Credits */}
          <Card>
            <CardHeader>
              <CardTitle>Kredit Gratis Pendaftaran</CardTitle>
              <CardDescription>
                Berikan kredit gratis untuk pengguna baru yang mendaftar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="free-credits-enabled" 
                  checked={freeCredits.enabled}
                  onCheckedChange={(checked) => setFreeCredits({...freeCredits, enabled: checked})}
                />
                <Label htmlFor="free-credits-enabled">Aktifkan Kredit Gratis</Label>
              </div>
              {freeCredits.enabled && (
                <div className="max-w-[200px] space-y-2">
                  <Label>Jumlah Kredit</Label>
                  <Input 
                    type="number" 
                    value={freeCredits.amount} 
                    onChange={(e) => setFreeCredits({...freeCredits, amount: parseInt(e.target.value) || 0})}
                  />
                </div>
              )}
              <Button onClick={handleSaveFreeCredits}>
                <Save className="h-4 w-4 mr-2" />
                Simpan Pengaturan Kredit
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="featured" className="space-y-6">
          {/* Featured Package Pricing */}
          <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Harga Featured Package
              </CardTitle>
              <CardDescription>
                Atur harga kredit untuk fitur paket unggulan berdasarkan durasi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium mb-3 block">Harga Berdasarkan Durasi (dalam kredit)</Label>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">1 Hari</Label>
                    <Input
                      type="number"
                      value={featuredPricing.daily_credits}
                      onChange={(e) => setFeaturedPricing({
                        ...featuredPricing,
                        daily_credits: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">7 Hari</Label>
                    <Input
                      type="number"
                      value={featuredPricing.weekly_credits}
                      onChange={(e) => setFeaturedPricing({
                        ...featuredPricing,
                        weekly_credits: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">30 Hari</Label>
                    <Input
                      type="number"
                      value={featuredPricing.monthly_credits}
                      onChange={(e) => setFeaturedPricing({
                        ...featuredPricing,
                        monthly_credits: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">Multiplier Berdasarkan Posisi</Label>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Beranda (Home)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={featuredPricing.positions.home}
                      onChange={(e) => setFeaturedPricing({
                        ...featuredPricing,
                        positions: {
                          ...featuredPricing.positions,
                          home: parseFloat(e.target.value) || 1
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Pencarian (Search)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={featuredPricing.positions.search}
                      onChange={(e) => setFeaturedPricing({
                        ...featuredPricing,
                        positions: {
                          ...featuredPricing.positions,
                          search: parseFloat(e.target.value) || 1
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Kategori</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={featuredPricing.positions.category}
                      onChange={(e) => setFeaturedPricing({
                        ...featuredPricing,
                        positions: {
                          ...featuredPricing.positions,
                          category: parseFloat(e.target.value) || 1
                        }
                      })}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveFeaturedPricing} className="bg-amber-600 hover:bg-amber-700">
                <Save className="h-4 w-4 mr-2" />
                Simpan Harga Featured
              </Button>
            </CardContent>
          </Card>

          {/* Featured Package Limits */}
          <Card>
            <CardHeader>
              <CardTitle>Limit Featured Package</CardTitle>
              <CardDescription>
                Atur batas maksimal paket unggulan yang dapat ditampilkan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Max per Travel</Label>
                  <Input
                    type="number"
                    value={featuredLimits.max_per_travel}
                    onChange={(e) => setFeaturedLimits({
                      ...featuredLimits,
                      max_per_travel: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Beranda</Label>
                  <Input
                    type="number"
                    value={featuredLimits.max_home_total}
                    onChange={(e) => setFeaturedLimits({
                      ...featuredLimits,
                      max_home_total: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Kategori</Label>
                  <Input
                    type="number"
                    value={featuredLimits.max_category_total}
                    onChange={(e) => setFeaturedLimits({
                      ...featuredLimits,
                      max_category_total: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
              </div>
              <Button onClick={handleSaveFeaturedLimits}>
                <Save className="h-4 w-4 mr-2" />
                Simpan Limit Featured
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whitelabel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5 text-primary" />
                Identitas Platform
              </CardTitle>
              <CardDescription>
                Atur nama, deskripsi, dan logo platform Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nama Situs</Label>
                  <Input 
                    value={whitelabelSettings.site_name} 
                    onChange={(e) => setWhitelabelSettings({...whitelabelSettings, site_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Warna Utama (Primary Color)</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      className="w-12 p-1 h-10"
                      value={whitelabelSettings.primary_color} 
                      onChange={(e) => setWhitelabelSettings({...whitelabelSettings, primary_color: e.target.value})}
                    />
                    <Input 
                      value={whitelabelSettings.primary_color} 
                      onChange={(e) => setWhitelabelSettings({...whitelabelSettings, primary_color: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Deskripsi Situs</Label>
                <Input 
                  value={whitelabelSettings.site_description} 
                  onChange={(e) => setWhitelabelSettings({...whitelabelSettings, site_description: e.target.value})}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>URL Logo</Label>
                  <Input 
                    value={whitelabelSettings.logo_url} 
                    onChange={(e) => setWhitelabelSettings({...whitelabelSettings, logo_url: e.target.value})}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL Favicon</Label>
                  <Input 
                    value={whitelabelSettings.favicon_url} 
                    onChange={(e) => setWhitelabelSettings({...whitelabelSettings, favicon_url: e.target.value})}
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informasi Kontak & Footer</CardTitle>
              <CardDescription>
                Atur informasi kontak yang akan ditampilkan di platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Email Kontak</Label>
                  <Input 
                    type="email"
                    value={whitelabelSettings.contact_email} 
                    onChange={(e) => setWhitelabelSettings({...whitelabelSettings, contact_email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telepon</Label>
                  <Input 
                    value={whitelabelSettings.contact_phone} 
                    onChange={(e) => setWhitelabelSettings({...whitelabelSettings, contact_phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp Number</Label>
                  <Input 
                    value={whitelabelSettings.whatsapp_number} 
                    onChange={(e) => setWhitelabelSettings({...whitelabelSettings, whatsapp_number: e.target.value})}
                    placeholder="628123456789"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Teks Footer</Label>
                <Input 
                  value={whitelabelSettings.footer_text} 
                  onChange={(e) => setWhitelabelSettings({...whitelabelSettings, footer_text: e.target.value})}
                />
              </div>
              <Button onClick={handleSaveWhitelabel}>
                <Save className="h-4 w-4 mr-2" />
                Simpan Pengaturan Whitelabel
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
