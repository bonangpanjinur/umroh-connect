import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MEMBERSHIP_PLANS, type MembershipPlan } from '@/hooks/useAgentMembership';
import { coreApi } from '@/lib/coreApi';
interface CorePlan { id:string; code:string; name:string; description?:string|null; price_minor:number; features?:unknown; limits?:unknown; billing_interval?:string; }
const key=['membership-config','core'] as const;
const mapPlan=(p:CorePlan):MembershipPlan=>({id:p.code,name:p.name,price:Number(p.price_minor||0),features:Array.isArray(p.features)?p.features as string[]:[],limits:{...MEMBERSHIP_PLANS.find(x=>x.id===p.code)?.limits,...(p.limits&&typeof p.limits==='object'?p.limits:{})} as MembershipPlan['limits']});
export const useMembershipConfig=()=>useQuery({queryKey:key,queryFn:async()=>{const plans=await coreApi.listSubscriptionPlans() as unknown as CorePlan[];const mapped=plans.filter(p=>p.code!=='free' || plans.length<=1).map(mapPlan);return mapped.length?mapped:MEMBERSHIP_PLANS;},staleTime:300000});
export const useSaveMembershipConfig=()=>{const qc=useQueryClient();return useMutation({mutationFn:async(plans:MembershipPlan[])=>{await coreApi.updatePlatformAdminSetting('membership_config',{plans});await coreApi.updatePlatformAdminSetting('membership_prices',Object.fromEntries(plans.map(p=>[p.id,p.price])));},onSuccess:()=>{void qc.invalidateQueries({queryKey:key});void qc.invalidateQueries({queryKey:['subscription-plans']});void qc.invalidateQueries({queryKey:['platform-settings']});}});};
export const getPlanFromConfig=(plans:MembershipPlan[],planId:string):MembershipPlan=>plans.find(p=>p.id===planId)||plans[0]||MEMBERSHIP_PLANS[0];
