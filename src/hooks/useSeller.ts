import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SellerProfile, SellerApplication, SellerMembershipPlan, SellerMembership, SellerCredits } from '@/types/seller';

// Check if current user is a seller
export const useSellerProfile = () => {
  const { user } = useAuthContext();
  return useQuery({
    queryKey: ['seller-profile', user?.id],
    queryFn: async (): Promise<SellerProfile | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('seller_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as SellerProfile | null;
    },
    enabled: !!user,
  });
};

// Fetch seller application status
export const useSellerApplication = () => {
  const { user } = useAuthContext();
  return useQuery({
    queryKey: ['seller-application', user?.id],
    queryFn: async (): Promise<SellerApplication | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('seller_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as SellerApplication | null;
    },
    enabled: !!user,
  });
};

// Submit seller application
export const useSubmitSellerApplication = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      user_id: string;
      shop_name: string;
      description?: string;
      phone: string;
      whatsapp?: string;
      email?: string;
      address?: string;
    }) => {
      const { data, error } = await supabase
        .from('seller_applications')
        .insert(params)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-application'] });
      toast({
        title: 'Pendaftaran Berhasil! 🎉',
        description: 'Mohon tunggu persetujuan admin (1-24 jam)',
      });
    },
    onError: (error: Error) => {
      toast({ title: 'Gagal mendaftar', description: error.message, variant: 'destructive' });
    },
  });
};

// Seller membership plans
export const useSellerMembershipPlans = () => {
  return useQuery({
    queryKey: ['seller-membership-plans'],
    queryFn: async (): Promise<SellerMembershipPlan[]> => {
      const { data, error } = await supabase
        .from('seller_membership_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data || []) as unknown as SellerMembershipPlan[];
    },
  });
};

// Current seller membership
export const useSellerMembership = (sellerId: string | undefined) => {
  return useQuery({
    queryKey: ['seller-membership', sellerId],
    queryFn: async (): Promise<SellerMembership | null> => {
      if (!sellerId) return null;
      const { data, error } = await supabase
        .from('seller_memberships')
        .select('*, plan:seller_membership_plans(*)')
        .eq('seller_id', sellerId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as SellerMembership | null;
    },
    enabled: !!sellerId,
  });
};

// Seller credits
export const useSellerCredits = (sellerId: string | undefined) => {
  return useQuery({
    queryKey: ['seller-credits', sellerId],
    queryFn: async (): Promise<SellerCredits | null> => {
      if (!sellerId) return null;
      const { data, error } = await supabase
        .from('seller_credits')
        .select('*')
        .eq('seller_id', sellerId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as SellerCredits | null;
    },
    enabled: !!sellerId,
  });
};

// Seller's products
export const useSellerProducts = (sellerId: string | undefined) => {
  return useQuery({
    queryKey: ['seller-products', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      const { data, error } = await supabase
        .from('shop_products')
        .select('*, category:shop_categories(*)')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!sellerId,
  });
};

// Create/update seller product
export const useUpsertSellerProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      id?: string;
      seller_id: string;
      name: string;
      slug: string;
      description?: string;
      price: number;
      compare_price?: number | null;
      stock: number;
      weight_gram?: number | null;
      category_id?: string | null;
      thumbnail_url?: string | null;
      images?: string[];
      is_active?: boolean;
      is_featured?: boolean;
    }) => {
      if (params.id) {
        const { data, error } = await supabase
          .from('shop_products')
          .update(params)
          .eq('id', params.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('shop_products')
          .insert(params)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['shop-products'] });
      toast({ title: 'Produk berhasil disimpan! ✅' });
    },
    onError: (error: Error) => {
      toast({ title: 'Gagal menyimpan produk', description: error.message, variant: 'destructive' });
    },
  });
};

// Delete seller product
export const useDeleteSellerProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('shop_products')
        .delete()
        .eq('id', productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['shop-products'] });
      toast({ title: 'Produk berhasil dihapus' });
    },
    onError: (error: Error) => {
      toast({ title: 'Gagal menghapus', description: error.message, variant: 'destructive' });
    },
  });
};

// Get current plan limits
export const useSellerPlanLimits = (sellerId: string | undefined) => {
  const { data: membership, isLoading: loadingMembership } = useSellerMembership(sellerId);
  const { data: plans = [] } = useSellerMembershipPlans();

  const currentPlan = membership?.plan || plans.find(p => p.sort_order === 1) || null;
  const maxProducts = currentPlan?.max_products || 5;
  const maxFeatured = currentPlan?.max_featured || 0;

  return {
    isLoading: loadingMembership,
    membership,
    currentPlan,
    maxProducts,
    maxFeatured,
  };
};
