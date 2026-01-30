import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTodayMeals, useLogMeal, useSkipMeal, useMealStats } from '@/hooks/useMealTracking';
import { Moon, Sun, Droplets, Utensils, Check, X, Leaf, Apple } from 'lucide-react';
import { motion } from 'framer-motion';

interface MealFormData {
  waterGlasses: number;
  proteinSource: string;
  carbSource: string;
  vegetables: string;
  fruits: string;
  notes: string;
}

const MealTrackingView = () => {
  const { user } = useAuthContext();
  const { data: todayMeals } = useTodayMeals(user?.id);
  const stats = useMealStats(user?.id);
  const logMeal = useLogMeal();
  const skipMeal = useSkipMeal();

  const [activeTab, setActiveTab] = useState<'sahur' | 'iftar'>('sahur');
  const [formData, setFormData] = useState<MealFormData>({
    waterGlasses: 2,
    proteinSource: '',
    carbSource: '',
    vegetables: '',
    fruits: '',
    notes: '',
  });

  const sahurLog = todayMeals?.find(m => m.meal_type === 'sahur');
  const iftarLog = todayMeals?.find(m => m.meal_type === 'iftar');
  const currentLog = activeTab === 'sahur' ? sahurLog : iftarLog;

  const handleSubmit = () => {
    if (!user) return;
    logMeal.mutate({
      userId: user.id,
      mealType: activeTab,
      waterGlasses: formData.waterGlasses,
      proteinSource: formData.proteinSource || undefined,
      carbSource: formData.carbSource || undefined,
      vegetables: formData.vegetables || undefined,
      fruits: formData.fruits || undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleSkip = () => {
    if (!user) return;
    skipMeal.mutate({ userId: user.id, mealType: activeTab });
  };

  if (!user) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-muted-foreground">
          Silakan login untuk tracking makan
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
          <CardContent className="p-3 text-center">
            <Droplets className="w-5 h-5 mx-auto mb-1 text-blue-600" />
            <p className="text-lg font-bold">{stats.avgWaterGlasses}</p>
            <p className="text-xs text-muted-foreground">Avg Air/Hari</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
          <CardContent className="p-3 text-center">
            <Leaf className="w-5 h-5 mx-auto mb-1 text-green-600" />
            <p className="text-lg font-bold">{stats.healthyMeals}</p>
            <p className="text-xs text-muted-foreground">Makan Sehat</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10">
          <CardContent className="p-3 text-center">
            <Utensils className="w-5 h-5 mx-auto mb-1 text-amber-600" />
            <p className="text-lg font-bold">{stats.totalSahur + stats.totalIftar}</p>
            <p className="text-xs text-muted-foreground">Total Log</p>
          </CardContent>
        </Card>
      </div>

      {/* Meal Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'sahur' | 'iftar')}>
          <CardHeader className="pb-2">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="sahur" className="gap-2">
                <Moon className="w-4 h-4" />
                Sahur
                {sahurLog && (
                  <Badge variant={sahurLog.is_skipped ? 'secondary' : 'default'} className="ml-1 scale-75">
                    {sahurLog.is_skipped ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="iftar" className="gap-2">
                <Sun className="w-4 h-4" />
                Berbuka
                {iftarLog && (
                  <Badge variant={iftarLog.is_skipped ? 'secondary' : 'default'} className="ml-1 scale-75">
                    {iftarLog.is_skipped ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            {currentLog ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                {currentLog.is_skipped ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <X className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>{activeTab === 'sahur' ? 'Sahur' : 'Berbuka'} di-skip hari ini</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                      <Droplets className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">{currentLog.water_glasses} gelas air</span>
                    </div>
                    
                    {currentLog.protein_source && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                        <span className="text-lg">🍗</span>
                        <div>
                          <p className="text-xs text-muted-foreground">Protein</p>
                          <p className="font-medium">{currentLog.protein_source}</p>
                        </div>
                      </div>
                    )}

                    {currentLog.carb_source && (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                        <span className="text-lg">🍚</span>
                        <div>
                          <p className="text-xs text-muted-foreground">Karbohidrat</p>
                          <p className="font-medium">{currentLog.carb_source}</p>
                        </div>
                      </div>
                    )}

                    {currentLog.vegetables && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                        <Leaf className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">Sayuran</p>
                          <p className="font-medium">{currentLog.vegetables}</p>
                        </div>
                      </div>
                    )}

                    {currentLog.fruits && (
                      <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                        <Apple className="w-5 h-5 text-orange-600" />
                        <div>
                          <p className="text-xs text-muted-foreground">Buah</p>
                          <p className="font-medium">{currentLog.fruits}</p>
                        </div>
                      </div>
                    )}

                    {currentLog.is_healthy && (
                      <Badge className="bg-green-100 text-green-700">
                        ✓ Makan Sehat
                      </Badge>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="space-y-4">
                {/* Water intake */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-600" />
                    Air Putih (gelas)
                  </Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(num => (
                      <Button
                        key={num}
                        variant={formData.waterGlasses === num ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, waterGlasses: num }))}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Protein */}
                <div className="space-y-2">
                  <Label>Protein (opsional)</Label>
                  <Input
                    placeholder="Telur, ayam, ikan..."
                    value={formData.proteinSource}
                    onChange={(e) => setFormData(prev => ({ ...prev, proteinSource: e.target.value }))}
                  />
                </div>

                {/* Carbs */}
                <div className="space-y-2">
                  <Label>Karbohidrat (opsional)</Label>
                  <Input
                    placeholder="Nasi, roti, oatmeal..."
                    value={formData.carbSource}
                    onChange={(e) => setFormData(prev => ({ ...prev, carbSource: e.target.value }))}
                  />
                </div>

                {/* Vegetables */}
                <div className="space-y-2">
                  <Label>Sayuran (opsional)</Label>
                  <Input
                    placeholder="Bayam, wortel..."
                    value={formData.vegetables}
                    onChange={(e) => setFormData(prev => ({ ...prev, vegetables: e.target.value }))}
                  />
                </div>

                {/* Fruits */}
                <div className="space-y-2">
                  <Label>Buah (opsional)</Label>
                  <Input
                    placeholder="Kurma, pisang..."
                    value={formData.fruits}
                    onChange={(e) => setFormData(prev => ({ ...prev, fruits: e.target.value }))}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Catatan (opsional)</Label>
                  <Textarea
                    placeholder="Catatan tambahan..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSubmit}
                    disabled={logMeal.isPending}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Simpan
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleSkip}
                    disabled={skipMeal.isPending}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Skip
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default MealTrackingView;
