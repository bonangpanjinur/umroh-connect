import { useQuery } from '@tanstack/react-query';
import { supabaseUntyped as supabase } from '@/lib/supabase';
import { Package, Travel, Departure, PackageWithDetails } from '@/types/database';

export const usePackages = () => {
  return useQuery({
    queryKey: ['packages'],
    queryFn: async (): Promise<PackageWithDetails[]> => {
      // Fetch packages with travel info
      const { data: packages, error: packagesError } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (packagesError) throw packagesError;
      if (!packages || packages.length === 0) return [];

      // Get unique travel IDs
      const travelIds = [...new Set(packages.map((p: any) => p.travel_id))];
      
      // Fetch travels
      const { data: travels, error: travelsError } = await supabase
        .from('travels')
        .select('*')
        .in('id', travelIds);

      if (travelsError) throw travelsError;

      // Fetch departures for all packages
      const packageIds = packages.map((p: any) => p.id);
      const { data: departures, error: departuresError } = await supabase
        .from('departures')
        .select('*')
        .in('package_id', packageIds)
        .order('departure_date', { ascending: true });

      if (departuresError) throw departuresError;

      // Combine data
      const travelsMap = new Map((travels || []).map((t: any) => [t.id, t]));
      const departuresMap = new Map<string, Departure[]>();
      
      (departures || []).forEach((d: any) => {
        const existing = departuresMap.get(d.package_id) || [];
        departuresMap.set(d.package_id, [...existing, d as Departure]);
      });

      return packages.map((pkg: any) => ({
        ...pkg,
        travel: travelsMap.get(pkg.travel_id) as Travel,
        departures: departuresMap.get(pkg.id) || [],
      })) as PackageWithDetails[];
    },
  });
};

export const usePackageById = (packageId: string | null) => {
  return useQuery({
    queryKey: ['package', packageId],
    queryFn: async (): Promise<PackageWithDetails | null> => {
      if (!packageId) return null;

      const { data: pkg, error: pkgError } = await supabase
        .from('packages')
        .select('*')
        .eq('id', packageId)
        .single();

      if (pkgError) throw pkgError;
      if (!pkg) return null;

      // Fetch travel
      const { data: travel, error: travelError } = await supabase
        .from('travels')
        .select('*')
        .eq('id', pkg.travel_id)
        .single();

      if (travelError) throw travelError;

      // Fetch departures
      const { data: departures, error: departuresError } = await supabase
        .from('departures')
        .select('*')
        .eq('package_id', packageId)
        .order('departure_date', { ascending: true });

      if (departuresError) throw departuresError;

      return {
        ...pkg,
        travel: travel as Travel,
        departures: (departures || []) as Departure[],
      } as PackageWithDetails;
    },
    enabled: !!packageId,
  });
};
