import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { usePayment } from '@/hooks/usePayment';
import { toast } from 'sonner';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyPayment } = usePayment();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [transactionData, setTransactionData] = useState<any>(null);

  useEffect(() => {
    const verifyAndProcessPayment = async () => {
      try {
        // Get transaction data from localStorage or URL params
        const storedTransaction = localStorage.getItem('habify_transaction');
        const abacatePayId = searchParams.get('payment_id') || 
                           (storedTransaction ? JSON.parse(storedTransaction).abacatePayId : null);

        if (!abacatePayId) {
          setStatus('error');
          return;
        }

        // Verify payment with AbacatePay
        const result = await verifyPayment(abacatePayId);

        if (result.success && result.isPaid) {
          setStatus('success');
          setTransactionData(result.transaction);
          
          // Clear stored transaction data
          localStorage.removeItem('habify_transaction');
          
          toast.success('Pagamento confirmado com sucesso!');
        } else {
          setStatus('error');
          toast.error('Pagamento não foi confirmado');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
        toast.error('Erro ao verificar pagamento');
      }
    };

    verifyAndProcessPayment();
  }, [searchParams, verifyPayment]);

  const handleGoToLogin = () => {
    navigate('/auth');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h1 className="text-xl font-semibold">Verificando pagamento...</h1>
            <p className="text-muted-foreground text-center">
              Aguarde enquanto confirmamos seu pagamento
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-8">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h1 className="text-xl font-semibold">Ops! Algo deu errado</h1>
            <p className="text-muted-foreground text-center">
              Não foi possível confirmar seu pagamento. Entre em contato conosco.
            </p>
            <div className="flex space-x-2 pt-4">
              <Button variant="outline" onClick={handleGoHome}>
                Voltar ao início
              </Button>
              <Button onClick={() => window.open('https://wa.me/5511999999999', '_blank')}>
                Falar no WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-600">
            Pagamento Confirmado!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-lg">
              Parabéns! Seu pagamento foi processado com sucesso.
            </p>
            <p className="text-muted-foreground">
              Agora você precisa criar sua conta para acessar o painel e começar seu projeto.
            </p>
          </div>

          {transactionData && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold">Detalhes da compra:</h3>
              <p><strong>Plano:</strong> {transactionData.plan?.name}</p>
              <p><strong>Valor:</strong> R$ {Number(transactionData.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p><strong>Status:</strong> <span className="text-green-600 font-medium">Pago</span></p>
            </div>
          )}

          <div className="space-y-4 pt-4">
            <h3 className="font-semibold">Próximos passos:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start space-x-2">
                <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
                <span>Criar sua conta no painel administrativo</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="bg-muted text-muted-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
                <span>Adicionar informações do seu empreendimento</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="bg-muted text-muted-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</span>
                <span>Nossa equipe começará a desenvolver seu site</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={handleGoHome} className="flex-1">
              Voltar ao início
            </Button>
            <Button onClick={handleGoToLogin} className="flex-1">
              Criar conta
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Dúvidas? Entre em contato via WhatsApp: (11) 99999-9999
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;