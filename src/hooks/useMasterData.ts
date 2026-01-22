import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Hotel, Airline } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

// Hooks for Hotels
export const useHotels = (city?: 'Makkah' | 'Madinah') => {
  return useQuery({
    queryKey: ['hotels', city],
    queryFn: async (): Promise<Hotel[]> => {
      let query = supabase
        .from('hotels')
        .select('*')
        .eq('is_active', true)
        .order('star_rating', { ascending: false })
        .order('name', { ascending: true });

      if (city) {
        query = query.eq('city', city);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Hotel[];
    },
  });
};

export const useAllHotels = () => {
  return useQuery({
    queryKey: ['admin-hotels'],
    queryFn: async (): Promise<Hotel[]> => {
      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .order('city', { ascending: true })
        .order('star_rating', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Hotel[];
    },
  });
};

export const useCreateHotel = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (hotel: Omit<Hotel, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('hotels')
        .insert(hotel)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotels'] });
      queryClient.invalidateQueries({ queryKey: ['admin-hotels'] });
      toast({ title: 'Hotel berhasil ditambahkan' });
    },
    onError: (error: Error) => {
      toast({ title: 'Gagal menambahkan hotel', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdateHotel = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Hotel> & { id: string }) => {
      const { error } = await supabase
        .from('hotels')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotels'] });
      queryClient.invalidateQueries({ queryKey: ['admin-hotels'] });
      toast({ title: 'Hotel berhasil diupdate' });
    },
    onError: (error: Error) => {
      toast({ title: 'Gagal mengupdate hotel', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteHotel = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('hotels')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotels'] });
      queryClient.invalidateQueries({ queryKey: ['admin-hotels'] });
      toast({ title: 'Hotel berhasil dihapus' });
    },
    onError: (error: Error) => {
      toast({ title: 'Gagal menghapus hotel', description: error.message, variant: 'destructive' });
    },
  });
};

// Hooks for Airlines
export const useAirlines = () => {
  return useQuery({
    queryKey: ['airlines'],
    queryFn: async (): Promise<Airline[]> => {
      const { data, error } = await supabase
        .from('airlines')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Airline[];
    },
  });
};

export const useAllAirlines = () => {
  return useQuery({
    queryKey: ['admin-airlines'],
    queryFn: async (): Promise<Airline[]> => {
      const { data, error } = await supabase
        .from('airlines')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Airline[];
    },
  });
};

export const useCreateAirline = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (airline: Omit<Airline, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('airlines')
        .insert(airline)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['airlines'] });
      queryClient.invalidateQueries({ queryKey: ['admin-airlines'] });
      toast({ title: 'Maskapai berhasil ditambahkan' });
    },
    onError: (error: Error) => {
      toast({ title: 'Gagal menambahkan maskapai', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdateAirline = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Airline> & { id: string }) => {
      const { error } = await supabase
        .from('airlines')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['airlines'] });
      queryClient.invalidateQueries({ queryKey: ['admin-airlines'] });
      toast({ title: 'Maskapai berhasil diupdate' });
    },
    onError: (error: Error) => {
      toast({ title: 'Gagal mengupdate maskapai', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteAirline = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('airlines')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['airlines'] });
      queryClient.invalidateQueries({ queryKey: ['admin-airlines'] });
      toast({ title: 'Maskapai berhasil dihapus' });
    },
    onError: (error: Error) => {
      toast({ title: 'Gagal menghapus maskapai', description: error.message, variant: 'destructive' });
    },
  });
};
