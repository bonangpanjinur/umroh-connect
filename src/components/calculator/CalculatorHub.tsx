import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Calendar, Coins, Wallet, Plane, Landmark, CreditCard, Gem } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import KhatamCalculatorFull from './KhatamCalculatorFull';
import QadhaPuasaCalculator from './QadhaPuasaCalculator';
import FidyahCalculator from './FidyahCalculator';
import ZakatCalculator from './ZakatCalculator';
import TabunganHajiCalculator from './TabunganHajiCalculator';
import CicilanSyariahCalculator from './CicilanSyariahCalculator';
import EmasSyariahCalculator from './EmasSyariahCalculator';
import SavingsCalculatorView from '@/components/savings/SavingsCalculatorView';

type CalcId = 'hub' | 'khatam' | 'qadha' | 'fidyah' | 'zakat' | 'umroh' | 'haji' | 'cicilan' | 'emas';

const calculators = [
  { id: 'khatam' as CalcId, label: 'Khatam Quran', icon: BookOpen, color: 'from-emerald-500 to-emerald-600', category: 'Ibadah' },
  { id: 'qadha' as CalcId, label: 'Qadha Puasa', icon: Calendar, color: 'from-orange-500 to-orange-600', category: 'Ibadah' },
  { id: 'fidyah' as CalcId, label: 'Fidyah', icon: Coins, color: 'from-amber-500 to-amber-600', category: 'Ibadah' },
  { id: 'zakat' as CalcId, label: 'Zakat', icon: Wallet, color: 'from-teal-500 to-teal-600', category: 'Ibadah' },
  { id: 'umroh' as CalcId, label: 'Biaya Umroh', icon: Plane, color: 'from-blue-500 to-blue-600', category: 'Keuangan' },
  { id: 'haji' as CalcId, label: 'Tabungan Haji', icon: Landmark, color: 'from-purple-500 to-purple-600', category: 'Keuangan' },
  { id: 'cicilan' as CalcId, label: 'Cicilan Syariah', icon: CreditCard, color: 'from-indigo-500 to-indigo-600', category: 'Keuangan' },
  { id: 'emas' as CalcId, label: 'Emas Syariah', icon: Gem, color: 'from-yellow-500 to-yellow-600', category: 'Keuangan' },
];

interface CalculatorHubProps {
  onBack: () => void;
  onViewPackages?: () => void;
}

const CalculatorHub = ({ onBack, onViewPackages }: CalculatorHubProps) => {
  const [activeCalc, setActiveCalc] = useState<CalcId>('hub');

  if (activeCalc === 'umroh') {
    return <SavingsCalculatorView onBack={() => setActiveCalc('hub')} onViewPackages={onViewPackages} />;
  }

  if (activeCalc !== 'hub') {
    const calcMap: Record<string, JSX.Element> = {
      khatam: <KhatamCalculatorFull />,
      qadha: <QadhaPuasaCalculator />,
      fidyah: <FidyahCalculator />,
      zakat: <ZakatCalculator />,
      haji: <TabunganHajiCalculator />,
      cicilan: <CicilanSyariahCalculator />,
      emas: <EmasSyariahCalculator />,
    };
    const info = calculators.find(c => c.id === activeCalc);

    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-background z-10 p-4 border-b flex items-center gap-3">
          <button onClick={() => setActiveCalc('hub')} className="p-2 rounded-full hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-lg">{info?.label}</h2>
        </div>
        <div className="p-4">{calcMap[activeCalc]}</div>
      </div>
    );
  }

  const ibadahCalcs = calculators.filter(c => c.category === 'Ibadah');
  const keuanganCalcs = calculators.filter(c => c.category === 'Keuangan');

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-10 p-4 border-b flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg">Kalkulator Islami</h2>
      </div>

      <div className="p-4 space-y-6">
        {/* Ibadah */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">📿 Kalkulator Ibadah</h3>
          <div className="grid grid-cols-2 gap-3">
            {ibadahCalcs.map((calc, i) => {
              const Icon = calc.icon;
              return (
                <motion.div
                  key={calc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className="cursor-pointer hover:shadow-md transition-all active:scale-95"
                    onClick={() => setActiveCalc(calc.id)}
                  >
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${calc.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium">{calc.label}</span>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Keuangan */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">💰 Kalkulator Keuangan Islami</h3>
          <div className="grid grid-cols-2 gap-3">
            {keuanganCalcs.map((calc, i) => {
              const Icon = calc.icon;
              return (
                <motion.div
                  key={calc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                >
                  <Card
                    className="cursor-pointer hover:shadow-md transition-all active:scale-95"
                    onClick={() => setActiveCalc(calc.id)}
                  >
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${calc.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium">{calc.label}</span>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorHub;
