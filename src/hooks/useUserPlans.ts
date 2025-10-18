import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserPlan {
  id: string;
  plan_id: string;
  plan_name: string;
  plan_type: 'website_only' | 'website_maintenance_1m' | 'website_maintenance_6m';
  status: 'active' | 'used' | 'expired' | 'cancelled';
  created_at: string;
  used_at?: string;
  expires_at?: string;
  used_for_project_id?: string;
}

export interface AvailablePlan {
  plan_id: string;
  plan_name: string;
  plan_type: string;
  count: number;
  expires_at?: string;
}

export const useUserPlans = () => {
  const [plans, setPlans] = useState<UserPlan[]>([]);
  const [availablePlans, setAvailablePlans] = useState<AvailablePlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserPlans = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar profile_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Buscar todos os planos do usuário
      const { data: userPlansData, error: plansError } = await supabase
        .from('user_plans')
        .select(`
          id,
          plan_id,
          status,
          created_at,
          used_at,
          expires_at,
          used_for_project_id,
          plans:plan_id (
            name,
            type
          )
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (plansError) throw plansError;

      const formattedPlans: UserPlan[] = (userPlansData || []).map((up: any) => ({
        id: up.id,
        plan_id: up.plan_id,
        plan_name: up.plans?.name || 'Plano Desconhecido',
        plan_type: up.plans?.type || 'website_only',
        status: up.status,
        created_at: up.created_at,
        used_at: up.used_at,
        expires_at: up.expires_at,
        used_for_project_id: up.used_for_project_id,
      }));

      setPlans(formattedPlans);

      // Buscar planos disponíveis usando a função RPC
      const { data: availableData, error: availableError } = await supabase
        .rpc('get_available_user_plans', { _user_id: profile.id });

      if (availableError) throw availableError;

      setAvailablePlans(availableData || []);
    } catch (error) {
      console.error('Error fetching user plans:', error);
    }
  };

  const usePlanForProject = async (planId: string, projectId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return false;

      // Usar plano via RPC
      const { data: success, error } = await supabase.rpc('use_user_plan', {
        _user_id: profile.id,
        _plan_id: planId,
        _project_id: projectId
      });

      if (error) throw error;

      if (!success) {
        toast.error('Você não tem um plano disponível deste tipo');
        return false;
      }

      await fetchUserPlans();
      toast.success('Plano utilizado com sucesso!');
      return true;
    } catch (error) {
      console.error('Error using plan:', error);
      toast.error('Erro ao usar plano');
      return false;
    }
  };

  const hasAvailablePlan = (planType?: string): boolean => {
    if (!planType) {
      return availablePlans.length > 0;
    }
    return availablePlans.some(p => p.plan_type === planType && p.count > 0);
  };

  const getAvailablePlanByType = (planType: string): AvailablePlan | undefined => {
    return availablePlans.find(p => p.plan_type === planType && p.count > 0);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchUserPlans();
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
    plans,
    availablePlans,
    loading,
    fetchUserPlans,
    usePlanForProject,
    hasAvailablePlan,
    getAvailablePlanByType,
  };
};
