import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Geofence {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  zone_type: string;
  group_id: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

interface GeofenceAlert {
  id: string;
  geofence_id: string;
  user_id: string;
  user_name: string;
  alert_type: string;
  latitude: number;
  longitude: number;
  distance_from_center: number | null;
  is_acknowledged: boolean;
  created_at: string;
  geofence?: Geofence;
}

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export const useGeofencing = (groupId: string | null) => {
  const { user, profile } = useAuthContext();
  
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [alerts, setAlerts] = useState<GeofenceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userInsideZones, setUserInsideZones] = useState<Set<string>>(new Set());

  // Fetch geofences for the group
  const fetchGeofences = useCallback(async () => {
    if (!groupId) return;

    const { data, error } = await supabase
      .from('geofences')
      .select('*')
      .eq('group_id', groupId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching geofences:', error);
      return;
    }

    setGeofences(data || []);
  }, [groupId]);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    if (!groupId) return;

    const { data, error } = await supabase
      .from('geofence_alerts')
      .select(`
        *,
        geofence:geofences(*)
      `)
      .in('geofence_id', geofences.map(g => g.id))
      .eq('is_acknowledged', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching alerts:', error);
      return;
    }

    setAlerts(data || []);
  }, [groupId, geofences]);

  // Create a new geofence
  const createGeofence = async (
    name: string,
    latitude: number,
    longitude: number,
    radiusMeters: number,
    zoneType: string,
    description?: string
  ) => {
    if (!user || !groupId) return null;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('geofences')
      .insert({
        name,
        description,
        latitude,
        longitude,
        radius_meters: radiusMeters,
        zone_type: zoneType,
        group_id: groupId,
        created_by: user.id,
      })
      .select()
      .single();

    setIsLoading(false);

    if (error) {
      console.error('Error creating geofence:', error);
      toast.error('Gagal membuat zona aman');
      return null;
    }

    toast.success('Zona aman berhasil dibuat');
    fetchGeofences();
    return data;
  };

  // Delete a geofence
  const deleteGeofence = async (geofenceId: string) => {
    const { error } = await supabase
      .from('geofences')
      .delete()
      .eq('id', geofenceId);

    if (error) {
      console.error('Error deleting geofence:', error);
      toast.error('Gagal menghapus zona');
      return false;
    }

    toast.success('Zona berhasil dihapus');
    fetchGeofences();
    return true;
  };

  // Check if user is inside geofences and create alert if exited
  const checkGeofences = useCallback(
    async (latitude: number, longitude: number, userName: string) => {
      if (!user || geofences.length === 0) return;

      const newInsideZones = new Set<string>();

      for (const geofence of geofences) {
        const distance = calculateDistance(
          latitude,
          longitude,
          geofence.latitude,
          geofence.longitude
        );

        const isInside = distance <= geofence.radius_meters;

        if (isInside) {
          newInsideZones.add(geofence.id);
        }

        // Check if user just exited this zone
        if (userInsideZones.has(geofence.id) && !isInside) {
          // User has exited the geofence - create alert
          console.log(`User exited geofence: ${geofence.name}, distance: ${distance}m`);
          
          const { error } = await supabase
            .from('geofence_alerts')
            .insert({
              geofence_id: geofence.id,
              user_id: user.id,
              user_name: userName,
              alert_type: 'exit',
              latitude,
              longitude,
              distance_from_center: Math.round(distance),
            });

          if (error) {
            console.error('Error creating alert:', error);
          } else {
            toast.warning(`⚠️ Anda keluar dari zona ${geofence.name}!`, {
              duration: 10000,
            });
          }
        }
      }

      setUserInsideZones(newInsideZones);
    },
    [user, geofences, userInsideZones]
  );

  // Acknowledge an alert
  const acknowledgeAlert = async (alertId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('geofence_alerts')
      .update({
        is_acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: user.id,
      })
      .eq('id', alertId);

    if (error) {
      console.error('Error acknowledging alert:', error);
      return false;
    }

    setAlerts(prev => prev.filter(a => a.id !== alertId));
    return true;
  };

  // Subscribe to real-time alerts
  useEffect(() => {
    if (!groupId || geofences.length === 0) return;

    const channel = supabase
      .channel(`geofence-alerts-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'geofence_alerts',
        },
        (payload) => {
          const newAlert = payload.new as GeofenceAlert;
          // Only add if it's for one of our geofences
          if (geofences.some(g => g.id === newAlert.geofence_id)) {
            setAlerts(prev => [newAlert, ...prev]);
            
            // Show toast for new alerts from other users
            if (newAlert.user_id !== user?.id) {
              toast.error(
                `🚨 ${newAlert.user_name} keluar dari zona aman!`,
                { duration: 15000 }
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, geofences, user]);

  // Initial fetch
  useEffect(() => {
    fetchGeofences();
  }, [fetchGeofences]);

  useEffect(() => {
    if (geofences.length > 0) {
      fetchAlerts();
    }
  }, [geofences, fetchAlerts]);

  return {
    geofences,
    alerts,
    isLoading,
    createGeofence,
    deleteGeofence,
    checkGeofences,
    acknowledgeAlert,
    refetch: fetchGeofences,
    calculateDistance,
  };
};
