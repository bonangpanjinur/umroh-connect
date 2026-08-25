import { useQuery } from '@tanstack/react-query';
import { coreApi } from '@/lib/coreApi';

export interface ManasikGuide { id: string; title: string; title_arabic: string | null; description: string | null; content: string; category: string; order_index: number; image_url: string | null; video_url: string | null; audio_url: string | null; doa_arabic: string | null; doa_latin: string | null; doa_meaning: string | null; is_active: boolean; }
export const useManasikGuides = (category: string = 'umroh') => useQuery({ queryKey: ['manasik-guides','core',category], queryFn: async () => { const rows=await coreApi.listManasik(false) as unknown as ManasikGuide[]; return rows.filter((row)=>row.category===category); } });
export const useAllManasikGuides = () => useQuery({ queryKey: ['manasik-guides','core','all'], queryFn: async () => await coreApi.listManasik(false) as unknown as ManasikGuide[] });
