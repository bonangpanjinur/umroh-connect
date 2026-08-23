import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coreApi } from '@/lib/coreApi';
import { toast } from 'sonner';

export interface Page { id: string; title: string; slug: string; content: string | null; image_url: string | null; meta_title: string | null; meta_description: string | null; meta_keywords: string | null; is_active: boolean; page_type: 'standard' | 'builder' | 'landing'; layout_data: any; created_at: string; updated_at: string; }
type PageInput = Omit<Page, 'id' | 'created_at' | 'updated_at'>;
const pagesKey = ['platform-pages', 'core'] as const;
const pageKey = (slug: string) => ['platform-page', 'core', slug] as const;

export const usePages = () => useQuery({ queryKey: pagesKey, queryFn: () => coreApi.listPlatformPages() as Promise<Page[]> });
export const usePage = (slug: string) => useQuery({ queryKey: pageKey(slug), queryFn: () => coreApi.getPublicPage(slug) as Promise<Page>, enabled: Boolean(slug) });
export const useCreatePage = () => { const qc = useQueryClient(); return useMutation({ mutationFn: (input: PageInput) => coreApi.createPlatformPage(input), onSuccess: () => { void qc.invalidateQueries({ queryKey: pagesKey }); toast.success('Halaman berhasil dibuat'); }, onError: (e: any) => toast.error(`Gagal membuat halaman: ${e.message}`) }); };
export const useUpdatePage = () => { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, ...updates }: Partial<Page> & { id: string }) => coreApi.updatePlatformPage(id, updates), onSuccess: (data: any) => { void qc.invalidateQueries({ queryKey: pagesKey }); if (data?.slug) void qc.invalidateQueries({ queryKey: pageKey(data.slug) }); toast.success('Halaman berhasil diperbarui'); }, onError: (e: any) => toast.error(`Gagal memperbarui halaman: ${e.message}`) }); };
export const useDeletePage = () => { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => coreApi.deletePlatformPage(id), onSuccess: () => { void qc.invalidateQueries({ queryKey: pagesKey }); toast.success('Halaman berhasil dihapus'); }, onError: (e: any) => toast.error(`Gagal menghapus halaman: ${e.message}`) }); };
export const useTogglePageActive = () => { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => coreApi.togglePlatformPage(id, is_active), onSuccess: () => { void qc.invalidateQueries({ queryKey: pagesKey }); toast.success('Status halaman diperbarui'); }, onError: (e: any) => toast.error(`Gagal memperbarui status halaman: ${e.message}`) }); };
