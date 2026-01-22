import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { usePlatformSettings, useUpdatePlatformSetting } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import { Settings, Save } from 'lucide-react';

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

  useEffect(() => {
    if (settings) {
      const membershipSetting = settings.find(s => s.key === 'membership_prices');
      const creditSetting = settings.find(s => s.key === 'credit_prices');
      const freeCreditSetting = settings.find(s => s.key === 'free_credits_on_register');
      
      if (membershipSetting) setMembershipPrices(membershipSetting.value as any);
      if (creditSetting) setCreditPrices(creditSetting.value as any);
      if (freeCreditSetting) setFreeCredits(freeCreditSetting.value as any);
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
