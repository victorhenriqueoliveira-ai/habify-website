import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, TrendingUp } from 'lucide-react';
import { usePlans, type Plan } from '@/hooks/usePlans';

const PricingSection = () => {
  const navigate = useNavigate();
  const { plans, loading, error } = usePlans();

  const handleSelectPlan = (planId: string) => {
    navigate(`/checkout/${planId}`);
  };

  const getPlanIcon = (type: Plan['type']) => {
    switch (type) {
      case 'website_only':
        return <Sparkles className="h-5 w-5" />;
      case 'website_maintenance_1m':
        return <TrendingUp className="h-5 w-5" />;
      case 'website_maintenance_6m':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const getPlanBadge = (type: Plan['type']) => {
    switch (type) {
      case 'website_maintenance_1m':
        return <Badge variant="secondary">Recomendado</Badge>;
      case 'website_maintenance_6m':
        return <Badge variant="outline">Mais Popular</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="h-8 bg-muted rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-32 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-24"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="h-4 bg-muted rounded"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || plans.length === 0) {
    return (
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-destructive mb-4">
            Erro ao carregar planos
          </h2>
          <p className="text-muted-foreground">
            {error || 'Nenhum plano disponível no momento'}
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="plans" className="py-20 px-4 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8 sm:mb-16">
            <div className="flex-1 h-[1px] bg-gray-300"></div>
          </div>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Escolha seu plano ideal
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transforme seu empreendimento em um site profissional que vende
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const isPopular = plan.type === 'website_maintenance_1m';
              const monthlyMaintenanceNote = plan.type === 'website_maintenance_6m' ? 
                'Manutenção sai por apenas R$ 166,16/mês' : null;

              return (
              <Card 
                key={plan.id} 
                className={`relative flex flex-col justify-between h-full transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                  isPopular ? 'border-primary shadow-primary/20 shadow-lg' : ''
                }`}
              >
                {getPlanBadge(plan.type) && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    {getPlanBadge(plan.type)}
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center mb-2">
                    {getPlanIcon(plan.type)}
                  </div>
                  <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                  
                  {/* Preço Cartão (Stripe) */}
                  {plan.stripe_price && (
                    <>
                      <div className='flex flex-row items-center justify-center gap-3'>
                        <div className="text-1xl font-bold text-primary">
                          12x de
                        </div>
                        <div className="text-3xl font-bold text-primary">
                          R$ {(plan.stripe_price / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          via cartão
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total: R$ {plan.stripe_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-blue-600 italic">
                        Parcelamento disponível no checkout*
                      </p>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          ou
                        </p>
                      </div>
                    </>
                  )}
                  
                  {/* Preço PIX */}
                  <div className='flex flex-row items-center justify-center gap-3'>
                    <div className="text-1xl font-bold text-primary">
                      R$ {(plan.pix_price || plan.price).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      via PIX
                    </p>
                  </div>
                  
                  {monthlyMaintenanceNote && (
                    <p className="text-sm text-muted-foreground font-medium">
                      {monthlyMaintenanceNote}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </CardHeader>

              <CardContent className="flex flex-col flex-grow justify-between">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    <Button 
                      onClick={() => handleSelectPlan(plan.id)}
                      className="w-full"
                      variant={isPopular ? "default" : "outline"}
                    >
                      Escolher Plano
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>

          <div className="text-center mt-12 space-y-3">
            <p className="text-muted-foreground mb-4">
              Todos os planos incluem garantia de 30 dias
            </p>
            <p className="text-sm text-muted-foreground">
              Pagamento 100% seguro via AbacatePay (PIX) e Hubla (Cartão/Boleto)
            </p>
            <p className="text-xs text-blue-600 italic">
              *Parcelamento em até 12x no cartão de crédito. As opções de parcelamento dependem do banco emissor do seu cartão e serão apresentadas no checkout do Hubla.
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default PricingSection;