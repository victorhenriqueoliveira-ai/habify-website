import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useUserRegistration = () => {
  const [loading, setLoading] = useState(false);

  const registerUser = async (email: string, password: string, name: string) => {
    try {
      // console.log('Attempting to sign in user:', email);
      
      // First try to sign in (user might have been created during payment)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!signInError && signInData.user) {
        // console.log('User signed in successfully:', signInData.user.id);
        
        // Check if profile is active
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', signInData.user.id)
          .single();

        if (!profileError && profile?.is_active) {
          return { success: true, user: signInData.user };
        }
      }

      // console.log('Sign in failed or user inactive, checking if user needs activation:', signInError?.message);

      // If sign in failed, user might not exist in auth yet - this is normal in our flow
      // User will be created via webhook when payment is confirmed
      return { 
        success: false, 
        error: 'Usuário ainda não foi ativado. Aguarde a confirmação do pagamento.' 
      };

    } catch (error: any) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    registerUser,
    loading,
  };
};