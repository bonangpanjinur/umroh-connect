import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Check, Upload, Clock, X, Sparkles, Cloud, Smartphone, BarChart3, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSubscriptionPlans, useCreateSubscription, useIsPremium } from '@/hooks/usePremiumSubscription';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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

export const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
  open,
  onOpenChange,
  onLoginRequired,
}) => {
  const { user } = useAuthContext();
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { isPremium, subscription } = useIsPremium();
  const createSubscription = useCreateSubscription();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'info' | 'payment' | 'upload'>('info');
  const [uploading, setUploading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof plans extends (infer T)[] ? T : never>();

  const plan = plans?.[0]; // Get the first active plan

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleUploadProof = async (file: File) => {
    if (!user || !plan) return;

    setUploading(true);
    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/payment-proof-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

      // Create subscription request
      await createSubscription.mutateAsync({
        planId: plan.id,
        paymentProofUrl: urlData.publicUrl,
        paymentAmount: plan.price_yearly,
      });

      setStep('info');
      onOpenChange(false);
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
              className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Clock className="h-10 w-10 text-white" />
            </motion.div>
            <h3 className="text-xl font-bold mb-2">Pembayaran Sedang Diverifikasi</h3>
            <p className="text-muted-foreground mb-4">
              Admin akan memverifikasi pembayaran Anda dalam 1-24 jam. 
              Anda akan mendapat notifikasi setelah diverifikasi.
            </p>
            <p className="text-sm text-muted-foreground">
              Tanggal pembayaran: {subscription.payment_date 
                ? new Date(subscription.payment_date).toLocaleDateString('id-ID')
                : '-'
              }
            </p>
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
            Upgrade ke Premium
          </DialogTitle>
          <DialogDescription>
            Simpan data ibadah Anda ke cloud
          </DialogDescription>
        </DialogHeader>

        {step === 'info' && (
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
                  onClick={() => {
                    onOpenChange(false);
                    onLoginRequired?.();
                  }}
                >
                  Masuk untuk Upgrade
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Anda harus login terlebih dahulu untuk upgrade ke Premium
                </p>
              </div>
            ) : (
              <Button 
                className="w-full gap-2" 
                onClick={() => setStep('payment')}
                disabled={plansLoading}
              >
                <Crown className="h-4 w-4" />
                Upgrade Sekarang
              </Button>
            )}
          </div>
        )}

        {step === 'payment' && plan && (
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setStep('info')}
              className="mb-2"
            >
              ← Kembali
            </Button>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Transfer ke Rekening</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">Bank BCA</p>
                  <p className="text-xl font-mono font-bold">1234567890</p>
                  <p className="text-sm">a.n. PT Arah Umroh Indonesia</p>
                </div>

                <div className="bg-primary/10 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">Total Pembayaran</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(plan.price_yearly)}
                  </p>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Setelah transfer, upload bukti pembayaran untuk verifikasi
                </p>
              </CardContent>
            </Card>

            <Button 
              className="w-full gap-2" 
              onClick={() => setStep('upload')}
            >
              <Upload className="h-4 w-4" />
              Upload Bukti Transfer
            </Button>
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setStep('payment')}
              className="mb-2"
            >
              ← Kembali
            </Button>

            <div className="text-center">
              <Label htmlFor="proof-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-primary/50 rounded-lg p-8 hover:bg-primary/5 transition-colors">
                  <Upload className="h-12 w-12 text-primary mx-auto mb-3" />
                  <p className="font-medium">Klik untuk upload bukti transfer</p>
                  <p className="text-sm text-muted-foreground">JPG, PNG, atau PDF (max 5MB)</p>
                </div>
              </Label>
              <Input
                id="proof-upload"
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      toast({
                        title: 'File terlalu besar',
                        description: 'Maksimal 5MB',
                        variant: 'destructive',
                      });
                      return;
                    }
                    handleUploadProof(file);
                  }
                }}
                disabled={uploading}
              />
            </div>

            {uploading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Mengupload...</p>
              </div>
            )}
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
