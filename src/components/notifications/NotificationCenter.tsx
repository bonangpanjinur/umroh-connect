import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Bell, BellOff, BellRing, 
  FileText, CreditCard, Package, Settings, Plane,
  Volume2, VolumeX, Vibrate, Clock, Trash2, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { usePushNotifications, NotificationType } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';
import UpcomingPayments from '@/components/booking/UpcomingPayments';

interface NotificationCenterProps {
  onBack: () => void;
}

const notificationTypeConfig: Record<NotificationType, {
  icon: React.ElementType;
  label: string;
  color: string;
}> = {
  departure: {
    icon: Plane,
    label: 'Keberangkatan',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  payment: {
    icon: CreditCard,
    label: 'Pembayaran',
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  document: {
    icon: FileText,
    label: 'Dokumen',
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  },
  preparation: {
    icon: Package,
    label: 'Persiapan',
    color: 'bg-green-500/10 text-green-600 border-green-500/20',
  },
  reminder: {
    icon: Bell,
    label: 'Pengingat',
    color: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  },
};

const NotificationCenter = ({ onBack }: NotificationCenterProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('settings');
  
  const {
    isSupported,
    permission,
    preferences,
    scheduledNotifications,
    departureDate,
    requestPermission,
    updatePreferences,
    cancelNotification,
    clearAllScheduled,
    getDepartureCountdown,
    sendPaymentReminder,
    notifyIncompleteDocuments,
  } = usePushNotifications();

  const countdown = getDepartureCountdown();

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast({
        title: 'Notifikasi Aktif! 🔔',
        description: 'Anda akan menerima pengingat persiapan umroh',
      });
    }
  };

  const handleTestNotification = (type: NotificationType) => {
    if (type === 'payment') {
      sendPaymentReminder('Ini adalah test notifikasi pembayaran');
    } else if (type === 'document') {
      notifyIncompleteDocuments(3);
    } else {
      toast({
        title: 'Test Notifikasi',
        description: `Notifikasi ${notificationTypeConfig[type].label} berhasil dikirim`,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Pusat Notifikasi</h1>
            <p className="text-sm text-muted-foreground">Pengingat & Jadwal</p>
          </div>
          {permission === 'granted' && (
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
              <BellRing className="w-3 h-3 mr-1" />
              Aktif
            </Badge>
          )}
        </div>

        {/* Departure Countdown */}
        {countdown && countdown.days >= 0 && (
          <div className="px-4 pb-3">
            <Card className="bg-primary/10 border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/20">
                      <Plane className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {countdown.formattedDate}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {countdown.days === 0 ? 'Hari ini!' : `${countdown.days} hari lagi`}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-primary text-primary-foreground">
                    H-{countdown.days}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        {!isSupported ? (
          <Alert variant="destructive">
            <BellOff className="h-4 w-4" />
            <AlertDescription>
              Browser Anda tidak mendukung notifikasi push. Gunakan browser modern seperti Chrome atau Firefox.
            </AlertDescription>
          </Alert>
        ) : permission === 'denied' ? (
          <Alert variant="destructive">
            <BellOff className="h-4 w-4" />
            <AlertDescription>
              Notifikasi diblokir. Aktifkan melalui pengaturan browser Anda untuk menerima pengingat.
            </AlertDescription>
          </Alert>
        ) : permission !== 'granted' ? (
          <Card className="mb-4">
            <CardContent className="p-4 text-center">
              <BellRing className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Aktifkan Notifikasi</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Dapatkan pengingat keberangkatan, pembayaran, dan kelengkapan dokumen
              </p>
              <Button onClick={handleRequestPermission} className="w-full">
                <Bell className="w-4 h-4 mr-2" />
                Aktifkan Notifikasi Push
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="payments">
                <Wallet className="w-4 h-4 mr-2" />
                Bayar
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-2" />
                Pengaturan
              </TabsTrigger>
              <TabsTrigger value="scheduled">
                <Clock className="w-4 h-4 mr-2" />
                Jadwal
              </TabsTrigger>
            </TabsList>

            <TabsContent value="payments" className="mt-4 space-y-4">
              <UpcomingPayments />
            </TabsContent>

            <TabsContent value="settings" className="mt-4 space-y-4">
              {/* Master Toggle */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Bell className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Notifikasi Push</p>
                        <p className="text-sm text-muted-foreground">
                          Aktifkan semua notifikasi
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.enabled}
                      onCheckedChange={(enabled) => updatePreferences({ enabled })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notification Types */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Jenis Notifikasi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Departure Reminders */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${notificationTypeConfig.departure.color}`}>
                        <Plane className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Pengingat Keberangkatan</p>
                        <p className="text-xs text-muted-foreground">
                          H-30, H-7, H-3, H-1, hari H
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.departureReminders}
                      onCheckedChange={(departureReminders) => 
                        updatePreferences({ departureReminders })
                      }
                      disabled={!preferences.enabled}
                    />
                  </div>

                  {/* Payment Reminders */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${notificationTypeConfig.payment.color}`}>
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Pengingat Pembayaran</p>
                        <p className="text-xs text-muted-foreground">
                          Jadwal pelunasan & DP
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.paymentReminders}
                      onCheckedChange={(paymentReminders) => 
                        updatePreferences({ paymentReminders })
                      }
                      disabled={!preferences.enabled}
                    />
                  </div>

                  {/* Document Reminders */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${notificationTypeConfig.document.color}`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Pengingat Dokumen</p>
                        <p className="text-xs text-muted-foreground">
                          Passport, visa, dokumen wajib
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.documentReminders}
                      onCheckedChange={(documentReminders) => 
                        updatePreferences({ documentReminders })
                      }
                      disabled={!preferences.enabled}
                    />
                  </div>

                  {/* Preparation Reminders */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${notificationTypeConfig.preparation.color}`}>
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Pengingat Persiapan</p>
                        <p className="text-xs text-muted-foreground">
                          Kesehatan, packing, manasik
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.preparationReminders}
                      onCheckedChange={(preparationReminders) => 
                        updatePreferences({ preparationReminders })
                      }
                      disabled={!preferences.enabled}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Sound & Vibration */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Suara & Getaran</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {preferences.soundEnabled ? (
                        <Volume2 className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className="text-sm">Suara Notifikasi</span>
                    </div>
                    <Switch
                      checked={preferences.soundEnabled}
                      onCheckedChange={(soundEnabled) => updatePreferences({ soundEnabled })}
                      disabled={!preferences.enabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Vibrate className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm">Getaran</span>
                    </div>
                    <Switch
                      checked={preferences.vibrationEnabled}
                      onCheckedChange={(vibrationEnabled) => 
                        updatePreferences({ vibrationEnabled })
                      }
                      disabled={!preferences.enabled}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Test Notifications */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Test Notifikasi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestNotification('departure')}
                      disabled={!preferences.enabled}
                    >
                      <Plane className="w-4 h-4 mr-1" />
                      Keberangkatan
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestNotification('payment')}
                      disabled={!preferences.enabled}
                    >
                      <CreditCard className="w-4 h-4 mr-1" />
                      Pembayaran
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestNotification('document')}
                      disabled={!preferences.enabled}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Dokumen
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestNotification('preparation')}
                      disabled={!preferences.enabled}
                    >
                      <Package className="w-4 h-4 mr-1" />
                      Persiapan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scheduled" className="mt-4">
              {scheduledNotifications.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-medium mb-1">Tidak Ada Notifikasi Terjadwal</h3>
                    <p className="text-sm text-muted-foreground">
                      {departureDate 
                        ? 'Semua notifikasi sudah terkirim atau belum dijadwalkan'
                        : 'Atur tanggal keberangkatan untuk menjadwalkan notifikasi'
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {scheduledNotifications.length} notifikasi terjadwal
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={clearAllScheduled}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Hapus Semua
                    </Button>
                  </div>

                  <ScrollArea className="h-[400px]">
                    <AnimatePresence>
                      {scheduledNotifications
                        .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())
                        .map((notification, index) => {
                          const config = notificationTypeConfig[notification.type];
                          const Icon = config.icon;
                          const daysUntil = differenceInDays(notification.scheduledTime, new Date());

                          return (
                            <motion.div
                              key={notification.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -100 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <Card className="mb-2">
                                <CardContent className="p-3">
                                  <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-full ${config.color}`}>
                                      <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className={config.color}>
                                          {config.label}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {daysUntil === 0 ? 'Hari ini' : 
                                           daysUntil === 1 ? 'Besok' : 
                                           `${daysUntil} hari lagi`}
                                        </span>
                                      </div>
                                      <p className="text-sm font-medium truncate">
                                        {notification.title}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {format(notification.scheduledTime, 'EEEE, dd MMM yyyy HH:mm', { locale: id })}
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                      onClick={() => cancelNotification(notification.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                    </AnimatePresence>
                  </ScrollArea>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </motion.div>
  );
};

export default NotificationCenter;
