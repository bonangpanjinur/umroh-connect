import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseUntyped as supabase } from '@/lib/supabase';
import { Travel, Package, Departure } from '@/types/database';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

// Get agent's travel
export const useAgentTravel = () => {
  const { profile } = useAuthContext();
  
  return useQuery({
    queryKey: ['agent-travel', profile?.id],
    queryFn: async (): Promise<Travel | null> => {
      if (!profile?.id) return null;
      
      const { data, error } = await supabase
        .from('travels')
        .select('*')
        .eq('owner_id', profile.id)
        .maybeSingle();

      if (error) throw error;
      return data as Travel | null;
    },
    enabled: !!profile?.id,
  });
};

// Create travel for agent
export const useCreateTravel = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuthContext();

  return useMutation({
    mutationFn: async (travelData: Partial<Travel>) => {
      if (!profile?.id) throw new Error('Profile not found');
      
      const { data, error } = await supabase
        .from('travels')
        .insert([{ ...travelData, owner_id: profile.id } as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-travel'] });
      toast({ title: 'Travel berhasil dibuat!' });
    },
    onError: (error: any) => {
      toast({ title: 'Gagal membuat travel', description: error.message, variant: 'destructive' });
    },
  });
};

// Update travel
export const useUpdateTravel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Travel> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('travels')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-travel'] });
      toast({ title: 'Travel berhasil diupdate!' });
    },
    onError: (error: any) => {
      toast({ title: 'Gagal update travel', description: error.message, variant: 'destructive' });
    },
  });
};

// Get agent's packages
export const useAgentPackages = (travelId: string | undefined) => {
  return useQuery({
    queryKey: ['agent-packages', travelId],
    queryFn: async (): Promise<Package[]> => {
      if (!travelId) return [];
      
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('travel_id', travelId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Package[];
    },
    enabled: !!travelId,
  });
};

// Create package
export const useCreatePackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (packageData: Partial<Package>) => {
      const { data, error } = await supabase
        .from('packages')
        .insert([packageData as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-packages'] });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast({ title: 'Paket berhasil dibuat!' });
    },
    onError: (error: any) => {
      toast({ title: 'Gagal membuat paket', description: error.message, variant: 'destructive' });
    },
  });
};

// Update package
export const useUpdatePackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Package> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('packages')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-packages'] });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast({ title: 'Paket berhasil diupdate!' });
    },
    onError: (error: any) => {
      toast({ title: 'Gagal update paket', description: error.message, variant: 'destructive' });
    },
  });
};

// Delete package
export const useDeletePackage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (packageId: string) => {
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', packageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-packages'] });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast({ title: 'Paket berhasil dihapus!' });
    },
    onError: (error: any) => {
      toast({ title: 'Gagal hapus paket', description: error.message, variant: 'destructive' });
    },
  });
};

// Get departures for a package
export const usePackageDepartures = (packageId: string | undefined) => {
  return useQuery({
    queryKey: ['package-departures', packageId],
    queryFn: async (): Promise<Departure[]> => {
      if (!packageId) return [];
      
      const { data, error } = await supabase
        .from('departures')
        .select('*')
        .eq('package_id', packageId)
        .order('departure_date', { ascending: true });

      if (error) throw error;
      return (data || []) as Departure[];
    },
    enabled: !!packageId,
  });
};

// Create departure
export const useCreateDeparture = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (departureData: Partial<Departure>) => {
      const { data, error } = await supabase
        .from('departures')
        .insert([departureData as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['package-departures'] });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast({ title: 'Jadwal keberangkatan berhasil ditambah!' });
    },
    onError: (error: any) => {
      toast({ title: 'Gagal menambah jadwal', description: error.message, variant: 'destructive' });
    },
  });
};

// Update departure
export const useUpdateDeparture = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Departure> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('departures')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['package-departures'] });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast({ title: 'Jadwal berhasil diupdate!' });
    },
    onError: (error: any) => {
      toast({ title: 'Gagal update jadwal', description: error.message, variant: 'destructive' });
    },
  });
};

// Delete departure
export const useDeleteDeparture = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (departureId: string) => {
      const { error } = await supabase
        .from('departures')
        .delete()
        .eq('id', departureId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['package-departures'] });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      toast({ title: 'Jadwal berhasil dihapus!' });
    },
    onError: (error: any) => {
      toast({ title: 'Gagal hapus jadwal', description: error.message, variant: 'destructive' });
    },
  });
};
