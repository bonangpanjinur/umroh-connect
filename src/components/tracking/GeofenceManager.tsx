import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, Trash2, MapPin, Building, Landmark, X, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface Geofence {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  zone_type: string;
  is_active: boolean;
}

interface GeofenceAlert {
  id: string;
  user_name: string;
  alert_type: string;
  distance_from_center: number | null;
  created_at: string;
  geofence?: Geofence;
}

interface GeofenceManagerProps {
  geofences: Geofence[];
  alerts: GeofenceAlert[];
  onCreateGeofence: (
    name: string,
    latitude: number,
    longitude: number,
    radiusMeters: number,
    zoneType: string,
    description?: string
  ) => Promise<any>;
  onDeleteGeofence: (id: string) => Promise<boolean>;
  onAcknowledgeAlert: (id: string) => Promise<boolean>;
  currentLocation: { latitude: number; longitude: number } | null;
  isLoading: boolean;
}

const zoneTypeIcons: Record<string, typeof Building> = {
  hotel: Building,
  masjid: Landmark,
  custom: MapPin,
};

const zoneTypeLabels: Record<string, string> = {
  hotel: 'Hotel',
  masjid: 'Masjid',
  custom: 'Area Kustom',
};

export const GeofenceManager = ({
  geofences,
  alerts,
  onCreateGeofence,
  onDeleteGeofence,
  onAcknowledgeAlert,
  currentLocation,
  isLoading,
}: GeofenceManagerProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [zoneType, setZoneType] = useState('hotel');
  const [radius, setRadius] = useState([500]);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');

  const handleCreate = async () => {
    const lat = useCurrentLocation ? currentLocation?.latitude : parseFloat(customLat);
    const lng = useCurrentLocation ? currentLocation?.longitude : parseFloat(customLng);

    if (!lat || !lng || !name.trim()) return;

    await onCreateGeofence(name.trim(), lat, lng, radius[0], zoneType, description || undefined);
    
    // Reset form
    setName('');
    setDescription('');
    setRadius([500]);
    setShowAddForm(false);
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h3 className="font-semibold text-destructive">
                Peringatan Aktif ({alerts.length})
              </h3>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-2 bg-background rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{alert.user_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Keluar dari {alert.geofence?.name || 'zona'} • {formatTime(alert.created_at)}
                      {alert.distance_from_center && (
                        <> • {formatDistance(alert.distance_from_center)} dari pusat</>
                      )}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAcknowledgeAlert(alert.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Geofences List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Zona Aman ({geofences.length})
          </h3>
          <Button
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            variant={showAddForm ? 'outline' : 'default'}
          >
            {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>

        {/* Add Geofence Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label htmlFor="name">Nama Zona</Label>
                    <Input
                      id="name"
                      placeholder="Contoh: Hotel Al-Safwa"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Tipe Zona</Label>
                    <Select value={zoneType} onValueChange={setZoneType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hotel">🏨 Hotel</SelectItem>
                        <SelectItem value="masjid">🕌 Masjid</SelectItem>
                        <SelectItem value="custom">📍 Area Kustom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Radius: {radius[0]} meter</Label>
                    <Slider
                      value={radius}
                      onValueChange={setRadius}
                      min={100}
                      max={2000}
                      step={50}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Jamaah akan mendapat notifikasi jika keluar dari radius ini
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="description">Deskripsi (Opsional)</Label>
                    <Input
                      id="description"
                      placeholder="Catatan tambahan..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useCurrentLoc"
                      checked={useCurrentLocation}
                      onChange={(e) => setUseCurrentLocation(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="useCurrentLoc" className="text-sm cursor-pointer">
                      Gunakan lokasi saat ini
                    </Label>
                  </div>

                  {!useCurrentLocation && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="lat">Latitude</Label>
                        <Input
                          id="lat"
                          type="number"
                          step="any"
                          placeholder="21.4225"
                          value={customLat}
                          onChange={(e) => setCustomLat(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lng">Longitude</Label>
                        <Input
                          id="lng"
                          type="number"
                          step="any"
                          placeholder="39.8262"
                          value={customLng}
                          onChange={(e) => setCustomLng(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    onClick={handleCreate}
                    disabled={
                      isLoading ||
                      !name.trim() ||
                      (useCurrentLocation && !currentLocation) ||
                      (!useCurrentLocation && (!customLat || !customLng))
                    }
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Buat Zona Aman
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Existing Geofences */}
        {geofences.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center">
              <Shield className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Belum ada zona aman. Buat zona untuk memantau posisi jamaah.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {geofences.map((geofence) => {
              const Icon = zoneTypeIcons[geofence.zone_type] || MapPin;
              return (
                <motion.div
                  key={geofence.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Card>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{geofence.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {formatDistance(geofence.radius_meters)}
                            </Badge>
                            <span>{zoneTypeLabels[geofence.zone_type]}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onDeleteGeofence(geofence.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
