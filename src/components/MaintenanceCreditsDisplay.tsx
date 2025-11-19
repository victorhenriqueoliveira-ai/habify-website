import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { useMaintenanceCredits } from '@/hooks/useMaintenanceCredits';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const MaintenanceCreditsDisplay = () => {
  const { credits, totalRemaining, loading } = useMaintenanceCredits();

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-8 bg-muted rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (credits.length === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-card to-muted/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Sem Créditos de Manutenção</h3>
            <p className="text-sm text-muted-foreground">
              Adquira um plano com manutenção para receber créditos mensais de customização
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/20">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Créditos Disponíveis</p>
              <p className="text-3xl font-bold">{totalRemaining}</p>
            </div>
          </div>
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Ativo
          </Badge>
        </div>
      </Card>

      <details className="group">
        <summary className="cursor-pointer list-none">
          <Card className="p-4 hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Detalhes dos Créditos</h4>
              <Clock className="h-4 w-4 text-muted-foreground group-open:rotate-180 transition-transform" />
            </div>
          </Card>
        </summary>
        
        <div className="mt-2 space-y-2">
          {credits.map((credit) => {
            const isExpired = credit.expires_at && new Date(credit.expires_at) < new Date();
            
            return (
              <Card key={credit.id} className={`p-4 ${isExpired ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {credit.remaining_credits} de {credit.total_credits} créditos
                      </p>
                      {isExpired && (
                        <Badge variant="secondary">Expirado</Badge>
                      )}
                    </div>
                    {credit.expires_at && (
                      <p className="text-xs text-muted-foreground">
                        Expira em: {format(new Date(credit.expires_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Usados</p>
                    <p className="text-lg font-bold">{credit.used_credits}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </details>
    </div>
  );
};
