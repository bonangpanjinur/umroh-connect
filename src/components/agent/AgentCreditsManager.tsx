// Path: src/components/agent/AgentCreditsManager.tsx

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, Plus, History, CreditCard, Building2, 
  Smartphone, QrCode, Upload, CheckCircle2, 
  ArrowUpCircle, ArrowDownCircle, Gift,
  ShoppingCart, Sparkles, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client'; // Menggunakan path integrasi Anda
import { useToast } from '@/hooks/use-toast';
import { usePlatformSettings } from '@/hooks/useAdminData';
import { usePublicPaymentConfig } from "@/hooks/usePublicPaymentConfig";
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useMidtrans } from '@/hooks/useMidtrans'; // Import Hook Midtrans

interface AgentCreditsManagerProps {
  travelId?: string;
}

const creditPackages = [
  { id: '1', credits: 1, label: '1 Kredit', popular: false },
  { id: '5', credits: 5, label: '5 Kredit', popular: false },
  { id: '10', credits: 10, label: '10 Kredit', popular: true },
  { id: '25', credits: 25, label: '25 Kredit', popular: false },
];

export const AgentCreditsManager = ({ travelId: propTravelId }: AgentCreditsManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { pay, isSnapLoaded } = useMidtrans(); // Inisialisasi Midtrans Snap

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState('10');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingGateway, setIsProcessingGateway] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    }
  });

  const travelId = propTravelId || user?.id || '';

  // Fetch agent credits
  const { data: credits, isLoading: creditsLoading } = useQuery({
    queryKey: ['agent-credits', travelId],
    queryFn: async () => {
      if (!travelId) return { credits_remaining: 0, credits_used: 0 };
      const { data, error } = await supabase
        .from('package_credits')
        .select('*')
        .eq('travel_id', travelId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data || { credits_remaining: 0, credits_used: 0 };
    },
    enabled: !!travelId
  });

  // Fetch credit transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['agent-credit-transactions', travelId],
    queryFn: async () => {
      if (!travelId) return [];
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('travel_id', travelId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!travelId
  });

  const { data: platformSettings } = usePlatformSettings();
  
  const creditPrices = platformSettings?.find(s => s.key === 'credit_prices')?.value as Record<string, number> || {
    '1': 50000,
    '5': 200000,
    '10': 350000,
    '25': 750000
  };

  const paymentGateway = platformSettings?.find(s => s.key === 'payment_gateway')?.value as any;
  const qrisSetting = platformSettings?.find(s => s.key === 'qris_image_url')?.value as any;
  const qrisImageUrl = typeof qrisSetting === 'string' ? qrisSetting : qrisSetting?.url || '';

  const enabledManualMethods = paymentGateway?.paymentMethods?.filter((pm: any) => pm.enabled) || [];
<<<<<<< HEAD
  const { config: paymentConfig } = usePublicPaymentConfig();
=======

  // Fetch automatic payment gateway config
  const { data: paymentConfig, isLoading: paymentConfigLoading } = usePublicPaymentConfig();
>>>>>>> c03e74dcf29ff6a74d7565440da3a16b53d9b0c6

  // Purchase credits mutation (Manual)
  const purchaseCredits = useMutation({
    mutationFn: async (params: { credits: number; price: number; proofUrl: string }) => {
      const { error: txError } = await supabase
        .from('credit_transactions')
        .insert({
          travel_id: travelId,
          transaction_type: 'purchase',
          amount: params.credits,
          price: params.price,
          notes: `Pembelian ${params.credits} kredit - menunggu verifikasi`
        });

      if (txError) throw txError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-credit-transactions', travelId] });
      toast({
        title: 'Pembelian Diajukan! 🎉',
        description: 'Mohon tunggu verifikasi dari admin (1-24 jam)',
      });
      setShowPurchaseModal(false);
      setPaymentProofUrl('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileName = `${travelId}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
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

  const handlePurchase = () => {
    if (selectedPaymentMethod === 'gateway') {
      handlePaymentGateway();
      return;
    }

    if (!paymentProofUrl) {
      toast({
        title: 'Bukti transfer diperlukan',
        description: 'Upload bukti pembayaran terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    const pkg = creditPackages.find(p => p.id === selectedPackage);
    if (!pkg) return;

    purchaseCredits.mutate({
      credits: pkg.credits,
      price: creditPrices[selectedPackage],
      proofUrl: paymentProofUrl,
    });
  };

  // --- LOGIKA BARU: Midtrans Snap ---
  const handlePaymentGateway = async () => {
    try {
      setIsProcessingGateway(true);
      const pkg = creditPackages.find(p => p.id === selectedPackage);
      if (!pkg) return;
      
      const price = creditPrices[selectedPackage];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Anda harus login");

      // 1. Panggil Edge Function untuk dapatkan Token Snap
      const { data, error } = await supabase.functions.invoke('create-midtrans-token', {
        body: {
          amount: price,
          transactionType: 'credit_topup',
          itemDetails: [{
            id: `CREDIT-${pkg.id}`,
            price: price, // Total harga
            quantity: pkg.credits, // Jumlah kredit
            name: `${pkg.label} Agent`
          }]
        }
      });

      if (error || !data?.token) {
        throw new Error(error?.message || "Gagal inisialisasi pembayaran");
      }

      // 2. Munculkan Pop-up Snap
      pay(data.token, {
        onSuccess: (result) => {
          toast({
            title: "Pembayaran Berhasil!",
            description: "Saldo kredit sedang diproses otomatis.",
          });
          setShowPurchaseModal(false);
          // Refresh data setelah jeda singkat
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['agent-credits', travelId] });
            queryClient.invalidateQueries({ queryKey: ['agent-credit-transactions', travelId] });
          }, 2000);
        },
        onPending: (result) => {
          toast({
            title: "Menunggu Pembayaran",
            description: "Silakan selesaikan pembayaran Anda di pop-up / tab baru.",
          });
          // Bisa tutup modal atau biarkan terbuka
        },
        onError: (result) => {
          toast({
            title: "Pembayaran Gagal",
            description: "Silakan coba lagi.",
            variant: "destructive"
          });
        },
        onClose: () => {
          console.log("Customer closed the popup");
        }
      });

    } catch (error: any) {
      console.error(error);
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
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase': return <ArrowUpCircle className="h-4 w-4 text-green-500" />;
      case 'usage': return <ArrowDownCircle className="h-4 w-4 text-red-500" />;
      case 'bonus': return <Gift className="h-4 w-4 text-purple-500" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const selectedPaymentData = enabledManualMethods.find((pm: any) => pm.id === selectedPaymentMethod);

  return (
    <div className="space-y-4">
      {/* Credits Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-2xl p-5 text-white"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-white/80">Saldo Kredit</p>
            <p className="text-4xl font-bold">{credits?.credits_remaining || 0}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <Zap className="w-7 h-7" />
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-white/80">
          <div className="flex items-center gap-1">
            <ArrowDownCircle className="w-4 h-4" />
            <span>{credits?.credits_used || 0} digunakan</span>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => setShowPurchaseModal(true)}
          className="h-auto py-4 flex flex-col items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-sm">Beli Kredit</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => { /* Scroll to history logic if needed */ }}
        >
          <History className="w-5 h-5" />
          <span className="text-sm">Riwayat</span>
        </Button>
      </div>

      {/* Credit Packages Preview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Paket Kredit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {creditPackages.map((pkg) => (
              <div
                key={pkg.id}
                className={`p-3 rounded-xl text-center border ${
                  pkg.popular ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <p className="text-lg font-bold">{pkg.credits}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(creditPrices[pkg.id])}
                </p>
                {pkg.popular && (
                  <Badge className="mt-1 text-[10px]" variant="default">
                    Populer
                  </Badge>
                )}
              </div>
            ))}
          </div>
          <Button
            className="w-full mt-3"
            onClick={() => setShowPurchaseModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Beli Kredit
          </Button>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4" />
            Riwayat Transaksi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : transactions?.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada transaksi</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {transactions?.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                >
                  {getTransactionIcon(tx.transaction_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize">
                      {tx.transaction_type === 'purchase' && 'Pembelian Kredit'}
                      {tx.transaction_type === 'usage' && 'Penggunaan Kredit'}
                      {tx.transaction_type === 'bonus' && 'Kredit Bonus'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(tx.created_at), 'dd MMM yyyy HH:mm', { locale: localeId })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </p>
                    {tx.price && (
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(tx.price)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase Modal */}
      <Dialog open={showPurchaseModal} onOpenChange={setShowPurchaseModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Beli Kredit
            </DialogTitle>
            <DialogDescription>
              Pilih paket kredit dan metode pembayaran
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="package" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="package">1. Pilih Paket</TabsTrigger>
              <TabsTrigger value="payment">2. Bayar</TabsTrigger>
            </TabsList>

            <TabsContent value="package" className="space-y-4">
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
            </TabsContent>

            <TabsContent value="payment" className="space-y-4">
              {/* Payment Methods */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Metode Pembayaran</Label>
                <RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                  <div className="grid gap-2">
                    
<<<<<<< HEAD
                    {/* Automatic Gateway Option (Midtrans Snap) */}
                    {paymentConfig?.is_enabled && (
=======
                    {/* Automatic Gateway Option */}
                    {paymentConfig && paymentConfig.provider !== 'manual' && (
>>>>>>> c03e74dcf29ff6a74d7565440da3a16b53d9b0c6
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
<<<<<<< HEAD
                            <span className="font-medium block">Bayar Otomatis (Instan)</span>
                            <span className="text-xs text-muted-foreground">QRIS, VA, E-Wallet (Midtrans)</span>
=======
                            <span className="font-medium block">Bayar via {paymentConfig?.provider === 'midtrans' ? 'Midtrans' : 'Xendit'}</span>
                            <span className="text-xs text-muted-foreground">QRIS, VA, E-Wallet - Verifikasi Otomatis</span>
>>>>>>> c03e74dcf29ff6a74d7565440da3a16b53d9b0c6
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
                  <p>Pop-up pembayaran aman akan muncul. Kredit ditambahkan otomatis setelah pembayaran sukses.</p>
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
                        alt="QRIS"
                        className="max-w-[180px] mx-auto rounded-lg"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Amount to Pay */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-amber-700">Total Bayar</span>
                  <span className="text-2xl font-bold text-amber-700">
                    {formatCurrency(creditPrices[selectedPackage])}
                  </span>
                </div>
              </div>

              {/* Upload Proof */}
              {selectedPaymentMethod !== 'gateway' && selectedPaymentMethod && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Upload Bukti Transfer</Label>
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadProof}
                      className="hidden"
                      id="proof-upload"
                      disabled={isUploading}
                    />
                    <Label
                      htmlFor="proof-upload"
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
              )}

              {/* Purchase Button */}
              <Button
                className="w-full"
                onClick={handlePurchase}
                disabled={
                  (selectedPaymentMethod === 'gateway' 
                    ? (isProcessingGateway || !isSnapLoaded) 
                    : (!paymentProofUrl || purchaseCredits.isPending)) || !selectedPaymentMethod
                }
              >
                {selectedPaymentMethod === 'gateway' ? (
                  isProcessingGateway ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses Payment...
                    </>
                  ) : !isSnapLoaded ? (
                    'Memuat Gateway...'
                  ) : (
                    'Bayar Sekarang'
                  )
                ) : (
                  purchaseCredits.isPending ? (
                    <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )
                )}
                {selectedPaymentMethod === 'gateway' && !isProcessingGateway && isSnapLoaded ? 'Bayar Sekarang' : 
                 purchaseCredits.isPending ? 'Memproses...' : 
                 selectedPaymentMethod !== 'gateway' ? 'Konfirmasi Pembayaran' : ''}
              </Button>

              {selectedPaymentMethod !== 'gateway' && (
                <p className="text-xs text-center text-muted-foreground">
                  Kredit akan ditambahkan setelah pembayaran diverifikasi (1-24 jam)
                </p>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};