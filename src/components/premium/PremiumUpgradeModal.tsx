import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, Check, Upload, Clock, Sparkles, Cloud, Smartphone, BarChart3, Download,
  Building2, QrCode, CreditCard, Loader2, ExternalLink
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

// Use existing Midtrans Snap type from useMidtrans.ts - no duplicate declaration needed

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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');

  const plan = plans?.[0]; // Get the first active plan
  
  // Payment config
  const provider = paymentConfig?.provider || 'manual';
  const isTestMode = paymentConfig?.isTestMode ?? true;
  const midtransClientKey = paymentConfig?.apiKey || '';
  const qrisImageUrl = paymentConfig?.qrisImageUrl || '';
  const isGatewayEnabled = provider !== 'manual';
  const enabledPaymentMethods = paymentConfig?.paymentMethods?.filter((pm: any) => pm.enabled) || [];

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

  // Auto-select first payment method
  useEffect(() => {
    if (!isGatewayEnabled && enabledPaymentMethods.length > 0 && !selectedPaymentMethod) {
      setSelectedPaymentMethod(enabledPaymentMethods[0].id);
    }
  }, [enabledPaymentMethods, selectedPaymentMethod, isGatewayEnabled]);

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
              className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Clock className="h-10 w-10 text-white" />
            </motion.div>
            <h3 className="text-xl font-bold mb-2">Pembayaran Sedang Diverifikasi</h3>
            <p className="text-muted-foreground mb-4">
              Admin akan memverifikasi pembayaran Anda dalam 1-24 jam.
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
            {step === 'info' && 'Upgrade ke Premium'}
            {step === 'payment' && 'Pembayaran'}
            {step === 'processing' && 'Memproses...'}
            {step === 'gateway' && 'Pembayaran Online'}
          </DialogTitle>
          <DialogDescription>
            Simpan data ibadah Anda ke cloud
          </DialogDescription>
        </DialogHeader>

        {/* Info Step */}
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
                {/* Gateway Payment Button */}
                {isGatewayEnabled && (
                  <Button 
                    className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80" 
                    onClick={handleGatewayPayment}
                    disabled={isProcessing}
                  >
                    <CreditCard className="h-4 w-4" />
                    Bayar via {provider === 'midtrans' ? 'Midtrans' : 'Xendit'}
                  </Button>
                )}
                
                {/* Manual Payment Button - always enabled immediately */}
                <Button 
                  className={`w-full gap-2 ${isGatewayEnabled ? '' : ''}`}
                  variant={isGatewayEnabled ? 'outline' : 'default'}
                  onClick={() => setStep('payment')}
                >
                  {isGatewayEnabled ? (
                    <>
                      <Building2 className="h-4 w-4" />
                      Transfer Manual
                    </>
                  ) : (
                    <>
                      <Crown className="h-4 w-4" />
                      Upgrade Sekarang
                    </>
                  )}
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

        {/* Manual Payment Step */}
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

            {/* Amount */}
            <div className="bg-primary/10 rounded-xl p-4 border border-primary/30">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Bayar</span>
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(plan.price_yearly)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Berlaku 1 tahun</p>
            </div>

            {/* Payment Methods */}
            {enabledPaymentMethods.length > 0 ? (
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
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>Tidak ada metode pembayaran manual yang aktif.</p>
                <p className="text-xs mt-1">Silakan hubungi admin.</p>
              </div>
            )}

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
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Upload Proof */}
            {selectedPaymentData && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Upload Bukti Transfer</Label>
                <div className="border-2 border-dashed border-primary/30 rounded-xl p-4 text-center">
                  {paymentProofUrl ? (
                    <div className="space-y-2">
                      <Check className="h-8 w-8 text-green-500 mx-auto" />
                      <p className="text-sm text-green-600">Bukti berhasil diupload</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPaymentProofUrl('')}
                      >
                        Ganti
                      </Button>
                    </div>
                  ) : (
                    <Label htmlFor="proof-upload" className="cursor-pointer block">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm">Klik untuk upload bukti transfer</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG (max 5MB)</p>
                    </Label>
                  )}
                  <Input
                    id="proof-upload"
                    type="file"
                    accept="image/*"
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
              </div>
            )}

            {uploading && (
              <div className="flex items-center justify-center gap-2 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Mengupload...</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              className="w-full"
              onClick={handleManualSubmit}
              disabled={!paymentProofUrl || createSubscription.isPending || !selectedPaymentData}
            >
              {createSubscription.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Crown className="h-4 w-4 mr-2" />
                  Ajukan Upgrade
                </>
              )}
            </Button>
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
