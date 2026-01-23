import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PrayerCategory {
  id: string;
  name: string;
  name_arabic: string | null;
  description: string | null;
  icon: string | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Prayer {
  id: string;
  category_id: string | null;
  title: string;
  title_arabic: string | null;
  arabic_text: string;
  transliteration: string | null;
  translation: string | null;
  source: string | null;
  benefits: string | null;
  audio_url: string | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: PrayerCategory;
}

// Categories hooks
export const usePrayerCategories = () => {
  return useQuery({
    queryKey: ['prayer-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prayer_categories')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (error) throw error;
      return data as PrayerCategory[];
    }
  });
};

export const useAllPrayerCategories = () => {
  return useQuery({
    queryKey: ['admin-prayer-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prayer_categories')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      return data as PrayerCategory[];
    }
  });
};

export const useCreatePrayerCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (category: Omit<PrayerCategory, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('prayer_categories')
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-prayer-categories'] });
      toast({ title: 'Kategori berhasil ditambahkan' });
    },
    onError: (error) => {
      toast({ title: 'Gagal menambahkan kategori', description: error.message, variant: 'destructive' });
    }
  });
};

export const useUpdatePrayerCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<PrayerCategory> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('prayer_categories')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-prayer-categories'] });
      toast({ title: 'Kategori berhasil diperbarui' });
    },
    onError: (error) => {
      toast({ title: 'Gagal memperbarui kategori', description: error.message, variant: 'destructive' });
    }
  });
};

export const useDeletePrayerCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('prayer_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-prayer-categories'] });
      toast({ title: 'Kategori berhasil dihapus' });
    },
    onError: (error) => {
      toast({ title: 'Gagal menghapus kategori', description: error.message, variant: 'destructive' });
    }
  });
};

// Prayers hooks
export const usePrayers = (categoryId?: string) => {
  return useQuery({
    queryKey: ['prayers', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('prayers')
        .select(`
          *,
          category:prayer_categories(*)
        `)
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Prayer[];
    }
  });
};

export const useAllPrayers = () => {
  return useQuery({
    queryKey: ['admin-prayers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prayers')
        .select(`
          *,
          category:prayer_categories(*)
        `)
        .order('priority', { ascending: true });

      if (error) throw error;
      return data as Prayer[];
    }
  });
};

export const usePrayer = (prayerId: string | null) => {
  return useQuery({
    queryKey: ['prayer', prayerId],
    queryFn: async () => {
      if (!prayerId) return null;

      const { data, error } = await supabase
        .from('prayers')
        .select(`
          *,
          category:prayer_categories(*)
        `)
        .eq('id', prayerId)
        .single();

      if (error) throw error;
      return data as Prayer;
    },
    enabled: !!prayerId
  });
};

export const useCreatePrayer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (prayer: Omit<Prayer, 'id' | 'created_at' | 'updated_at' | 'category'>) => {
      const { data, error } = await supabase
        .from('prayers')
        .insert(prayer)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-prayers'] });
      toast({ title: 'Doa berhasil ditambahkan' });
    },
    onError: (error) => {
      toast({ title: 'Gagal menambahkan doa', description: error.message, variant: 'destructive' });
    }
  });
};

export const useUpdatePrayer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Prayer> & { id: string }) => {
      const { category, ...updateData } = data;
      const { data: result, error } = await supabase
        .from('prayers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-prayers'] });
      queryClient.invalidateQueries({ queryKey: ['prayer'] });
      toast({ title: 'Doa berhasil diperbarui' });
    },
    onError: (error) => {
      toast({ title: 'Gagal memperbarui doa', description: error.message, variant: 'destructive' });
    }
  });
};

export const useDeletePrayer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('prayers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-prayers'] });
      toast({ title: 'Doa berhasil dihapus' });
    },
    onError: (error) => {
      toast({ title: 'Gagal menghapus doa', description: error.message, variant: 'destructive' });
    }
  });
};

// Audio upload hook
export const useUploadPrayerAudio = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ file, prayerId }: { file: File; prayerId: string }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${prayerId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('prayer-audio')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('prayer-audio')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    },
    onError: (error) => {
      toast({ title: 'Gagal upload audio', description: error.message, variant: 'destructive' });
    }
  });
};
