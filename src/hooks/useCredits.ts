import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreditsHistory {
  id: string;
  amount: number;
  type: 'purchase' | 'usage' | 'admin_grant' | 'refund';
  description: string | null;
  created_at: string;
}

export const useCredits = () => {
  const [credits, setCredits] = useState<number>(0);
  const [history, setHistory] = useState<CreditsHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCredits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('auth_user_id', user.id)
        .single();

      if (error) throw error;
      setCredits(profile?.credits || 0);
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar profile_id primeiro
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from('credits_history')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory((data || []) as CreditsHistory[]);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const useCreditsForProject = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Buscar profile_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, credits')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) return false;

      if (profile.credits < 1) {
        toast.error('Você não tem créditos suficientes para criar um site');
        return false;
      }

      // Usar 1 crédito
      const { data, error } = await supabase.rpc('use_credits', {
        _user_id: profile.id,
        _amount: 1,
        _description: 'Criação de site'
      });

      if (error) throw error;

      if (!data) {
        toast.error('Você não tem créditos suficientes');
        return false;
      }

      await fetchCredits();
      await fetchHistory();
      return true;
    } catch (error) {
      console.error('Error using credits:', error);
      toast.error('Erro ao usar créditos');
      return false;
    }
  };

  const grantCredits = async (userId: string, amount: number, description: string) => {
    try {
      const { error } = await supabase.rpc('add_credits', {
        _user_id: userId,
        _amount: amount,
        _type: 'admin_grant',
        _description: description
      });

      if (error) throw error;
      
      toast.success(`${amount} crédito(s) concedido(s) com sucesso`);
      await fetchCredits();
      await fetchHistory();
      return true;
    } catch (error) {
      console.error('Error granting credits:', error);
      toast.error('Erro ao conceder créditos');
      return false;
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchCredits();
      await fetchHistory();
      setLoading(false);
    };

    init();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      init();
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    credits,
    history,
    loading,
    fetchCredits,
    fetchHistory,
    useCreditsForProject,
    grantCredits,
  };
};
