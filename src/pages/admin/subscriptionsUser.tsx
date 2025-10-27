import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useUserPlans } from "@/hooks/useUserPlans";
import { Package, Calendar, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const SubscriptionsUserPage: React.FC = () => {
  const { plans, availablePlans, loading } = useUserPlans();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando suas assinaturas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Minhas Assinaturas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e visualize seus planos contratados
          </p>
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
                Você tem {availablePlans.reduce((sum, p) => sum + p.count, 0)} crédito(s) disponível(is)
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
                {plan.plan_features && Array.isArray(plan.plan_features) && plan.plan_features.length > 0 && (
                  <ul className="text-xs space-y-1 mb-3 text-muted-foreground">
                    {plan.plan_features.slice(0, 3).map((feature: string, idx: number) => (
                      <li key={idx}>• {feature}</li>
                    ))}
                  </ul>
                )}
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
                          onClick={() => window.location.href = `/admin/projects/${plan.used_for_project_id}`}
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
            Você ainda não possui nenhum plano contratado. Entre em contato com o administrador para adquirir um plano.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
