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
  plan_price: string;
  notes?: string;
}

export interface AvailablePlan {
  plan_id: string;
  plan_name: string;
  plan_type: string;
  plan_description: string | null;
  plan_features: any;
  count: number;
  expires_at: string | null;
}

// Helper to check if user is admin/dev via user_roles table (secure)
const checkIsAdminOrDev = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'dev'])
      .maybeSingle();

    return !error && !!data;
  } catch {
    return false;
  }
};

export const useUserPlans = () => {
  const [plans, setPlans] = useState<UserPlan[]>([]);
  const [availablePlans, setAvailablePlans] = useState<AvailablePlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserPlans = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar profile do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Check admin/dev status using user_roles table (secure)
      const isAdminOrDev = await checkIsAdminOrDev(user.id);

      // Buscar planos - admin/dev veem todos, usuários veem apenas os seus
      let query = supabase
        .from('user_plans_detailed')
        .select(`
          id,
          plan_id,
          status,
          created_at,
          used_at,
          price,
          notes,
          expires_at,
          used_for_project_id,
          user_id,
          user_name,
          user_email,
          plans:plan_id (
            name,
            type
          )
        `);

      // Admin/Dev veem todos os planos, usuários veem apenas os seus
      if (!isAdminOrDev) {
        query = query.eq('user_id', profile.id);
      }

      const { data: userPlansData, error: plansError } = await query
        .order('created_at', { ascending: false });

      if (plansError) throw plansError;

      const formattedPlans: UserPlan[] = (userPlansData || []).map((up: any) => ({
        id: up.id,
        plan_id: up.plan_id,
        plan_name: up.plans?.name || 'Plano Desconhecido',
        plan_type: up.plans?.type || 'website_only',
        plan_price: up.price,
        notes: up.notes,
        status: up.status,
        created_at: up.created_at,
        used_at: up.used_at,
        expires_at: up.expires_at,
        used_for_project_id: up.used_for_project_id,
      }));

      setPlans(formattedPlans);

      // Buscar planos disponíveis - apenas para usuários regulares
      // Admin/Dev não precisam de planos disponíveis
      if (!isAdminOrDev) {
        const { data: availableData, error: availableError } = await supabase
          .rpc('get_available_user_plans', { _user_id: profile.id });

        if (availableError) {
          console.error('Error fetching available plans:', availableError);
          setAvailablePlans([]);
        } else {
          const formattedAvailable: AvailablePlan[] = (availableData || []).map((plan: any) => ({
            plan_id: plan.plan_id,
            plan_name: plan.plan_name,
            plan_type: plan.plan_type,
            plan_description: plan.plan_description,
            plan_features: plan.plan_features,
            count: Number(plan.count),
            expires_at: plan.expires_at,
          }));
          setAvailablePlans(formattedAvailable);
        }
      } else {
        setAvailablePlans([]);
      }
    } catch (error) {
      console.error('Error fetching user plans:', error);
      setPlans([]);
      setAvailablePlans([]);
    } finally {
      setLoading(false);
    }
  };

  const usePlanForProject = async (planId: string, projectId: string): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return null;

      // Usar plano via RPC - agora retorna o user_plan_id
      const { data: userPlanId, error } = await supabase.rpc('use_user_plan', {
        _user_id: profile.id,
        _plan_id: planId,
        _project_id: projectId
      });

      if (error) throw error;

      if (!userPlanId) {
        toast.error('Você não tem um plano disponível deste tipo');
        return null;
      }

      await fetchUserPlans();
      toast.success('Plano utilizado com sucesso!');
      return userPlanId;
    } catch (error) {
      console.error('Error using plan:', error);
      return null;
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
