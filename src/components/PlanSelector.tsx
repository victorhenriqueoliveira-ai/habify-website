import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useUserPlans } from '@/hooks/useUserPlans';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Package } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PlanSelectorProps {
  selectedPlanId: string | null;
  onPlanSelect: (planId: string) => void;
}

export const PlanSelector = ({ selectedPlanId, onPlanSelect }: PlanSelectorProps) => {
  const { availablePlans, loading } = useUserPlans();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando planos...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (availablePlans.length === 0) {
    return (
      <Alert>
        <Package className="h-4 w-4" />
        <AlertDescription>
          Você não possui planos ativos disponíveis. Por favor, adquira um plano para criar um novo projeto.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selecione o Plano</CardTitle>
        <CardDescription>
          Escolha qual plano deseja utilizar para criar este projeto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedPlanId || ''} onValueChange={onPlanSelect}>
          <div className="space-y-3">
            {availablePlans.map((plan) => (
              <div
                key={plan.plan_id}
                className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer hover:bg-accent/50 ${
                  selectedPlanId === plan.plan_id
                    ? 'border-primary bg-accent'
                    : 'border-border'
                }`}
                onClick={() => onPlanSelect(plan.plan_id)}
              >
                <RadioGroupItem value={plan.plan_id} id={plan.plan_id} className="mt-1" />
                <Label htmlFor={plan.plan_id} className="flex-1 cursor-pointer">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{plan.plan_name}</div>
                      <Badge variant="secondary">
                        {plan.count} disponível{plan.count > 1 ? 'is' : ''}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Tipo: {plan.plan_type === 'website_only' ? 'Site Único' : 
                             plan.plan_type === 'website_maintenance_1m' ? 'Site + 1 mês de manutenção' :
                             plan.plan_type === 'website_maintenance_6m' ? 'Site + 6 meses de manutenção' : 
                             plan.plan_type}
                    </div>
                    {plan.expires_at && (
                      <div className="text-xs text-muted-foreground">
                        Expira em: {format(new Date(plan.expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};
