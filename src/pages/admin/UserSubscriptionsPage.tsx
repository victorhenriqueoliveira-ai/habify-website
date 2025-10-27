import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Package, Calendar, AlertCircle, ArrowLeft, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface UserPlan {
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

interface AvailablePlan {
  plan_id: string;
  plan_name: string;
  plan_type: string;
  count: number;
  expires_at?: string;
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
}

export const UserSubscriptionsPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<UserPlan[]>([]);
  const [availablePlans, setAvailablePlans] = useState<AvailablePlan[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-500/20";
      case "used":
        return "bg-blue-100 text-blue-700 border-blue-500/20";
      case "expired":
        return "bg-orange-100 text-orange-700 border-orange-500/20";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-500/20";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

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
            plans:plan_id (
              name,
              type
            )
          `)
          .eq('user_id', userId)
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

        // Buscar planos disponíveis
        const { data: availableData, error: availableError } = await supabase
          .rpc('get_available_user_plans', { _user_id: userId });

        if (availableError) {
          console.error('Error fetching available plans:', availableError);
          setAvailablePlans([]);
        } else {
          setAvailablePlans(availableData || []);
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando assinaturas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/users')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Assinaturas do Usuário</h1>
          {userInfo && (
            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{userInfo.name} ({userInfo.email})</span>
            </div>
          )}
        </div>
      </div>

      {/* Planos Disponíveis */}
      {availablePlans.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/20">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Planos Ativos</h2>
              <p className="text-sm text-muted-foreground">
                {availablePlans.reduce((sum, p) => sum + p.count, 0)} crédito(s) disponível(is)
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availablePlans.map((plan) => (
              <Card key={plan.plan_id} className="p-4 bg-background">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{plan.plan_name}</h3>
                  <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                    {plan.count} {plan.count === 1 ? 'crédito' : 'créditos'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {plan.plan_type === 'website_only' ? 'Criação de site único' : 
                   plan.plan_type === 'website_maintenance_1m' ? 'Site + Suporte técnico por 1 mês' :
                   'Site + Suporte técnico por 6 meses'}
                </p>
                {plan.expires_at && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Válido até {format(new Date(plan.expires_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Histórico de Planos */}
      {plans.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Histórico de Planos</h2>
          <div className="grid gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{plan.plan_name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Tipo: {plan.plan_type === 'website_only' ? 'Site Único' : 
                               plan.plan_type === 'website_maintenance_1m' ? 'Site + 1 Mês de Manutenção' : 
                               'Site + 6 Meses de Manutenção'}
                      </p>
                      {plan.used_for_project_id && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="h-auto p-0 mt-2"
                          onClick={() => navigate(`/admin/projects/${plan.used_for_project_id}`)}
                        >
                          Ver Projeto Vinculado →
                        </Button>
                      )}
                    </div>
                  </div>
                  <Badge className={getStatusColor(plan.status)}>
                    {plan.status === "active" ? "Ativo" : 
                     plan.status === "used" ? "Utilizado" :
                     plan.status === "expired" ? "Expirado" : "Cancelado"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Data de Aquisição</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {format(new Date(plan.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  {plan.used_at && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Data de Uso</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">
                          {format(new Date(plan.used_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  )}

                  {plan.expires_at && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Data de Expiração</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">
                          {format(new Date(plan.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {plan.plan_price && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="text-2xl font-bold text-primary">
                      R$ {parseFloat(plan.plan_price).toFixed(2)}
                    </p>
                  </div>
                )}

                {plan.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Observações</p>
                    <p className="text-sm">{plan.notes}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Este usuário ainda não possui nenhum plano contratado.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
