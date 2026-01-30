import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlatformSettings, useUpdatePlatformSetting } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Smartphone,
  Globe,
  Shield,
  Wallet,
  Banknote,
  QrCode
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'bank_transfer' | 'ewallet' | 'qris' | 'virtual_account';
  enabled: boolean;
  accountNumber?: string;
  accountName?: string;
  instructions?: string;
  icon?: string;
}

interface PaymentGatewayConfig {
  provider: 'manual' | 'midtrans' | 'xendit';
  isTestMode: boolean;
  apiKey?: string;
  serverKey?: string;
  webhookUrl?: string;
  autoVerify: boolean;
  paymentMethods: PaymentMethod[];
}

const defaultPaymentMethods: PaymentMethod[] = [
  { id: 'bca', name: 'Bank BCA', type: 'bank_transfer', enabled: true, accountNumber: '', accountName: '' },
  { id: 'mandiri', name: 'Bank Mandiri', type: 'bank_transfer', enabled: false, accountNumber: '', accountName: '' },
  { id: 'bni', name: 'Bank BNI', type: 'bank_transfer', enabled: false, accountNumber: '', accountName: '' },
  { id: 'bri', name: 'Bank BRI', type: 'bank_transfer', enabled: false, accountNumber: '', accountName: '' },
  { id: 'gopay', name: 'GoPay', type: 'ewallet', enabled: false, accountNumber: '' },
  { id: 'ovo', name: 'OVO', type: 'ewallet', enabled: false, accountNumber: '' },
  { id: 'dana', name: 'DANA', type: 'ewallet', enabled: false, accountNumber: '' },
  { id: 'shopeepay', name: 'ShopeePay', type: 'ewallet', enabled: false, accountNumber: '' },
  { id: 'qris', name: 'QRIS', type: 'qris', enabled: true },
];

export const PaymentGatewaySettings = () => {
  const { data: settings, isLoading } = usePlatformSettings();
  const updateSetting = useUpdatePlatformSetting();
  
  const [config, setConfig] = useState<PaymentGatewayConfig>({
    provider: 'manual',
    isTestMode: true,
    autoVerify: false,
    paymentMethods: defaultPaymentMethods,
  });

  const [qrisImageUrl, setQrisImageUrl] = useState('');

  useEffect(() => {
    if (settings) {
      const paymentSetting = settings.find(s => s.key === 'payment_gateway');
      const qrisSetting = settings.find(s => s.key === 'qris_image_url');
      
      if (paymentSetting) {
        setConfig(paymentSetting.value as PaymentGatewayConfig);
      }
      if (qrisSetting && typeof qrisSetting.value === 'string') {
        setQrisImageUrl(qrisSetting.value);
      } else if (qrisSetting && typeof qrisSetting.value === 'object' && (qrisSetting.value as any).url) {
        setQrisImageUrl((qrisSetting.value as any).url);
      }
    }
  }, [settings]);

  const handleSaveConfig = async () => {
    try {
      await updateSetting.mutateAsync({
        key: 'payment_gateway',
        value: config
      });
      toast.success('Pengaturan payment gateway berhasil disimpan');
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan');
    }
  };

  const handleSaveQris = async () => {
    try {
      await updateSetting.mutateAsync({
        key: 'qris_image_url',
        value: { url: qrisImageUrl }
      });
      toast.success('QRIS berhasil disimpan');
    } catch (error) {
      toast.error('Gagal menyimpan QRIS');
    }
  };

  const togglePaymentMethod = (id: string) => {
    setConfig(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.map(pm =>
        pm.id === id ? { ...pm, enabled: !pm.enabled } : pm
      )
    }));
  };

  const updatePaymentMethod = (id: string, field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.map(pm =>
        pm.id === id ? { ...pm, [field]: value } : pm
      )
    }));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'bank_transfer':
        return <Building2 className="h-4 w-4" />;
      case 'ewallet':
        return <Smartphone className="h-4 w-4" />;
      case 'qris':
        return <QrCode className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const enabledMethods = config.paymentMethods.filter(pm => pm.enabled);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Wallet className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Payment Gateway</h2>
        <Badge variant={config.provider === 'manual' ? 'secondary' : 'default'}>
          {config.provider === 'manual' ? 'Manual Transfer' : config.provider.toUpperCase()}
        </Badge>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              {config.provider !== 'manual' ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
              <span className="text-sm font-medium">
                {config.provider !== 'manual' ? 'Gateway Aktif' : 'Mode Manual'}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">{enabledMethods.length}</div>
            <p className="text-sm text-muted-foreground">Metode Aktif</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Shield className={`h-5 w-5 ${config.isTestMode ? 'text-amber-500' : 'text-green-500'}`} />
              <span className="text-sm font-medium">
                {config.isTestMode ? 'Test Mode' : 'Live Mode'}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${config.autoVerify ? 'bg-green-500' : 'bg-amber-500'}`} />
              <span className="text-sm font-medium">
                {config.autoVerify ? 'Auto Verifikasi' : 'Manual Verifikasi'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="provider" className="space-y-4">
        <TabsList>
          <TabsTrigger value="provider">Provider</TabsTrigger>
          <TabsTrigger value="bank">Transfer Bank</TabsTrigger>
          <TabsTrigger value="ewallet">E-Wallet</TabsTrigger>
          <TabsTrigger value="qris">QRIS</TabsTrigger>
        </TabsList>

        {/* Provider Settings */}
        <TabsContent value="provider">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Provider Payment Gateway
              </CardTitle>
              <CardDescription>
                Pilih provider untuk pemrosesan pembayaran otomatis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                {['manual', 'midtrans', 'xendit'].map((provider) => (
                  <div
                    key={provider}
                    onClick={() => setConfig(prev => ({ ...prev, provider: provider as any }))}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      config.provider === provider
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {provider === 'manual' ? (
                        <Banknote className="h-8 w-8 text-muted-foreground" />
                      ) : (
                        <CreditCard className="h-8 w-8 text-primary" />
                      )}
                      <div>
                        <p className="font-semibold capitalize">{provider}</p>
                        <p className="text-xs text-muted-foreground">
                          {provider === 'manual' && 'Transfer manual'}
                          {provider === 'midtrans' && 'Payment gateway Indonesia'}
                          {provider === 'xendit' && 'Multi-channel payments'}
                        </p>
                      </div>
                    </div>
                    {config.provider === provider && (
                      <CheckCircle2 className="h-5 w-5 text-primary mt-2" />
                    )}
                  </div>
                ))}
              </div>

              {config.provider !== 'manual' && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Test Mode</Label>
                      <p className="text-xs text-muted-foreground">
                        Gunakan sandbox untuk testing
                      </p>
                    </div>
                    <Switch
                      checked={config.isTestMode}
                      onCheckedChange={(v) => setConfig(prev => ({ ...prev, isTestMode: v }))}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>API Key / Client Key</Label>
                      <Input
                        type="password"
                        value={config.apiKey || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                        placeholder="Masukkan API key..."
                      />
                    </div>
                    <div>
                      <Label>Server Key / Secret Key</Label>
                      <Input
                        type="password"
                        value={config.serverKey || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, serverKey: e.target.value }))}
                        placeholder="Masukkan server key..."
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto Verifikasi</Label>
                      <p className="text-xs text-muted-foreground">
                        Otomatis verifikasi pembayaran berhasil
                      </p>
                    </div>
                    <Switch
                      checked={config.autoVerify}
                      onCheckedChange={(v) => setConfig(prev => ({ ...prev, autoVerify: v }))}
                    />
                  </div>
                </div>
              )}

              <Button onClick={handleSaveConfig}>
                <Save className="h-4 w-4 mr-2" />
                Simpan Pengaturan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Transfer Settings */}
        <TabsContent value="bank">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Transfer Bank
              </CardTitle>
              <CardDescription>
                Atur rekening bank untuk pembayaran manual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.paymentMethods
                .filter(pm => pm.type === 'bank_transfer')
                .map((method) => (
                  <div
                    key={method.id}
                    className={`p-4 rounded-xl border ${
                      method.enabled ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        <span className="font-semibold">{method.name}</span>
                      </div>
                      <Switch
                        checked={method.enabled}
                        onCheckedChange={() => togglePaymentMethod(method.id)}
                      />
                    </div>
                    {method.enabled && (
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <Label className="text-xs">Nomor Rekening</Label>
                          <Input
                            value={method.accountNumber || ''}
                            onChange={(e) => updatePaymentMethod(method.id, 'accountNumber', e.target.value)}
                            placeholder="1234567890"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Nama Pemilik</Label>
                          <Input
                            value={method.accountName || ''}
                            onChange={(e) => updatePaymentMethod(method.id, 'accountName', e.target.value)}
                            placeholder="PT Arah Umroh"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              <Button onClick={handleSaveConfig}>
                <Save className="h-4 w-4 mr-2" />
                Simpan Pengaturan Bank
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* E-Wallet Settings */}
        <TabsContent value="ewallet">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                E-Wallet
              </CardTitle>
              <CardDescription>
                Aktifkan pembayaran via e-wallet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.paymentMethods
                .filter(pm => pm.type === 'ewallet')
                .map((method) => (
                  <div
                    key={method.id}
                    className={`p-4 rounded-xl border ${
                      method.enabled ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5" />
                        <span className="font-semibold">{method.name}</span>
                      </div>
                      <Switch
                        checked={method.enabled}
                        onCheckedChange={() => togglePaymentMethod(method.id)}
                      />
                    </div>
                    {method.enabled && (
                      <div>
                        <Label className="text-xs">Nomor {method.name}</Label>
                        <Input
                          value={method.accountNumber || ''}
                          onChange={(e) => updatePaymentMethod(method.id, 'accountNumber', e.target.value)}
                          placeholder="08123456789"
                        />
                      </div>
                    )}
                  </div>
                ))}
              <Button onClick={handleSaveConfig}>
                <Save className="h-4 w-4 mr-2" />
                Simpan Pengaturan E-Wallet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* QRIS Settings */}
        <TabsContent value="qris">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QRIS
              </CardTitle>
              <CardDescription>
                Upload gambar QRIS untuk pembayaran universal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  <span className="font-semibold">QRIS</span>
                  <Badge>Universal</Badge>
                </div>
                <Switch
                  checked={config.paymentMethods.find(pm => pm.id === 'qris')?.enabled || false}
                  onCheckedChange={() => togglePaymentMethod('qris')}
                />
              </div>

              <div>
                <Label>URL Gambar QRIS</Label>
                <Input
                  value={qrisImageUrl}
                  onChange={(e) => setQrisImageUrl(e.target.value)}
                  placeholder="https://example.com/qris.png"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload gambar QRIS ke storage lalu paste URL di sini
                </p>
              </div>

              {qrisImageUrl && (
                <div className="p-4 bg-secondary rounded-xl flex justify-center">
                  <img
                    src={qrisImageUrl}
                    alt="QRIS"
                    className="max-w-[200px] rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </div>
              )}

              <Button onClick={handleSaveQris}>
                <Save className="h-4 w-4 mr-2" />
                Simpan QRIS
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
