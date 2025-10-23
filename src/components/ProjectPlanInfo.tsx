import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Calendar, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

interface ProjectPlanInfoProps {
  projectId: string;
}

interface PlanInfo {
  user_plan_id: string;
  plan_name: string;
  plan_type: string;
  status: string;
  created_at: string;
  used_at?: string;
}

const planTypeLabels: Record<string, string> = {
  'website_only': 'Site Único',
  'website_maintenance_1m': 'Site + 1 mês de manutenção',
  'website_maintenance_6m': 'Site + 6 meses de manutenção',
};

export const ProjectPlanInfo = ({ projectId }: ProjectPlanInfoProps) => {
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlanInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select(`
            user_plan_id,
            user_plan:user_plan_id (
              status,
              created_at,
              used_at,
              plan:plan_id (
                name,
                type
              )
            )
          `)
          .eq('id', projectId)
          .maybeSingle();

        if (error) throw error;

        if (data && data.user_plan) {
          const plan = data.user_plan as any;
          setPlanInfo({
            user_plan_id: data.user_plan_id,
            plan_name: plan.plan?.name || 'Plano Desconhecido',
            plan_type: plan.plan?.type || 'website_only',
            status: plan.status,
            created_at: plan.created_at,
            used_at: plan.used_at,
          });
        }
      } catch (error) {
        console.error('Error fetching plan info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanInfo();
  }, [projectId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Plano Utilizado
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!planInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Plano Utilizado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum plano vinculado a este projeto
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Plano Utilizado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Nome do Plano</p>
          <p className="font-semibold text-lg">{planInfo.plan_name}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">Tipo de Plano</p>
          <Badge variant="secondary" className="text-sm">
            {planTypeLabels[planInfo.plan_type] || planInfo.plan_type}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium capitalize">{planInfo.status}</p>
          </div>
        </div>

        {planInfo.used_at && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Utilizado em</p>
              <p className="font-medium">
                {format(new Date(planInfo.used_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        )}

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Plano adquirido em {format(new Date(planInfo.created_at), "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
