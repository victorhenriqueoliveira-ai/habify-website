import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react';

const PaymentCanceled = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleTryAgain = () => {
    navigate('/', { state: { scrollTo: 'pricing' } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-orange-500" />
          </div>
          <CardTitle className="text-2xl text-orange-600">
            Pagamento Cancelado
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-lg">
              Não se preocupe! Você pode tentar novamente quando quiser.
            </p>
            <p className="text-muted-foreground">
              Seu pagamento foi cancelado e nenhum valor foi cobrado.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Precisa de ajuda?</h3>
            <p className="text-sm text-muted-foreground">
              Entre em contato conosco pelo WhatsApp se tiver alguma dúvida sobre o processo de pagamento.
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={handleTryAgain} className="w-full" size="lg">
              <CreditCard className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
            
            <Button variant="outline" onClick={handleGoHome} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Início
            </Button>
          </div>

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => window.open('https://wa.me/5511961769504', '_blank')}
              className="text-sm"
            >
              Falar no WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCanceled;