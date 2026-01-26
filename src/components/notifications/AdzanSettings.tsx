import { Bell, BellOff, Volume2, VolumeX, Vibrate, Clock, MapPin, TestTube, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdzanNotifications, PrayerId } from '@/hooks/useAdzanNotifications';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { toast } from 'sonner';
import { useState } from 'react';

const AdzanSettings = () => {
  const {
    isSupported,
    permission,
    preferences,
    scheduledAdzans,
    nextScheduledAdzan,
    prayerNames,
    requestPermission,
    updatePreferences,
    togglePrayer,
    enableAll,
    disableAll,
    sendTestNotification,
  } = useAdzanNotifications();

  const { times, location, loading, currentPrayer, prayerList } = usePrayerTimes();
  const [testingPrayer, setTestingPrayer] = useState<PrayerId | null>(null);

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success('Izin notifikasi diberikan');
      await enableAll();
    } else {
      toast.error('Izin notifikasi ditolak');
    }
  };

  const handleTestNotification = async (prayerId: PrayerId) => {
    setTestingPrayer(prayerId);
    const success = await sendTestNotification(prayerId);
    if (success) {
      toast.success(`Test notifikasi ${prayerNames[prayerId].name} terkirim`);
    }
    setTimeout(() => setTestingPrayer(null), 1000);
  };

  if (!isSupported) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <BellOff className="h-5 w-5" />
            Notifikasi Tidak Didukung
          </CardTitle>
          <CardDescription>
            Browser Anda tidak mendukung notifikasi push. Gunakan browser modern seperti Chrome, Firefox, atau Safari.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Location & Current Prayer */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">
                {loading ? 'Mencari lokasi...' : location ? `${location.city}${location.country ? `, ${location.country}` : ''}` : 'Lokasi tidak tersedia'}
              </span>
            </div>
            {currentPrayer && (
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                <Clock className="h-3 w-3 mr-1" />
                {currentPrayer.name} {currentPrayer.time}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Permission Request */}
      {permission !== 'granted' && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Aktifkan Notifikasi Adzan
            </CardTitle>
            <CardDescription>
              Dapatkan pengingat saat waktu sholat tiba, bahkan saat aplikasi tertutup.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRequestPermission} className="w-full">
              <Bell className="h-4 w-4 mr-2" />
              Izinkan Notifikasi
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Settings */}
      {permission === 'granted' && (
        <>
          {/* Master Toggle */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Notifikasi Adzan</CardTitle>
                  <CardDescription>Aktifkan pengingat waktu sholat</CardDescription>
                </div>
                <Switch
                  checked={preferences.enabled}
                  onCheckedChange={(enabled) => {
                    if (enabled) {
                      enableAll();
                    } else {
                      disableAll();
                    }
                  }}
                />
              </div>
            </CardHeader>
          </Card>

          {/* Prayer Times Toggle */}
          <AnimatePresence>
            {preferences.enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Jadwal Sholat</CardTitle>
                    <CardDescription>Pilih sholat yang ingin diingatkan</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {prayerList.map((prayer) => (
                      <div
                        key={prayer.id}
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                          prayer.active ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">
                            {prayerNames[prayer.id as PrayerId].emoji}
                          </div>
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {prayer.name}
                              {prayer.active && (
                                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                                  Sekarang
                                </Badge>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground font-arabic">
                              {prayer.arabic} • {prayer.time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleTestNotification(prayer.id as PrayerId)}
                            disabled={!preferences.prayers[prayer.id as PrayerId]}
                          >
                            {testingPrayer === prayer.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <TestTube className="h-4 w-4" />
                            )}
                          </Button>
                          <Switch
                            checked={preferences.prayers[prayer.id as PrayerId]}
                            onCheckedChange={(enabled) => togglePrayer(prayer.id as PrayerId, enabled)}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reminder Settings */}
          <AnimatePresence>
            {preferences.enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Pengaturan Pengingat</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Reminder Before */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">Pengingat Sebelum Adzan</p>
                          <p className="text-xs text-muted-foreground">Notifikasi persiapan sholat</p>
                        </div>
                      </div>
                      <Select
                        value={String(preferences.reminderMinutes)}
                        onValueChange={(value) => updatePreferences({ reminderMinutes: Number(value) })}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Tidak</SelectItem>
                          <SelectItem value="5">5 menit</SelectItem>
                          <SelectItem value="10">10 menit</SelectItem>
                          <SelectItem value="15">15 menit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Sound */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {preferences.soundEnabled ? (
                          <Volume2 className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <VolumeX className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium text-sm">Suara Notifikasi</p>
                          <p className="text-xs text-muted-foreground">Bunyi saat adzan tiba</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.soundEnabled}
                        onCheckedChange={(enabled) => updatePreferences({ soundEnabled: enabled })}
                      />
                    </div>

                    {/* Vibration */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Vibrate className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">Getaran</p>
                          <p className="text-xs text-muted-foreground">Getar saat notifikasi</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.vibrationEnabled}
                        onCheckedChange={(enabled) => updatePreferences({ vibrationEnabled: enabled })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scheduled Notifications Info */}
          {preferences.enabled && scheduledAdzans.length > 0 && (
            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bell className="h-4 w-4" />
                  <span>
                    {scheduledAdzans.filter(s => !s.isReminder).length} notifikasi adzan dijadwalkan
                  </span>
                </div>
                {nextScheduledAdzan && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Berikutnya: {nextScheduledAdzan.prayerName} pukul{' '}
                    {nextScheduledAdzan.scheduledTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default AdzanSettings;
