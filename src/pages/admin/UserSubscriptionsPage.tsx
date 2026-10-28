import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Package, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingState, PageHeader } from '@/components/admin/ui';
import {
  AvailableCreditsSection,
  PlanHistorySection,
  type AvailableCredit,
  type PlanHistoryItem,
} from '@/components/admin/PlanSections';

interface UserInfo {
  id: string;
  name: string;
  email: string;
}

/** Linha crua vinda de `user_plans_detailed` com o join de `plans`. */
interface UserPlanRow {
  id: string;
  plan_id: string;
  status: string;
  created_at: string;
  used_at?: string;
  price?: string;
  notes?: string;
  expires_at?: string;
  used_for_project_id?: string;
  plans: { name: string; type: string } | null;
}

export const UserSubscriptionsPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanHistoryItem[]>([]);
  const [availablePlans, setAvailablePlans] = useState<AvailableCredit[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        setLoading(true);

        // Buscar informações do usuário
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;
        setUserInfo(profile);

        // Buscar todos os planos do usuário
        const { data: userPlansData, error: plansError } = await supabase
          .from('user_plans_detailed')
          .select(
            `
            id,
            plan_id,
            status,
            created_at,
            used_at,
            price,
            notes,
            expires_at,
            used_for_project_id,
            plans:plan_id (
              name,
              type
            )
          `,
          )
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (plansError) throw plansError;

        const formattedPlans: PlanHistoryItem[] = ((userPlansData || []) as unknown as UserPlanRow[]).map(
          (up) => ({
            id: up.id,
            plan_name: up.plans?.name || 'Plano desconhecido',
            plan_type: up.plans?.type || 'website_only',
            plan_price: up.price,
            notes: up.notes,
            status: up.status,
            created_at: up.created_at,
            used_at: up.used_at,
            expires_at: up.expires_at,
            used_for_project_id: up.used_for_project_id,
          }),
        );

        setPlans(formattedPlans);

        // Buscar planos disponíveis
        const { data: availableData, error: availableError } = await supabase.rpc(
          'get_available_user_plans',
          { _user_id: userId },
        );

        if (availableError) {
          console.error('Error fetching available plans:', availableError);
          setAvailablePlans([]);
        } else {
          setAvailablePlans((availableData || []) as AvailableCredit[]);
        }
      } catch (error) {
        console.error('Error fetching user subscriptions:', error);
        toast.error('Erro ao carregar assinaturas do usuário');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return <LoadingState label="Carregando assinaturas..." size="lg" fullScreen />;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/admin/users')} className="-ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
        Voltar para usuários
      </Button>

      <PageHeader
        icon={Package}
        eyebrow="Pessoas"
        title="Assinaturas do usuário"
        description={userInfo ? `${userInfo.name} · ${userInfo.email}` : undefined}
      />

      <AvailableCreditsSection credits={availablePlans} />

      <PlanHistorySection
        plans={plans}
        emptyDescription="Este usuário ainda não possui nenhum plano contratado."
      />
    </div>
  );
};
