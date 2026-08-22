import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseUntyped as supabase } from '@/lib/supabase';
import { coreApi } from '@/lib/coreApi';
import { 
  AppRole,
  AdminStats, 
  Membership, 
  Banner, 
  PackageCredits, 
  CreditTransaction,
  PlatformSetting,
  Travel,
  Profile,
  TravelStatus
} from '@/types/database';

// Fetch admin statistics
export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats', 'platform'],
    queryFn: () => coreApi.getPlatformAdminOverview(),
  });
};

// Fetch all users with profiles
export const useAllUsers = () => {
  return useQuery({
    queryKey: ['admin-users', 'platform'],
    queryFn: async () => (await coreApi.listPlatformAdminUsers()).data,
  });
};

// Suspend/unsuspend user
export const useSuspendUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ user_id, is_suspended, suspension_reason }: { user_id: string; is_suspended: boolean; suspension_reason?: string | null }) => coreApi.setPlatformAdminUserSuspension(user_id, is_suspended, suspension_reason),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users', 'platform'] }); },
  });
};

// Fetch all travels with owner info
export const useAllTravels = () => {
  return useQuery({ queryKey: ['admin-travels', 'platform'], queryFn: async () => (await coreApi.listPlatformAdminTravels()).data });
};

// Fetch all memberships
export const useMemberships = () => {
  return useQuery({ queryKey: ['admin-memberships', 'platform'], queryFn: async () => (await coreApi.listPlatformAdminMemberships()).data });
};

// Update membership
export const useUpdateMembership = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }: Partial<Membership> & { id: string }) => coreApi.updatePlatformMembership(id, updates as Record<string, unknown>),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-memberships', 'platform'] }); queryClient.invalidateQueries({ queryKey: ['admin-stats', 'platform'] }); }
  });
};

// Fetch all banners
export const useBanners = () => {
  return useQuery({ queryKey: ['admin-banners', 'platform'], queryFn: async () => (await coreApi.listPlatformAdminBanners()).data });
};

// Create banner
export const useCreateBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (banner: Omit<Banner, 'id' | 'created_at' | 'updated_at'>) => coreApi.createPlatformAdminBanner(banner as Record<string, unknown>), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-banners', 'platform'] }) });
};

// Update banner
export const useUpdateBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...updates }: Partial<Banner> & { id: string }) => coreApi.updatePlatformAdminBanner(id, updates as Record<string, unknown>), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-banners', 'platform'] }) });
};

// Delete banner
export const useDeleteBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (id: string) => coreApi.deletePlatformAdminBanner(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-banners', 'platform'] }) });
};

// Fetch package credits
export const usePackageCredits = () => useQuery({ queryKey: ['admin-credits','platform'], queryFn: async () => (await coreApi.listPlatformAdminCredits()).data });

// Add credits to travel
export const useAddCredits = () => { const queryClient=useQueryClient(); return useMutation({ mutationFn:(input:{travel_id:string;amount:number;notes?:string})=>coreApi.addPlatformAdminCredits(input), onSuccess:()=>queryClient.invalidateQueries({queryKey:['admin-credits','platform']}) }); };

// Fetch credit transactions
export const useCreditTransactions = () => useQuery({ queryKey: ['admin-transactions','platform'], queryFn: async () => (await coreApi.listPlatformCreditTransactions()).data });

// Fetch platform settings
export const usePlatformSettings = () => {
  return useQuery({ queryKey: ['platform-settings', 'platform'], queryFn: async () => (await coreApi.getPlatformAdminSettings()).data });
};

// Update platform setting (upsert if not exists)
export const useUpdatePlatformSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: ({ key, value }: { key: string; value: Record<string, any> }) => coreApi.updatePlatformAdminSetting(key, value), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform-settings', 'platform'] }) });
};

// Update user role
export const useUpdateUserRole = () => { const queryClient=useQueryClient(); return useMutation({ mutationFn:({user_id,role}:{user_id:string;role:AppRole})=>coreApi.updatePlatformUserRole(user_id,role), onSuccess:()=>{queryClient.invalidateQueries({queryKey:['admin-users','platform']});queryClient.invalidateQueries({queryKey:['admin-stats','platform']});} }); };

// Verify/unverify travel with notes
export const useVerifyTravel = () => { const queryClient=useQueryClient(); return useMutation({ mutationFn:({id,verified,approval_notes}:{id:string;verified:boolean;approval_notes?:string|null})=>coreApi.verifyPlatformTravel(id,verified,approval_notes), onSuccess:()=>queryClient.invalidateQueries({queryKey:['admin-travels','platform']}) }); };

// Suspend/activate travel
export const useSuspendTravel = () => { const queryClient=useQueryClient(); return useMutation({ mutationFn:({id,status}:{id:string;status:TravelStatus})=>coreApi.setPlatformTravelStatus(id,status), onSuccess:()=>queryClient.invalidateQueries({queryKey:['admin-travels','platform']}) }); };

// Create new travel (admin)
export const useCreateTravel = () => { const queryClient=useQueryClient(); return useMutation({ mutationFn:(travel:Record<string,unknown>)=>coreApi.createPlatformTravel(travel), onSuccess:()=>{queryClient.invalidateQueries({queryKey:['admin-travels','platform']});queryClient.invalidateQueries({queryKey:['admin-stats','platform']});} }); };

// Delete travel (admin)
export const useDeleteTravel = () => { const queryClient=useQueryClient(); return useMutation({ mutationFn:(id:string)=>coreApi.deletePlatformTravel(id), onSuccess:()=>{queryClient.invalidateQueries({queryKey:['admin-travels','platform']});queryClient.invalidateQueries({queryKey:['admin-stats','platform']});} }); };

// Update travel (admin)
export const useUpdateTravelAdmin = () => { const queryClient=useQueryClient(); return useMutation({ mutationFn:({id,...data}:{id:string;[key:string]:unknown})=>coreApi.updatePlatformTravel(id,data), onSuccess:()=>queryClient.invalidateQueries({queryKey:['admin-travels','platform']}) }); };

// Fetch all agent website settings for URL management
export const useAllAgentWebsiteSettings = () => useQuery({ queryKey:['admin-agent-website-settings','platform'], queryFn:async()=> (await coreApi.listPlatformAgentWebsiteSettings()).data });

// Update agent website settings (approve/reject slug)
export const useUpdateAgentWebsiteSettings = () => { const queryClient=useQueryClient(); return useMutation({ mutationFn:({user_id,...updates}:{user_id:string;[key:string]:unknown})=>coreApi.updatePlatformAgentWebsiteSettings(user_id,updates), onSuccess:()=>queryClient.invalidateQueries({queryKey:['admin-agent-website-settings','platform']}) }); };
