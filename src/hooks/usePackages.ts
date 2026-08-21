import { useQuery } from '@tanstack/react-query';
import { coreApi } from '@/lib/coreApi';
import { PackageWithDetails } from '@/types/database';

export const usePackages = () => {
  return useQuery({
    queryKey: ['packages', 'core-marketplace'],
    queryFn: async (): Promise<PackageWithDetails[]> => {
      return coreApi.listMarketplaceListings({ limit: 50 });
    },
  });
};

export const usePackageById = (packageId: string | null) => {
  return useQuery({
    queryKey: ['package', 'core-marketplace', packageId],
    queryFn: async (): Promise<PackageWithDetails | null> => {
      if (!packageId) return null;
      return coreApi.getMarketplacePackage(packageId);
    },
    enabled: !!packageId,
  });
};
