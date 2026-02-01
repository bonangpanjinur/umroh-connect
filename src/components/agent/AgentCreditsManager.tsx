import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Plus, History, CheckCircle2, Clock, AlertCircle, 
  ChevronRight, CreditCard, Building2, Smartphone, QrCode, 
  Upload, Loader2, ArrowLeft, Check, ExternalLink, Wallet, Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useAgentCredits, 
  usePurchaseCredits, 
  useCreditTransactions 
} from '@/hooks/useAgentCredits';
import { usePlatformSettings } from '@/hooks/useAdminData';
import { usePublicPaymentConfig } from '@/hooks/usePublicPaymentConfig';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface AgentCreditsManagerProps {
  travelId: string;
}

type PaymentCategory = 'gateway' | 'qris' | 'manual';

const creditPackages = [
  { id: 'small', credits: 100, label: '100 Kredit', popular: false },
  { id: 'medium', credits: 500, label: '500 Kredit', popular: true },
  { id: 'large', credits: 1000, label: '1000 Kredit', popular: false },
];

const creditPrices: Record<string, number> = {
  small: 50000,
  medium: 225000,
  large: 400000,
};

export const AgentCreditsManager = ({ travelId }: AgentCreditsManagerProps) => {
  const { toast } = useToast();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [modalStep, setModalStep] = useState<'package' | 'payment'>('package');
  const [selectedPackage, setSelectedPackage] = useState('medium');
  const [selectedCategory, setSelectedCategory] = useState<PaymentCategory | ''>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingGateway, setIsProcessingGateway] = useState(false);

  const { data: credits, isLoading: creditsLoading } = useAgentCredits(travelId);
  const purchaseCredits = usePurchaseCredits();
  const { data: transactions, isLoading: transactionsLoading } = useCreditTransactions(travelId);

  // Fetch automatic payment gateway config
  const { data: paymentConfig } = usePublicPaymentConfig();
  
  const qrisImageUrl = paymentConfig?.qrisImageUrl || '';
  
  const provider = paymentConfig?.provider || 'manual';
  const isGatewayEnabled = provider !== 'manual';
  const enabledPaymentMethods = paymentConfig?.paymentMethods?.filter((pm: any) => pm.enabled) || [];

  const hasQris = enabledPaymentMethods.some(pm => pm.type === 'qris');
  const hasManual = enabledPaymentMethods.some(pm => pm.type === 'bank_transfer');

  // Auto-select category
  useEffect(() => {
    if (modalStep === 'payment' && !selectedCategory) {
      if (isGatewayEnabled) setSelectedCategory('gateway');
      else if (hasQris) setSelectedCategory('qris');
      else if (hasManual) setSelectedCategory('manual');
    }
  }, [modalStep, isGatewayEnabled, hasQris, hasManual, selectedCategory]);

  useEffect(() => {
    if (selectedCategory === 'qris') {
      const qrisMethod = enabledPaymentMethods.find(pm => pm.type === 'qris');
      if (qrisMethod) setSelectedPaymentMethod(qrisMethod.id);
    } else if (selectedCategory === 'manual') {
      const manualMethod = enabledPaymentMethods.find(pm => pm.type === 'bank_transfer');
      if (manualMethod) setSelectedPaymentMethod(manualMethod.id);
    } else if (selectedCategory === 'gateway') {
      setSelectedPaymentMethod('gateway');
    }
  }, [selectedCategory, enabledPaymentMethods]);

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileName = `credits/${travelId}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

      setPaymentProofUrl(publicUrl);
      toast({ title: 'Bukti pembayaran berhasil diupload' });
    } catch (error: any) {
      toast({
        title: 'Gagal upload',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitPurchase = () => {
    if (selectedCategory === 'gateway') {
      handlePaymentGateway();
      return;
    }

    if (!paymentProofUrl) {
      toast({
        title: 'Bukti pembayaran diperlukan',
        description: 'Upload bukti pembayaran terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    const pkg = creditPackages.find(p => p.id === selectedPackage);
    if (!pkg) return;

    purchaseCredits.mutate({
      travelId,
      credits: pkg.credits,
      amount: creditPrices[selectedPackage],
      proofUrl: paymentProofUrl,
    }, {
      onSuccess: () => {
        setShowPurchaseModal(false);
        setPaymentProofUrl('');
        setModalStep('package');
      }
    });
  };

  const handlePaymentGateway = async () => {
    try {
      setIsProcessingGateway(true);
      const pkg = creditPackages.find(p => p.id === selectedPackage);
      if (!pkg) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Anda harus login");

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: creditPrices[selectedPackage],
          description: `Pembelian ${pkg.credits} Kredit Broadcast`,
          type: "agent_credits",
          metadata: {
            user_id: user.id,
            credits: pkg.credits,
            package_id: selectedPackage,
            travel_id: travelId
          }
        }
      });

      if (error) throw error;
      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else if (data?.redirect_url) {
        window.location.href = data.redirect_url;
      } else if (data?.invoice_url) {
        window.location.href = data.invoice_url;
      }
    } catch (error: any) {
      toast({
        title: "Gagal memproses pembayaran otomatis",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessingGateway(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const selectedPaymentData = enabledPaymentMethods.find((pm: any) => pm.id === selectedPaymentMethod);

  return (
    <div className="space-y-6">
      {/* Credits Status Card */}
      <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-none shadow-lg">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-amber-100 text-sm font-medium mb-1">Saldo Kredit Broadcast</p>
              <div className="flex items-center gap-2">
                <Zap className="w-8 h-8 text-amber-300 fill-amber-300" />
                <h2 className="text-4xl font-bold">{credits?.credits_remaining || 0}</h2>
              </div>
            </div>
            <Button 
              onClick={() => {
                setModalStep('package');
                setShowPurchaseModal(true);
              }}
              className="bg-white text-orange-600 hover:bg-amber-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Isi Saldo
            </Button>
          </div>
          <div className="bg-white/10 rounded-xl p-3 flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-amber-200" />
            <p className="text-amber-50">1 kredit digunakan untuk 1 pesan broadcast WA per jamaah.</p>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Modal */}
      <Dialog open={showPurchaseModal} onOpenChange={setShowPurchaseModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              {modalStep === 'package' ? 'Beli Kredit Broadcast' : 'Pilih Pembayaran'}
            </DialogTitle>
            <DialogDescription>
              {modalStep === 'package' ? 'Pilih paket kredit sesuai kebutuhan Anda' : 'Selesaikan pembayaran Anda'}
            </DialogDescription>
          </DialogHeader>

          {modalStep === 'package' && (
            <div className="space-y-4 mt-4">
              <RadioGroup value={selectedPackage} onValueChange={setSelectedPackage}>
                {creditPackages.map((pkg) => (
                  <div key={pkg.id}>
                    <RadioGroupItem value={pkg.id} id={`pkg-${pkg.id}`} className="sr-only" />
                    <Label
                      htmlFor={`pkg-${pkg.id}`}
                      className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${
                        selectedPackage === pkg.id
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'bg-secondary border-2 border-transparent hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <p className="font-semibold">{pkg.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(creditPrices[pkg.id] / pkg.credits)}/kredit
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(creditPrices[pkg.id])}</p>
                        {pkg.popular && <Badge variant="secondary" className="text-xs">Populer</Badge>}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <Button className="w-full py-6 text-base font-bold" onClick={() => setModalStep('payment')}>
                Lanjut ke Pembayaran
              </Button>
            </div>
          )}

          {modalStep === 'payment' && (
            <div className="space-y-6 mt-4">
              <button 
                onClick={() => setModalStep('package')}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </button>

              {/* Order Summary */}
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Paket {creditPackages.find(p => p.id === selectedPackage)?.label}</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(creditPrices[selectedPackage])}
                  </span>
                </div>
              </div>

              {/* Category Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Pilih Metode Pembayaran</Label>
                <div className="grid gap-2">
                  {isGatewayEnabled && (
                    <div 
                      onClick={() => setSelectedCategory('gateway')}
                      className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border-2 transition-all ${
                        selectedCategory === 'gateway' ? 'bg-primary/5 border-primary shadow-sm' : 'bg-card border-border hover:border-primary/30'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${selectedCategory === 'gateway' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">Payment Gateway</p>
                        <p className="text-[10px] text-muted-foreground">{provider === 'midtrans' ? 'Midtrans' : 'Xendit'} (Otomatis)</p>
                      </div>
                      {selectedCategory === 'gateway' && <Check className="w-4 h-4 text-primary" />}
                    </div>
                  )}

                  {hasQris && (
                    <div 
                      onClick={() => setSelectedCategory('qris')}
                      className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border-2 transition-all ${
                        selectedCategory === 'qris' ? 'bg-primary/5 border-primary shadow-sm' : 'bg-card border-border hover:border-primary/30'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${selectedCategory === 'qris' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">QRIS</p>
                        <p className="text-[10px] text-muted-foreground">Scan QR Code</p>
                      </div>
                      {selectedCategory === 'qris' && <Check className="w-4 h-4 text-primary" />}
                    </div>
                  )}

                  {hasManual && (
                    <div 
                      onClick={() => setSelectedCategory('manual')}
                      className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border-2 transition-all ${
                        selectedCategory === 'manual' ? 'bg-primary/5 border-primary shadow-sm' : 'bg-card border-border hover:border-primary/30'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${selectedCategory === 'manual' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">Transfer Manual</p>
                        <p className="text-[10px] text-muted-foreground">Transfer Bank</p>
                      </div>
                      {selectedCategory === 'manual' && <Check className="w-4 h-4 text-primary" />}
                    </div>
                  )}
                </div>
              </div>

              {/* Details and Upload */}
              {selectedCategory === 'gateway' && (
                <Button 
                  className="w-full py-6 text-base font-bold gap-2"
                  onClick={handlePaymentGateway}
                  disabled={isProcessingGateway}
                >
                  {isProcessingGateway ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wallet className="w-5 h-5" />}
                  Bayar via {provider === 'midtrans' ? 'Midtrans' : 'Xendit'}
                </Button>
              )}

              {(selectedCategory === 'qris' || selectedCategory === 'manual') && (
                <div className="space-y-4">
                  {selectedCategory === 'manual' && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Pilih Bank</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {enabledPaymentMethods.filter(pm => pm.type === 'bank_transfer').map(pm => (
                          <div 
                            key={pm.id}
                            onClick={() => setSelectedPaymentMethod(pm.id)}
                            className={`p-2 text-center rounded-lg border cursor-pointer transition-all text-xs font-medium ${
                              selectedPaymentMethod === pm.id ? 'bg-primary text-white border-primary' : 'bg-muted hover:bg-muted/80 border-transparent'
                            }`}
                          >
                            {pm.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedPaymentData && (
                    <Card className="border-primary/20">
                      <CardContent className="p-4 space-y-3">
                        {selectedCategory === 'qris' ? (
                          <div className="text-center space-y-2">
                            {qrisImageUrl && <img src={qrisImageUrl} alt="QRIS" className="w-40 h-40 mx-auto border rounded-lg" />}
                            <p className="text-xs font-medium">Scan kode QR di atas</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Bank</span><span className="font-bold">{selectedPaymentData.name}</span></div>
                            <div className="flex justify-between text-xs"><span className="text-muted-foreground">No. Rekening</span><span className="font-mono font-bold">{selectedPaymentData.accountNumber}</span></div>
                            <div className="flex justify-between text-xs"><span className="text-muted-foreground">Atas Nama</span><span className="font-medium">{selectedPaymentData.accountName}</span></div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Upload Bukti Pembayaran</Label>
                    <div className={`border-2 border-dashed rounded-xl p-6 text-center ${paymentProofUrl ? 'border-green-500 bg-green-50' : 'border-border'}`}>
                      {paymentProofUrl ? (
                        <div className="space-y-2">
                          <Check className="w-8 h-8 text-green-500 mx-auto" />
                          <p className="text-sm font-bold text-green-700">Bukti Terupload</p>
                          <Button variant="ghost" size="sm" onClick={() => setPaymentProofUrl('')}>Ganti</Button>
                        </div>
                      ) : (
                        <Label htmlFor="proof-upload-credits" className="cursor-pointer space-y-2 block">
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                          <p className="text-sm font-medium">Klik untuk upload bukti</p>
                        </Label>
                      )}
                      <input id="proof-upload-credits" type="file" accept="image/*" className="hidden" onChange={handleUploadProof} disabled={isUploading} />
                    </div>
                  </div>

                  <Button className="w-full py-6 text-base font-bold" onClick={handleSubmitPurchase} disabled={!paymentProofUrl || purchaseCredits.isPending || isUploading}>
                    {purchaseCredits.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Zap className="w-5 h-5 mr-2" />}
                    Konfirmasi Pembayaran
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
