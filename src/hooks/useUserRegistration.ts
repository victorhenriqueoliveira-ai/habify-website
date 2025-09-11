import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useUserRegistration = () => {
  const [loading, setLoading] = useState(false);

  const registerUser = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/dashboard`,
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          // User already exists, try to sign in
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (signInError) {
            throw new Error('Email já cadastrado. Tente fazer login.');
          }
          
          toast.success('Login realizado com sucesso!');
          return { success: true, user: authData.user };
        }
        throw authError;
      }

      // Create profile
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            name,
            email,
            role: 'user',
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          // Don't fail registration if profile creation fails
        }
      }

      toast.success('Conta criada com sucesso! Verifique seu email para confirmar.');
      return { success: true, user: authData.user };
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Erro ao criar conta');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    registerUser,
    loading,
  };
};