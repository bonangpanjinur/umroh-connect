import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  AdminStats, 
  Membership, 
  Banner, 
  PackageCredits, 
  CreditTransaction,
  PlatformSetting,
  Travel,
  Profile
} from '@/types/database';

// Fetch admin statistics
export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<AdminStats> => {
      // Fetch all counts in parallel
      const [
        usersResult,
        agentsResult,
        travelsResult,
        packagesResult,
        activeMembersResult,
        pendingMembersResult,
        revenueResult
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('user_roles').select('id', { count: 'exact', head: true }).eq('role', 'agent'),
        supabase.from('travels').select('id', { count: 'exact', head: true }),
        supabase.from('packages').select('id', { count: 'exact', head: true }),
        supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('memberships').select('amount').eq('status', 'active')
      ]);

      const totalRevenue = (revenueResult.data || []).reduce((sum, m) => sum + (m.amount || 0), 0);

      return {
        totalUsers: usersResult.count || 0,
        totalAgents: agentsResult.count || 0,
        totalTravels: travelsResult.count || 0,
        totalPackages: packagesResult.count || 0,
        activeMembers: activeMembersResult.count || 0,
        pendingMembers: pendingMembersResult.count || 0,
        totalRevenue
      };
    }
  });
};

// Fetch all users with profiles
export const useAllUsers = () => {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Profile[];
    }
  });
};

// Fetch all travels with owner info
export const useAllTravels = () => {
  return useQuery({
    queryKey: ['admin-travels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('travels')
        .select(`
          *,
          owner:profiles!travels_owner_id_fkey(id, full_name, phone, user_id)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};

// Fetch all memberships
export const useMemberships = () => {
  return useQuery({
    queryKey: ['admin-memberships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memberships')
        .select(`
          *,
          travel:travels(id, name, logo_url, phone, whatsapp)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (Membership & { travel: Travel })[];
    }
  });
};

// Update membership
export const useUpdateMembership = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Membership> & { id: string }) => {
      const { data, error } = await supabase
        .from('memberships')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-memberships'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    }
  });
};

// Fetch all banners
export const useBanners = () => {
  return useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('priority', { ascending: false });
      
      if (error) throw error;
      return data as Banner[];
    }
  });
};

// Create banner
export const useCreateBanner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (banner: Omit<Banner, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('banners')
        .insert(banner)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
    }
  });
};

// Update banner
export const useUpdateBanner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Banner> & { id: string }) => {
      const { data, error } = await supabase
        .from('banners')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
    }
  });
};

// Delete banner
export const useDeleteBanner = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
    }
  });
};

// Fetch package credits
export const usePackageCredits = () => {
  return useQuery({
    queryKey: ['admin-credits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('package_credits')
        .select(`
          *,
          travel:travels(id, name, logo_url)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (PackageCredits & { travel: Travel })[];
    }
  });
};

// Add credits to travel
export const useAddCredits = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ travel_id, amount, notes }: { travel_id: string; amount: number; notes?: string }) => {
      // First, upsert the credits
      const { data: existingCredits } = await supabase
        .from('package_credits')
        .select('*')
        .eq('travel_id', travel_id)
        .single();

      if (existingCredits) {
        await supabase
          .from('package_credits')
          .update({
            credits_remaining: existingCredits.credits_remaining + amount,
            last_purchase_date: new Date().toISOString()
          })
          .eq('id', existingCredits.id);
      } else {
        await supabase
          .from('package_credits')
          .insert({
            travel_id,
            credits_remaining: amount,
            last_purchase_date: new Date().toISOString()
          });
      }

      // Record transaction
      const { error } = await supabase
        .from('credit_transactions')
        .insert({
          travel_id,
          transaction_type: 'bonus',
          amount,
          notes: notes || 'Admin bonus'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-credits'] });
    }
  });
};

// Fetch credit transactions
export const useCreditTransactions = () => {
  return useQuery({
    queryKey: ['admin-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select(`
          *,
          travel:travels(id, name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as (CreditTransaction & { travel: Travel })[];
    }
  });
};

// Fetch platform settings
export const usePlatformSettings = () => {
  return useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*');
      
      if (error) throw error;
      return data as PlatformSetting[];
    }
  });
};

// Update platform setting
export const useUpdatePlatformSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, any> }) => {
      const { data, error } = await supabase
        .from('platform_settings')
        .update({ value })
        .eq('key', key)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
    }
  });
};

// Update user role
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: 'jamaah' | 'agent' | 'admin' }) => {
      // Update profile role
      await supabase
        .from('profiles')
        .update({ role })
        .eq('user_id', user_id);

      // Update or insert user_roles
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user_id)
        .single();

      if (existingRole) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', user_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    }
  });
};

// Verify/unverify travel
export const useVerifyTravel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const { error } = await supabase
        .from('travels')
        .update({ verified })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-travels'] });
    }
  });
};

// Create new travel (admin)
export const useCreateTravel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (travel: {
      name: string;
      phone: string;
      whatsapp?: string | null;
      email?: string | null;
      address?: string | null;
      description?: string | null;
      verified?: boolean;
      owner_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('travels')
        .insert({
          name: travel.name,
          phone: travel.phone,
          whatsapp: travel.whatsapp,
          email: travel.email,
          address: travel.address,
          description: travel.description,
          verified: travel.verified || false,
          owner_id: travel.owner_id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-travels'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    }
  });
};

// Delete travel (admin)
export const useDeleteTravel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('travels')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-travels'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    }
  });
};
