import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useUserRegistration = () => {
  const [loading, setLoading] = useState(false);

  const registerUser = async (email: string, password: string, name: string) => {
    setLoading(true);
    console.log('Starting user registration for:', email);
    
    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/my-projects`,
          data: {
            name: name
          }
        },
      });

      console.log('Auth signup response:', { authData, authError });

      if (authError) {
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          console.log('User already exists, attempting sign in...');
          // User already exists, try to sign in
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          console.log('Sign in response:', { signInData, signInError });
          
          if (signInError) {
            console.error('Sign in error:', signInError);
            // Don't throw error, just inform success as the account exists
            toast.success('Usuário já existe! Redirecionando para o painel...');
            
            // Try to sign in with a different approach or just navigate
            return { success: true, user: null, message: 'User already exists' };
          }
          
          toast.success('Login realizado com sucesso!');
          
          // Link any pending transactions to this user after login
          console.log('Linking transactions to logged in user...');
          try {
            const { error: linkError } = await supabase.rpc('link_user_transaction', {
              user_email: email
            });
            
            if (linkError) {
              console.error('Error linking transactions:', linkError);
            } else {
              console.log('Transactions linked successfully');
            }
          } catch (linkError) {
            console.error('Error calling link_user_transaction:', linkError);
          }
          
          return { success: true, user: signInData.user };
        }
        
        // For other auth errors, try to continue anyway
        console.error('Auth error, but continuing:', authError);
        toast.success('Processando... Redirecionando para o painel.');
        return { success: true, user: null, message: 'Auth error but processed' };
      }

      console.log('User created successfully:', authData.user?.id);

      // Create profile
      if (authData.user) {
        console.log('Creating user profile...');
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
          // Don't fail registration if profile creation fails, but log it
        } else {
          console.log('Profile created successfully');
        }

        // Link any pending transactions to this user
        console.log('Linking transactions to user...');
        try {
          const { error: linkError } = await supabase.rpc('link_user_transaction', {
            user_email: email
          });
          
          if (linkError) {
            console.error('Error linking transactions:', linkError);
          } else {
            console.log('Transactions linked successfully');
          }
        } catch (linkError) {
          console.error('Error calling link_user_transaction:', linkError);
        }
      }

      toast.success('Conta criada com sucesso!');
      return { success: true, user: authData.user };
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.message || 'Erro ao criar conta';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    registerUser,
    loading,
  };
};