import { useQuery } from '@tanstack/react-query';
import { coreApi } from '@/lib/coreApi';

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
  apiKey?: string;
  autoVerify?: boolean;
  paymentMethods: PublicPaymentMethod[];
  qrisImageUrl: string;
}

const fallbackConfig: PublicPaymentConfig = {
  provider: 'manual',
  isTestMode: true,
  paymentMethods: [],
  qrisImageUrl: '',
};

export const usePublicPaymentConfig = () => useQuery({
  queryKey: ['public-payment-config', 'core'],
  queryFn: async (): Promise<PublicPaymentConfig> => {
    try {
      const config = await coreApi.getPublicPaymentConfig();
      return {
        ...fallbackConfig,
        ...config,
        paymentMethods: (config.paymentMethods || []) as PublicPaymentMethod[],
      };
    } catch (error) {
      console.error('Failed to fetch Core payment config:', error);
      return fallbackConfig;
    }
  },
  staleTime: 60_000,
  refetchOnWindowFocus: false,
});
