import { Package, Calendar, CheckCircle2, XCircle, Clock, ShoppingCart } from 'lucide-react';
import { useUserPlans } from '@/hooks/useUserPlans';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCanViewPlans } from '@/hooks/useCanViewPlans';

export const UserPlansDisplay = () => {
  const { availablePlans, plans, loading } = useUserPlans();
  const navigate = useNavigate();
  const { canViewPlans } = useCanViewPlans();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border animate-pulse">
        <Package className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Carregando planos...</span>
      </div>
    );
  }

  // Não mostrar nada para admin/dev
  if (!canViewPlans) {
    return null;
  }

  const totalAvailable = availablePlans.reduce((sum, plan) => sum + plan.count, 0);

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="flex items-center gap-3 flex-wrap">
        <Card className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 flex-1 min-w-[200px]">
          <div className="p-2 rounded-lg bg-primary/20">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-medium">Planos Ativos</span>
            <span className="text-2xl font-bold text-primary">{totalAvailable}</span>
            <span className="text-xs text-muted-foreground">
              {totalAvailable === 1 ? 'site disponível' : 'sites disponíveis'}
            </span>
          </div>
        </Card>
        
        <Button 
          size="default" 
          onClick={() => navigate('/admin/new-project/purchase')}
          className="gap-2"
          variant={totalAvailable === 0 ? "default" : "outline"}
        >
          <ShoppingCart className="h-4 w-4" />
          {totalAvailable === 0 ? 'Contratar Plano' : 'Contratar Mais'}
        </Button>
      </div>

      {/* Available Plans Details */}
      {availablePlans.length > 0 && (
        <Card className="p-4 bg-gradient-to-br from-card to-muted/20">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <h3 className="font-semibold text-sm">Seus Planos Ativos</h3>
          </div>
          <div className="grid gap-3">
            {availablePlans.map((plan) => (
              <div 
                key={plan.plan_id} 
                className="flex items-center justify-between p-3 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Package className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{plan.plan_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs border-green-500/50 text-green-700">
                        {plan.count} {plan.count === 1 ? 'crédito' : 'créditos'}
                      </Badge>
                      {plan.expires_at && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Válido até {format(new Date(plan.expires_at), 'dd/MMM/yy', { locale: ptBR })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Plans History */}
      {plans.length > 0 && (
        <Card className="p-4">
          <details className="group">
            <summary className="cursor-pointer font-medium text-sm flex items-center gap-2 hover:text-primary transition-colors">
              <Clock className="h-4 w-4" />
              Histórico Completo de Planos ({plans.length})
              <span className="ml-auto text-xs text-muted-foreground">
                {plans.filter(p => p.status === 'used').length} utilizados
              </span>
            </summary>
            <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
              {plans.map((plan) => (
                <div 
                  key={plan.id} 
                  className="p-3 rounded-lg border bg-background hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">
                        {plan.status === 'active' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        {plan.status === 'used' && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
                        {plan.status === 'expired' && <XCircle className="h-4 w-4 text-orange-500" />}
                        {plan.status === 'cancelled' && <XCircle className="h-4 w-4 text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{plan.plan_name}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Adquirido: {format(new Date(plan.created_at), 'dd/MM/yy', { locale: ptBR })}
                          </span>
                          {plan.used_at && (
                            <span className="flex items-center gap-1">
                              Usado: {format(new Date(plan.used_at), 'dd/MM/yy', { locale: ptBR })}
                            </span>
                          )}
                          {plan.expires_at && (
                            <span className="flex items-center gap-1">
                              Expira: {format(new Date(plan.expires_at), 'dd/MM/yy', { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant={plan.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs shrink-0"
                    >
                      {plan.status === 'active' ? 'Ativo' : 
                       plan.status === 'used' ? 'Usado' : 
                       plan.status === 'expired' ? 'Expirado' : 'Cancelado'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </Card>
      )}
    </div>
  );
};
