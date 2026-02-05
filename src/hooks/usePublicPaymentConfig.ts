import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PublicPaymentProvider = 'manual' | 'midtrans' | 'xendit';

export interface PublicPaymentMethod {
  id: string;
  name: string;
  type: 'bank_transfer' | 'ewallet' | 'qris' | 'virtual_account';
  enabled: boolean;
  accountNumber?: string;
  accountName?: string;
  instructions?: string;
}

export interface PublicPaymentConfig {
  provider: PublicPaymentProvider;
  isTestMode: boolean;
  /** Publishable client key (e.g. Midtrans client key). Never contains secret keys. */
  apiKey?: string;
  autoVerify?: boolean;
  paymentMethods: PublicPaymentMethod[];
  qrisImageUrl: string;
}

export const usePublicPaymentConfig = () => {
  return useQuery({
    queryKey: ['public-payment-config'],
    queryFn: async (): Promise<PublicPaymentConfig> => {
      try {
        const { data, error } = await supabase.functions.invoke('payment-config');
        if (error) {
          console.error('Supabase function error:', error);
          return {
            provider: 'manual',
            isTestMode: true,
            paymentMethods: [],
            qrisImageUrl: '',
          } as PublicPaymentConfig;
        }
        return data as PublicPaymentConfig;
      } catch (err) {
        console.error('Failed to fetch payment config:', err);
        return {
          provider: 'manual',
          isTestMode: true,
          paymentMethods: [],
          qrisImageUrl: '',
        } as PublicPaymentConfig;
      }
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
};
