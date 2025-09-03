import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { User as AdminUser } from '@/types/admin';

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: AdminUser | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          isAuthenticated: !!session?.user,
        }));

        // Fetch profile data if user is authenticated
        if (session?.user) {
          setTimeout(async () => {
            try {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

              if (!error && profile) {
                const adminUser: AdminUser = {
                  id: profile.id,
                  name: profile.name,
                  email: session.user.email || '',
                  phone: profile.phone || '',
                  role: profile.role,
                  company: profile.company,
                  avatar: profile.avatar_url,
                  createdAt: profile.created_at,
                  lastLogin: session.user.last_sign_in_at,
                  isActive: profile.is_active,
                };

                setAuthState(prev => ({
                  ...prev,
                  profile: adminUser,
                  loading: false,
                }));
              }
            } catch (error) {
              console.error('Error fetching profile:', error);
              setAuthState(prev => ({ ...prev, loading: false }));
            }
          }, 0);
        } else {
          setAuthState(prev => ({
            ...prev,
            profile: null,
            loading: false,
          }));
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session?.user,
      }));
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
        }
      }
    });

    return { user: data.user, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { user: data.user, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const hasRole = (roles: string | string[]): boolean => {
    if (!authState.profile) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(authState.profile.role);
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    hasRole,
  };
};