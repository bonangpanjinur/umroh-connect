import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, Star, Clock, Calendar, Package, Plus,
  CheckCircle2, AlertCircle, XCircle, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  useAgentFeaturedPackages,
  useFeaturedPricing,
  useCreateFeaturedPackage,
  useCancelFeaturedPackage,
  FeaturedPackage,
} from '@/hooks/useFeaturedPackages';
import { useAgentPackages } from '@/hooks/useAgentData';
import { format, formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface FeaturedPackageManagerProps {
  travelId?: string;
}

const positionLabels = {
  home: { label: 'Beranda', description: 'Tampil di halaman utama', multiplier: '1.5x' },
  category: { label: 'Kategori', description: 'Tampil di filter kategori', multiplier: '1.0x' },
  search: { label: 'Pencarian', description: 'Prioritas di hasil pencarian', multiplier: '1.2x' },
};

const durationOptions = {
  daily: { label: '1 Hari', days: 1 },
  weekly: { label: '7 Hari', days: 7 },
  monthly: { label: '30 Hari', days: 30 },
};

export const FeaturedPackageManager = ({ travelId }: FeaturedPackageManagerProps) => {
  const { toast } = useToast();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<'home' | 'category' | 'search'>('home');
  const [selectedDuration, setSelectedDuration] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const { data: featuredPackages, isLoading } = useAgentFeaturedPackages(travelId);
  const { data: packages } = useAgentPackages(travelId);
  const { data: pricing } = useFeaturedPricing();
  const createFeatured = useCreateFeaturedPackage();
  const cancelFeatured = useCancelFeaturedPackage();

  // Fetch agent credits
  const { data: credits } = useQuery({
    queryKey: ['agent-credits', travelId],
    queryFn: async () => {
      if (!travelId) return null;
      const { data, error } = await supabase
        .from('package_credits')
        .select('credits_remaining')
        .eq('travel_id', travelId)
        .single();
      
      if (error) return { credits_remaining: 0 };
      return data;
    },
    enabled: !!travelId,
  });

  const calculateCredits = () => {
    if (!pricing) return 0;
    
    const baseCredits = pricing[`${selectedDuration}_credits` as keyof typeof pricing] as number;
    const multiplier = pricing.positions[selectedPosition];
    
    return Math.ceil(baseCredits * multiplier);
  };

  const handlePurchase = async () => {
    if (!selectedPackageId || !travelId) return;

    const creditsNeeded = calculateCredits();
    
    try {
      await createFeatured.mutateAsync({
        packageId: selectedPackageId,
        travelId,
        position: selectedPosition,
        duration: selectedDuration,
        creditsToUse: creditsNeeded,
      });

      toast({
        title: 'Berhasil!',
        description: 'Paket Anda sekarang tampil di posisi unggulan',
      });

      setShowPurchaseModal(false);
      setSelectedPackageId('');
    } catch (error: any) {
      toast({
        title: 'Gagal',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async (featuredId: string) => {
    try {
      await cancelFeatured.mutateAsync(featuredId);
      toast({
        title: 'Berhasil',
        description: 'Featured package dibatalkan',
      });
    } catch (error: any) {
      toast({
        title: 'Gagal',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const activeFeatures = featuredPackages?.filter(fp => 
    fp.status === 'active' && new Date(fp.end_date) > new Date()
  ) || [];

  const expiredFeatures = featuredPackages?.filter(fp => 
    fp.status !== 'active' || new Date(fp.end_date) <= new Date()
  ) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Credits Balance */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80">Saldo Kredit</p>
            <p className="text-3xl font-bold">{credits?.credits_remaining || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Add Featured Button */}
      <Button 
        className="w-full" 
        onClick={() => setShowPurchaseModal(true)}
        disabled={!packages || packages.length === 0}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Jadikan Paket Unggulan
      </Button>

      {/* Active Featured Packages */}
      {activeFeatures.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            Featured Aktif
          </h4>
          {activeFeatures.map((featured) => (
            <motion.div
              key={featured.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl border border-amber-200 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary">
                  <img
                    src={featured.package?.images?.[0] || '/placeholder.svg'}
                    alt={featured.package?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium line-clamp-1">{featured.package?.name}</h5>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
                      {positionLabels[featured.position as keyof typeof positionLabels]?.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {featured.credits_used} kredit
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Clock className="w-3 h-3" />
                    Berakhir {formatDistanceToNow(new Date(featured.end_date), { 
                      addSuffix: true, 
                      locale: localeId 
                    })}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 text-destructive border-destructive/30"
                onClick={() => handleCancel(featured.id)}
              >
                <XCircle className="w-3 h-3 mr-1" />
                Batalkan
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {activeFeatures.length === 0 && (
        <div className="bg-card rounded-2xl border-2 border-dashed border-border p-8 text-center">
          <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h4 className="font-medium mb-1">Belum Ada Paket Unggulan</h4>
          <p className="text-sm text-muted-foreground">
            Jadikan paket Anda tampil di posisi teratas untuk menarik lebih banyak jamaah
          </p>
        </div>
      )}

      {/* Expired/Cancelled */}
      {expiredFeatures.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">Riwayat</h4>
          {expiredFeatures.slice(0, 3).map((featured) => (
            <div
              key={featured.id}
              className="bg-secondary/50 rounded-lg p-3 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium line-clamp-1">{featured.package?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(featured.start_date), 'dd MMM', { locale: localeId })} - 
                  {format(new Date(featured.end_date), 'dd MMM yyyy', { locale: localeId })}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {featured.status === 'cancelled' ? 'Dibatalkan' : 'Berakhir'}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Purchase Modal */}
      <Dialog open={showPurchaseModal} onOpenChange={setShowPurchaseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Jadikan Paket Unggulan
            </DialogTitle>
            <DialogDescription>
              Paket unggulan tampil di posisi teratas dan mendapat lebih banyak perhatian
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Package Selection */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Pilih Paket</Label>
              <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih paket yang ingin ditonjolkan" />
                </SelectTrigger>
                <SelectContent>
                  {packages?.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        {pkg.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Position Selection */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Posisi Tampil</Label>
              <RadioGroup value={selectedPosition} onValueChange={(v) => setSelectedPosition(v as any)}>
                {Object.entries(positionLabels).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/50">
                    <RadioGroupItem value={key} id={key} />
                    <Label htmlFor={key} className="flex-1 cursor-pointer">
                      <span className="font-medium">{value.label}</span>
                      <span className="text-xs text-muted-foreground block">{value.description}</span>
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      {value.multiplier}
                    </Badge>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Duration Selection */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Durasi</Label>
              <RadioGroup value={selectedDuration} onValueChange={(v) => setSelectedDuration(v as any)}>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(durationOptions).map(([key, value]) => (
                    <div key={key}>
                      <RadioGroupItem value={key} id={`dur-${key}`} className="sr-only" />
                      <Label
                        htmlFor={`dur-${key}`}
                        className={`block p-3 rounded-lg text-center cursor-pointer transition-colors ${
                          selectedDuration === key
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary hover:bg-secondary/80'
                        }`}
                      >
                        <span className="font-medium block">{value.label}</span>
                        {pricing && (
                          <span className="text-xs opacity-80">
                            {key === 'daily' ? pricing.daily_credits : 
                             key === 'weekly' ? pricing.weekly_credits : 
                             pricing.monthly_credits} kredit
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Cost Summary */}
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-amber-700">Total Biaya</span>
                <span className="text-2xl font-bold text-amber-700">{calculateCredits()} Kredit</span>
              </div>
              <div className="flex items-center justify-between text-xs text-amber-600">
                <span>Saldo Anda</span>
                <span>{credits?.credits_remaining || 0} Kredit</span>
              </div>
              {(credits?.credits_remaining || 0) < calculateCredits() && (
                <div className="flex items-center gap-1 mt-2 text-xs text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  Kredit tidak mencukupi
                </div>
              )}
            </div>

            {/* Purchase Button */}
            <Button
              className="w-full"
              disabled={
                !selectedPackageId || 
                (credits?.credits_remaining || 0) < calculateCredits() ||
                createFeatured.isPending
              }
              onClick={handlePurchase}
            >
              {createFeatured.isPending ? (
                <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Aktifkan Sekarang
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
