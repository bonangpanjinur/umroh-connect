import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Crown, CheckCircle2, Clock, AlertCircle, Upload,
  Sparkles, Shield, Star, Building2, Smartphone, QrCode, CreditCard, Loader2, ArrowLeft, Check, ExternalLink, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useAgentMembership,
  useIsAgentPro,
  useRequestMembership,
  MEMBERSHIP_PLANS,
  getMembershipDaysRemaining,
} from '@/hooks/useAgentMembership';
import { usePlatformSettings } from '@/hooks/useAdminData';
import { usePublicPaymentConfig } from '@/hooks/usePublicPaymentConfig';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface AgentMembershipCardProps {
  travelId: string;
}

type PaymentCategory = 'gateway' | 'qris' | 'manual';

export const AgentMembershipCard = ({ travelId }: AgentMembershipCardProps) => {
  const { toast } = useToast();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [modalStep, setModalStep] = useState<'plan' | 'payment'>('plan');
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [selectedCategory, setSelectedCategory] = useState<PaymentCategory | ''>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingGateway, setIsProcessingGateway] = useState(false);

  const { data: membership, isLoading } = useAgentMembership(travelId);
  const { planType, isPro, isPremium, isActive } = useIsAgentPro(travelId);
  const requestMembership = useRequestMembership();

  // Fetch platform settings for manual payment methods
  const { data: platformSettings } = usePlatformSettings();
  const paymentGateway = platformSettings?.find(s => s.key === 'payment_gateway')?.value as any;
  const qrisSetting = platformSettings?.find(s => s.key === 'qris_image_url')?.value as any;
  const qrisImageUrl = typeof qrisSetting === 'string' ? qrisSetting : qrisSetting?.url || '';
  
  // Fetch automatic payment gateway config
  const { data: paymentConfig } = usePublicPaymentConfig();
  
  const provider = paymentConfig?.provider || 'manual';
  const isGatewayEnabled = provider !== 'manual';
  const enabledPaymentMethods = paymentConfig?.paymentMethods?.filter((pm: any) => pm.enabled) || [];

  const hasQris = enabledPaymentMethods.some(pm => pm.type === 'qris');
  const hasManual = enabledPaymentMethods.some(pm => pm.type === 'bank_transfer');

  const currentPlan = MEMBERSHIP_PLANS.find(p => p.id === planType) || MEMBERSHIP_PLANS[0];
  const daysRemaining = getMembershipDaysRemaining(membership?.end_date || null);

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
      const fileName = `membership/${travelId}/${Date.now()}_${file.name}`;
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

  const handleSubmitUpgrade = () => {
    // If using Gateway
    if (selectedCategory === 'gateway') {
      handlePaymentGateway();
      return;
    }

    // If using Manual Transfer
    if (!paymentProofUrl) {
      toast({
        title: 'Bukti pembayaran diperlukan',
        description: 'Upload bukti pembayaran terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    const plan = MEMBERSHIP_PLANS.find(p => p.id === selectedPlan);
    if (!plan) return;

    requestMembership.mutate({
      travelId,
      planType: selectedPlan,
      amount: plan.price,
      paymentProofUrl,
    }, {
      onSuccess: () => {
        setShowUpgradeModal(false);
        setPaymentProofUrl('');
        setModalStep('plan');
      }
    });
  };

  const handlePaymentGateway = async () => {
    try {
      setIsProcessingGateway(true);
      const plan = MEMBERSHIP_PLANS.find(p => p.id === selectedPlan);
      if (!plan) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Anda harus login");

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: plan.price,
          description: `Upgrade Membership Agen ${plan.name}`,
          type: "agent_membership",
          metadata: {
            user_id: user.id,
            plan: selectedPlan,
            travel_id: travelId
          }
        }
      });

      if (error) throw error;
      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
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

  const getStatusBadge = () => {
    if (!membership) return null;

    switch (membership.status) {
      case 'active':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Aktif
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-amber-500 text-white">
            <Clock className="w-3 h-3 mr-1" />
            Menunggu Verifikasi
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Ditolak
          </Badge>
        );
      default:
        return null;
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'premium':
        return <Crown className="w-5 h-5 text-amber-500" />;
      case 'pro':
        return <Sparkles className="w-5 h-5 text-blue-500" />;
      default:
        return <Shield className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const selectedPaymentData = enabledPaymentMethods.find((pm: any) => pm.id === selectedPaymentMethod);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Membership Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className={`relative overflow-hidden ${
          isPremium ? 'border-amber-500 border-2' : 
          isPro ? 'border-blue-500 border-2' : ''
        }`}>
          {/* Background gradient for paid plans */}
          {(isPro || isPremium) && (
            <div className={`absolute inset-0 ${
              isPremium 
                ? 'bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent' 
                : 'bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent'
            }`} />
          )}

          <CardHeader className="pb-2 relative">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                {getPlanIcon(planType)}
                Status Keanggotaan
              </CardTitle>
              {getStatusBadge()}
            </div>
          </CardHeader>

          <CardContent className="relative space-y-4">
            {/* Current Plan Info */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-lg">{currentPlan.name}</p>
                  {currentPlan.badge && (
                    <Badge variant="outline" className={`
                      ${isPremium ? 'border-amber-500 text-amber-600' : 'border-blue-500 text-blue-600'}
                    `}>
                      {currentPlan.badge}
                    </Badge>
                  )}
                </div>
                {isActive && membership?.end_date && (
                  <p className="text-sm text-muted-foreground">
                    Berlaku sampai {format(new Date(membership.end_date), 'dd MMM yyyy', { locale: localeId })}
                    <span className="ml-1 font-medium">
                      ({daysRemaining} hari lagi)
                    </span>
                  </p>
                )}
                {membership?.status === 'pending' && (
                  <p className="text-sm text-amber-600">
                    Menunggu verifikasi admin...
                  </p>
                )}
                {!membership && (
                  <p className="text-sm text-muted-foreground">
                    Upgrade untuk fitur lebih lengkap
                  </p>
                )}
              </div>
              {getPlanIcon(planType)}
            </div>

            {/* Features List */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Fitur yang Anda dapatkan:</p>
              <ul className="space-y-1">
                {currentPlan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Button */}
            <Button 
              className="w-full" 
              variant={isPremium ? "outline" : "default"}
              onClick={() => {
                setModalStep('plan');
                setShowUpgradeModal(true);
              }}
            >
              {isPremium ? 'Perpanjang Membership' : 'Upgrade Sekarang'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              {modalStep === 'plan' ? 'Upgrade Keanggotaan' : 'Pilih Pembayaran'}
            </DialogTitle>
            <DialogDescription>
              {modalStep === 'plan' ? 'Pilih paket keanggotaan Anda' : 'Selesaikan pembayaran Anda'}
            </DialogDescription>
          </DialogHeader>

          {modalStep === 'plan' && (
            <div className="space-y-4 mt-4">
              <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
                {MEMBERSHIP_PLANS.filter(p => p.id !== 'free').map((plan) => (
                  <div key={plan.id}>
                    <RadioGroupItem value={plan.id} id={`plan-${plan.id}`} className="sr-only" />
                    <Label
                      htmlFor={`plan-${plan.id}`}
                      className={`block p-4 rounded-xl cursor-pointer transition-all ${
                        selectedPlan === plan.id
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'bg-secondary border-2 border-transparent hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getPlanIcon(plan.id)}
                          <span className="font-bold">{plan.name}</span>
                          {plan.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {plan.badge}
                            </Badge>
                          )}
                        </div>
                        <span className="font-bold text-lg">
                          {formatCurrency(plan.price)}
                          <span className="text-xs font-normal text-muted-foreground">/bulan</span>
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {plan.features.slice(0, 4).map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
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
                onClick={() => setModalStep('plan')}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </button>

              {/* Order Summary */}
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Paket {MEMBERSHIP_PLANS.find(p => p.id === selectedPlan)?.name}</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(MEMBERSHIP_PLANS.find(p => p.id === selectedPlan)?.price || 0)}
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
                        <Label htmlFor="proof-upload-agent" className="cursor-pointer space-y-2 block">
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                          <p className="text-sm font-medium">Klik untuk upload bukti</p>
                        </Label>
                      )}
                      <input id="proof-upload-agent" type="file" accept="image/*" className="hidden" onChange={handleUploadProof} disabled={isUploading} />
                    </div>
                  </div>

                  <Button className="w-full py-6 text-base font-bold" onClick={handleSubmitUpgrade} disabled={!paymentProofUrl || requestMembership.isPending || isUploading}>
                    {requestMembership.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Crown className="w-5 h-5 mr-2" />}
                    Konfirmasi Pembayaran
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
