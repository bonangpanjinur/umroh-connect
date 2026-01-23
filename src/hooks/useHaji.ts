import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export type PackageType = 'umroh' | 'haji_reguler' | 'haji_plus' | 'haji_furoda';

export interface HajiRegistration {
  id: string;
  user_id: string;
  package_id: string;
  travel_id: string;
  full_name: string;
  nik: string;
  phone: string;
  email: string | null;
  birth_date: string;
  address: string | null;
  porsi_number: string | null;
  registration_year: number | null;
  estimated_departure_year: number | null;
  status: 'pending' | 'verified' | 'waiting' | 'departed' | 'cancelled';
  documents: Record<string, any>;
  dp_amount: number;
  dp_paid_at: string | null;
  agent_notes: string | null;
  created_at: string;
  updated_at: string;
  package?: {
    name: string;
    package_type: PackageType;
  };
}

export interface HajiChecklist {
  id: string;
  title: string;
  description: string | null;
  category: string;
  is_required: boolean;
  applies_to: string[];
  priority: number;
  is_active: boolean;
}

export const packageTypeLabels: Record<PackageType, string> = {
  umroh: 'Umroh',
  haji_reguler: 'Haji Reguler',
  haji_plus: 'Haji Plus/Khusus',
  haji_furoda: 'Haji Furoda',
};

export const packageTypeColors: Record<PackageType, string> = {
  umroh: 'bg-emerald-100 text-emerald-800',
  haji_reguler: 'bg-blue-100 text-blue-800',
  haji_plus: 'bg-purple-100 text-purple-800',
  haji_furoda: 'bg-amber-100 text-amber-800',
};

// Fetch haji checklists
export const useHajiChecklists = (packageType?: PackageType) => {
  return useQuery({
    queryKey: ['haji-checklists', packageType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('haji_checklists')
        .select('*')
        .eq('is_active', true)
        .order('priority');

      if (error) throw error;

      // Filter by package type if provided
      if (packageType && packageType !== 'umroh') {
        return (data as HajiChecklist[]).filter(item => 
          item.applies_to.includes(packageType)
        );
      }

      return data as HajiChecklist[];
    },
  });
};

// Fetch user's haji registrations
export const useUserHajiRegistrations = () => {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['user-haji-registrations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('haji_registrations')
        .select(`
          *,
          package:packages(name, package_type)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as HajiRegistration[];
    },
    enabled: !!user,
  });
};

// Fetch agent's haji registrations
export const useAgentHajiRegistrations = (travelId?: string) => {
  return useQuery({
    queryKey: ['agent-haji-registrations', travelId],
    queryFn: async () => {
      if (!travelId) return [];

      const { data, error } = await supabase
        .from('haji_registrations')
        .select(`
          *,
          package:packages(name, package_type)
        `)
        .eq('travel_id', travelId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as HajiRegistration[];
    },
    enabled: !!travelId,
  });
};

// Submit haji registration
export const useSubmitHajiRegistration = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      packageId: string;
      travelId: string;
      fullName: string;
      nik: string;
      phone: string;
      email?: string;
      birthDate: string;
      address?: string;
      dpAmount?: number;
    }) => {
      if (!user) throw new Error('Harus login untuk mendaftar haji');

      const { data: result, error } = await supabase
        .from('haji_registrations')
        .insert({
          user_id: user.id,
          package_id: data.packageId,
          travel_id: data.travelId,
          full_name: data.fullName,
          nik: data.nik,
          phone: data.phone,
          email: data.email || null,
          birth_date: data.birthDate,
          address: data.address || null,
          dp_amount: data.dpAmount || 0,
          registration_year: new Date().getFullYear(),
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-haji-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['agent-haji-registrations'] });
    },
  });
};

// Update haji registration (for agents)
export const useUpdateHajiRegistration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      registrationId,
      updates,
    }: {
      registrationId: string;
      updates: {
        status?: HajiRegistration['status'];
        porsi_number?: string;
        estimated_departure_year?: number;
        agent_notes?: string;
        documents?: Record<string, any>;
      };
    }) => {
      const { data, error } = await supabase
        .from('haji_registrations')
        .update(updates)
        .eq('id', registrationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-haji-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['user-haji-registrations'] });
    },
  });
};

// Get haji statistics
export const useHajiStats = (travelId?: string) => {
  return useQuery({
    queryKey: ['haji-stats', travelId],
    queryFn: async () => {
      if (!travelId) return null;

      const { data, error } = await supabase
        .from('haji_registrations')
        .select('status')
        .eq('travel_id', travelId);

      if (error) throw error;

      return {
        total: data.length,
        pending: data.filter(r => r.status === 'pending').length,
        verified: data.filter(r => r.status === 'verified').length,
        waiting: data.filter(r => r.status === 'waiting').length,
        departed: data.filter(r => r.status === 'departed').length,
        cancelled: data.filter(r => r.status === 'cancelled').length,
      };
    },
    enabled: !!travelId,
  });
};

// Get current haji season info
export const getHajiSeasonInfo = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Haji season is typically in Dzulhijjah (around July-August in Gregorian)
  // This is a simplified estimation
  const hajiMonth = 7; // Approximate month
  const isHajiSeason = now.getMonth() >= 6 && now.getMonth() <= 8;
  
  return {
    currentYear,
    nextHajiYear: isHajiSeason ? currentYear + 1 : currentYear,
    isHajiSeason,
    estimatedHajiMonths: ['Juli', 'Agustus'],
    regularWaitingYears: 25, // Approximate waiting years for regular haji
  };
};
