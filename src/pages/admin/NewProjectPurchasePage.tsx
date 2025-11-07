import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Star } from 'lucide-react';
import { usePlans } from '@/hooks/usePlans';
import { useCanViewPlans } from '@/hooks/useCanViewPlans';

const NewProjectPurchasePage = () => {
  const navigate = useNavigate();
  const { plans, loading } = usePlans();
  const { canViewPlans } = useCanViewPlans();
  
  // Redirecionar admin/dev para página de criação de projeto
  useEffect(() => {
    if (!canViewPlans) {
      navigate('/admin/new-project');
    }
  }, [canViewPlans, navigate]);

  const handlePurchasePlan = (planId: string) => {
    navigate(`/checkout/${planId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/admin/my-projects')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Contratar Novo Projeto</h1>
            <p className="text-muted-foreground mt-1">
              Você já possui um projeto ativo. Para criar um novo, contrate um dos planos abaixo.
            </p>
          </div>
        </div>
      </div>
      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <Card 
            key={plan.id} 
            className={`relative ${index === 1 ? 'border-primary shadow-lg scale-105' : ''}`}
          >
            {index === 1 && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  <Star className="w-3 h-3 mr-1" />
                  Mais Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="text-3xl font-bold text-primary">
                R$ {plan.price.toLocaleString('pt-BR')}
              </div>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              
              <Button 
                className="w-full" 
                variant={index === 1 ? "default" : "outline"}
                onClick={() => handlePurchasePlan(plan.id)}
              >
                Contratar Agora
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary font-bold">1</span>
              </div>
              <h3 className="font-medium mb-2">Escolha o Plano</h3>
              <p className="text-sm text-muted-foreground">
                Selecione o plano que melhor se adequa às suas necessidades
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary font-bold">2</span>
              </div>
              <h3 className="font-medium mb-2">Efetue o Pagamento</h3>
              <p className="text-sm text-muted-foreground">
                Complete o checkout com seus dados e forme de pagamento
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-primary font-bold">3</span>
              </div>
              <h3 className="font-medium mb-2">Crie seu Projeto</h3>
              <p className="text-sm text-muted-foreground">
                Após o pagamento, você poderá criar seu novo projeto
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewProjectPurchasePage;