import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, Check, Upload, Clock, Sparkles, Cloud, Smartphone, BarChart3, Download,
  Building2, QrCode, CreditCard, Loader2, ExternalLink, ArrowLeft, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useSubscriptionPlans, useCreateSubscription, useIsPremium } from '@/hooks/usePremiumSubscription';
import { usePublicPaymentConfig } from '@/hooks/usePublicPaymentConfig';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface PremiumUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginRequired?: () => void;
}

const featureIcons: Record<string, React.ReactNode> = {
  'Sync data ke cloud': <Cloud className="h-4 w-4" />,
  'Backup otomatis': <Upload className="h-4 w-4" />,
  'Akses multi-device': <Smartphone className="h-4 w-4" />,
  'Statistik lengkap': <BarChart3 className="h-4 w-4" />,
  'Export data': <Download className="h-4 w-4" />,
};

type PaymentCategory = 'gateway' | 'qris' | 'manual';

export const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
  open,
  onOpenChange,
  onLoginRequired,
}) => {
  const { user, profile } = useAuthContext();
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: paymentConfig, isLoading: paymentConfigLoading } = usePublicPaymentConfig();
  const { isPremium, subscription } = useIsPremium();
  const createSubscription = useCreateSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'info' | 'payment' | 'processing' | 'gateway'>('info');
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PaymentCategory | ''>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');

  // Fallback plan if data is missing
  const fallbackPlan = {
    id: 'premium-yearly',
    name: 'Premium Yearly',
    description: 'Akses penuh fitur cloud & statistik',
    price_yearly: 50000,
    features: ['Sync data ke cloud', 'Backup otomatis', 'Akses multi-device', 'Statistik lengkap']
  };

  const plan = (plans && plans.length > 0) ? plans[0] : fallbackPlan;
  
  // Payment config with fallback
  const provider = paymentConfig?.provider || 'manual';
  const isTestMode = paymentConfig?.isTestMode ?? true;
  const midtransClientKey = paymentConfig?.apiKey || '';
  const qrisImageUrl = paymentConfig?.qrisImageUrl || '';
  const isGatewayEnabled = provider !== 'manual';
  
  // Fallback payment methods if config is missing
  const fallbackPaymentMethods = [
    {
      id: 'manual-bca',
      name: 'BCA Transfer',
      type: 'bank_transfer',
      enabled: true,
      accountNumber: '1234567890',
      accountName: 'PT Umroh Connect Indonesia'
    },
    {
      id: 'qris-main',
      name: 'QRIS',
      type: 'qris',
      enabled: true
    }
  ];

  const enabledPaymentMethods = (paymentConfig?.paymentMethods && paymentConfig.paymentMethods.length > 0)
    ? paymentConfig.paymentMethods.filter((pm: any) => pm.enabled)
    : fallbackPaymentMethods;

  const hasQris = enabledPaymentMethods.some(pm => pm.type === 'qris');
  const hasManual = enabledPaymentMethods.some(pm => pm.type === 'bank_transfer');

  // Load Midtrans Snap script if provider is midtrans
  useEffect(() => {
    if (provider === 'midtrans' && midtransClientKey) {
      const existingScript = document.getElementById('midtrans-snap');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'midtrans-snap';
        script.src = isTestMode 
          ? 'https://app.sandbox.midtrans.com/snap/snap.js'
          : 'https://app.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', midtransClientKey);
        document.head.appendChild(script);
      }
    }
  }, [provider, isTestMode, midtransClientKey]);

  // Auto-select first category and method
  useEffect(() => {
    if (step === 'payment' && !selectedCategory) {
      if (isGatewayEnabled) setSelectedCategory('gateway');
      else if (hasQris) setSelectedCategory('qris');
      else if (hasManual) setSelectedCategory('manual');
    }
  }, [step, isGatewayEnabled, hasQris, hasManual, selectedCategory]);

  useEffect(() => {
    if (selectedCategory === 'qris') {
      const qrisMethod = enabledPaymentMethods.find(pm => pm.type === 'qris');
      if (qrisMethod) setSelectedPaymentMethod(qrisMethod.id);
    } else if (selectedCategory === 'manual') {
      const manualMethod = enabledPaymentMethods.find(pm => pm.type === 'bank_transfer');
      if (manualMethod) setSelectedPaymentMethod(manualMethod.id);
    }
  }, [selectedCategory, enabledPaymentMethods]);

  const handleLoginClick = () => {
    onOpenChange(false);
    navigate('/auth');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Handle gateway payment (Midtrans/Xendit)
  const handleGatewayPayment = async () => {
    if (!plan || !user) return;

    setIsProcessing(true);
    setStep('processing');

    try {
      const orderId = `PREMIUM-${Date.now()}-${user.id.substring(0, 8)}`;
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: plan.price_yearly,
          order_id: orderId,
          customer_name: profile?.full_name || user.email?.split('@')[0] || 'User',
          customer_email: user.email || '',
          customer_phone: profile?.phone || '',
          item_name: `Premium Tracker - ${plan.name}`,
          payment_type: 'premium_subscription'
        }
      });

      if (error) throw error;

      if (data.provider === 'midtrans' && data.token) {
        if (window.snap) {
          window.snap.pay(data.token, {
            onSuccess: async (result) => {
              await createSubscription.mutateAsync({
                planId: plan.id,
                paymentProofUrl: `midtrans:${result.order_id}`,
                paymentAmount: plan.price_yearly,
              });
              toast({ title: 'Pembayaran berhasil!', description: 'Premium aktif sekarang' });
              onOpenChange(false);
            },
            onPending: () => {
              toast({ title: 'Menunggu pembayaran', description: 'Silakan selesaikan pembayaran Anda' });
              setStep('info');
            },
            onError: () => {
              toast({ title: 'Pembayaran gagal', variant: 'destructive' });
              setStep('info');
            },
            onClose: () => setStep('info')
          });
        } else if (data.redirect_url) {
          setPaymentUrl(data.redirect_url);
          setStep('gateway');
        }
      } else if (data.provider === 'xendit' && data.invoice_url) {
        setPaymentUrl(data.invoice_url);
        setStep('gateway');
      } else {
        throw new Error('Invalid payment response');
      }
    } catch (error: any) {
      toast({
        title: 'Gagal membuat pembayaran',
        description: error.message,
        variant: 'destructive',
      });
      setStep('info');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadProof = async (file: File) => {
    if (!user || !plan) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/payment-proof-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

      setPaymentProofUrl(urlData.publicUrl);
      toast({ title: 'Bukti pembayaran berhasil diupload' });
    } catch (error: any) {
      toast({
        title: 'Gagal upload',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!paymentProofUrl || !plan) {
      toast({
        title: 'Bukti transfer diperlukan',
        description: 'Upload bukti pembayaran terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createSubscription.mutateAsync({
        planId: plan.id,
        paymentProofUrl,
        paymentAmount: plan.price_yearly,
      });
      
      setStep('info');
      setPaymentProofUrl('');
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const selectedPaymentData = enabledPaymentMethods.find((pm: any) => pm.id === selectedPaymentMethod);

  // If already premium, show status
  if (isPremium && subscription) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Status Premium
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Crown className="h-10 w-10 text-white" />
            </motion.div>
            <h3 className="text-xl font-bold text-primary mb-2">Anda Premium! 🎉</h3>
            <p className="text-muted-foreground mb-4">
              Data ibadah Anda tersimpan di cloud dan bisa diakses dari mana saja.
            </p>
            <div className="bg-muted rounded-lg p-4 text-sm">
              <p className="text-muted-foreground">Berlaku hingga:</p>
              <p className="font-semibold text-lg">
                {subscription.end_date 
                  ? new Date(subscription.end_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '-'
                }
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // If subscription pending
  if (subscription?.status === 'pending') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Menunggu Verifikasi
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-20 h-20 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"
            />
            <h3 className="text-xl font-bold mb-2">Sedang Diverifikasi</h3>
            <p className="text-muted-foreground">
              Bukti pembayaran Anda sedang dicek oleh tim kami. Mohon tunggu maksimal 1x24 jam.
            </p>
            <Button className="mt-6" variant="outline" onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {step === 'info' && 'Upgrade ke Premium'}
            {step === 'payment' && 'Pilih Pembayaran'}
            {step === 'processing' && 'Memproses...'}
            {step === 'gateway' && 'Pembayaran Online'}
          </DialogTitle>
          <DialogDescription>
            {plansLoading || paymentConfigLoading ? 'Memuat informasi...' : 'Simpan data ibadah Anda ke cloud'}
          </DialogDescription>
        </DialogHeader>

        {(plansLoading || paymentConfigLoading) && step === 'info' && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground text-sm">Mengambil penawaran terbaik...</p>
          </div>
        )}

        {/* Info Step */}
        {step === 'info' && !plansLoading && !paymentConfigLoading && (
          <div className="space-y-4">
            {/* Free vs Premium comparison */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Gratis</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  <p>✓ Semua fitur tracker</p>
                  <p>✓ Data di perangkat ini</p>
                  <p className="text-destructive">✗ Tidak tersimpan di cloud</p>
                  <p className="text-destructive">✗ Hilang jika clear data</p>
                </CardContent>
              </Card>

              <Card className="border-primary bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-1">
                    <Crown className="h-3 w-3 text-yellow-500" />
                    Premium
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <p className="text-primary">✓ Semua fitur gratis</p>
                  <p className="text-primary">✓ Sync ke cloud</p>
                  <p className="text-primary">✓ Multi-device</p>
                  <p className="text-primary">✓ Backup otomatis</p>
                </CardContent>
              </Card>
            </div>

            {/* Plan details */}
            {plan && (
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {formatPrice(plan.price_yearly)}
                      </p>
                      <p className="text-xs text-muted-foreground">/tahun</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {plan.features?.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        {featureIcons[feature] || <Check className="h-4 w-4 text-primary" />}
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CTA */}
            {!user ? (
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  onClick={handleLoginClick}
                >
                  Masuk untuk Upgrade
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Anda harus login terlebih dahulu untuk upgrade ke Premium
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Button 
                  className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80" 
                  onClick={() => setStep('payment')}
                  disabled={isProcessing}
                >
                  <Crown className="h-4 w-4" />
                  Upgrade Sekarang
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Menyiapkan halaman pembayaran...</p>
          </div>
        )}

        {/* Gateway Redirect Step */}
        {step === 'gateway' && paymentUrl && (
          <div className="space-y-4 py-4">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <ExternalLink className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Klik tombol di bawah untuk melanjutkan pembayaran
              </p>
            </div>
            
            <Button
              className="w-full"
              size="lg"
              onClick={() => window.open(paymentUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Buka Halaman Pembayaran
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setStep('info');
                setPaymentUrl('');
              }}
            >
              Kembali
            </Button>
          </div>
        )}

        {/* Unified Payment Step */}
        {step === 'payment' && plan && (
          <div className="space-y-6">
            <button 
              onClick={() => setStep('info')}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </button>

            {/* Amount */}
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Bayar</span>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(plan.price_yearly)}
                </span>
              </div>
            </div>

            {/* Category Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Pilih Metode Pembayaran</Label>
              <div className="grid gap-2">
                {/* 1. Payment Gateway */}
                {isGatewayEnabled && (
                  <div 
                    onClick={() => setSelectedCategory('gateway')}
                    className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border-2 transition-all ${
                      selectedCategory === 'gateway' 
                        ? 'bg-primary/5 border-primary shadow-sm' 
                        : 'bg-card border-border hover:border-primary/30'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${selectedCategory === 'gateway' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">Payment Gateway</p>
                      <p className="text-[10px] text-muted-foreground">
                        {provider === 'midtrans' ? 'Midtrans (VA, GoPay, CC)' : 'Xendit (VA, E-Wallet)'}
                      </p>
                    </div>
                    {selectedCategory === 'gateway' && <Check className="w-4 h-4 text-primary" />}
                  </div>
                )}

                {/* 2. QRIS */}
                {hasQris && (
                  <div 
                    onClick={() => setSelectedCategory('qris')}
                    className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border-2 transition-all ${
                      selectedCategory === 'qris' 
                        ? 'bg-primary/5 border-primary shadow-sm' 
                        : 'bg-card border-border hover:border-primary/30'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${selectedCategory === 'qris' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">QRIS</p>
                      <p className="text-[10px] text-muted-foreground">Scan pakai GoPay, OVO, Dana, dll</p>
                    </div>
                    {selectedCategory === 'qris' && <Check className="w-4 h-4 text-primary" />}
                  </div>
                )}

                {/* 3. Manual Transfer */}
                {hasManual && (
                  <div 
                    onClick={() => setSelectedCategory('manual')}
                    className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border-2 transition-all ${
                      selectedCategory === 'manual' 
                        ? 'bg-primary/5 border-primary shadow-sm' 
                        : 'bg-card border-border hover:border-primary/30'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${selectedCategory === 'manual' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">Transfer Manual</p>
                      <p className="text-[10px] text-muted-foreground">Konfirmasi manual oleh admin</p>
                    </div>
                    {selectedCategory === 'manual' && <Check className="w-4 h-4 text-primary" />}
                  </div>
                )}
              </div>
            </div>

            {/* Category Content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {selectedCategory === 'gateway' && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-xl border border-dashed text-center">
                    <p className="text-xs text-muted-foreground">
                      Pembayaran akan terverifikasi secara otomatis setelah Anda menyelesaikan transaksi.
                    </p>
                  </div>
                  <Button 
                    className="w-full py-6 text-base font-bold gap-2"
                    onClick={handleGatewayPayment}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wallet className="w-5 h-5" />}
                    Bayar via {provider === 'midtrans' ? 'Midtrans' : 'Xendit'}
                  </Button>
                </div>
              )}

              {(selectedCategory === 'qris' || selectedCategory === 'manual') && (
                <div className="space-y-4">
                  {/* Specific method selection for manual transfer */}
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

                  {/* Payment Details Card */}
                  {selectedPaymentData && (
                    <Card className="border-primary/20 overflow-hidden">
                      <div className="bg-primary/5 px-4 py-2 border-b border-primary/10">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Detail Pembayaran</p>
                      </div>
                      <CardContent className="p-4 space-y-3">
                        {selectedCategory === 'qris' ? (
                          <div className="text-center space-y-3">
                            {qrisImageUrl ? (
                              <div className="bg-white p-2 rounded-lg inline-block border shadow-sm">
                                <img src={qrisImageUrl} alt="QRIS" className="w-40 h-40 mx-auto" />
                              </div>
                            ) : (
                              <div className="w-40 h-40 mx-auto bg-muted rounded-lg flex items-center justify-center">
                                <QrCode className="w-10 h-10 text-muted-foreground opacity-20" />
                              </div>
                            )}
                            <p className="text-xs font-medium">Scan kode QR di atas</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">Bank</span>
                              <span className="text-sm font-bold">{selectedPaymentData.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">No. Rekening</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono font-bold">{selectedPaymentData.accountNumber}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedPaymentData.accountNumber || '');
                                    toast({ title: 'Berhasil disalin' });
                                  }}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">Atas Nama</span>
                              <span className="text-sm font-medium">{selectedPaymentData.accountName}</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Upload Section */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Bukti Pembayaran</Label>
                    <div 
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                        paymentProofUrl ? 'border-green-500 bg-green-50' : 'border-border hover:border-primary/30'
                      }`}
                    >
                      {paymentProofUrl ? (
                        <div className="space-y-2">
                          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                            <Check className="w-6 h-6 text-white" />
                          </div>
                          <p className="text-sm font-bold text-green-700">Bukti Berhasil Diupload</p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setPaymentProofUrl('')}
                            className="text-xs"
                          >
                            Ganti Foto
                          </Button>
                        </div>
                      ) : (
                        <Label htmlFor="proof-upload" className="cursor-pointer space-y-2 block">
                          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                            <Upload className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Klik untuk upload bukti</p>
                            <p className="text-[10px] text-muted-foreground">Format JPG, PNG (Maks 5MB)</p>
                          </div>
                        </Label>
                      )}
                      <Input
                        id="proof-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadProof(file);
                        }}
                        disabled={uploading}
                      />
                    </div>
                  </div>

                  {/* Submit Manual */}
                  <Button 
                    className="w-full py-6 text-base font-bold"
                    onClick={handleManualSubmit}
                    disabled={!paymentProofUrl || createSubscription.isPending || uploading}
                  >
                    {createSubscription.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Crown className="w-5 h-5 mr-2" />
                    )}
                    Konfirmasi Pembayaran
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Premium badge component for UI
export const PremiumBadge: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  const { isPremium } = useIsPremium();

  if (isPremium) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-full text-xs font-medium shadow-md"
      >
        <Crown className="h-3 w-3" />
        Premium
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full text-xs font-medium transition-colors"
    >
      <Sparkles className="h-3 w-3" />
      Upgrade
    </motion.button>
  );
};

// Storage indicator component
export const StorageIndicator: React.FC<{ onUpgrade?: () => void }> = ({ onUpgrade }) => {
  const { user } = useAuthContext();
  const { isPremium } = useIsPremium();

  if (isPremium) {
    return (
      <div className="flex items-center gap-2 text-xs text-primary">
        <Cloud className="h-3 w-3" />
        <span>Data tersimpan di cloud</span>
      </div>
    );
  }

  return (
    <button
      onClick={onUpgrade}
      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
    >
      <Smartphone className="h-3 w-3" />
      <span>Data hanya di perangkat ini</span>
      <span className="text-primary underline">Upgrade</span>
    </button>
  );
};
