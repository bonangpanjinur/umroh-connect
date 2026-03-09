import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabaseUntyped as supabase } from '@/lib/supabase';
import { Profile, AppRole } from '@/types/database';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchProfileAndRoles(session.user.id);
        } else {
          setProfile(null);
          setRoles([]);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfileAndRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfileAndRoles = async (userId: string) => {
    try {
      // Fetch profile and roles in parallel
      const [profileResult, rolesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId),
      ]);

      if (profileResult.error) {
        console.error('Error fetching profile:', profileResult.error);
      } else {
        setProfile(profileResult.data as Profile);
      }

      if (rolesResult.error) {
        console.error('Error fetching roles:', rolesResult.error);
        setRoles([]);
      } else {
        const fetchedRoles = (rolesResult.data || []).map(r => r.role as AppRole);
        setRoles(fetchedRoles);
      }
    } catch (error) {
      console.error('Error fetching profile/roles:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    setRoles([]);
    return { error };
  };

  // Multi-role: check from user_roles table
  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role);
  };

  const isAgent = (): boolean => hasRole('agent');
  const isAdmin = (): boolean => hasRole('admin') || hasRole('super_admin');
  const isJamaah = (): boolean => roles.length === 0 || (roles.length === 1 && hasRole('jamaah'));
  const isShopAdmin = (): boolean => hasRole('shop_admin');
  const isSeller = (): boolean => hasRole('seller');

  return {
    user,
    session,
    profile,
    roles,
    loading,
    signUp,
    signIn,
    signOut,
    hasRole,
    isAgent,
    isAdmin,
    isJamaah,
    isShopAdmin,
    isSeller,
  };
};
