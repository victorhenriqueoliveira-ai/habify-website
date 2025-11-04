import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePostPaymentFlow = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [hasProcessed, setHasProcessed] = useState(false);
  const pollingIntervalRef = useRef<number | null>(null);
  const attemptCountRef = useRef(0);
  const maxAttempts = 20; // 20 tentativas = 60 segundos (3s cada)

  useEffect(() => {
    // Prevenir execução múltipla
    if (hasProcessed) {
      console.log('✅ Already processed, skipping');
      return;
    }

    // Obter orderId ou paymentId
    const orderId = localStorage.getItem('orderId');
    const paymentId = searchParams.get('abacate_pay_id') || 
                      searchParams.get('payment_id') || 
                      localStorage.getItem('paymentId');

    console.log('🔍 Payment flow started:', {
      orderId,
      paymentId,
      hasAnyId: !!(orderId || paymentId),
      searchParams: Object.fromEntries(searchParams.entries())
    });

    // Se não tiver ID algum, não tem o que verificar
    if (!orderId && !paymentId) {
      console.log('⚠️ No payment ID found - skipping verification');
      setIsProcessing(false);
      return;
    }

    // Função para verificar status do pagamento
    const verifyPaymentStatus = async () => {
      try {
        attemptCountRef.current += 1;
        console.log(`🔄 Verification attempt ${attemptCountRef.current}/${maxAttempts}`);

        const { data, error } = await supabase.functions.invoke('verify-payment-status', {
          body: { orderId, paymentId }
        });

        if (error) {
          console.error('❌ Error verifying payment:', error);
          
          // Se excedeu tentativas, parar
          if (attemptCountRef.current >= maxAttempts) {
            console.log('⏱️ Max attempts reached - showing pending state');
            stopPolling();
            setIsProcessing(false);
            setHasProcessed(true);
            toast.warning('Seu pagamento está sendo processado. Você receberá um email quando for confirmado.');
            return;
          }
          return; // Continuar tentando
        }

        if (!data?.success) {
          console.log('⚠️ Payment verification failed:', data?.error);
          
          if (attemptCountRef.current >= maxAttempts) {
            stopPolling();
            setIsProcessing(false);
            setHasProcessed(true);
            toast.error('Não foi possível verificar o pagamento. Entre em contato com o suporte.');
          }
          return;
        }

        const orderData = data.order;
        console.log('📦 Order status:', {
          id: orderData.id,
          status: orderData.status,
          gateway: orderData.gateway,
          credits: orderData.credits
        });

        // Se pagamento confirmado
        if (orderData.status === 'paid') {
          console.log('✅ Payment confirmed!');
          
          // Parar polling
          stopPolling();
          
          // Salvar dados da transação
          localStorage.setItem('transactionData', JSON.stringify({
            id: orderData.id,
            status: orderData.status,
            amount: orderData.amount,
            plan: orderData.plan,
            payment_data: {
              isLoggedInPurchase: orderData.isLoggedInPurchase,
              customerData: {
                email: orderData.customerEmail
              }
            },
            user_id: orderData.isLoggedInPurchase ? 'existing' : null
          }));
          
          // Limpar IDs de tracking
          localStorage.removeItem('orderId');
          localStorage.removeItem('paymentId');
          localStorage.removeItem('gateway');
          localStorage.removeItem('checkoutData');
          
          setIsProcessing(false);
          setHasProcessed(true);
          
          // Dar tempo para UI processar os dados
          setTimeout(() => {
            // Não redirecionar aqui - deixar PaymentSuccess exibir dados
            console.log('Payment flow completed successfully');
          }, 500);
          
          return;
        }

        // Se pagamento falhou
        if (orderData.status === 'failed') {
          console.log('❌ Payment failed');
          stopPolling();
          setIsProcessing(false);
          setHasProcessed(true);
          
          // Limpar dados de pagamento
          localStorage.removeItem('orderId');
          localStorage.removeItem('paymentId');
          localStorage.removeItem('gateway');
          localStorage.removeItem('checkoutData');
          
          toast.error('Pagamento não foi confirmado.');
          setTimeout(() => navigate('/payment-canceled'), 2000);
          return;
        }

        // Se ainda pendente, continuar polling (a menos que tenha excedido tentativas)
        if (orderData.status === 'pending') {
          console.log('⏳ Payment still pending...');
          
          if (attemptCountRef.current >= maxAttempts) {
            console.log('⏱️ Timeout - payment still pending');
            stopPolling();
            setIsProcessing(false);
            setHasProcessed(true);
            
            // Salvar dados para mostrar estado pendente
            localStorage.setItem('transactionData', JSON.stringify({
              id: orderData.id,
              status: 'pending',
              payment_data: {
                customerData: {
                  email: orderData.customerEmail
                }
              }
            }));
            
            toast.info('Seu pagamento está sendo processado. Você receberá um email quando for confirmado.');
          }
        }

      } catch (error) {
        console.error('💥 Verification exception:', error);
        
        if (attemptCountRef.current >= maxAttempts) {
          stopPolling();
          setIsProcessing(false);
          setHasProcessed(true);
          toast.error('Erro ao verificar pagamento. Entre em contato com o suporte.');
        }
      }
    };

    // Função para parar o polling
    const stopPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        console.log('🛑 Polling stopped');
      }
    };

    // Iniciar primeira verificação imediatamente
    verifyPaymentStatus();

    // Iniciar polling a cada 3 segundos
    pollingIntervalRef.current = window.setInterval(() => {
      verifyPaymentStatus();
    }, 3000);

    // Cleanup ao desmontar
    return () => {
      stopPolling();
    };
  }, [searchParams, navigate, hasProcessed]);

  return { isProcessing };
};
