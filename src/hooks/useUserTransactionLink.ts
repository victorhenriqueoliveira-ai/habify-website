import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUserTransactionLink = () => {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const linkTransaction = async () => {
      if (!isAuthenticated || !user?.email) return;

      try {
        // Call the function to link transactions to the authenticated user
        const { error } = await supabase.rpc('link_user_transaction', {
          user_email: user.email
        });

        if (error) {
          console.error('Error linking transaction:', error);
        } else {
          console.log('Transaction successfully linked to user');
        }
      } catch (error) {
        console.error('Error in useUserTransactionLink:', error);
      }
    };

    linkTransaction();
  }, [isAuthenticated, user?.email]);
};