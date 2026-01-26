import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Local types since Supabase types may not be updated yet
type ChecklistCategory = 'dokumen' | 'perlengkapan' | 'kesehatan' | 'mental';

interface Checklist {
  id: string;
  title: string;
  description: string | null;
  category: ChecklistCategory;
  phase: string;
  priority: number;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserChecklist {
  id: string;
  user_id: string;
  checklist_id: string;
  is_checked: boolean;
  checked_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ChecklistWithProgress extends Checklist {
  userProgress?: UserChecklist;
}

// Fetch all checklists with user progress
export const useChecklists = () => {
  return useQuery({
    queryKey: ['checklists'],
    queryFn: async (): Promise<Checklist[]> => {
      const { data, error } = await (supabase as any)
        .from('checklists')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;
      return data as Checklist[];
    },
  });
};

// Fetch user's checklist progress
export const useUserChecklistProgress = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-checklists', userId],
    queryFn: async (): Promise<UserChecklist[]> => {
      if (!userId) return [];
      
      const { data, error } = await (supabase as any)
        .from('user_checklists')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data as UserChecklist[];
    },
    enabled: !!userId,
  });
};

// Combined hook: checklists with progress
export const useChecklistsWithProgress = (userId: string | undefined) => {
  const { data: checklists, isLoading: checklistsLoading } = useChecklists();
  const { data: progress, isLoading: progressLoading } = useUserChecklistProgress(userId);

  const checklistsWithProgress: ChecklistWithProgress[] = (checklists || []).map(checklist => ({
    ...checklist,
    userProgress: progress?.find(p => p.checklist_id === checklist.id),
  }));

  return {
    data: checklistsWithProgress,
    isLoading: checklistsLoading || progressLoading,
  };
};

// Toggle checklist item
export const useToggleChecklist = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      checklistId, 
      isChecked 
    }: { 
      userId: string; 
      checklistId: string; 
      isChecked: boolean;
    }) => {
      if (isChecked) {
        // Upsert: create or update to checked
        const { error } = await (supabase as any)
          .from('user_checklists')
          .upsert({
            user_id: userId,
            checklist_id: checklistId,
            is_checked: true,
            checked_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,checklist_id'
          });

        if (error) throw error;
      } else {
        // Update to unchecked
        const { error } = await (supabase as any)
          .from('user_checklists')
          .update({
            is_checked: false,
            checked_at: null,
          })
          .eq('user_id', userId)
          .eq('checklist_id', checklistId);

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-checklists', variables.userId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal menyimpan',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Update checklist notes
export const useUpdateChecklistNotes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      userId, 
      checklistId, 
      notes 
    }: { 
      userId: string; 
      checklistId: string; 
      notes: string;
    }) => {
      const { error } = await (supabase as any)
        .from('user_checklists')
        .upsert({
          user_id: userId,
          checklist_id: checklistId,
          notes,
        }, {
          onConflict: 'user_id,checklist_id'
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-checklists', variables.userId] });
    },
  });
};

// Get checklist statistics
export const useChecklistStats = (userId: string | undefined) => {
  const { data, isLoading } = useChecklistsWithProgress(userId);

  const stats = {
    total: data.length,
    completed: data.filter(c => c.userProgress?.is_checked).length,
    percentage: data.length > 0 
      ? Math.round((data.filter(c => c.userProgress?.is_checked).length / data.length) * 100) 
      : 0,
    byCategory: {
      dokumen: {
        total: data.filter(c => c.category === 'dokumen').length,
        completed: data.filter(c => c.category === 'dokumen' && c.userProgress?.is_checked).length,
      },
      perlengkapan: {
        total: data.filter(c => c.category === 'perlengkapan').length,
        completed: data.filter(c => c.category === 'perlengkapan' && c.userProgress?.is_checked).length,
      },
      kesehatan: {
        total: data.filter(c => c.category === 'kesehatan').length,
        completed: data.filter(c => c.category === 'kesehatan' && c.userProgress?.is_checked).length,
      },
      mental: {
        total: data.filter(c => c.category === 'mental').length,
        completed: data.filter(c => c.category === 'mental' && c.userProgress?.is_checked).length,
      },
    },
    byPhase: {
      'H-30': {
        total: data.filter(c => c.phase === 'H-30').length,
        completed: data.filter(c => c.phase === 'H-30' && c.userProgress?.is_checked).length,
      },
      'H-7': {
        total: data.filter(c => c.phase === 'H-7').length,
        completed: data.filter(c => c.phase === 'H-7' && c.userProgress?.is_checked).length,
      },
    },
  };

  return { stats, isLoading };
};
