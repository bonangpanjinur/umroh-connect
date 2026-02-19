import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WhitelabelSettings {
  site_name: string;
  site_description: string;
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  contact_email: string;
  contact_phone: string;
  whatsapp_number: string;
  footer_text: string;
}

const DEFAULT_WHITELABEL: WhitelabelSettings = {
  site_name: 'Arah Umroh',
  site_description: 'Platform Koneksi Umroh Terpercaya',
  logo_url: '',
  favicon_url: '',
  primary_color: '#8B5CF6',
  contact_email: '',
  contact_phone: '',
  whatsapp_number: '',
  footer_text: '© 2024 Arah Umroh. All rights reserved.',
};

export const usePlatformConfig = () => {
  return useQuery({
    queryKey: ['platform-config-whitelabel'],
    queryFn: async (): Promise<WhitelabelSettings> => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'whitelabel_settings')
        .maybeSingle();

      if (error || !data) return DEFAULT_WHITELABEL;
      return { ...DEFAULT_WHITELABEL, ...(data.value as any) };
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useMembershipPrices = () => {
  return useQuery({
    queryKey: ['platform-config-membership-prices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'membership_prices')
        .maybeSingle();

      if (error || !data) return { free: 0, pro: 2000000, premium: 7500000 };
      return data.value as { free: number; pro: number; premium: number };
    },
    staleTime: 5 * 60 * 1000,
  });
};
