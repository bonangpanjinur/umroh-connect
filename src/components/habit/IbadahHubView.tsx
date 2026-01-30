import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Flame, Heart, Activity, Moon, Sparkles, ArrowRight, Settings
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import HabitView from './HabitView';
import SedekahView from './SedekahView';
import OlahragaView from './OlahragaView';
import RamadhanDashboard from './RamadhanDashboard';

interface IbadahHubViewProps {
  onOpenTasbih?: () => void;
}

export const IbadahHubView = ({ onOpenTasbih }: IbadahHubViewProps) => {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('ibadah');
  const [isRamadhanMode, setIsRamadhanMode] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('ramadhan_mode');
    return saved === 'true';
  });

  // Save Ramadhan mode to localStorage
  useEffect(() => {
    localStorage.setItem('ramadhan_mode', isRamadhanMode.toString());
  }, [isRamadhanMode]);

  if (!user) {
    return (
      <div className="p-4 text-center">
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Masuk untuk Melacak Ibadah</h3>
            <p className="text-muted-foreground text-sm">
              Login untuk mulai tracking ibadah, sedekah, dan olahraga Anda
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Ramadhan Mode Toggle */}
      <div className="px-4 pt-3 pb-2">
        <Card className={`transition-all duration-300 ${
          isRamadhanMode 
            ? 'bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-300 dark:border-purple-700' 
            : 'bg-muted/50'
        }`}>
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isRamadhanMode 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-muted'
              }`}>
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">Mode Ramadhan</p>
                  {isRamadhanMode && (
                    <Badge className="bg-purple-500 text-white text-[10px]">
                      Aktif
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isRamadhanMode 
                    ? 'Dashboard & fitur Ramadhan aktif' 
                    : 'Aktifkan untuk fitur khusus Ramadhan'}
                </p>
              </div>
            </div>
            <Switch 
              checked={isRamadhanMode} 
              onCheckedChange={setIsRamadhanMode}
              className="data-[state=checked]:bg-purple-500"
            />
          </CardContent>
        </Card>
      </div>

      {/* Ramadhan Dashboard (only when mode is active) */}
      {isRamadhanMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 py-2"
        >
          <Button 
            variant="outline" 
            className="w-full justify-between bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-purple-200 dark:border-purple-800 hover:border-purple-400"
            onClick={() => setActiveTab('ramadhan')}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="font-medium">Lihat Dashboard Ramadhan</span>
            </div>
            <ArrowRight className="w-4 h-4 text-purple-500" />
          </Button>
        </motion.div>
      )}

      {/* Main Tabs */}
      <div className="px-4 pt-2 sticky top-0 bg-background z-20">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4 h-auto">
            <TabsTrigger value="ibadah" className="text-xs py-2.5 gap-1.5">
              <Flame className="w-4 h-4" />
              Ibadah
            </TabsTrigger>
            <TabsTrigger value="sedekah" className="text-xs py-2.5 gap-1.5">
              <Heart className="w-4 h-4" />
              Sedekah
            </TabsTrigger>
            <TabsTrigger value="olahraga" className="text-xs py-2.5 gap-1.5">
              <Activity className="w-4 h-4" />
              Olahraga
            </TabsTrigger>
            {isRamadhanMode && (
              <TabsTrigger value="ramadhan" className="text-xs py-2.5 gap-1.5">
                <Moon className="w-4 h-4" />
                Ramadhan
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === 'ibadah' && (
          <motion.div
            key="ibadah"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <HabitView onOpenTasbih={onOpenTasbih} isRamadhanMode={isRamadhanMode} />
          </motion.div>
        )}

        {activeTab === 'sedekah' && (
          <motion.div
            key="sedekah"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <SedekahView />
          </motion.div>
        )}

        {activeTab === 'olahraga' && (
          <motion.div
            key="olahraga"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <OlahragaView isRamadhanMode={isRamadhanMode} />
          </motion.div>
        )}

        {activeTab === 'ramadhan' && isRamadhanMode && (
          <motion.div
            key="ramadhan"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <RamadhanDashboard />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IbadahHubView;
