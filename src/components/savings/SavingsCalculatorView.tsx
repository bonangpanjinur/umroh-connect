import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Calculator, Target, Calendar, TrendingUp, Wallet, PiggyBank, Lock, CreditCard, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInMonths, addMonths } from 'date-fns';
import { id } from 'date-fns/locale';

interface SavingsCalculatorViewProps {
  onBack: () => void;
  onViewPackages?: () => void;
}

interface SavingsGoal {
  targetAmount: number;
  currentSavings: number;
  targetDate: Date;
  monthlySavings: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const SavingsCalculatorView = ({ onBack, onViewPackages }: SavingsCalculatorViewProps) => {
  // Load saved data from localStorage
  const loadSavedGoal = (): SavingsGoal => {
    const saved = localStorage.getItem('umroh_savings_goal');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        targetDate: new Date(parsed.targetDate),
      };
    }
    return {
      targetAmount: 35000000,
      currentSavings: 0,
      targetDate: addMonths(new Date(), 12),
      monthlySavings: 0,
    };
  };

  const [goal, setGoal] = useState<SavingsGoal>(loadSavedGoal);
  const [activeTab, setActiveTab] = useState('calculator');
  const [showSuccess, setShowSuccess] = useState(false);

  // Save to localStorage whenever goal changes
  useEffect(() => {
    localStorage.setItem('umroh_savings_goal', JSON.stringify(goal));
  }, [goal]);

  // Calculate months remaining
  const monthsRemaining = useMemo(() => {
    const months = differenceInMonths(goal.targetDate, new Date());
    return Math.max(1, months);
  }, [goal.targetDate]);

  // Calculate required monthly savings
  const requiredMonthlySavings = useMemo(() => {
    const remaining = goal.targetAmount - goal.currentSavings;
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / monthsRemaining);
  }, [goal.targetAmount, goal.currentSavings, monthsRemaining]);

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    if (goal.targetAmount <= 0) return 0;
    return Math.min(100, (goal.currentSavings / goal.targetAmount) * 100);
  }, [goal.currentSavings, goal.targetAmount]);

  // Calculate estimated completion date based on monthly savings
  const estimatedCompletionDate = useMemo(() => {
    if (goal.monthlySavings <= 0) return null;
    const remaining = goal.targetAmount - goal.currentSavings;
    if (remaining <= 0) return new Date();
    const monthsNeeded = Math.ceil(remaining / goal.monthlySavings);
    return addMonths(new Date(), monthsNeeded);
  }, [goal.targetAmount, goal.currentSavings, goal.monthlySavings]);

  // Generate savings timeline
  const savingsTimeline = useMemo(() => {
    const timeline = [];
    let accumulated = goal.currentSavings;
    const monthly = goal.monthlySavings > 0 ? goal.monthlySavings : requiredMonthlySavings;
    
    for (let i = 0; i < Math.min(monthsRemaining, 24); i++) {
      accumulated += monthly;
      const date = addMonths(new Date(), i + 1);
      timeline.push({
        month: format(date, 'MMM yyyy', { locale: id }),
        accumulated: Math.min(accumulated, goal.targetAmount),
        percentage: Math.min(100, (accumulated / goal.targetAmount) * 100),
        isComplete: accumulated >= goal.targetAmount,
      });
      if (accumulated >= goal.targetAmount) break;
    }
    return timeline;
  }, [goal, monthsRemaining, requiredMonthlySavings]);

  // Check if goal is achievable
  const isGoalAchievable = goal.monthlySavings >= requiredMonthlySavings;

  // Package price presets
  const packagePresets = [
    { name: 'Paket Ekonomi', price: 25000000, duration: '9 Hari' },
    { name: 'Paket Reguler', price: 35000000, duration: '12 Hari' },
    { name: 'Paket Premium', price: 50000000, duration: '14 Hari' },
    { name: 'Paket VIP', price: 75000000, duration: '14 Hari' },
  ];

  const handleAddSavings = (amount: number) => {
    setGoal(prev => ({
      ...prev,
      currentSavings: prev.currentSavings + amount,
    }));
    if (goal.currentSavings + amount >= goal.targetAmount) {
      setShowSuccess(true);
    }
  };

  const quickAddAmounts = [500000, 1000000, 2000000, 5000000];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-primary to-primary/80 z-10 p-4 text-primary-foreground">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-lg">Kalkulator Tabungan Umroh</h1>
            <p className="text-xs opacity-90">Rencanakan perjalanan suci Anda</p>
          </div>
        </div>
      </div>

      {/* Main Progress Card */}
      <div className="p-4">
        <Card className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/20 rounded-full">
                  <PiggyBank className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium">Progress Tabungan</span>
              </div>
              <Badge variant={progressPercentage >= 100 ? "default" : "secondary"}>
                {progressPercentage.toFixed(1)}%
              </Badge>
            </div>

            {/* Visual Progress */}
            <div className="relative mb-4">
              <Progress value={progressPercentage} className="h-4 bg-muted" />
              <motion.div 
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${Math.min(progressPercentage, 95)}%` }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {progressPercentage >= 100 ? (
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Target className="w-4 h-4 text-primary" />
                )}
              </motion.div>
            </div>

            {/* Amount Display */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-muted-foreground">Terkumpul</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(goal.currentSavings)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Target</p>
                <p className="text-lg font-bold">{formatCurrency(goal.targetAmount)}</p>
              </div>
            </div>

            {/* Remaining & Timeline */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Sisa</p>
                  <p className="text-sm font-semibold">{formatCurrency(Math.max(0, goal.targetAmount - goal.currentSavings))}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Target</p>
                  <p className="text-sm font-semibold">{format(goal.targetDate, 'MMM yyyy', { locale: id })}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="calculator" className="text-xs">
              <Calculator className="w-3 h-3 mr-1" />
              Kalkulator
            </TabsTrigger>
            <TabsTrigger value="tracker" className="text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              Tracker
            </TabsTrigger>
            <TabsTrigger value="options" className="text-xs">
              <CreditCard className="w-3 h-3 mr-1" />
              Opsi
            </TabsTrigger>
          </TabsList>

          {/* Calculator Tab */}
          <TabsContent value="calculator" className="space-y-4">
            {/* Package Presets */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Pilih Target Paket
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {packagePresets.map((pkg) => (
                  <button
                    key={pkg.name}
                    onClick={() => setGoal(prev => ({ ...prev, targetAmount: pkg.price }))}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      goal.targetAmount === pkg.price 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <p className="text-xs font-medium">{pkg.name}</p>
                    <p className="text-sm font-bold text-primary">{formatCurrency(pkg.price)}</p>
                    <p className="text-[10px] text-muted-foreground">{pkg.duration}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Custom Target */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Target Custom</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Target Biaya (Rp)</Label>
                  <Input
                    type="number"
                    value={goal.targetAmount}
                    onChange={(e) => setGoal(prev => ({ ...prev, targetAmount: Number(e.target.value) }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Tabungan Saat Ini (Rp)</Label>
                  <Input
                    type="number"
                    value={goal.currentSavings}
                    onChange={(e) => setGoal(prev => ({ ...prev, currentSavings: Number(e.target.value) }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Target Keberangkatan</Label>
                  <Input
                    type="month"
                    value={format(goal.targetDate, 'yyyy-MM')}
                    onChange={(e) => setGoal(prev => ({ ...prev, targetDate: new Date(e.target.value + '-01') }))}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Calculation Result */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Hasil Perhitungan</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Waktu tersisa</span>
                    <span className="font-semibold">{monthsRemaining} bulan</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tabungan per bulan</span>
                    <span className="font-bold text-primary text-lg">{formatCurrency(requiredMonthlySavings)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Per minggu</span>
                    <span className="font-semibold">{formatCurrency(Math.ceil(requiredMonthlySavings / 4))}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Per hari</span>
                    <span className="font-semibold">{formatCurrency(Math.ceil(requiredMonthlySavings / 30))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tracker Tab */}
          <TabsContent value="tracker" className="space-y-4">
            {/* Monthly Savings Input */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Tabungan Bulanan Anda</CardTitle>
                <CardDescription className="text-xs">
                  Berapa yang bisa Anda tabung per bulan?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">{formatCurrency(goal.monthlySavings)}</span>
                    <span className={`text-xs ${isGoalAchievable ? 'text-green-600' : 'text-orange-500'}`}>
                      {isGoalAchievable ? '✓ Target tercapai' : `Kurang ${formatCurrency(requiredMonthlySavings - goal.monthlySavings)}/bulan`}
                    </span>
                  </div>
                  <Slider
                    value={[goal.monthlySavings]}
                    onValueChange={([value]) => setGoal(prev => ({ ...prev, monthlySavings: value }))}
                    max={10000000}
                    step={100000}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">Rp 0</span>
                    <span className="text-[10px] text-muted-foreground">Rp 10 Juta</span>
                  </div>
                </div>

                {estimatedCompletionDate && (
                  <div className={`p-3 rounded-lg ${isGoalAchievable ? 'bg-accent/50' : 'bg-secondary'}`}>
                    <p className="text-xs text-muted-foreground">Estimasi target tercapai</p>
                    <p className={`font-semibold ${isGoalAchievable ? 'text-primary' : 'text-destructive'}`}>
                      {format(estimatedCompletionDate, 'MMMM yyyy', { locale: id })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Add Savings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Tambah Tabungan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {quickAddAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSavings(amount)}
                      className="h-12"
                    >
                      + {formatCurrency(amount)}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Nominal lainnya"
                    id="customAmount"
                    className="flex-1"
                  />
                  <Button
                    onClick={() => {
                      const input = document.getElementById('customAmount') as HTMLInputElement;
                      const amount = Number(input.value);
                      if (amount > 0) {
                        handleAddSavings(amount);
                        input.value = '';
                      }
                    }}
                  >
                    Tambah
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Proyeksi Tabungan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {savingsTimeline.map((item, index) => (
                    <motion.div
                      key={item.month}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        item.isComplete ? 'bg-accent/50' : 'bg-muted/30'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${item.isComplete ? 'bg-primary' : 'bg-primary/50'}`} />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium">{item.month}</span>
                          <span className="text-xs">{formatCurrency(item.accumulated)}</span>
                        </div>
                        <Progress value={item.percentage} className="h-1 mt-1" />
                      </div>
                      {item.isComplete && (
                        <Badge variant="default" className="text-[10px]">Target!</Badge>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Options Tab */}
          <TabsContent value="options" className="space-y-4">
            {/* Lock Harga */}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/20 rounded-full">
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Lock Harga Sekarang</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Kunci harga paket hari ini dengan DP minimal. Harga tidak naik meski Anda menabung bertahap.
                    </p>
                    <div className="mt-3 p-2 bg-background rounded-lg">
                      <div className="flex justify-between text-xs">
                        <span>DP Minimal (10%)</span>
                        <span className="font-semibold">{formatCurrency(goal.targetAmount * 0.1)}</span>
                      </div>
                    </div>
                    <Button className="w-full mt-3" size="sm" onClick={onViewPackages}>
                      <Lock className="w-3 h-3 mr-1" />
                      Lihat Paket & Lock Harga
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cicilan */}
            <Card className="border-accent/30 bg-gradient-to-br from-accent/10 to-background">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-accent/20 rounded-full">
                    <CreditCard className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Program Cicilan</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Berangkat sekarang, bayar bertahap dengan cicilan ringan hingga 24 bulan.
                    </p>
                    <div className="mt-3 space-y-2">
                      {[6, 12, 24].map((months) => (
                        <div key={months} className="flex justify-between items-center p-2 bg-background rounded-lg">
                          <span className="text-xs">{months} Bulan</span>
                          <span className="font-semibold text-sm">{formatCurrency(Math.ceil(goal.targetAmount / months))}/bln</span>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full mt-3" size="sm" onClick={onViewPackages}>
                      <CreditCard className="w-3 h-3 mr-1" />
                      Lihat Program Cicilan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">💡 Tips Menabung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  'Sisihkan di awal bulan, bukan sisa gaji',
                  'Gunakan rekening terpisah untuk tabungan umroh',
                  'Kurangi pengeluaran tidak perlu (kopi, makan luar)',
                  'Jual barang tidak terpakai untuk tambahan',
                  'Libatkan keluarga dalam target bersama',
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-primary">•</span>
                    <span className="text-muted-foreground">{tip}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSuccess(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-background rounded-2xl p-6 max-w-sm w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Alhamdulillah! 🎉</h2>
              <p className="text-muted-foreground mb-4">
                Target tabungan Anda sudah tercapai! Saatnya mewujudkan perjalanan suci ke Baitullah.
              </p>
              <div className="space-y-2">
                <Button className="w-full" onClick={onViewPackages}>
                  Lihat Paket Umroh
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setShowSuccess(false)}>
                  Tutup
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SavingsCalculatorView;
