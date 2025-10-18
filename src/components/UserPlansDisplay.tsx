import { Package, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useUserPlans } from '@/hooks/useUserPlans';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const UserPlansDisplay = () => {
  const { availablePlans, plans, loading } = useUserPlans();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border animate-pulse">
        <Package className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  const totalAvailable = availablePlans.reduce((sum, plan) => sum + plan.count, 0);

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="flex items-center gap-3">
        <Card className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <Package className="h-5 w-5 text-primary" />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Planos Disponíveis</span>
            <span className="text-lg font-bold">{totalAvailable}</span>
          </div>
        </Card>
        
        {totalAvailable === 0 && (
          <Button 
            size="sm" 
            onClick={() => navigate('/admin/new-project/purchase')}
            className="whitespace-nowrap"
          >
            Comprar Planos
          </Button>
        )}
      </div>

      {/* Available Plans Details */}
      {availablePlans.length > 0 && (
        <div className="grid gap-2">
          {availablePlans.map((plan) => (
            <Card key={plan.plan_id} className="p-3 bg-card/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{plan.plan_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {plan.count} disponível{plan.count > 1 ? 'is' : ''}
                      </Badge>
                      {plan.expires_at && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Expira em {format(new Date(plan.expires_at), 'dd/MMM/yy', { locale: ptBR })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Plans History */}
      {plans.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Histórico de Planos ({plans.length})
          </summary>
          <div className="mt-2 space-y-2">
            {plans.slice(0, 5).map((plan) => (
              <Card key={plan.id} className="p-2 text-xs bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {plan.status === 'active' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                    {plan.status === 'used' && <CheckCircle2 className="h-3 w-3 text-blue-500" />}
                    {plan.status === 'expired' && <XCircle className="h-3 w-3 text-orange-500" />}
                    {plan.status === 'cancelled' && <XCircle className="h-3 w-3 text-red-500" />}
                    <span className="font-medium">{plan.plan_name}</span>
                  </div>
                  <Badge 
                    variant={plan.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {plan.status === 'active' ? 'Ativo' : 
                     plan.status === 'used' ? 'Usado' : 
                     plan.status === 'expired' ? 'Expirado' : 'Cancelado'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-muted-foreground">
                  <span>
                    Adquirido: {format(new Date(plan.created_at), 'dd/MM/yy HH:mm')}
                  </span>
                  {plan.used_at && (
                    <span>
                      Usado: {format(new Date(plan.used_at), 'dd/MM/yy HH:mm')}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};
