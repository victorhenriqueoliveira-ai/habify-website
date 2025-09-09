import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const TransactionLinker = () => {
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
          // Silent error - no console logging in production
        }
      } catch (error) {
        // Silent error handling in production
      }
    };

    linkTransaction();
  }, [isAuthenticated, user?.email]);

  return null; // This component doesn't render anything
};