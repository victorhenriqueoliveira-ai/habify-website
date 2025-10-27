import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useUserPlans } from '@/hooks/useUserPlans';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Package, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

  const getPlanTypeDescription = (type: string) => {
    switch (type) {
      case 'website_only':
        return 'Criação de site profissional sem manutenção incluída';
      case 'website_maintenance_1m':
        return 'Criação de site + Suporte técnico e atualizações por 1 mês';
      case 'website_maintenance_6m':
        return 'Criação de site + Suporte técnico e atualizações por 6 meses';
      default:
        return type;
    }
  };

  return (
    <TooltipProvider>
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
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{plan.plan_name}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-sm">{getPlanTypeDescription(plan.plan_type)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Badge variant="secondary">
                          {plan.count} disponível{plan.count > 1 ? 'is' : ''}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        {getPlanTypeDescription(plan.plan_type)}
                      </div>

                      {plan.plan_description && (
                        <p className="text-xs text-muted-foreground italic">
                          {plan.plan_description}
                        </p>
                      )}

                      {plan.plan_features && Array.isArray(plan.plan_features) && plan.plan_features.length > 0 && (
                        <Collapsible>
                          <CollapsibleTrigger className="text-xs text-primary hover:underline">
                            Ver recursos inclusos ({plan.plan_features.length})
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                              {plan.plan_features.map((feature: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-1">
                                  <span className="text-primary">•</span>
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {plan.expires_at && (
                        <div className="text-xs text-muted-foreground pt-1 border-t">
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
    </TooltipProvider>
  );
};
