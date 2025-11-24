import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MaintenanceCredit {
  id: string;
  user_plan_id: string;
  user_id: string;
  project_id?: string;
  total_credits: number;
  used_credits: number;
  remaining_credits: number;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export const useMaintenanceCredits = (userId?: string, projectId?: string) => {
  const [credits, setCredits] = useState<MaintenanceCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRemaining, setTotalRemaining] = useState(0);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user && !userId) return;

      // Determinar qual user_id usar
      let targetProfileId = userId;
      if (!targetProfileId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user!.id)
          .single();
        targetProfileId = profile?.id;
      }

      if (!targetProfileId) return;

      let query = supabase
        .from('maintenance_credits')
        .select('*')
        .eq('user_id', targetProfileId);
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query.order('expires_at', { ascending: true, nullsFirst: false });

      if (error) throw error;

      const creditsData = data as MaintenanceCredit[];
      setCredits(creditsData);
      
      const total = creditsData.reduce((sum, credit) => {
        // Considerar apenas créditos não expirados
        if (credit.expires_at && new Date(credit.expires_at) < new Date()) {
          return sum;
        }
        return sum + credit.remaining_credits;
      }, 0);
      
      setTotalRemaining(total);
    } catch (error) {
      console.error('Error fetching maintenance credits:', error);
      toast.error('Erro ao carregar créditos de manutenção');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, [userId, projectId]);

  return {
    credits,
    totalRemaining,
    loading,
    refetch: fetchCredits,
  };
};
