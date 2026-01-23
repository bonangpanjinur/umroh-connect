import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { usePlatformSettings, useUpdatePlatformSetting } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import { Settings, Save, Sparkles } from 'lucide-react';

export const PlatformSettings = () => {
  const { data: settings, isLoading } = usePlatformSettings();
  const updateSetting = useUpdatePlatformSetting();
  
  const [membershipPrices, setMembershipPrices] = useState({
    basic: 500000,
    premium: 1500000,
    enterprise: 5000000
  });
  
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

  useEffect(() => {
    if (settings) {
      const membershipSetting = settings.find(s => s.key === 'membership_prices');
      const creditSetting = settings.find(s => s.key === 'credit_prices');
      const freeCreditSetting = settings.find(s => s.key === 'free_credits_on_register');
      const featuredPricingSetting = settings.find(s => s.key === 'featured_package_pricing');
      const featuredLimitsSetting = settings.find(s => s.key === 'featured_package_limits');
      
      if (membershipSetting) setMembershipPrices(membershipSetting.value as any);
      if (creditSetting) setCreditPrices(creditSetting.value as any);
      if (freeCreditSetting) setFreeCredits(freeCreditSetting.value as any);
      if (featuredPricingSetting) setFeaturedPricing(featuredPricingSetting.value as any);
      if (featuredLimitsSetting) setFeaturedLimits(featuredLimitsSetting.value as any);
    }
  }, [settings]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleSaveMembership = async () => {
    try {
      await updateSetting.mutateAsync({
        key: 'membership_prices',
        value: membershipPrices
      });
      toast.success('Harga keanggotaan berhasil disimpan');
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan');
    }
  };

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
          {/* Duration Pricing */}
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
                <p className="text-xs text-muted-foreground mt-1">
                  {featuredPricing.daily_credits} kredit/hari
                </p>
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
                <p className="text-xs text-muted-foreground mt-1">
                  ~{(featuredPricing.weekly_credits / 7).toFixed(1)} kredit/hari
                </p>
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
                <p className="text-xs text-muted-foreground mt-1">
                  ~{(featuredPricing.monthly_credits / 30).toFixed(1)} kredit/hari
                </p>
              </div>
            </div>
          </div>

          {/* Position Multipliers */}
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
                <p className="text-xs text-muted-foreground mt-1">
                  Harga = kredit × {featuredPricing.positions.home}
                </p>
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
                <p className="text-xs text-muted-foreground mt-1">
                  Harga = kredit × {featuredPricing.positions.search}
                </p>
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
                <p className="text-xs text-muted-foreground mt-1">
                  Harga = kredit × {featuredPricing.positions.category}
                </p>
              </div>
            </div>
          </div>

          {/* Example Calculation */}
          <div className="bg-amber-100 rounded-lg p-3">
            <p className="text-sm font-medium text-amber-800 mb-1">Contoh Perhitungan:</p>
            <p className="text-xs text-amber-700">
              Featured 7 hari di Beranda = {featuredPricing.weekly_credits} × {featuredPricing.positions.home} = <strong>{Math.ceil(featuredPricing.weekly_credits * featuredPricing.positions.home)} kredit</strong>
            </p>
          </div>

          <Button onClick={handleSaveFeaturedPricing} className="bg-amber-600 hover:bg-amber-700">
            <Save className="h-4 w-4 mr-2" />
            Simpan Harga Featured
          </Button>
        </CardContent>
      </Card>

      {/* Featured Package Limits */}
      <Card className="border-amber-200 bg-amber-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Limit Featured Package
          </CardTitle>
          <CardDescription>
            Atur batasan jumlah paket unggulan yang bisa aktif bersamaan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Maks per Travel</Label>
              <Input
                type="number"
                value={featuredLimits.max_per_travel}
                onChange={(e) => setFeaturedLimits({
                  ...featuredLimits,
                  max_per_travel: parseInt(e.target.value) || 0
                })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Setiap travel maksimal {featuredLimits.max_per_travel} paket featured
              </p>
            </div>
            <div>
              <Label>Maks di Beranda</Label>
              <Input
                type="number"
                value={featuredLimits.max_home_total}
                onChange={(e) => setFeaturedLimits({
                  ...featuredLimits,
                  max_home_total: parseInt(e.target.value) || 0
                })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Total {featuredLimits.max_home_total} paket di beranda
              </p>
            </div>
            <div>
              <Label>Maks di Kategori</Label>
              <Input
                type="number"
                value={featuredLimits.max_category_total}
                onChange={(e) => setFeaturedLimits({
                  ...featuredLimits,
                  max_category_total: parseInt(e.target.value) || 0
                })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Total {featuredLimits.max_category_total} paket per kategori
              </p>
            </div>
          </div>
          <Button onClick={handleSaveFeaturedLimits} className="bg-amber-600 hover:bg-amber-700">
            <Save className="h-4 w-4 mr-2" />
            Simpan Limit Featured
          </Button>
        </CardContent>
      </Card>

      {/* Membership Prices */}
      <Card>
        <CardHeader>
          <CardTitle>Harga Keanggotaan</CardTitle>
          <CardDescription>
            Atur harga bulanan untuk setiap paket keanggotaan travel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Basic (per bulan)</Label>
              <Input
                type="number"
                value={membershipPrices.basic}
                onChange={(e) => setMembershipPrices({
                  ...membershipPrices,
                  basic: parseInt(e.target.value) || 0
                })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(membershipPrices.basic)}
              </p>
            </div>
            <div>
              <Label>Premium (per bulan)</Label>
              <Input
                type="number"
                value={membershipPrices.premium}
                onChange={(e) => setMembershipPrices({
                  ...membershipPrices,
                  premium: parseInt(e.target.value) || 0
                })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(membershipPrices.premium)}
              </p>
            </div>
            <div>
              <Label>Enterprise (per bulan)</Label>
              <Input
                type="number"
                value={membershipPrices.enterprise}
                onChange={(e) => setMembershipPrices({
                  ...membershipPrices,
                  enterprise: parseInt(e.target.value) || 0
                })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(membershipPrices.enterprise)}
              </p>
            </div>
          </div>
          <Button onClick={handleSaveMembership}>
            <Save className="h-4 w-4 mr-2" />
            Simpan Harga Keanggotaan
          </Button>
        </CardContent>
      </Card>

      {/* Credit Prices */}
      <Card>
        <CardHeader>
          <CardTitle>Harga Kredit Posting</CardTitle>
          <CardDescription>
            Atur harga untuk pembelian kredit posting paket (1 kredit = 1 paket)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label>1 Kredit</Label>
              <Input
                type="number"
                value={creditPrices['1']}
                onChange={(e) => setCreditPrices({
                  ...creditPrices,
                  '1': parseInt(e.target.value) || 0
                })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(creditPrices['1'])}
              </p>
            </div>
            <div>
              <Label>5 Kredit</Label>
              <Input
                type="number"
                value={creditPrices['5']}
                onChange={(e) => setCreditPrices({
                  ...creditPrices,
                  '5': parseInt(e.target.value) || 0
                })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(creditPrices['5'])} ({formatCurrency(creditPrices['5'] / 5)}/kredit)
              </p>
            </div>
            <div>
              <Label>10 Kredit</Label>
              <Input
                type="number"
                value={creditPrices['10']}
                onChange={(e) => setCreditPrices({
                  ...creditPrices,
                  '10': parseInt(e.target.value) || 0
                })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(creditPrices['10'])} ({formatCurrency(creditPrices['10'] / 10)}/kredit)
              </p>
            </div>
            <div>
              <Label>25 Kredit</Label>
              <Input
                type="number"
                value={creditPrices['25']}
                onChange={(e) => setCreditPrices({
                  ...creditPrices,
                  '25': parseInt(e.target.value) || 0
                })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(creditPrices['25'])} ({formatCurrency(creditPrices['25'] / 25)}/kredit)
              </p>
            </div>
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
            Berikan kredit gratis saat travel baru mendaftar sebagai agent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Aktifkan Kredit Gratis</Label>
              <p className="text-sm text-muted-foreground">
                Travel baru akan mendapat kredit gratis untuk posting paket pertama
              </p>
            </div>
            <Switch
              checked={freeCredits.enabled}
              onCheckedChange={(checked) => setFreeCredits({
                ...freeCredits,
                enabled: checked
              })}
            />
          </div>
          
          {freeCredits.enabled && (
            <div className="max-w-xs">
              <Label>Jumlah Kredit Gratis</Label>
              <Input
                type="number"
                min={0}
                value={freeCredits.amount}
                onChange={(e) => setFreeCredits({
                  ...freeCredits,
                  amount: parseInt(e.target.value) || 0
                })}
              />
            </div>
          )}
          
          <Button onClick={handleSaveFreeCredits}>
            <Save className="h-4 w-4 mr-2" />
            Simpan Pengaturan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
