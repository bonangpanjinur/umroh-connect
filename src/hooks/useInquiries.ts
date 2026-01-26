import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { z } from 'zod';

// Validation schema
export const inquirySchema = z.object({
  fullName: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  phone: z.string().trim().min(10, 'Nomor telepon minimal 10 digit').max(15, 'Nomor telepon maksimal 15 digit')
    .regex(/^[0-9+\-\s]+$/, 'Format nomor telepon tidak valid'),
  email: z.string().trim().email('Format email tidak valid').max(255).optional().or(z.literal('')),
  message: z.string().trim().max(500, 'Pesan maksimal 500 karakter').optional(),
  numberOfPeople: z.number().min(1, 'Minimal 1 orang').max(50, 'Maksimal 50 orang'),
});

export type InquiryFormData = z.infer<typeof inquirySchema>;

export interface PackageInquiry {
  id: string;
  package_id: string;
  departure_id: string | null;
  travel_id: string;
  user_id: string | null;
  full_name: string;
  phone: string;
  email: string | null;
  message: string | null;
  number_of_people: number;
  status: 'pending' | 'contacted' | 'converted' | 'cancelled';
  agent_notes: string | null;
  contacted_at: string | null;
  created_at: string;
  updated_at: string;
  package?: {
    name: string;
    travel?: {
      name: string;
    };
  };
  departure?: {
    departure_date: string;
    price: number;
  };
}

// Submit inquiry
export const useSubmitInquiry = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      packageId,
      travelId,
      departureId,
      formData,
    }: {
      packageId: string;
      travelId: string;
      departureId?: string;
      formData: InquiryFormData;
    }) => {
      // Validate form data
      const validated = inquirySchema.parse(formData);

      const { data, error } = await supabase
        .from('package_inquiries')
        .insert({
          package_id: packageId,
          travel_id: travelId,
          departure_id: departureId || null,
          user_id: user?.id || null,
          full_name: validated.fullName,
          phone: validated.phone,
          email: validated.email || null,
          message: validated.message || null,
          number_of_people: validated.numberOfPeople,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['user-inquiries'] });
    },
  });
};

// Get inquiries for agent's travel
export const useAgentInquiries = (travelId?: string) => {
  return useQuery({
    queryKey: ['agent-inquiries', travelId],
    queryFn: async () => {
      let query = supabase
        .from('package_inquiries')
        .select(`
          *,
          package:packages(name),
          departure:departures(departure_date, price)
        `)
        .order('created_at', { ascending: false });

      if (travelId) {
        query = query.eq('travel_id', travelId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PackageInquiry[];
    },
    enabled: true,
  });
};

// Get user's own inquiries
export const useUserInquiries = () => {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['user-inquiries', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('package_inquiries')
        .select(`
          *,
          package:packages(name, travel:travels(name))
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PackageInquiry[];
    },
    enabled: !!user,
  });
};

// Update inquiry status (for agents)
export const useUpdateInquiryStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      inquiryId,
      status,
      agentNotes,
    }: {
      inquiryId: string;
      status: PackageInquiry['status'];
      agentNotes?: string;
    }) => {
      const updateData: any = {
        status,
        agent_notes: agentNotes,
      };

      if (status === 'contacted' || status === 'converted') {
        updateData.contacted_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('package_inquiries')
        .update(updateData)
        .eq('id', inquiryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-inquiries'] });
    },
  });
};

// Delete inquiry
export const useDeleteInquiry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inquiryId: string) => {
      const { error } = await supabase
        .from('package_inquiries')
        .delete()
        .eq('id', inquiryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-inquiries'] });
    },
  });
};

// Get inquiry stats for agent dashboard
export const useInquiryStats = (travelId?: string) => {
  return useQuery({
    queryKey: ['inquiry-stats', travelId],
    queryFn: async () => {
      let query = supabase
        .from('package_inquiries')
        .select('status, created_at');

      if (travelId) {
        query = query.eq('travel_id', travelId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        pending: data?.filter(i => i.status === 'pending').length || 0,
        contacted: data?.filter(i => i.status === 'contacted').length || 0,
        converted: data?.filter(i => i.status === 'converted').length || 0,
        cancelled: data?.filter(i => i.status === 'cancelled').length || 0,
        thisWeek: data?.filter(i => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(i.created_at) >= weekAgo;
        }).length || 0,
      };

      return stats;
    },
  });
};
