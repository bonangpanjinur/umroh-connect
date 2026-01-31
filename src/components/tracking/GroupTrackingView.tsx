import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Users, Copy, Plus, LogIn, LogOut, Navigation, 
  Battery, Clock, Share2, ArrowLeft, Wifi, WifiOff, X, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGroupTracking } from '@/hooks/useGroupTracking';
import { useGeofencing } from '@/hooks/useGeofencing';
import { useAuthContext } from '@/contexts/AuthContext'; // FIXED: Changed from useAuth to useAuthContext
import { useToast } from '@/hooks/use-toast';
import { GeofenceManager } from './GeofenceManager';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FeatureLock } from "@/components/common/FeatureLock";

interface GroupTrackingViewProps {
  onBack?: () => void;
}

// Custom marker icons
const createMarkerIcon = (color: string, isCurrentUser: boolean = false) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        width: ${isCurrentUser ? '20px' : '16px'};
        height: ${isCurrentUser ? '20px' : '16px'};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ${isCurrentUser ? 'animation: pulse 2s infinite;' : ''}
      "></div>
    `,
    iconSize: [isCurrentUser ? 20 : 16, isCurrentUser ? 20 : 16],
    iconAnchor: [isCurrentUser ? 10 : 8, isCurrentUser ? 10 : 8]
  });
};

// Map center component
const MapCenter = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    if (center[0] !== 0 && center[1] !== 0) {
      map.setView(center, 16);
    }
  }, [center, map]);
  return null;
};

const GroupTrackingView = ({ onBack }: GroupTrackingViewProps) => {
  const { user, profile } = useAuthContext(); // FIXED
  const { toast } = useToast();
  const {
    groups,
    currentGroup,
    setCurrentGroup,
    locations,
    isSharing,
    isLoading,
    createGroup,
    joinGroup,
    startSharing,
    stopSharing,
    subscribeToGroup,
    leaveGroup
  } = useGroupTracking();

  const {
    geofences,
    alerts,
    isLoading: isGeofenceLoading,
    createGeofence,
    deleteGeofence,
    checkGeofences,
    acknowledgeAlert,
  } = useGeofencing(currentGroup?.id || null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([21.4225, 39.8262]); // Makkah default
  const [activeTab, setActiveTab] = useState('map');
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Subscribe to group when selected
  useEffect(() => {
    if (currentGroup) {
      const unsubscribe = subscribeToGroup(currentGroup.id);
      return unsubscribe;
    }
  }, [currentGroup, subscribeToGroup]);

  // Update map center to user's location and check geofences
  useEffect(() => {
    if (user && locations.length > 0) {
      const myLocation = locations.find(l => l.user_id === user.id);
      if (myLocation && myLocation.latitude !== 0) {
        setMapCenter([myLocation.latitude, myLocation.longitude]);
        setCurrentLocation({ latitude: myLocation.latitude, longitude: myLocation.longitude });
        
        // Check geofences when location updates
        if (profile?.full_name) {
          checkGeofences(myLocation.latitude, myLocation.longitude, profile.full_name);
        }
      }
    }
  }, [locations, user, profile, checkGeofences]);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    const group = await createGroup(groupName);
    if (group) {
      setCurrentGroup(group);
      setShowCreateModal(false);
      setGroupName('');
    }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) return;
    const success = await joinGroup(joinCode);
    if (success) {
      setShowJoinModal(false);
      setJoinCode('');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Kode disalin!' });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const getBatteryColor = (level: number | null) => {
    if (!level) return 'text-muted-foreground';
    if (level > 50) return 'text-green-500';
    if (level > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Helper function to render content to keep return clean
  const renderContent = () => {
    if (!user) {
      return (
        <div className="min-h-screen bg-background p-4">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-lg">Tracking Grup</h2>
          </div>
          <Card className="p-8 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Login Diperlukan</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Silakan login untuk menggunakan fitur tracking grup
            </p>
            <Button asChild>
              <a href="/auth">Masuk / Daftar</a>
            </Button>
          </Card>
        </div>
      );
    }

    // Group detail view
    if (currentGroup) {
      const activeLocations = locations.filter(l => l.is_sharing && l.latitude !== 0);
      
      return (
        <div className="min-h-screen bg-background flex flex-col">
          {/* Header */}
          <div className="sticky top-0 bg-card z-20 p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setCurrentGroup(null)} className="p-2 rounded-full hover:bg-muted">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="font-bold text-lg">{currentGroup.name}</h2>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono">
                      {currentGroup.code}
                    </Badge>
                    <button onClick={() => copyCode(currentGroup.code)}>
                      <Copy className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {alerts.length > 0 && (
                  <Badge variant="destructive" className="gap-1 animate-pulse">
                    ⚠️ {alerts.length}
                  </Badge>
                )}
                <Badge variant="secondary" className="gap-1">
                  <Users className="w-3 h-3" />
                  {locations.length}
                </Badge>
              </div>
            </div>
            
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-3">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="map" className="gap-2">
                  <MapPin className="w-4 h-4" />
                  Peta
                </TabsTrigger>
                <TabsTrigger value="geofence" className="gap-2">
                  <Shield className="w-4 h-4" />
                  Zona Aman
                  {geofences.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {geofences.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {activeTab === 'map' ? (
            <>
              {/* Map */}
              <div className="flex-1 relative">
                <MapContainer
                  center={mapCenter}
                  zoom={16}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapCenter center={mapCenter} />
                  
                  {/* Geofence circles */}
                  {geofences.map((geofence) => (
                    <Circle
                      key={geofence.id}
                      center={[geofence.latitude, geofence.longitude]}
                      radius={geofence.radius_meters}
                      pathOptions={{
                        color: geofence.zone_type === 'masjid' ? '#10b981' : '#3b82f6',
                        fillColor: geofence.zone_type === 'masjid' ? '#10b981' : '#3b82f6',
                        fillOpacity: 0.15,
                        weight: 2,
                        dashArray: '5, 5',
                      }}
                    >
                      <Popup>
                        <div className="text-center">
                          <p className="font-semibold">{geofence.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Radius: {geofence.radius_meters}m
                          </p>
                        </div>
                      </Popup>
                    </Circle>
                  ))}
                  
                  {/* User markers */}
                  {activeLocations.map((loc) => (
                    <Marker
                      key={loc.id}
                      position={[loc.latitude, loc.longitude]}
                      icon={createMarkerIcon(
                        loc.user_id === user.id ? '#10b981' : '#3b82f6',
                        loc.user_id === user.id
                      )}
                    >
                      <Popup>
                        <div className="text-center min-w-[120px]">
                          <p className="font-semibold">{loc.user_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(loc.last_updated)}
                          </p>
                          {loc.battery_level && (
                            <p className={`text-xs ${getBatteryColor(loc.battery_level)}`}>
                              🔋 {loc.battery_level}%
                            </p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>

                {/* Member List Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent pb-4 pt-12 z-[400]">
                  <ScrollArea className="max-h-40">
                    <div className="px-4 space-y-2">
                      {locations.map((loc) => (
                        <Card 
                          key={loc.id} 
                          className={`p-3 flex items-center justify-between ${
                            loc.user_id === user.id ? 'border-primary' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              loc.is_sharing && loc.latitude !== 0 ? 'bg-green-500' : 'bg-muted'
                            }`} />
                            <div>
                              <p className="font-medium text-sm">
                                {loc.user_name}
                                {loc.user_id === user.id && (
                                  <span className="text-xs text-primary ml-1">(Anda)</span>
                                )}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {formatTime(loc.last_updated)}
                                {loc.battery_level && (
                                  <>
                                    <Battery className={`w-3 h-3 ${getBatteryColor(loc.battery_level)}`} />
                                    {loc.battery_level}%
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          {loc.is_sharing ? (
                            <Wifi className="w-4 h-4 text-green-500" />
                          ) : (
                            <WifiOff className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </>
          ) : (
            <ScrollArea className="flex-1 p-4">
              <GeofenceManager
                geofences={geofences}
                alerts={alerts}
                onCreateGeofence={createGeofence}
                onDeleteGeofence={deleteGeofence}
                onAcknowledgeAlert={acknowledgeAlert}
                currentLocation={currentLocation}
                isLoading={isGeofenceLoading}
              />
            </ScrollArea>
          )}

          {/* Bottom Controls */}
          <div className="p-4 bg-card border-t space-y-2">
            <div className="flex gap-2">
              {isSharing ? (
                <Button 
                  variant="destructive" 
                  className="flex-1 gap-2"
                  onClick={() => stopSharing(currentGroup.id)}
                >
                  <Navigation className="w-4 h-4" />
                  Berhenti Berbagi
                </Button>
              ) : (
                <Button 
                  className="flex-1 gap-2"
                  onClick={() => startSharing(currentGroup.id)}
                >
                  <Navigation className="w-4 h-4" />
                  Bagikan Lokasi
                </Button>
              )}
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => {
                  const text = `Bergabung ke grup tracking "${currentGroup.name}"!\nKode: ${currentGroup.code}`;
                  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                  window.open(url, '_blank');
                }}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
            <Button 
              variant="ghost" 
              className="w-full text-destructive hover:text-destructive gap-2"
              onClick={() => leaveGroup(currentGroup.id)}
            >
              <LogOut className="w-4 h-4" />
              Keluar dari Grup
            </Button>
          </div>
        </div>
      );
    }

    // Group list view
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 bg-card z-10 p-4 border-b">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-bold text-lg">Tracking Grup</h2>
              <p className="text-xs text-muted-foreground">Pantau lokasi rombongan real-time</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-6 h-6 text-primary" />
              <span className="text-sm">Buat Grup</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => setShowJoinModal(true)}
            >
              <LogIn className="w-6 h-6 text-primary" />
              <span className="text-sm">Gabung Grup</span>
            </Button>
          </div>

          {/* Groups List */}
          <div>
            <h3 className="font-semibold mb-3">Grup Saya</h3>
            {groups.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  Belum ada grup. Buat atau gabung grup untuk memulai tracking.
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {groups.map((group) => (
                  <Card 
                    key={group.id}
                    className="p-4 cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setCurrentGroup(group)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{group.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="font-mono">
                            {group.code}
                          </Badge>
                          <span>•</span>
                          <span>{new Date(group.created_at).toLocaleDateString('id-ID')}</span>
                        </div>
                      </div>
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Group Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCreateModal(false)}
                className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-sm bg-card rounded-3xl p-6"
              >
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 bg-secondary rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
                <h3 className="font-bold text-lg mb-4">Buat Grup Baru</h3>
                <Input
                  placeholder="Nama grup (mis: Rombongan Masjid Al-Ikhlas)"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="mb-4"
                />
                <Button 
                  className="w-full" 
                  onClick={handleCreateGroup}
                  disabled={isLoading || !groupName.trim()}
                >
                  {isLoading ? 'Membuat...' : 'Buat Grup'}
                </Button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Join Group Modal */}
        <AnimatePresence>
          {showJoinModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowJoinModal(false)}
                className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-sm bg-card rounded-3xl p-6"
              >
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 bg-secondary rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
                <h3 className="font-bold text-lg mb-4">Gabung Grup</h3>
                <Input
                  placeholder="Masukkan kode grup (6 karakter)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="mb-4 text-center font-mono text-lg tracking-widest"
                />
                <Button 
                  className="w-full" 
                  onClick={handleJoinGroup}
                  disabled={isLoading || joinCode.length !== 6}
                >
                  {isLoading ? 'Bergabung...' : 'Gabung'}
                </Button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <FeatureLock 
      featureId="group_tracking" 
      title="Pelacakan Jemaah Real-time"
      description="Pantau lokasi anggota keluarga atau rombongan Anda secara real-time saat di Tanah Suci. Fitur ini membutuhkan akses Premium untuk memastikan server pelacakan berjalan optimal."
    >
      {renderContent()}
    </FeatureLock>
  );
};

export default GroupTrackingView;