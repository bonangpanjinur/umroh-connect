import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, BellOff, Calendar, CreditCard, FileText, 
  Heart, Volume2, VolumeX, Vibrate, Check, X,
  Loader2, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePushNotifications, NotificationType } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';

const PushNotificationSettings = () => {
  const { user } = useAuthContext();
  const {
    isSupported,
    permission,
    preferences,
    scheduledNotifications,
    departureDate,
    requestPermission,
    subscribeToPush,
    updatePreferences,
    getDepartureCountdown,
    clearAllScheduled,
  } = usePushNotifications();

  const [isRequesting, setIsRequesting] = useState(false);
  const departureCountdown = getDepartureCountdown();

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const result = await requestPermission();
      if (result) {
        // If user is logged in, subscribe to push notifications
        if (user) {
          await subscribeToPush(user.id);
        }
        toast.success('Notifikasi diaktifkan!');
        updatePreferences({ enabled: true });
      } else {
        toast.error('Izin notifikasi ditolak. Aktifkan di pengaturan browser.');
      }
    } catch (e) {
      console.error('Error requesting permission:', e);
      toast.error('Gagal mengaktifkan notifikasi');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleToggleAll = (enabled: boolean) => {
    updatePreferences({ enabled });
    if (!enabled) {
      clearAllScheduled();
    }
  };

  if (!isSupported) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
        <CardContent className="p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Notifikasi Tidak Didukung
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Browser Anda tidak mendukung notifikasi push
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Permission Status */}
      {permission !== 'granted' ? (
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Aktifkan Notifikasi</h3>
                <p className="text-xs text-muted-foreground">
                  Dapatkan reminder pembayaran & keberangkatan
                </p>
              </div>
            </div>
            <Button 
              onClick={handleRequestPermission} 
              className="w-full"
              disabled={isRequesting}
            >
              {isRequesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Mengaktifkan...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Izinkan Notifikasi
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Master Toggle */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {preferences.enabled ? (
                    <Bell className="w-5 h-5 text-primary" />
                  ) : (
                    <BellOff className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">Push Notification</p>
                    <p className="text-xs text-muted-foreground">
                      {preferences.enabled ? 'Aktif' : 'Nonaktif'}
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={preferences.enabled} 
                  onCheckedChange={handleToggleAll}
                />
              </div>
            </CardContent>
          </Card>

          {preferences.enabled && (
            <>
              {/* Departure Countdown */}
              {departureCountdown && (
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-bold text-green-800 dark:text-green-200">
                          H-{departureCountdown.days} Menuju Keberangkatan
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {departureCountdown.formattedDate}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notification Categories */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Kategori Notifikasi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">Keberangkatan</p>
                        <p className="text-xs text-muted-foreground">H-30, H-7, H-1</p>
                      </div>
                    </div>
                    <Switch 
                      checked={preferences.departureReminders}
                      onCheckedChange={(val) => updatePreferences({ departureReminders: val })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Pembayaran</p>
                        <p className="text-xs text-muted-foreground">Reminder & deadline</p>
                      </div>
                    </div>
                    <Switch 
                      checked={preferences.paymentReminders}
                      onCheckedChange={(val) => updatePreferences({ paymentReminders: val })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <div>
                        <p className="text-sm font-medium">Dokumen</p>
                        <p className="text-xs text-muted-foreground">Passport, visa, checklist</p>
                      </div>
                    </div>
                    <Switch 
                      checked={preferences.documentReminders}
                      onCheckedChange={(val) => updatePreferences({ documentReminders: val })}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Heart className="w-4 h-4 text-red-500" />
                      <div>
                        <p className="text-sm font-medium">Persiapan</p>
                        <p className="text-xs text-muted-foreground">Kesehatan, packing, manasik</p>
                      </div>
                    </div>
                    <Switch 
                      checked={preferences.preparationReminders}
                      onCheckedChange={(val) => updatePreferences({ preparationReminders: val })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Sound & Vibration */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Pengaturan Lainnya</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {preferences.soundEnabled ? (
                        <Volume2 className="w-4 h-4 text-primary" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">Suara Notifikasi</span>
                    </div>
                    <Switch 
                      checked={preferences.soundEnabled}
                      onCheckedChange={(val) => updatePreferences({ soundEnabled: val })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Vibrate className="w-4 h-4 text-primary" />
                      <span className="text-sm">Getar</span>
                    </div>
                    <Switch 
                      checked={preferences.vibrationEnabled}
                      onCheckedChange={(val) => updatePreferences({ vibrationEnabled: val })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Scheduled Notifications */}
              {scheduledNotifications.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Notifikasi Terjadwal</CardTitle>
                      <Badge variant="secondary">{scheduledNotifications.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {scheduledNotifications.slice(0, 5).map((notif) => (
                        <div 
                          key={notif.id} 
                          className="flex items-center gap-2 text-xs p-2 bg-secondary/50 rounded-lg"
                        >
                          <Check className="w-3 h-3 text-green-600 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{notif.title}</p>
                            <p className="text-muted-foreground truncate">{notif.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default PushNotificationSettings;
