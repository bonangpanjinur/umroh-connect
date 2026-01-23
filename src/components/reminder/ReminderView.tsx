import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Bell, BellOff, Calendar, Check, ChevronRight, 
  Clock, Plus, Settings, Trash2, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { useReminders } from '@/hooks/useReminders';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  ReminderPhase, 
  getPhaseLabel, 
  getCategoryLabel, 
  getPriorityColor 
} from '@/data/reminderData';
import { FeatureLock } from '@/components/common/FeatureLock';

interface ReminderViewProps {
  onBack: () => void;
  onViewPackages?: () => void;
}

const phases: ReminderPhase[] = ['H-30', 'H-7', 'H-1', 'during', 'after'];

const ReminderView = ({ onBack, onViewPackages }: ReminderViewProps) => {
  const [activePhase, setActivePhase] = useState<ReminderPhase>('H-30');
  const [showSettings, setShowSettings] = useState(false);
  
  const {
    departureDate,
    currentPhase,
    setDepartureDate,
    getRemindersByPhase,
    toggleReminderComplete,
    toggleReminderNotification,
    getProgress,
    getPhaseProgress,
    getUpcomingReminders
  } = useReminders();

  const {
    isSupported,
    permission,
    requestPermission,
    showNotification
  } = useNotifications();

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      showNotification('Notifikasi Aktif! 🕌', {
        body: 'Anda akan menerima pengingat persiapan umroh'
      });
    }
  };

  const daysUntilDeparture = departureDate 
    ? differenceInDays(departureDate, new Date()) 
    : null;

  const progress = getProgress();
  const upcomingReminders = getUpcomingReminders(3);
  const phaseReminders = getRemindersByPhase(activePhase);

  if (showSettings) {
    return (
      <ReminderSettings
        departureDate={departureDate}
        onSetDepartureDate={setDepartureDate}
        isNotificationSupported={isSupported}
        notificationPermission={permission}
        onRequestPermission={handleRequestPermission}
        onBack={() => setShowSettings(false)}
      />
    );
  }

  return (
    <FeatureLock
      featureName="Pengingat Persiapan"
      description="Fitur pengingat hanya tersedia untuk jamaah yang sudah melakukan booking paket umroh."
      onViewPackages={onViewPackages}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-background"
      >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Pengingat</h1>
              <p className="text-sm text-muted-foreground">Persiapan Umroh</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Departure Date Banner */}
        {departureDate ? (
          <div className="px-4 pb-3">
            <Card className="bg-primary/10 border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/20">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Keberangkatan: {format(departureDate, 'dd MMMM yyyy', { locale: id })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {daysUntilDeparture !== null && daysUntilDeparture >= 0
                          ? `${daysUntilDeparture} hari lagi`
                          : daysUntilDeparture !== null
                          ? `${Math.abs(daysUntilDeparture)} hari yang lalu`
                          : ''
                        }
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    {getPhaseLabel(currentPhase)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="px-4 pb-3">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Atur tanggal keberangkatan untuk pengingat</span>
                <Button size="sm" variant="outline" onClick={() => setShowSettings(true)}>
                  Atur
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Progress */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Progress Persiapan</span>
            <span className="text-sm font-medium">{progress.completed}/{progress.total}</span>
          </div>
          <Progress value={progress.percentage} className="h-2" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-20 space-y-4">
        {/* Upcoming Reminders */}
        {upcomingReminders.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pengingat Mendatang
            </h3>
            <div className="space-y-2">
              {upcomingReminders.map((reminder) => (
                <Card key={reminder.id} className="border-accent/30 bg-accent/5">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-accent/20">
                          <Bell className="w-4 h-4 text-accent-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{reminder.title}</p>
                          <p className="text-xs text-muted-foreground">
                            H-{reminder.daysBeforeDeparture} • {getCategoryLabel(reminder.category)}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => toggleReminderComplete(reminder.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Phase Tabs */}
        <Tabs value={activePhase} onValueChange={(v) => setActivePhase(v as ReminderPhase)}>
          <TabsList className="w-full overflow-x-auto hide-scrollbar flex justify-start">
            {phases.map((phase) => {
              const phaseProgress = getPhaseProgress(phase);
              return (
                <TabsTrigger 
                  key={phase} 
                  value={phase}
                  className="relative whitespace-nowrap"
                >
                  {getPhaseLabel(phase).replace(' Hari', '')}
                  {phaseProgress.completed > 0 && (
                    <span className="ml-1 text-xs">
                      ({phaseProgress.completed}/{phaseProgress.total})
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {phases.map((phase) => (
            <TabsContent key={phase} value={phase} className="mt-4 space-y-3">
              <AnimatePresence mode="wait">
                {phaseReminders.map((reminder, index) => (
                  <motion.div
                    key={reminder.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={reminder.isCompleted ? 'opacity-60' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Button
                            variant={reminder.isCompleted ? 'default' : 'outline'}
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-full"
                            onClick={() => toggleReminderComplete(reminder.id)}
                          >
                            {reminder.isCompleted && <Check className="w-4 h-4" />}
                          </Button>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={getPriorityColor(reminder.priority)}>
                                {reminder.priority === 'high' ? 'Penting' : 
                                 reminder.priority === 'medium' ? 'Sedang' : 'Rendah'}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {getCategoryLabel(reminder.category)}
                              </Badge>
                            </div>
                            <h4 className={`font-medium ${reminder.isCompleted ? 'line-through' : ''}`}>
                              {reminder.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {reminder.description}
                            </p>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => toggleReminderNotification(reminder.id)}
                          >
                            {reminder.notificationEnabled ? (
                              <Bell className="w-4 h-4 text-primary" />
                            ) : (
                              <BellOff className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {phaseReminders.length === 0 && (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Tidak ada pengingat untuk fase ini</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </motion.div>
    </FeatureLock>
  );
};

// Settings Component
interface ReminderSettingsProps {
  departureDate: Date | null;
  onSetDepartureDate: (date: Date | null) => void;
  isNotificationSupported: boolean;
  notificationPermission: NotificationPermission;
  onRequestPermission: () => void;
  onBack: () => void;
}

const ReminderSettings = ({
  departureDate,
  onSetDepartureDate,
  isNotificationSupported,
  notificationPermission,
  onRequestPermission,
  onBack
}: ReminderSettingsProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(departureDate || undefined);

  const handleSaveDate = () => {
    onSetDepartureDate(selectedDate || null);
    onBack();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Pengaturan Pengingat</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Departure Date */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Tanggal Keberangkatan
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Atur tanggal keberangkatan umroh Anda untuk menerima pengingat yang tepat waktu
            </p>
            
            <div className="flex justify-center">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={id}
                className="rounded-md border"
              />
            </div>

            {selectedDate && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">Tanggal dipilih:</p>
                <p className="font-medium text-foreground">
                  {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: id })}
                </p>
              </div>
            )}

            <Button className="w-full mt-4" onClick={handleSaveDate}>
              Simpan Tanggal
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notifikasi Push
            </h3>

            {!isNotificationSupported ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Browser Anda tidak mendukung notifikasi push
                </AlertDescription>
              </Alert>
            ) : notificationPermission === 'granted' ? (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/40">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    Notifikasi aktif
                  </span>
                </div>
              </div>
            ) : notificationPermission === 'denied' ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Notifikasi diblokir. Aktifkan melalui pengaturan browser.
                </AlertDescription>
              </Alert>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Izinkan notifikasi untuk menerima pengingat persiapan umroh
                </p>
                <Button onClick={onRequestPermission} className="w-full">
                  <Bell className="w-4 h-4 mr-2" />
                  Aktifkan Notifikasi
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Install PWA Prompt */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Install Aplikasi
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Install Arah Umroh ke layar utama untuk akses cepat dan notifikasi yang lebih baik
            </p>
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p className="font-medium mb-2">Cara Install:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>iOS: Ketuk <strong>Share</strong> → <strong>Add to Home Screen</strong></li>
                <li>Android: Ketuk <strong>Menu (⋮)</strong> → <strong>Install app</strong></li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default ReminderView;
