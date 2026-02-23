import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Bell, ShoppingBag, MessageSquare, CreditCard, Volume2, Smartphone, Loader2 } from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { toast } from 'sonner';

const NotificationPreferencesPanel = () => {
  const { preferences, isLoading, updatePreferences } = useNotificationPreferences();

  const handleToggle = (key: string, value: boolean) => {
    updatePreferences.mutate(
      { [key]: value },
      { onSuccess: () => toast.success('Preferensi notifikasi diperbarui') }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const eventToggles = [
    {
      key: 'notify_new_order',
      label: 'Pesanan Baru',
      description: 'Notifikasi saat ada pesanan baru masuk',
      icon: ShoppingBag,
      value: preferences.notify_new_order,
    },
    {
      key: 'notify_status_change',
      label: 'Perubahan Status',
      description: 'Notifikasi saat status pesanan berubah',
      icon: Bell,
      value: preferences.notify_status_change,
    },
    {
      key: 'notify_chat_message',
      label: 'Pesan Chat',
      description: 'Notifikasi saat ada pesan baru',
      icon: MessageSquare,
      value: preferences.notify_chat_message,
    },
    {
      key: 'notify_payment_reminder',
      label: 'Pengingat Pembayaran',
      description: 'Notifikasi pengingat jatuh tempo pembayaran',
      icon: CreditCard,
      value: preferences.notify_payment_reminder,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Pengaturan Notifikasi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Toggles */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Jenis Notifikasi</p>
          {eventToggles.map((toggle) => (
            <div key={toggle.key} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <toggle.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <Label className="text-sm font-medium">{toggle.label}</Label>
                  <p className="text-xs text-muted-foreground">{toggle.description}</p>
                </div>
              </div>
              <Switch
                checked={toggle.value}
                onCheckedChange={(val) => handleToggle(toggle.key, val)}
              />
            </div>
          ))}
        </div>

        <Separator />

        {/* Sound & Push */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Pengaturan Umum</p>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Volume2 className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <Label className="text-sm font-medium">Suara Notifikasi</Label>
                <p className="text-xs text-muted-foreground">Putar suara saat notifikasi masuk</p>
              </div>
            </div>
            <Switch
              checked={preferences.sound_enabled}
              onCheckedChange={(val) => handleToggle('sound_enabled', val)}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Smartphone className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <Label className="text-sm font-medium">Push Notification</Label>
                <p className="text-xs text-muted-foreground">Terima notifikasi meskipun browser tertutup</p>
              </div>
            </div>
            <Switch
              checked={preferences.push_enabled}
              onCheckedChange={(val) => handleToggle('push_enabled', val)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationPreferencesPanel;
