import { supabase } from "@/integrations/supabase/client";

/**
 * Typed helper for querying tables/views not yet in generated types.
 * Use this instead of `supabase.from(table as any)` scattered across the codebase.
 * 
 * Once Supabase types are regenerated to include these tables,
 * migrate calls back to direct `supabase.from(table)`.
 */
export const typedFrom = (table: string) => supabase.from(table as any);

/**
 * Query the public_profiles view (user_id, full_name, avatar_url only).
 * Use this for cross-user lookups where you don't need sensitive data.
 */
export const queryPublicProfiles = () => typedFrom('public_profiles');

/**
 * Query the public_travels view (excludes approval_notes, verified_by).
 * Use this for public-facing travel data.
 */
export const queryPublicTravels = () => typedFrom('public_travels');
