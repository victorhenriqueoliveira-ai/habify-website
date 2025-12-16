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

// Helper function to fetch user role from user_roles table (more secure than profiles.role)
const fetchUserRole = async (userId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      // Fallback to 'user' if no role found
      return 'user';
    }

    // Map app_role to user_role format if needed
    return data.role;
  } catch {
    return 'user';
  }
};

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
              // Fetch profile data
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

              if (!error && profile) {
                // Fetch role from user_roles table (secure)
                const userRole = await fetchUserRole(session.user.id);

                const adminUser: AdminUser = {
                  id: profile.id,
                  userId: profile.user_id,
                  name: profile.name,
                  email: session.user.email || '',
                  phone: profile.phone || '',
                  role: userRole as 'user' | 'admin' | 'dev',
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
              } else {
                setAuthState(prev => ({ ...prev, loading: false }));
              }
            } catch (error) {
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

    // Log successful login
    if (data.user && !error) {
      setTimeout(async () => {
        try {
          await supabase.from('audit_logs').insert({
            user_id: data.user?.id || null,
            action: 'LOGIN',
            target_type: 'auth',
            details: { email, timestamp: new Date().toISOString() }
          });
        } catch (logError) {
          // Silent error handling
        }
      }, 100);
    }

    return { user: data.user, error };
  };

  const signOut = async () => {
    const userId = authState.user?.id;
    
    const { error } = await supabase.auth.signOut();
    
    // Log logout
    if (userId) {
      setTimeout(async () => {
        try {
          await supabase.from('audit_logs').insert({
            user_id: userId,
            action: 'LOGOUT',
            target_type: 'auth',
            details: { timestamp: new Date().toISOString() }
          });
        } catch (logError) {
          // Silent error handling
        }
      }, 100);
    }

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
