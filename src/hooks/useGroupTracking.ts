import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface TrackingGroup {
  id: string;
  name: string;
  code: string;
  created_by: string;
  travel_id: string | null;
  is_active: boolean;
  created_at: string;
}

interface GroupLocation {
  id: string;
  group_id: string;
  user_id: string;
  user_name: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  battery_level: number | null;
  last_updated: string;
  is_sharing: boolean;
}

export const useGroupTracking = () => {
  const { user, profile } = useAuthContext();
  const { toast } = useToast();
  const [groups, setGroups] = useState<TrackingGroup[]>([]);
  const [currentGroup, setCurrentGroup] = useState<TrackingGroup | null>(null);
  const [locations, setLocations] = useState<GroupLocation[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Fetch user's groups
  const fetchGroups = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('tracking_groups')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  }, [user]);

  // Create a new group
  const createGroup = async (name: string) => {
    if (!user) {
      toast({ title: 'Login diperlukan', variant: 'destructive' });
      return null;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tracking_groups')
        .insert({
          name,
          created_by: user.id,
          code: '' // Will be auto-generated
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Grup berhasil dibuat!' });
      await fetchGroups();
      return data;
    } catch (error: any) {
      toast({ 
        title: 'Gagal membuat grup', 
        description: error.message,
        variant: 'destructive' 
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Join a group by code
  const joinGroup = async (code: string) => {
    if (!user || !profile) {
      toast({ title: 'Login diperlukan', variant: 'destructive' });
      return false;
    }

    setIsLoading(true);
    try {
      // Find group by code
      const { data: group, error: groupError } = await supabase
        .from('tracking_groups')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (groupError || !group) {
        toast({ 
          title: 'Grup tidak ditemukan', 
          description: 'Pastikan kode grup benar',
          variant: 'destructive' 
        });
        return false;
      }

      // Add user to group with initial location (0,0 - will be updated)
      const { error: joinError } = await supabase
        .from('group_locations')
        .upsert({
          group_id: group.id,
          user_id: user.id,
          user_name: profile.full_name || 'Jamaah',
          latitude: 0,
          longitude: 0,
          is_sharing: false
        }, {
          onConflict: 'group_id,user_id'
        });

      if (joinError) throw joinError;

      toast({ title: `Berhasil bergabung ke ${group.name}!` });
      setCurrentGroup(group);
      await fetchGroups();
      return true;
    } catch (error: any) {
      toast({ 
        title: 'Gagal bergabung', 
        description: error.message,
        variant: 'destructive' 
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Start sharing location
  const startSharing = useCallback(async (groupId: string) => {
    if (!user || !profile) return;
    if (!navigator.geolocation) {
      toast({ 
        title: 'Geolocation tidak didukung', 
        variant: 'destructive' 
      });
      return;
    }

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Get battery level if available
        let batteryLevel = null;
        try {
          const battery = await (navigator as any).getBattery?.();
          if (battery) {
            batteryLevel = Math.round(battery.level * 100);
          }
        } catch (e) {
          // Battery API not available
        }

        // Update location in database
        await supabase
          .from('group_locations')
          .upsert({
            group_id: groupId,
            user_id: user.id,
            user_name: profile.full_name || 'Jamaah',
            latitude,
            longitude,
            accuracy,
            battery_level: batteryLevel,
            last_updated: new Date().toISOString(),
            is_sharing: true
          }, {
            onConflict: 'group_id,user_id'
          });
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({ 
          title: 'Error mendapatkan lokasi', 
          description: error.message,
          variant: 'destructive' 
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    setWatchId(id);
    setIsSharing(true);
    toast({ title: 'Lokasi sedang dibagikan' });
  }, [user, profile, toast]);

  // Stop sharing location
  const stopSharing = useCallback(async (groupId: string) => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }

    if (user) {
      await supabase
        .from('group_locations')
        .update({ is_sharing: false })
        .eq('group_id', groupId)
        .eq('user_id', user.id);
    }

    setIsSharing(false);
    toast({ title: 'Berhenti berbagi lokasi' });
  }, [watchId, user, toast]);

  // Subscribe to group locations
  const subscribeToGroup = useCallback((groupId: string) => {
    // Initial fetch
    const fetchLocations = async () => {
      const { data } = await supabase
        .from('group_locations')
        .select('*')
        .eq('group_id', groupId);
      
      if (data) setLocations(data);
    };
    fetchLocations();

    // Realtime subscription
    const channel = supabase
      .channel(`group-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_locations',
          filter: `group_id=eq.${groupId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setLocations(prev => {
              const existing = prev.findIndex(l => l.id === payload.new.id);
              if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = payload.new as GroupLocation;
                return updated;
              }
              return [...prev, payload.new as GroupLocation];
            });
          } else if (payload.eventType === 'DELETE') {
            setLocations(prev => prev.filter(l => l.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Leave group
  const leaveGroup = async (groupId: string) => {
    if (!user) return;

    await stopSharing(groupId);
    
    await supabase
      .from('group_locations')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id);

    setCurrentGroup(null);
    setLocations([]);
    toast({ title: 'Keluar dari grup' });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
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
    leaveGroup,
    fetchGroups
  };
};
