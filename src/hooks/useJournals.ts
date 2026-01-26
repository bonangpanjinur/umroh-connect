import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export type JournalMood = 'grateful' | 'peaceful' | 'emotional' | 'inspired' | 'tired' | 'happy';

export interface Journal {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  mood: JournalMood | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  photos?: JournalPhoto[];
}

export interface JournalPhoto {
  id: string;
  journal_id: string;
  photo_url: string;
  caption: string | null;
  order_index: number;
  created_at: string;
}

export interface CreateJournalInput {
  title: string;
  content?: string;
  location_name?: string;
  latitude?: number;
  longitude?: number;
  mood?: JournalMood;
  is_public?: boolean;
}

export interface UpdateJournalInput extends Partial<CreateJournalInput> {
  id: string;
}

export const useJournals = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['journals', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('journals')
        .select(`
          *,
          photos:journal_photos(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Journal[];
    },
    enabled: !!user
  });
};

export const useJournal = (journalId: string | null) => {
  return useQuery({
    queryKey: ['journal', journalId],
    queryFn: async () => {
      if (!journalId) return null;

      const { data, error } = await supabase
        .from('journals')
        .select(`
          *,
          photos:journal_photos(*)
        `)
        .eq('id', journalId)
        .single();

      if (error) throw error;
      return data as Journal;
    },
    enabled: !!journalId
  });
};

export const useCreateJournal = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateJournalInput) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('journals')
        .insert({
          ...input,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
      toast({
        title: 'Jurnal Tersimpan',
        description: 'Catatan jurnal berhasil disimpan'
      });
    },
    onError: (error) => {
      toast({
        title: 'Gagal Menyimpan',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

export const useUpdateJournal = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateJournalInput) => {
      const { data, error } = await supabase
        .from('journals')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
      queryClient.invalidateQueries({ queryKey: ['journal', data.id] });
      toast({
        title: 'Jurnal Diperbarui',
        description: 'Perubahan berhasil disimpan'
      });
    },
    onError: (error) => {
      toast({
        title: 'Gagal Memperbarui',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

export const useDeleteJournal = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (journalId: string) => {
      const { error } = await supabase
        .from('journals')
        .delete()
        .eq('id', journalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
      toast({
        title: 'Jurnal Dihapus',
        description: 'Catatan jurnal berhasil dihapus'
      });
    },
    onError: (error) => {
      toast({
        title: 'Gagal Menghapus',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

export const useUploadJournalPhoto = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ file, journalId }: { file: File; journalId: string }) => {
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${journalId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('journal-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('journal-photos')
        .getPublicUrl(fileName);

      // Add photo to journal_photos table
      const { data, error } = await supabase
        .from('journal_photos')
        .insert({
          journal_id: journalId,
          photo_url: urlData.publicUrl,
          order_index: Date.now()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onError: (error) => {
      toast({
        title: 'Gagal Upload Foto',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

export const useDeleteJournalPhoto = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (photoId: string) => {
      const { error } = await supabase
        .from('journal_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
    onError: (error) => {
      toast({
        title: 'Gagal Menghapus Foto',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

// Mood helpers
export const getMoodEmoji = (mood: JournalMood): string => {
  const emojis: Record<JournalMood, string> = {
    grateful: '🤲',
    peaceful: '☮️',
    emotional: '🥹',
    inspired: '✨',
    tired: '😴',
    happy: '😊'
  };
  return emojis[mood];
};

export const getMoodLabel = (mood: JournalMood): string => {
  const labels: Record<JournalMood, string> = {
    grateful: 'Bersyukur',
    peaceful: 'Damai',
    emotional: 'Haru',
    inspired: 'Terinspirasi',
    tired: 'Lelah',
    happy: 'Bahagia'
  };
  return labels[mood];
};
