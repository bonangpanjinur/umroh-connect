import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Calculator, Target, Calendar, TrendingUp, Wallet, Lock, CreditCard, Sparkles, ShieldCheck, Clock, CheckCircle2, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInMonths, addMonths, differenceInDays } from 'date-fns';
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

// Lock Harga simulation data
const DP_PERCENTAGES = [
  { label: '10%', value: 0.10, desc: 'DP Minimum' },
  { label: '20%', value: 0.20, desc: 'DP Standar' },
  { label: '30%', value: 0.30, desc: 'DP Rekomendasi' },
  { label: '50%', value: 0.50, desc: 'DP Setengah' },
];

const PRICE_INCREASE_RATE = 0.05; // 5% per tahun estimasi kenaikan

// Cicilan config
const CICILAN_OPTIONS = [
  { months: 3, margin: 0, label: '3 Bulan', desc: 'Tanpa margin', badge: 'Terbaik' },
  { months: 6, margin: 0, label: '6 Bulan', desc: 'Tanpa margin', badge: 'Populer' },
  { months: 12, margin: 0.03, label: '12 Bulan', desc: 'Margin 3%', badge: null },
  { months: 18, margin: 0.05, label: '18 Bulan', desc: 'Margin 5%', badge: null },
  { months: 24, margin: 0.08, label: '24 Bulan', desc: 'Margin 8%', badge: null },
];

const SavingsCalculatorView = ({ onBack, onViewPackages }: SavingsCalculatorViewProps) => {
  const loadSavedGoal = (): SavingsGoal => {
    const saved = localStorage.getItem('umroh_savings_goal');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...parsed, targetDate: new Date(parsed.targetDate) };
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
  const [selectedDpIndex, setSelectedDpIndex] = useState(0);
  const [selectedCicilanIndex, setSelectedCicilanIndex] = useState(1);
  const [dpAmount, setDpAmount] = useState(0);
  const [showLockDetail, setShowLockDetail] = useState(false);
  const [showCicilanDetail, setShowCicilanDetail] = useState(false);

  useEffect(() => {
    localStorage.setItem('umroh_savings_goal', JSON.stringify(goal));
  }, [goal]);

  useEffect(() => {
    setDpAmount(Math.ceil(goal.targetAmount * DP_PERCENTAGES[selectedDpIndex].value));
  }, [goal.targetAmount, selectedDpIndex]);

  const monthsRemaining = useMemo(() => {
    return Math.max(1, differenceInMonths(goal.targetDate, new Date()));
  }, [goal.targetDate]);

  const daysRemaining = useMemo(() => {
    return Math.max(0, differenceInDays(goal.targetDate, new Date()));
  }, [goal.targetDate]);

  const requiredMonthlySavings = useMemo(() => {
    const remaining = goal.targetAmount - goal.currentSavings;
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / monthsRemaining);
  }, [goal.targetAmount, goal.currentSavings, monthsRemaining]);

  const progressPercentage = useMemo(() => {
    if (goal.targetAmount <= 0) return 0;
    return Math.min(100, (goal.currentSavings / goal.targetAmount) * 100);
  }, [goal.currentSavings, goal.targetAmount]);

  const estimatedCompletionDate = useMemo(() => {
    if (goal.monthlySavings <= 0) return null;
    const remaining = goal.targetAmount - goal.currentSavings;
    if (remaining <= 0) return new Date();
    return addMonths(new Date(), Math.ceil(remaining / goal.monthlySavings));
  }, [goal.targetAmount, goal.currentSavings, goal.monthlySavings]);

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

  // Lock Harga calculations
  const lockHargaCalc = useMemo(() => {
    const dp = DP_PERCENTAGES[selectedDpIndex];
    const dpNominal = Math.ceil(goal.targetAmount * dp.value);
    const sisaPelunasan = goal.targetAmount - dpNominal;
    const estimasiKenaikan = Math.ceil(goal.targetAmount * PRICE_INCREASE_RATE * (monthsRemaining / 12));
    const hargaTanpaLock = goal.targetAmount + estimasiKenaikan;
    const penghematan = estimasiKenaikan;
    const pelunasanPerBulan = monthsRemaining > 0 ? Math.ceil(sisaPelunasan / monthsRemaining) : sisaPelunasan;
    const batasWaktuPelunasan = addMonths(new Date(), monthsRemaining);

    return {
      dpNominal,
      dpPercentLabel: dp.label,
      sisaPelunasan,
      estimasiKenaikan,
      hargaTanpaLock,
      penghematan,
      pelunasanPerBulan,
      batasWaktuPelunasan,
      monthsRemaining,
    };
  }, [goal.targetAmount, selectedDpIndex, monthsRemaining]);

  // Cicilan calculations
  const cicilanCalc = useMemo(() => {
    const option = CICILAN_OPTIONS[selectedCicilanIndex];
    const totalMargin = Math.ceil(goal.targetAmount * option.margin);
    const totalBayar = goal.targetAmount + totalMargin;
    const cicilanPerBulan = Math.ceil(totalBayar / option.months);
    const dpCicilan = Math.ceil(goal.targetAmount * 0.1); // DP 10% fixed for cicilan
    const sisaCicilan = totalBayar - dpCicilan;
    const cicilanBulanan = Math.ceil(sisaCicilan / option.months);

    const schedule = [];
    for (let i = 1; i <= option.months; i++) {
      schedule.push({
        bulan: i,
        tanggal: format(addMonths(new Date(), i), 'MMM yyyy', { locale: id }),
        nominal: cicilanBulanan,
        sisaHutang: Math.max(0, sisaCicilan - (cicilanBulanan * i)),
      });
    }

    return {
      totalMargin,
      totalBayar,
      cicilanPerBulan,
      dpCicilan,
      sisaCicilan,
      cicilanBulanan,
      schedule,
      option,
    };
  }, [goal.targetAmount, selectedCicilanIndex]);

  const isGoalAchievable = goal.monthlySavings >= requiredMonthlySavings;

  const packagePresets = [
    { name: 'Paket Ekonomi', price: 25000000, duration: '9 Hari' },
    { name: 'Paket Reguler', price: 35000000, duration: '12 Hari' },
    { name: 'Paket Premium', price: 50000000, duration: '14 Hari' },
    { name: 'Paket VIP', price: 75000000, duration: '14 Hari' },
  ];

  const handleAddSavings = (amount: number) => {
    setGoal(prev => ({ ...prev, currentSavings: prev.currentSavings + amount }));
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
            <h1 className="font-bold text-lg">Kalkulator Umroh</h1>
            <p className="text-xs opacity-90">Simulasi Tabungan, Lock Harga & Cicilan</p>
          </div>
        </div>
      </div>

      {/* Main Progress Card */}
      <div className="p-4">
        <Card className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20 overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/20 rounded-full">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium">Progress Tabungan</span>
              </div>
              <Badge variant={progressPercentage >= 100 ? "default" : "secondary"}>
                {progressPercentage.toFixed(1)}%
              </Badge>
            </div>

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

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/50">
              <div className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Sisa</p>
                  <p className="text-xs font-semibold">{formatCurrency(Math.max(0, goal.targetAmount - goal.currentSavings))}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Target</p>
                  <p className="text-xs font-semibold">{format(goal.targetDate, 'MMM yyyy', { locale: id })}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Sisa Hari</p>
                  <p className="text-xs font-semibold">{daysRemaining} hari</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="calculator" className="text-[10px] px-1">
              <Calculator className="w-3 h-3 mr-0.5" />
              Hitung
            </TabsTrigger>
            <TabsTrigger value="tracker" className="text-[10px] px-1">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              Tracker
            </TabsTrigger>
            <TabsTrigger value="lock" className="text-[10px] px-1">
              <Lock className="w-3 h-3 mr-0.5" />
              Lock
            </TabsTrigger>
            <TabsTrigger value="cicilan" className="text-[10px] px-1">
              <CreditCard className="w-3 h-3 mr-0.5" />
              Cicilan
            </TabsTrigger>
          </TabsList>

          {/* Calculator Tab */}
          <TabsContent value="calculator" className="space-y-4">
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

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Target Custom</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Target Biaya (Rp)</Label>
                  <Input type="number" value={goal.targetAmount} onChange={(e) => setGoal(prev => ({ ...prev, targetAmount: Number(e.target.value) }))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Tabungan Saat Ini (Rp)</Label>
                  <Input type="number" value={goal.currentSavings} onChange={(e) => setGoal(prev => ({ ...prev, currentSavings: Number(e.target.value) }))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Target Keberangkatan</Label>
                  <Input type="month" value={format(goal.targetDate, 'yyyy-MM')} onChange={(e) => setGoal(prev => ({ ...prev, targetDate: new Date(e.target.value + '-01') }))} className="mt-1" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Hasil Perhitungan</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Waktu tersisa</span>
                    <span className="font-semibold">{monthsRemaining} bulan ({daysRemaining} hari)</span>
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
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Tabungan Bulanan Anda</CardTitle>
                <CardDescription className="text-xs">Berapa yang bisa Anda tabung per bulan?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">{formatCurrency(goal.monthlySavings)}</span>
                    <span className={`text-xs ${isGoalAchievable ? 'text-green-600' : 'text-orange-500'}`}>
                      {isGoalAchievable ? '✓ Target tercapai' : `Kurang ${formatCurrency(requiredMonthlySavings - goal.monthlySavings)}/bulan`}
                    </span>
                  </div>
                  <Slider value={[goal.monthlySavings]} onValueChange={([value]) => setGoal(prev => ({ ...prev, monthlySavings: value }))} max={10000000} step={100000} className="w-full" />
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

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Tambah Tabungan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {quickAddAmounts.map((amount) => (
                    <Button key={amount} variant="outline" size="sm" onClick={() => handleAddSavings(amount)} className="h-12">
                      + {formatCurrency(amount)}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input type="number" placeholder="Nominal lainnya" id="customAmount" className="flex-1" />
                  <Button onClick={() => {
                    const input = document.getElementById('customAmount') as HTMLInputElement;
                    const amount = Number(input.value);
                    if (amount > 0) { handleAddSavings(amount); input.value = ''; }
                  }}>Tambah</Button>
                </div>
              </CardContent>
            </Card>

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
                    <motion.div key={item.month} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-3 p-2 rounded-lg ${item.isComplete ? 'bg-accent/50' : 'bg-muted/30'}`}>
                      <div className={`w-2 h-2 rounded-full ${item.isComplete ? 'bg-primary' : 'bg-primary/50'}`} />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium">{item.month}</span>
                          <span className="text-xs">{formatCurrency(item.accumulated)}</span>
                        </div>
                        <Progress value={item.percentage} className="h-1 mt-1" />
                      </div>
                      {item.isComplete && <Badge variant="default" className="text-[10px]">Target!</Badge>}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lock Harga Tab */}
          <TabsContent value="lock" className="space-y-4">
            {/* Lock Harga Explanation */}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-primary/20 rounded-full">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Lock Harga Paket</h3>
                    <p className="text-xs text-muted-foreground">Kunci harga hari ini, bayar bertahap</p>
                  </div>
                </div>

                <div className="p-3 bg-primary/10 rounded-lg mb-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-xs text-foreground/80">
                      Dengan Lock Harga, Anda mengamankan harga paket saat ini. Meski harga naik di kemudian hari, harga Anda tetap sama. Cukup bayar DP dan lunasi sebelum keberangkatan.
                    </p>
                  </div>
                </div>

                {/* DP Selection */}
                <div className="mb-4">
                  <Label className="text-xs font-semibold mb-2 block">Pilih Jumlah DP</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {DP_PERCENTAGES.map((dp, i) => (
                      <button
                        key={dp.label}
                        onClick={() => setSelectedDpIndex(i)}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          selectedDpIndex === i
                            ? 'border-primary bg-primary/10 ring-1 ring-primary'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <p className="text-sm font-bold text-primary">{dp.label}</p>
                        <p className="text-[9px] text-muted-foreground">{dp.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulation Results */}
                <div className="space-y-2">
                  <div className="p-3 bg-background rounded-xl border border-border space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Harga Paket Hari Ini</span>
                      <span className="font-bold">{formatCurrency(goal.targetAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">DP Lock Harga ({lockHargaCalc.dpPercentLabel})</span>
                      <span className="font-bold text-primary">{formatCurrency(lockHargaCalc.dpNominal)}</span>
                    </div>
                    <hr className="border-border/50" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Sisa Pelunasan</span>
                      <span className="font-semibold">{formatCurrency(lockHargaCalc.sisaPelunasan)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Pelunasan per Bulan</span>
                      <span className="font-semibold text-primary">{formatCurrency(lockHargaCalc.pelunasanPerBulan)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Batas Pelunasan</span>
                      <span className="font-semibold">{format(lockHargaCalc.batasWaktuPelunasan, 'dd MMM yyyy', { locale: id })}</span>
                    </div>
                  </div>

                  {/* Savings highlight */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-semibold text-green-700 dark:text-green-400">Estimasi Penghematan</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Harga tanpa lock ({monthsRemaining} bln lagi)</p>
                        <p className="text-xs line-through text-muted-foreground">{formatCurrency(lockHargaCalc.hargaTanpaLock)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-green-600 dark:text-green-400">Anda hemat</p>
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(lockHargaCalc.penghematan)}</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Detail toggle */}
                  <button
                    onClick={() => setShowLockDetail(!showLockDetail)}
                    className="w-full flex items-center justify-center gap-1 text-xs text-primary py-2"
                  >
                    {showLockDetail ? 'Sembunyikan' : 'Lihat'} jadwal pelunasan
                    {showLockDetail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  <AnimatePresence>
                    {showLockDetail && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {Array.from({ length: Math.min(lockHargaCalc.monthsRemaining, 12) }, (_, i) => {
                            const paid = lockHargaCalc.pelunasanPerBulan * (i + 1);
                            const remaining = Math.max(0, lockHargaCalc.sisaPelunasan - paid);
                            return (
                              <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-xs">
                                <span className="text-muted-foreground">
                                  {format(addMonths(new Date(), i + 1), 'MMM yyyy', { locale: id })}
                                </span>
                                <span className="font-medium">{formatCurrency(lockHargaCalc.pelunasanPerBulan)}</span>
                                <span className="text-muted-foreground text-[10px]">
                                  Sisa: {formatCurrency(remaining)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Button className="w-full mt-4" onClick={onViewPackages}>
                  <Lock className="w-4 h-4 mr-2" />
                  Lihat Paket & Lock Harga
                </Button>
              </CardContent>
            </Card>

            {/* Warning */}
            <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">Penting!</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Simulasi ini bersifat estimasi. Harga aktual dan ketentuan lock harga mengikuti kebijakan masing-masing travel agent. Hubungi agen untuk detail dan konfirmasi.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cicilan Tab */}
          <TabsContent value="cicilan" className="space-y-4">
            <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-background">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-accent/20 rounded-full">
                    <CreditCard className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Program Cicilan</h3>
                    <p className="text-xs text-muted-foreground">Berangkat dulu, bayar bertahap</p>
                  </div>
                </div>

                <div className="p-3 bg-accent/10 rounded-lg mb-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-accent-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-foreground/80">
                      Program cicilan memungkinkan Anda berangkat umroh lebih cepat. Bayar DP 10% dan sisanya dicicil per bulan dengan margin ringan.
                    </p>
                  </div>
                </div>

                {/* Cicilan Options */}
                <div className="mb-4">
                  <Label className="text-xs font-semibold mb-2 block">Pilih Tenor Cicilan</Label>
                  <div className="space-y-2">
                    {CICILAN_OPTIONS.map((opt, i) => (
                      <button
                        key={opt.months}
                        onClick={() => setSelectedCicilanIndex(i)}
                        className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                          selectedCicilanIndex === i
                            ? 'border-primary bg-primary/10 ring-1 ring-primary'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-sm font-semibold">{opt.label}</p>
                            <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                          </div>
                          {opt.badge && (
                            <Badge variant="secondary" className="text-[9px]">{opt.badge}</Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">
                            {formatCurrency(Math.ceil((goal.targetAmount + goal.targetAmount * opt.margin - goal.targetAmount * 0.1) / opt.months))}
                          </p>
                          <p className="text-[10px] text-muted-foreground">/bulan</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulation Results */}
                <div className="p-3 bg-background rounded-xl border border-border space-y-2.5">
                  <h4 className="text-xs font-semibold flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5" />
                    Detail Simulasi - {cicilanCalc.option.label}
                  </h4>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Harga Paket</span>
                    <span className="font-semibold">{formatCurrency(goal.targetAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">DP (10%)</span>
                    <span className="font-bold text-primary">{formatCurrency(cicilanCalc.dpCicilan)}</span>
                  </div>
                  {cicilanCalc.totalMargin > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Margin ({cicilanCalc.option.desc})</span>
                      <span className="font-semibold text-orange-500">{formatCurrency(cicilanCalc.totalMargin)}</span>
                    </div>
                  )}
                  <hr className="border-border/50" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Total Bayar</span>
                    <span className="font-bold">{formatCurrency(cicilanCalc.totalBayar)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Sisa Setelah DP</span>
                    <span className="font-semibold">{formatCurrency(cicilanCalc.sisaCicilan)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-primary/5 rounded-lg">
                    <span className="text-xs font-semibold">Cicilan per Bulan</span>
                    <span className="font-bold text-lg text-primary">{formatCurrency(cicilanCalc.cicilanBulanan)}</span>
                  </div>
                </div>

                {/* Detail toggle */}
                <button
                  onClick={() => setShowCicilanDetail(!showCicilanDetail)}
                  className="w-full flex items-center justify-center gap-1 text-xs text-primary py-2"
                >
                  {showCicilanDetail ? 'Sembunyikan' : 'Lihat'} jadwal cicilan
                  {showCicilanDetail ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                <AnimatePresence>
                  {showCicilanDetail && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1.5 max-h-60 overflow-y-auto">
                        {/* DP Row */}
                        <div className="flex items-center justify-between p-2 bg-primary/10 rounded-lg text-xs">
                          <span className="font-semibold text-primary">DP Awal</span>
                          <span className="font-bold text-primary">{formatCurrency(cicilanCalc.dpCicilan)}</span>
                          <span className="text-[10px] text-muted-foreground">Bayar di muka</span>
                        </div>
                        {cicilanCalc.schedule.map((item) => (
                          <div key={item.bulan} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-xs">
                            <span className="text-muted-foreground w-20">
                              Bln {item.bulan} • {item.tanggal}
                            </span>
                            <span className="font-medium">{formatCurrency(item.nominal)}</span>
                            <span className="text-muted-foreground text-[10px] w-24 text-right">
                              Sisa: {formatCurrency(item.sisaHutang)}
                            </span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 rounded-lg text-xs">
                          <span className="font-semibold text-green-600">✓ Lunas</span>
                          <span className="font-bold text-green-600">{formatCurrency(cicilanCalc.totalBayar)}</span>
                          <span className="text-[10px] text-green-600">Total dibayar</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button className="w-full mt-4" variant="outline" onClick={onViewPackages}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Lihat Paket Cicilan
                </Button>
              </CardContent>
            </Card>

            {/* Warning */}
            <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">Catatan</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Simulasi ini menggunakan skema syariah tanpa bunga (margin tetap). Detail program cicilan dan margin aktual mengikuti kebijakan masing-masing travel agent.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">💡 Tips Memilih Cicilan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  'Pilih tenor pendek (3-6 bulan) jika mampu, untuk menghindari margin',
                  'Pastikan cicilan tidak melebihi 30% pendapatan bulanan',
                  'Siapkan dana darurat minimal 3 bulan sebelum mengambil cicilan',
                  'Tanyakan apakah ada opsi pelunasan dipercepat tanpa penalti',
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSuccess(false)}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              className="bg-background rounded-2xl p-6 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Alhamdulillah! 🎉</h2>
              <p className="text-muted-foreground mb-4">Target tabungan Anda sudah tercapai! Saatnya mewujudkan perjalanan suci ke Baitullah.</p>
              <div className="space-y-2">
                <Button className="w-full" onClick={onViewPackages}>Lihat Paket Umroh</Button>
                <Button variant="outline" className="w-full" onClick={() => setShowSuccess(false)}>Tutup</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SavingsCalculatorView;
