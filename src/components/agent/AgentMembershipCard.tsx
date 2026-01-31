import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Crown, CheckCircle2, Clock, AlertCircle, Upload,
  Sparkles, Shield, Star, Building2, Smartphone, QrCode, CreditCard, Loader2
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
import { usePublicPaymentConfig } from '@/hooks/usePublicPaymentConfig'; // New Hook
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface AgentMembershipCardProps {
  travelId: string;
}

export const AgentMembershipCard = ({ travelId }: AgentMembershipCardProps) => {
  const { toast } = useToast();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('pro');
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
  const enabledManualMethods = paymentGateway?.paymentMethods?.filter((pm: any) => pm.enabled) || [];

  // Fetch automatic payment gateway config
  const { config: paymentConfig } = usePublicPaymentConfig();

  const currentPlan = MEMBERSHIP_PLANS.find(p => p.id === planType) || MEMBERSHIP_PLANS[0];
  const daysRemaining = getMembershipDaysRemaining(membership?.end_date || null);

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
    if (selectedPaymentMethod === 'gateway') {
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

  const selectedPaymentData = enabledManualMethods.find((pm: any) => pm.id === selectedPaymentMethod);

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
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Upgrade Button */}
            {planType !== 'premium' && membership?.status !== 'pending' && (
              <Button 
                className="w-full"
                onClick={() => setShowUpgradeModal(true)}
              >
                <Crown className="w-4 h-4 mr-2" />
                {planType === 'free' ? 'Upgrade Sekarang' : 'Upgrade ke Premium'}
              </Button>
            )}

            {/* Pending Warning */}
            {membership?.status === 'pending' && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Pengajuan {membership.plan_type.toUpperCase()} sedang diproses. 
                  Kami akan memberitahu Anda setelah diverifikasi.
                </p>
              </div>
            )}

            {/* Rejected Warning */}
            {membership?.status === 'rejected' && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">
                  Pengajuan sebelumnya ditolak. 
                  {membership.notes && <span className="block mt-1">Alasan: {membership.notes}</span>}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setShowUpgradeModal(true)}
                >
                  Ajukan Kembali
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Upgrade Keanggotaan
            </DialogTitle>
            <DialogDescription>
              Pilih paket dan lakukan pembayaran
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="plan" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="plan">1. Pilih Paket</TabsTrigger>
              <TabsTrigger value="payment">2. Bayar</TabsTrigger>
            </TabsList>

            <TabsContent value="plan" className="space-y-4">
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
                        {plan.features.length > 4 && (
                          <li className="text-xs text-muted-foreground">
                            +{plan.features.length - 4} fitur lainnya
                          </li>
                        )}
                      </ul>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </TabsContent>

            <TabsContent value="payment" className="space-y-4">
              {/* Order Summary */}
              <div className="bg-secondary rounded-xl p-4">
                <p className="text-sm font-medium mb-2">Ringkasan Pesanan</p>
                <div className="flex items-center justify-between">
                  <span>Paket {MEMBERSHIP_PLANS.find(p => p.id === selectedPlan)?.name} (1 bulan)</span>
                  <span className="font-bold">
                    {formatCurrency(MEMBERSHIP_PLANS.find(p => p.id === selectedPlan)?.price || 0)}
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Metode Pembayaran</Label>
                <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                  <div className="grid gap-2">
                    
                    {/* Automatic Gateway Option */}
                    {paymentConfig?.is_enabled && (
                      <div>
                        <RadioGroupItem value="gateway" id="pay-gateway" className="sr-only" />
                        <Label
                          htmlFor="pay-gateway"
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                            selectedPaymentMethod === 'gateway'
                              ? 'bg-primary/10 border-2 border-primary'
                              : 'bg-secondary border-2 border-transparent hover:border-primary/30'
                          }`}
                        >
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-medium block">Bayar Otomatis (Instan)</span>
                            <span className="text-xs text-muted-foreground">QRIS, VA, E-Wallet (Midtrans/Xendit)</span>
                          </div>
                        </Label>
                      </div>
                    )}

                    {/* Manual Methods */}
                    {enabledManualMethods.map((method: any) => (
                      <div key={method.id}>
                        <RadioGroupItem value={method.id} id={`pay-${method.id}`} className="sr-only" />
                        <Label
                          htmlFor={`pay-${method.id}`}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                            selectedPaymentMethod === method.id
                              ? 'bg-primary/10 border-2 border-primary'
                              : 'bg-secondary border-2 border-transparent hover:border-primary/30'
                          }`}
                        >
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                            {method.type === 'bank_transfer' && <Building2 className="w-5 h-5" />}
                            {method.type === 'ewallet' && <Smartphone className="w-5 h-5" />}
                            {method.type === 'qris' && <QrCode className="w-5 h-5" />}
                          </div>
                          <div>
                            <span className="font-medium block">{method.name}</span>
                            <span className="text-xs text-muted-foreground">Transfer Manual & Upload Bukti</span>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Automatic Payment Info */}
              {selectedPaymentMethod === 'gateway' && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm text-blue-700 dark:text-blue-300">
                  <p>Anda akan diarahkan ke halaman pembayaran aman. Status keanggotaan akan aktif otomatis setelah pembayaran berhasil.</p>
                </div>
              )}

              {/* Manual Payment Details */}
              {selectedPaymentMethod !== 'gateway' && selectedPaymentData && (
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
                        alt="QRIS Code"
                        className="w-48 h-48 mx-auto object-contain border rounded-lg"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Manual Upload Proof */}
              {selectedPaymentMethod !== 'gateway' && selectedPaymentMethod && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Upload Bukti Pembayaran</Label>
                  <div className="border-2 border-dashed border-border rounded-xl p-4 text-center">
                    {paymentProofUrl ? (
                      <div className="space-y-2">
                        <img
                          src={paymentProofUrl}
                          alt="Bukti Pembayaran"
                          className="max-h-32 mx-auto rounded-lg object-contain"
                        />
                        <p className="text-xs text-green-600 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Bukti berhasil diupload
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPaymentProofUrl('')}
                        >
                          Ganti Bukti
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleUploadProof}
                          disabled={isUploading}
                        />
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            {isUploading ? 'Mengupload...' : 'Klik untuk upload bukti pembayaran'}
                          </p>
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                className="w-full"
                disabled={
                  (selectedPaymentMethod === 'gateway' ? isProcessingGateway : (!paymentProofUrl || requestMembership.isPending)) || !selectedPaymentMethod
                }
                onClick={handleSubmitUpgrade}
              >
                {selectedPaymentMethod === 'gateway' ? (
                  isProcessingGateway ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses Payment...
                    </>
                  ) : 'Lanjut ke Pembayaran'
                ) : (
                  requestMembership.isPending ? 'Memproses...' : 'Kirim Pengajuan Manual'
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};