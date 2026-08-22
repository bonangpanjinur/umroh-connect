import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShopProduct, ShopCategory, ShopOrder } from '@/types/shop';
import { toast } from '@/hooks/use-toast';
import { coreApi } from '@/lib/coreApi';

// ─── Categories ───
export const useAdminShopCategories = () => useQuery({ queryKey: ['admin-shop-categories'], queryFn: async (): Promise<ShopCategory[]> => (await coreApi.listCommerceCategories()).map((row) => row as unknown as ShopCategory) });

export const useCreateShopCategory = () => { const qc = useQueryClient(); return useMutation({ mutationFn: (cat: { name: string; slug: string; icon?: string | null; description?: string | null; sort_order?: number; is_active?: boolean }) => coreApi.createCommerceCategory(cat), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-shop-categories'] }); toast({ title: 'Kategori ditambahkan' }); }, onError: (error: any) => toast({ title: 'Gagal menambah kategori', description: error.message, variant: 'destructive' }) }); };

export const useUpdateShopCategory = () => { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ id, ...updates }: Partial<ShopCategory> & { id: string }) => coreApi.updateCommerceCategory(id, updates), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-shop-categories'] }); toast({ title: 'Kategori diupdate' }); }, onError: (error: any) => toast({ title: 'Gagal update kategori', description: error.message, variant: 'destructive' }) }); };

export const useDeleteShopCategory = () => { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => coreApi.updateCommerceCategory(id, { is_active: false }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-shop-categories'] }); toast({ title: 'Kategori dinonaktifkan' }); }, onError: (error: any) => toast({ title: 'Gagal menonaktifkan kategori', description: error.message, variant: 'destructive' }) }); };

// ─── Products ───
export const useAdminShopProducts = () => useQuery({ queryKey: ['admin-shop-products'], queryFn: async (): Promise<ShopProduct[]> => (await coreApi.listCommerceProducts({ limit: 100 })).map((row) => row as unknown as ShopProduct) });

export const useCreateShopProduct = () => { const qc = useQueryClient(); return useMutation({ mutationFn: (product: { name: string; slug: string; category_id?: string; description?: string; price: number; compare_price?: number; stock: number; weight_gram?: number; thumbnail_url?: string; images?: string[]; is_active?: boolean; is_featured?: boolean }) => coreApi.createCommerceProduct(product), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-shop-products'] }); toast({ title: 'Produk ditambahkan' }); } }); };

export const useUpdateShopProduct = () => { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ id, ...updates }: Partial<ShopProduct> & { id: string }) => { const { category, id: ignoredId, seller_id, created_at, updated_at, ...rest } = updates as any; void ignoredId; void seller_id; void created_at; void updated_at; return coreApi.updateCommerceProduct(id, rest); }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-shop-products'] }); toast({ title: 'Produk diupdate' }); } }); };

export const useDeleteShopProduct = () => { const qc = useQueryClient(); return useMutation({ mutationFn: async (id: string) => { return coreApi.updateCommerceProduct(id, { is_active: false }); }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-shop-products'] }); toast({ title: 'Produk dinonaktifkan' }); } }); };

// ─── Orders (Admin) ───
export const useAdminShopOrders = () => useQuery({ queryKey: ['admin-shop-orders'], queryFn: async (): Promise<ShopOrder[]> => (await coreApi.listCommerceOrders()).map((row) => row as unknown as ShopOrder) });

export const useUpdateShopOrderStatus = () => { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, status, tracking_number, courier }: { id: string; status: string; tracking_number?: string; courier?: string }) => coreApi.updateCommerceOrderStatus(id, { status, tracking_number: tracking_number ?? null, courier: courier ?? null }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-shop-orders'] }); toast({ title: 'Status pesanan diupdate' }); } }); };
