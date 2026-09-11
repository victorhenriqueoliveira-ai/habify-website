import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Globe, ShieldCheck, Zap, Wrench } from 'lucide-react';
import { usePlans } from '@/hooks/usePlans';
import { BUSINESS } from '@/config/business';
import { useAuth } from '@/contexts/AuthContext';

const maintenanceBenefits = [
  'Atualizações de textos, fotos e informações',
  'Correções de bugs e suporte técnico dedicado',
  'Backup regular dos seus dados',
];

const PricingSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plans, loading, error } = usePlans();

  const handleSelectPlan = (planId: string) => {
    navigate(`/checkout/${planId}`);
  };

  if (loading) {
    return (
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="h-8 bg-muted rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {[1, 2].map((i) => (
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

  // Filter out domain_registration plans - only show website plans
  const websitePlans = plans.filter(p => p.type !== 'domain_registration');
  const activePlan = websitePlans[0]; // Apenas 1 plano ativo de site

  if (error || websitePlans.length === 0) {
    return (
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
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
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-8 sm:mb-16">
            <div className="flex-1 h-[1px] bg-gray-300"></div>
          </div>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Comece agora
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Transforme seu empreendimento em um site profissional que vende
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Plano Único */}
            <Card className="relative border-primary shadow-primary/20 shadow-lg flex flex-col justify-between h-full transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 flex gap-2">
                <Badge variant="secondary">Mais Vendido</Badge>
                <Badge className="bg-primary text-primary-foreground gap-1">
                  <Zap className="h-3 w-3" /> Pagamento Único
                </Badge>
              </div>

              <CardHeader className="text-center pb-4 pt-6">
                <div className="flex items-center justify-center mb-2">
                  <Globe className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-bold">{activePlan.name}</CardTitle>

                <div className="mt-4 space-y-2">
                  <div className="text-4xl font-bold text-primary">
                    R$ {activePlan.price.toFixed(2).replace('.', ',')}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    pagamento único · sem mensalidades
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Concorrentes: R$ {BUSINESS.competitor.monthlyPrice}/mês ={' '}
                    <span className="line-through">R$ {BUSINESS.competitor.yearlyCost.toLocaleString('pt-BR')}/ano</span>
                  </p>
                </div>

                <p className="text-sm text-muted-foreground mt-2">
                  {activePlan.description}
                </p>
              </CardHeader>

              <CardContent className="flex flex-col flex-grow justify-between">
                <ul className="space-y-3 mb-6">
                  {activePlan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto space-y-3">
                  <Button
                    onClick={() => handleSelectPlan(activePlan.id)}
                    className="w-full"
                    size="lg"
                  >
                    Começar Agora
                  </Button>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    <span>Garantia de {BUSINESS.pricing.guaranteeDays} dias</span>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    Domínio por conta do cliente (~R$ {BUSINESS.pricing.domainYearly}/ano)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Plano Enterprise */}
            <Card className="relative border-2 border-purple-500 shadow-xl flex flex-col justify-between h-full">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-1 whitespace-nowrap">
                  Para Grandes Corretores
                </Badge>
              </div>
              <CardHeader className="text-center pt-10">
                <div className="flex items-center justify-center mb-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                  Plano Enterprise
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Solução personalizada para imobiliárias e grandes corretores
                </p>
              </CardHeader>
              <CardContent className="space-y-6 flex-1 flex flex-col">
                <div className="text-center">
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                    Sob Consulta
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Plano customizado de acordo com suas necessidades
                  </p>
                </div>

                <div className="space-y-3 flex-1">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Check className="h-4 w-4 text-purple-600" />
                    Benefícios Exclusivos
                  </h4>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="h-3 w-3 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span>Múltiplos empreendimentos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3 w-3 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span>Formulários de captura personalizados</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3 w-3 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span>Relatórios e analytics avançados</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3 w-3 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span>Suporte prioritário e consultoria dedicada</span>
                    </li>
                  </ul>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 mt-auto"
                  onClick={() => {
                    window.open(
                      BUSINESS.whatsapp.url(
                        'Olá! Vim do site e gostaria de saber mais sobre o Plano Enterprise da Habify. Tenho interesse em uma solução personalizada para minha imobiliária/corretora.'
                      ),
                      '_blank'
                    );
                  }}
                >
                  Falar com Especialista
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12 space-y-3">
            <p className="text-muted-foreground mb-4">
              Garantia de 30 dias
            </p>
            <p className="text-sm text-muted-foreground">
              Pagamento 100% seguro via AbacatePay (PIX e Cartão)
            </p>
          </div>

          {/* Manutenção mensal — add-on após a entrega */}
          <Card className="max-w-3xl mx-auto mt-8 border-border/60">
            <CardContent className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8">
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wrench className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-bold text-foreground">Manutenção mensal (opcional)</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {maintenanceBenefits.join(' · ')}
                </p>
              </div>
              <div className="flex-shrink-0 text-center sm:text-right">
                <div className="text-2xl font-bold text-primary">R$ 54,90<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    if (user) {
                      navigate('/admin/my-maintenances');
                    } else {
                      window.open(BUSINESS.whatsapp.url('Olá! Gostaria de saber mais sobre a manutenção mensal da Habify.'), '_blank');
                    }
                  }}
                >
                  {user ? 'Contratar' : 'Saiba mais'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
};

export default PricingSection;
