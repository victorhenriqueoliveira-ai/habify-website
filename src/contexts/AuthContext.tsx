import React, { createContext, useContext, ReactNode } from 'react';
import { User } from '@/types/admin';
import { useAuth as useSupabaseAuth } from '@/hooks/useAuth';
import { useUserTransactionLink } from '@/hooks/useUserTransactionLink';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { profile, loading, isAuthenticated, signIn, signOut, hasRole } = useSupabaseAuth();
  
  // Auto-link transactions when user authenticates
  useUserTransactionLink();

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { error } = await signIn(email, password);
      return !error;
    } catch (error) {
      return false;
    }
  };

  const logout = async () => {
    await signOut();
  };

  const value = {
    user: profile,
    login,
    logout,
    loading,
    isAuthenticated,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};