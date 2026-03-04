import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2, Coins, AlertCircle, XCircle } from 'lucide-react';
import { usePostPaymentFlow } from '@/hooks/usePostPaymentFlow';
import { useCredits } from '@/hooks/useCredits';
import { useAuth } from '@/hooks/useAuth';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isProcessing } = usePostPaymentFlow();
  const { credits, fetchCredits } = useCredits();
  const { user } = useAuth();
  const [transactionData, setTransactionData] = useState<any>(null);
  const [autoRedirectSeconds, setAutoRedirectSeconds] = useState(5);
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'confirmed' | 'pending' | 'error'>('processing');

  useEffect(() => {
    // 🎯 TELEMETRIA: Log de entrada
    // console.log('🎯 PaymentSuccess mounted:', {
    //   pathname: window.location.pathname,
    //   search: window.location.search,
    //   searchParams: Object.fromEntries(searchParams.entries()),
    //   localStorage: {
    //     orderId: localStorage.getItem('orderId'),
    //     paymentId: localStorage.getItem('paymentId'),
    //     gateway: localStorage.getItem('gateway'),
    //     transactionData: !!localStorage.getItem('transactionData')
    //   },
    //   timestamp: new Date().toISOString()
    // });

    // Atualizar créditos quando a página carregar
    fetchCredits();
  }, []);

  useEffect(() => {
    // Auto redirect countdown - apenas se não estiver processando e tiver transactionData
    if (!isProcessing && transactionData && autoRedirectSeconds > 0) {
      const timer = setTimeout(() => {
        setAutoRedirectSeconds(autoRedirectSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (autoRedirectSeconds === 0 && transactionData) {
      const isLoggedInPurchase = transactionData.payment_data?.isLoggedInPurchase;
      if (isLoggedInPurchase) {
        navigate('/admin/my-projects');
      } else {
        navigate('/admin/auth', { 
          state: { 
            message: 'Faça login para acessar seus projetos',
            email: transactionData.payment_data?.customerData?.email
          }
        });
      }
    }
  }, [autoRedirectSeconds, isProcessing, transactionData, navigate]);

  useEffect(() => {
    // 🔥 PRIORIDADE: Buscar orderId primeiro (mais confiável)
    const orderId = localStorage.getItem('orderId');
    
    // Fallback: IDs do gateway (podem não vir na URL de retorno)
    const paymentIdFromUrl = searchParams.get('abacate_pay_id') || searchParams.get('payment_id');
    const paymentIdFromStorage = localStorage.getItem('paymentId');
    
    // console.log('🔍 Checking payment IDs:', {
    //   orderId,
    //   paymentIdFromUrl,
    //   paymentIdFromStorage,
    //   hasAnyId: !!(orderId || paymentIdFromUrl || paymentIdFromStorage)
    // });
    
    // Salvar paymentId se veio na URL
    if (paymentIdFromUrl) {
      localStorage.setItem('paymentId', paymentIdFromUrl);
      // console.log('💾 Saved paymentId from URL:', paymentIdFromUrl);
    }
    
    // Se não tiver NENHUM ID, marcar como erro
    if (!orderId && !paymentIdFromUrl && !paymentIdFromStorage) {
      console.error('❌ Nenhum ID encontrado para verificar pagamento');
      setPaymentStatus('error');
      return;
    }

    // Check if we have verified payment data
    const verifiedData = localStorage.getItem('transactionData');
    if (verifiedData) {
      try {
        const data = JSON.parse(verifiedData);
        // console.log('✅ Transaction data found:', {
        //   status: data.status,
        //   hasUserId: !!data.user_id,
        //   orderId: data.id
        // });
        setTransactionData(data);
        // Se temos dados de transação e o status é "paid", o pagamento foi confirmado
        if (data.status === 'paid') {
          setPaymentStatus('confirmed');
        } else {
          setPaymentStatus('pending');
        }
      } catch (error) {
        console.error('❌ Error parsing transaction data:', error);
        setPaymentStatus('error');
      }
    } else if (orderId || paymentIdFromUrl || paymentIdFromStorage) {
      // Tem ID mas não tem dados de transação = ainda processando
      // console.log('⏳ Payment ID found but no transaction data - processing');
      setPaymentStatus('processing');
    }
  }, [searchParams]);

  // TELEMETRIA: Log de mudanças de status
  useEffect(() => {
    // console.log('📊 Payment status changed:', {
    //   status: paymentStatus,
    //   isProcessing,
    //   hasTransactionData: !!transactionData,
    //   transactionId: transactionData?.id,
    //   timestamp: new Date().toISOString()
    // });
  }, [paymentStatus, isProcessing, transactionData]);

  const handleGoToDashboard = () => {
    navigate('/admin/my-projects');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleRetryCheckout = () => {
    // Limpar dados antigos
    localStorage.removeItem('orderId');
    localStorage.removeItem('paymentId');
    localStorage.removeItem('gateway');
    localStorage.removeItem('transactionData');
    
    // Recuperar dados do checkout se existirem
    const checkoutData = localStorage.getItem('checkoutData');
    if (checkoutData) {
      try {
        const data = JSON.parse(checkoutData);
        navigate(`/checkout/${data.planId}`);
      } catch {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h1 className="text-xl font-semibold">Processando pagamento...</h1>
            {!user &&
            <p className="text-muted-foreground text-center">
              Verificando pagamento e criando sua conta automaticamente
            </p>
            } 
            {user &&
            <p className="text-muted-foreground text-center">
              Verificando pagamento e adicionando créditos à sua conta
            </p>
            }
          </CardContent>
        </Card>
      </div>
    );
  }

  // Renderização baseada no status
  if (paymentStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-destructive">
              Erro ao Processar Pagamento
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-lg">
                Não foi possível confirmar seu pagamento.
              </p>
              <p className="text-muted-foreground">
                Por favor, entre em contato com nosso suporte.
              </p>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button variant="outline" onClick={handleGoHome} className="flex-1">
                Voltar ao início
              </Button>
              <Button onClick={handleRetryCheckout} className="flex-1">
                Tentar Novamente
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Dúvidas? Entre em contato via WhatsApp: +55 (11) 96176-9504
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-16 w-16 text-warning" />
            </div>
            <CardTitle className="text-2xl text-warning">
              Pagamento Pendente
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-lg">
                Seu pagamento ainda está sendo processado.
              </p>
              <p className="text-muted-foreground">
                Você receberá um e-mail assim que for confirmado.
              </p>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button variant="outline" onClick={handleGoHome} className="flex-1">
                Voltar ao início
              </Button>
              <Button onClick={handleRetryCheckout} className="flex-1">
                Tentar Novamente
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Dúvidas? Entre em contato via WhatsApp: +55 (11) 96176-9504
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
            {transactionData && paymentStatus === 'confirmed' && (
              <p className="text-muted-foreground">
                {transactionData.payment_data?.isLoggedInPurchase 
                  ? `Redirecionando para o painel em ${autoRedirectSeconds} segundos...`
                  : `Redirecionando para login em ${autoRedirectSeconds} segundos...`
                }
              </p>
            )}
          </div>

          {/* Display Credits */}
          {/* <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Coins className="h-6 w-6 text-primary" />
              <h3 className="text-2xl font-bold">{credits} Crédito{credits !== 1 ? 's' : ''}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Você pode criar {credits} site{credits !== 1 ? 's' : ''} com seus créditos
            </p>
          </div> */}

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
                <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">✓</span>
                <span className="line-through text-muted-foreground">Pagamento confirmado</span>
              </div>
              {transactionData?.payment_data?.isLoggedInPurchase ? (
                <>
                  <div className="flex items-start space-x-2">
                    <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">✓</span>
                    <span className="line-through text-muted-foreground">Créditos adicionados à sua conta</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
                    <span>Criar novo projeto com seus créditos</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start space-x-2">
                    <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">✓</span>
                    <span className="line-through text-muted-foreground">Conta criada automaticamente</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
                    <span>Fazer login e acessar o painel</span>
                  </div>
                </>
              )}
              <div className="flex items-start space-x-2">
                <span className="bg-muted text-muted-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
                <span>Criar seu primeiro site</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={handleGoHome} className="flex-1">
              Voltar ao início
            </Button>
            <Button onClick={handleGoToDashboard} className="flex-1">
              Acessar Painel
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Dúvidas? Entre em contato via WhatsApp: +55 (11) 96176-9504
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;