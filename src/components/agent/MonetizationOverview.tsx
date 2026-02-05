import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Crown, Zap, Sparkles, TrendingUp, DollarSign, Users, Package,
  ArrowRight, CheckCircle2, AlertCircle, Info, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface MonetizationFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  plan: 'free' | 'pro' | 'premium';
  benefit: string;
  priceImpact: string;
}

const monetizationFeatures: MonetizationFeature[] = [
  {
    id: 'featured-package',
    name: 'Featured Package',
    description: 'Tampilkan paket Anda di halaman utama untuk visibilitas maksimal',
    icon: <Sparkles className="w-6 h-6" />,
    plan: 'pro',
    benefit: 'Tingkatkan konversi hingga 3x lipat',
    priceImpact: 'Rp 50.000 per paket per bulan',
  },
  {
    id: 'premium-badge',
    name: 'Premium Badge',
    description: 'Dapatkan badge premium di profil untuk kepercayaan pelanggan',
    icon: <Crown className="w-6 h-6" />,
    plan: 'pro',
    benefit: 'Meningkatkan kredibilitas dan kepercayaan',
    priceImpact: 'Rp 100.000 per bulan',
  },
  {
    id: 'advanced-analytics',
    name: 'Advanced Analytics',
    description: 'Akses laporan mendalam tentang performa paket dan pelanggan',
    icon: <TrendingUp className="w-6 h-6" />,
    plan: 'pro',
    benefit: 'Buat keputusan bisnis berdasarkan data',
    priceImpact: 'Included dalam Pro Plan',
  },
  {
    id: 'priority-support',
    name: 'Priority Support',
    description: 'Dapatkan dukungan pelanggan prioritas 24/7',
    icon: <Users className="w-6 h-6" />,
    plan: 'premium',
    benefit: 'Respon cepat dan solusi prioritas',
    priceImpact: 'Included dalam Premium Plan',
  },
  {
    id: 'custom-website',
    name: 'Custom Website',
    description: 'Buat website bisnis Anda sendiri tanpa coding',
    icon: <Package className="w-6 h-6" />,
    plan: 'premium',
    benefit: 'Tingkatkan brand awareness dan penjualan',
    priceImpact: 'Included dalam Premium Plan',
  },
  {
    id: 'unlimited-credits',
    name: 'Unlimited Credits',
    description: 'Akses unlimited untuk semua fitur premium',
    icon: <Zap className="w-6 h-6" />,
    plan: 'premium',
    benefit: 'Tidak perlu khawatir tentang batasan',
    priceImpact: 'Included dalam Premium Plan',
  },
];

const revenuePaths = [
  {
    title: 'Komisi Booking',
    description: 'Dapatkan komisi dari setiap booking yang berhasil',
    amount: '5-10%',
    example: 'Paket Rp 10 juta = Komisi Rp 500rb - 1juta',
    icon: <DollarSign className="w-8 h-8" />,
  },
  {
    title: 'Featured Package',
    description: 'Promosikan paket unggulan Anda',
    amount: 'Rp 50rb/bulan',
    example: 'Tingkatkan visibility hingga 300%',
    icon: <Sparkles className="w-8 h-8" />,
  },
  {
    title: 'Premium Membership',
    description: 'Upgrade untuk akses fitur eksklusif',
    amount: 'Rp 100rb/bulan',
    example: 'Akses analytics, website builder, dan support prioritas',
    icon: <Crown className="w-8 h-8" />,
  },
  {
    title: 'Credit System',
    description: 'Beli kredit untuk fitur premium',
    amount: 'Rp 50rb - 400rb',
    example: 'Gunakan untuk featured package atau promosi',
    icon: <Zap className="w-8 h-8" />,
  },
];

const membershipPlans = [
  {
    name: 'Free',
    price: 'Gratis',
    period: 'Selamanya',
    features: [
      'Buat hingga 3 paket',
      'Chat dengan pelanggan',
      'Basic analytics',
      'Terima booking',
      'Rating & review',
    ],
    limitations: [
      'Tidak ada featured package',
      'Analytics terbatas',
      'Support email saja',
      'Tidak ada custom website',
    ],
    cta: 'Mulai Gratis',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 'Rp 100rb',
    period: 'per bulan',
    features: [
      'Unlimited paket',
      'Featured package (1x)',
      'Advanced analytics',
      'Priority support',
      'Premium badge',
      'Custom branding',
      'API access',
    ],
    limitations: [
      'Website builder terbatas',
      'Tidak ada custom domain',
    ],
    cta: 'Upgrade ke Pro',
    highlighted: true,
  },
  {
    name: 'Premium',
    price: 'Rp 300rb',
    period: 'per bulan',
    features: [
      'Semua fitur Pro',
      'Featured package (unlimited)',
      'Custom website builder',
      'Custom domain',
      'Email marketing',
      'Advanced SEO tools',
      'Dedicated account manager',
      'Priority support 24/7',
    ],
    limitations: [],
    cta: 'Upgrade ke Premium',
    highlighted: false,
  },
];

interface MonetizationOverviewProps {
  travelId: string;
  currentPlan?: 'free' | 'pro' | 'premium';
}

export const MonetizationOverview = ({ travelId, currentPlan = 'free' }: MonetizationOverviewProps) => {
  const [selectedFeature, setSelectedFeature] = useState<MonetizationFeature | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'premium':
        return 'from-amber-500 to-orange-500';
      case 'pro':
        return 'from-blue-500 to-cyan-500';
      default:
        return 'from-gray-500 to-slate-500';
    }
  };

  const isPlanAccessible = (featurePlan: string) => {
    const planHierarchy = { free: 0, pro: 1, premium: 2 };
    return planHierarchy[currentPlan as keyof typeof planHierarchy] >= planHierarchy[featurePlan as keyof typeof planHierarchy];
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Strategi Monetisasi</h2>
        <p className="text-muted-foreground">
          Maksimalkan penghasilan Anda dengan berbagai opsi monetisasi yang tersedia
        </p>
      </div>

      {/* Revenue Paths */}
      <div>
        <h3 className="text-xl font-bold mb-4">Jalur Pendapatan Utama</h3>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {revenuePaths.map((path, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              <Card className="hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {path.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{path.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{path.description}</p>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm font-semibold text-primary">{path.amount}</p>
                    <p className="text-xs text-muted-foreground mt-1">{path.example}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Features by Plan */}
      <div>
        <h3 className="text-xl font-bold mb-4">Fitur Monetisasi Tersedia</h3>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {monetizationFeatures.map((feature) => {
            const isAccessible = isPlanAccessible(feature.plan);
            return (
              <motion.div key={feature.id} variants={itemVariants}>
                <Card
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    !isAccessible ? 'opacity-60' : ''
                  }`}
                  onClick={() => setSelectedFeature(feature)}
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {feature.icon}
                      </div>
                      {!isAccessible && (
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold">{feature.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                    </div>
                    <div className="pt-2 border-t border-border space-y-2">
                      <Badge variant={feature.plan === 'premium' ? 'default' : 'secondary'}>
                        {feature.plan === 'premium' ? '👑 Premium' : '⭐ Pro'}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{feature.priceImpact}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Pricing Plans Comparison */}
      <div>
        <h3 className="text-xl font-bold mb-4">Paket Berlangganan</h3>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {membershipPlans.map((plan, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              <Card
                className={`relative overflow-hidden transition-all ${
                  plan.highlighted
                    ? 'border-primary border-2 shadow-lg scale-105'
                    : ''
                }`}
              >
                {plan.highlighted && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${getPlanColor(plan.name.toLowerCase())} opacity-5`} />
                )}

                <CardHeader className="relative">
                  {plan.highlighted && (
                    <Badge className="w-fit mb-2 bg-primary">Paling Populer</Badge>
                  )}
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="mt-4">
                    <p className="text-3xl font-bold">{plan.price}</p>
                    <p className="text-sm text-muted-foreground">{plan.period}</p>
                  </div>
                </CardHeader>

                <CardContent className="relative space-y-6">
                  {/* Features */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">Fitur Included:</p>
                    {plan.features.map((feature, fidx) => (
                      <div key={fidx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Limitations */}
                  {plan.limitations.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-border">
                      <p className="text-sm font-semibold text-foreground">Tidak Included:</p>
                      {plan.limitations.map((limitation, lidx) => (
                        <div key={lidx} className="flex items-start gap-3">
                          <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CTA */}
                  <Button
                    className="w-full mt-4"
                    variant={plan.highlighted ? 'default' : 'outline'}
                    onClick={() => setShowPricingModal(true)}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Tips Section */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Tips Maksimalkan Penghasilan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Gunakan Featured Package</p>
              <p className="text-sm text-muted-foreground">Paket yang di-featured mendapat 3x lebih banyak views</p>
            </div>
          </div>
          <div className="flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Tingkatkan Rating Anda</p>
              <p className="text-sm text-muted-foreground">Rating tinggi meningkatkan kepercayaan dan konversi pelanggan</p>
            </div>
          </div>
          <div className="flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Manfaatkan Analytics</p>
              <p className="text-sm text-muted-foreground">Gunakan data untuk optimize paket dan strategi marketing</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Detail Modal */}
      <Dialog open={!!selectedFeature} onOpenChange={(open) => !open && setSelectedFeature(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {selectedFeature?.icon}
              </div>
              {selectedFeature?.name}
            </DialogTitle>
            <DialogDescription>{selectedFeature?.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold">Manfaat Utama</p>
              <p className="text-sm text-muted-foreground">{selectedFeature?.benefit}</p>
            </div>

            <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold">Harga</p>
              <p className="text-sm text-muted-foreground">{selectedFeature?.priceImpact}</p>
            </div>

            <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold">Tersedia untuk</p>
              <Badge variant={selectedFeature?.plan === 'premium' ? 'default' : 'secondary'}>
                {selectedFeature?.plan === 'premium' ? '👑 Premium Plan' : '⭐ Pro Plan & Premium'}
              </Badge>
            </div>

            {!isPlanAccessible(selectedFeature?.plan || 'premium') && (
              <Button className="w-full" onClick={() => setShowPricingModal(true)}>
                Upgrade Sekarang
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
