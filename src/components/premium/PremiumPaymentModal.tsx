import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Crown, Building2, Smartphone, QrCode, Upload,
  CheckCircle2, Star, Zap, Shield, Cloud,
  Clock, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { usePlatformSettings } from '@/hooks/useAdminData';

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

export const PremiumPaymentModal = ({ open, onOpenChange }: PremiumPaymentModalProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<'info' | 'payment'>('info');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: platformSettings, isLoading: settingsLoading } = usePlatformSettings();
  const createSubscription = useCreateSubscription();

  const activePlan = plans?.[0];
  const paymentGateway = platformSettings?.find(s => s.key === 'payment_gateway')?.value as any;
  const qrisSetting = platformSettings?.find(s => s.key === 'qris_image_url')?.value as any;
  const qrisImageUrl = typeof qrisSetting === 'string' ? qrisSetting : qrisSetting?.url || '';

  const enabledPaymentMethods = paymentGateway?.paymentMethods?.filter((pm: any) => pm.enabled) || [];
  
  // Auto-select first payment method if none selected
  useEffect(() => {
    if (enabledPaymentMethods.length > 0 && !selectedPaymentMethod) {
      setSelectedPaymentMethod(enabledPaymentMethods[0].id);
    }
  }, [enabledPaymentMethods, selectedPaymentMethod]);

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

  const handleSubmit = async () => {
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
            {step === 'info' ? 'Upgrade ke Premium' : 'Pembayaran'}
          </DialogTitle>
          <DialogDescription>
            {step === 'info' 
              ? 'Nikmati fitur lengkap untuk tracking ibadah Anda'
              : 'Selesaikan pembayaran untuk mengaktifkan Premium'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'info' ? (
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

            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              size="lg"
              onClick={() => setStep('payment')}
            >
              <Crown className="w-4 h-4 mr-2" />
              Lanjut ke Pembayaran
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Amount */}
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-700">Total Bayar</span>
                <span className="text-2xl font-bold text-amber-700">
                  {formatCurrency(activePlan?.price_yearly || 99000)}
                </span>
              </div>
              <p className="text-xs text-amber-600 mt-1">Berlaku 1 tahun</p>
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
                    paymentProofUrl ? 'border-green-500 bg-green-50' : 'border-border hover:border-primary'
                  }`}
                >
                  {isUploading ? (
                    <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                  ) : paymentProofUrl ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="text-green-700">Bukti terupload</span>
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
                onClick={handleSubmit}
                disabled={!paymentProofUrl || createSubscription.isPending}
              >
                {createSubscription.isPending ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
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
