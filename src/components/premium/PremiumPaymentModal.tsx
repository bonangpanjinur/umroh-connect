import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Crown, Building2, Smartphone, QrCode, Upload,
  CheckCircle2, Star, Zap, Shield, Cloud,
  Clock, Check, ExternalLink, Loader2, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCreateSubscription, useSubscriptionPlans } from '@/hooks/usePremiumSubscription';
import { usePublicPaymentConfig } from '@/hooks/usePublicPaymentConfig';
import { useAuthContext } from '@/contexts/AuthContext';

interface PremiumPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const premiumFeatures = [
  { icon: Cloud, label: 'Sinkronisasi Cloud', description: 'Data habit tersimpan permanen' },
  { icon: Zap, label: 'Unlimited Habits', description: 'Tambah habit tanpa batas' },
  { icon: Star, label: 'Statistik Lengkap', description: 'Analitik progres detail' },
  { icon: Shield, label: 'Backup Otomatis', description: 'Data aman tersimpan' },
];

// Declare Midtrans Snap type
declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: {
        onSuccess?: (result: any) => void;
        onPending?: (result: any) => void;
        onError?: (result: any) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

export const PremiumPaymentModal = ({ open, onOpenChange }: PremiumPaymentModalProps) => {
  const { toast } = useToast();
  const { user, profile } = useAuthContext();
  const [step, setStep] = useState<'info' | 'payment' | 'processing' | 'gateway'>('info');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');

  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: paymentConfig, isLoading: paymentConfigLoading } = usePublicPaymentConfig();
  const createSubscription = useCreateSubscription();

  const activePlan = plans?.[0];
  const provider = paymentConfig?.provider || 'manual';
  const isTestMode = paymentConfig?.isTestMode ?? true;
  const midtransClientKey = paymentConfig?.apiKey || '';
  const qrisImageUrl = paymentConfig?.qrisImageUrl || '';

  const isGatewayEnabled = provider !== 'manual';
  const enabledPaymentMethods = paymentConfig?.paymentMethods?.filter((pm: any) => pm.enabled) || [];

  // Load Midtrans Snap script if provider is midtrans
  useEffect(() => {
    if (provider === 'midtrans') {
      const existingScript = document.getElementById('midtrans-snap');
      if (!existingScript) {
        if (!midtransClientKey) return;
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

  // Auto-select first payment method if none selected (for manual mode)
  useEffect(() => {
    if (!isGatewayEnabled && enabledPaymentMethods.length > 0 && !selectedPaymentMethod) {
      setSelectedPaymentMethod(enabledPaymentMethods[0].id);
    }
  }, [enabledPaymentMethods, selectedPaymentMethod, isGatewayEnabled]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileName = `premium/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

      setPaymentProofUrl(publicUrl);
      toast({ title: 'Bukti transfer berhasil diupload' });
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

  // Handle gateway payment (Midtrans/Xendit)
  const handleGatewayPayment = async () => {
    if (!activePlan || !user) return;

    setIsProcessing(true);
    setStep('processing');

    try {
      const orderId = `PREMIUM-${Date.now()}-${user.id.substring(0, 8)}`;
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: activePlan.price_yearly,
          order_id: orderId,
          customer_name: profile?.full_name || user.email?.split('@')[0] || 'User',
          customer_email: user.email || '',
          customer_phone: profile?.phone || '',
          item_name: `Premium Tracker - ${activePlan.name}`,
          payment_type: 'premium_subscription'
        }
      });

      if (error) throw error;

      console.log('Payment response:', data);

      if (data.provider === 'midtrans' && data.token) {
        // Use Midtrans Snap popup
        if (window.snap) {
          window.snap.pay(data.token, {
            onSuccess: async (result) => {
              console.log('Payment success:', result);
              // Create subscription with auto-verified status
              await createSubscription.mutateAsync({
                planId: activePlan.id,
                paymentProofUrl: `midtrans:${result.order_id}`,
                paymentAmount: activePlan.price_yearly,
              });
              toast({ title: 'Pembayaran berhasil!', description: 'Premium aktif sekarang' });
              onOpenChange(false);
            },
            onPending: (result) => {
              console.log('Payment pending:', result);
              toast({ title: 'Menunggu pembayaran', description: 'Silakan selesaikan pembayaran Anda' });
              setStep('info');
            },
            onError: (result) => {
              console.error('Payment error:', result);
              toast({ title: 'Pembayaran gagal', variant: 'destructive' });
              setStep('info');
            },
            onClose: () => {
              setStep('info');
            }
          });
        } else {
          // Fallback to redirect URL
          if (data.redirect_url) {
            setPaymentUrl(data.redirect_url);
            setStep('gateway');
          }
        }
      } else if (data.provider === 'xendit' && data.invoice_url) {
        // Redirect to Xendit invoice
        setPaymentUrl(data.invoice_url);
        setStep('gateway');
      } else {
        throw new Error('Invalid payment response');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
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

  // Handle manual payment submission
  const handleManualSubmit = async () => {
    if (!paymentProofUrl || !activePlan) {
      toast({
        title: 'Bukti transfer diperlukan',
        description: 'Upload bukti pembayaran terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createSubscription.mutateAsync({
        planId: activePlan.id,
        paymentProofUrl,
        paymentAmount: activePlan.price_yearly,
      });
      
      onOpenChange(false);
      setStep('info');
      setPaymentProofUrl('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const selectedPaymentData = enabledPaymentMethods.find((pm: any) => pm.id === selectedPaymentMethod);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            {step === 'info' && 'Upgrade ke Premium'}
            {step === 'payment' && 'Pembayaran Manual'}
            {step === 'processing' && 'Memproses...'}
            {step === 'gateway' && 'Pembayaran Online'}
          </DialogTitle>
          <DialogDescription>
            {step === 'info' && 'Nikmati fitur lengkap untuk tracking ibadah Anda'}
            {step === 'payment' && 'Transfer manual dan upload bukti pembayaran'}
            {step === 'processing' && 'Sedang menyiapkan pembayaran...'}
            {step === 'gateway' && 'Lanjutkan pembayaran di halaman berikut'}
          </DialogDescription>
        </DialogHeader>

        {/* Info Step */}
        {step === 'info' && (
          <div className="space-y-4">
            {/* Premium Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 rounded-2xl p-5 text-white"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{activePlan?.name || 'Premium'}</h3>
                  <p className="text-sm text-white/80">Akses Selamanya</p>
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">
                  {formatCurrency(activePlan?.price_yearly || 99000)}
                </span>
                <span className="text-white/80">/tahun</span>
              </div>
            </motion.div>

            {/* Features */}
            <div className="space-y-3">
              {premiumFeatures.map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{feature.label}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                  <Check className="w-5 h-5 text-green-500 ml-auto" />
                </motion.div>
              ))}
            </div>

            {/* Payment Buttons */}
            <div className="space-y-2">
              {isGatewayEnabled && (
                <Button
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  size="lg"
                  onClick={handleGatewayPayment}
                  disabled={isProcessing || paymentConfigLoading}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Bayar via {provider === 'midtrans' ? 'Midtrans' : 'Xendit'}
                </Button>
              )}
              
              {!isGatewayEnabled ? (
                <Button
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  size="lg"
                  onClick={() => setStep('payment')}
                  disabled={paymentConfigLoading}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Lanjut ke Pembayaran
                </Button>
              ) : enabledPaymentMethods.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep('payment')}
                  disabled={paymentConfigLoading}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Transfer Manual
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-amber-500" />
            <p className="text-muted-foreground">Menyiapkan halaman pembayaran...</p>
          </div>
        )}

        {/* Gateway Redirect Step */}
        {step === 'gateway' && paymentUrl && (
          <div className="space-y-4 py-4">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center">
                <ExternalLink className="w-8 h-8 text-amber-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                Klik tombol di bawah untuk melanjutkan pembayaran
              </p>
            </div>
            
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500"
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

            <p className="text-xs text-center text-muted-foreground">
              Setelah pembayaran berhasil, status akan diperbarui otomatis
            </p>
          </div>
        )}

        {/* Manual Payment Step */}
        {step === 'payment' && (
          <div className="space-y-4">
            {/* Amount */}
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-700 dark:text-amber-300">Total Bayar</span>
                <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  {formatCurrency(activePlan?.price_yearly || 99000)}
                </span>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Berlaku 1 tahun</p>
            </div>

            {/* Payment Methods */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Pilih Metode Pembayaran</Label>
              <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <div className="grid gap-2">
                  {enabledPaymentMethods.map((method: any) => (
                    <div key={method.id}>
                      <RadioGroupItem value={method.id} id={`pm-${method.id}`} className="sr-only" />
                      <Label
                        htmlFor={`pm-${method.id}`}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                          selectedPaymentMethod === method.id
                            ? 'bg-primary/10 border-2 border-primary'
                            : 'bg-secondary border-2 border-transparent hover:border-primary/30'
                        }`}
                      >
                        {method.type === 'bank_transfer' && <Building2 className="w-5 h-5" />}
                        {method.type === 'ewallet' && <Smartphone className="w-5 h-5" />}
                        {method.type === 'qris' && <QrCode className="w-5 h-5" />}
                        <span className="font-medium">{method.name}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Payment Details */}
            {selectedPaymentData && (
              <div className="bg-secondary rounded-xl p-4">
                {selectedPaymentData.type === 'bank_transfer' && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{selectedPaymentData.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">No. Rekening:</span>
                      <span className="font-mono font-bold">{selectedPaymentData.accountNumber || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Atas Nama:</span>
                      <span className="font-medium">{selectedPaymentData.accountName || '-'}</span>
                    </div>
                  </div>
                )}
                {selectedPaymentData.type === 'ewallet' && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{selectedPaymentData.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Nomor:</span>
                      <span className="font-mono font-bold">{selectedPaymentData.accountNumber || '-'}</span>
                    </div>
                  </div>
                )}
                {selectedPaymentData.type === 'qris' && qrisImageUrl && (
                  <div className="text-center">
                    <p className="text-sm font-medium mb-3">Scan QRIS</p>
                    <img
                      src={qrisImageUrl}
                      alt="QRIS"
                      className="max-w-[180px] mx-auto rounded-lg"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Upload Proof */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Upload Bukti Transfer</Label>
              <div className="relative">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadProof}
                  className="hidden"
                  id="premium-proof-upload"
                  disabled={isUploading}
                />
                <Label
                  htmlFor="premium-proof-upload"
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                    paymentProofUrl ? 'border-green-500 bg-green-50 dark:bg-green-950/30' : 'border-border hover:border-primary'
                  }`}
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : paymentProofUrl ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="text-green-700 dark:text-green-300">Bukti terupload</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="text-muted-foreground">Klik untuk upload</span>
                    </>
                  )}
                </Label>
              </div>
              {paymentProofUrl && (
                <img
                  src={paymentProofUrl}
                  alt="Bukti"
                  className="mt-2 rounded-lg max-h-32 object-cover"
                />
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('info')}
                className="flex-1"
              >
                Kembali
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500"
                onClick={handleManualSubmit}
                disabled={!paymentProofUrl || createSubscription.isPending}
              >
                {createSubscription.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Konfirmasi
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs text-center text-muted-foreground justify-center">
              <Clock className="w-3 h-3" />
              <span>Verifikasi dalam 1-24 jam</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};