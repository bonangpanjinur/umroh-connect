import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShopProduct, ShopCategory, ShopOrder } from '@/types/shop';
import { toast } from '@/hooks/use-toast';

// ─── Categories ───
export const useAdminShopCategories = () => {
  return useQuery({
    queryKey: ['admin-shop-categories'],
    queryFn: async (): Promise<ShopCategory[]> => {
      const { data, error } = await supabase
        .from('shop_categories')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return (data || []) as unknown as ShopCategory[];
    },
  });
};

export const useCreateShopCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cat: { name: string; slug: string; icon?: string; description?: string; sort_order?: number }) => {
      const { error } = await supabase.from('shop_categories').insert(cat);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-shop-categories'] }); toast({ title: 'Kategori ditambahkan' }); },
  });
};

export const useUpdateShopCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ShopCategory> & { id: string }) => {
      const { error } = await supabase.from('shop_categories').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-shop-categories'] }); toast({ title: 'Kategori diupdate' }); },
  });
};

export const useDeleteShopCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shop_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-shop-categories'] }); toast({ title: 'Kategori dihapus' }); },
  });
};

// ─── Products ───
export const useAdminShopProducts = () => {
  return useQuery({
    queryKey: ['admin-shop-products'],
    queryFn: async (): Promise<ShopProduct[]> => {
      const { data, error } = await supabase
        .from('shop_products')
        .select('*, category:shop_categories(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ShopProduct[];
    },
  });
};

export const useCreateShopProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: {
      name: string; slug: string; category_id?: string; description?: string;
      price: number; compare_price?: number; stock: number; weight_gram?: number;
      thumbnail_url?: string; images?: string[]; is_active?: boolean; is_featured?: boolean;
    }) => {
      const { error } = await supabase.from('shop_products').insert(product);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-shop-products'] }); toast({ title: 'Produk ditambahkan' }); },
  });
};

export const useUpdateShopProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ShopProduct> & { id: string }) => {
      const { category, ...rest } = updates as any;
      const { error } = await supabase.from('shop_products').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-shop-products'] }); toast({ title: 'Produk diupdate' }); },
  });
};

export const useDeleteShopProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shop_products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-shop-products'] }); toast({ title: 'Produk dihapus' }); },
  });
};

// ─── Orders (Admin) ───
export const useAdminShopOrders = () => {
  return useQuery({
    queryKey: ['admin-shop-orders'],
    queryFn: async (): Promise<ShopOrder[]> => {
      const { data, error } = await supabase
        .from('shop_orders')
        .select('*, items:shop_order_items(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ShopOrder[];
    },
  });
};

export const useUpdateShopOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, tracking_number, courier }: { id: string; status: string; tracking_number?: string; courier?: string }) => {
      const updates: any = { status };
      if (status === 'paid') updates.paid_at = new Date().toISOString();
      if (tracking_number !== undefined) updates.tracking_number = tracking_number;
      if (courier !== undefined) updates.courier = courier;
      const { error } = await supabase.from('shop_orders').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-shop-orders'] }); toast({ title: 'Status pesanan diupdate' }); },
  });
};
