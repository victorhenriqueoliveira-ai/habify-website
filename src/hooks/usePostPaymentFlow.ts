import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePayment } from './usePayment';
import { toast } from 'sonner';
import { ErrorMessages } from '@/lib/errorMessages';

/**
 * Hook simplificado para gerenciar o fluxo pós-pagamento
 * 
 * SEGURANÇA:
 * - Apenas verifica se o pagamento foi confirmado via webhook
 * - Não tenta criar usuários (isso é feito pelo webhook)
 * - Remove dependência de polling constante
 * - Apenas autentica usuários já criados
 */
export const usePostPaymentFlow = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyPayment } = usePayment();

  useEffect(() => {
    const handlePaymentVerification = async () => {
      // Apenas processar na página de sucesso
      if (!window.location.pathname.includes('payment-success')) {
        return;
      }

      // 🔥 PRIORIDADE: Buscar orderId primeiro (mais confiável)
      const orderId = localStorage.getItem('orderId');
      
      // Fallback: IDs do gateway (podem não vir na URL de retorno)
      const paymentId = searchParams.get('abacate_pay_id') || 
                       searchParams.get('payment_id') ||
                       searchParams.get('transaction_id') ||
                       localStorage.getItem('paymentId');

      // Precisa de pelo menos um ID para verificar
      const idToVerify = orderId || paymentId;
      
      if (!idToVerify) {
        console.error('Nenhum ID de pagamento encontrado', {
          orderId,
          paymentId,
          searchParams: Object.fromEntries(searchParams.entries()),
          localStorage: {
            orderId: localStorage.getItem('orderId'),
            paymentId: localStorage.getItem('paymentId')
          }
        });
        toast.error(ErrorMessages.PAYMENT_ID_MISSING);
        return;
      }

      setIsProcessing(true);

      try {
        console.log('Verificando pagamento:', { orderId, paymentId, idToVerify });
        
        // Verificar status do pagamento
        const result = await verifyPayment(idToVerify);

        if (!result.success) {
          throw new Error(result.error || ErrorMessages.PAYMENT_VERIFICATION_ERROR);
        }

        if (!result.isPaid) {
          // Pagamento ainda pendente
          toast.info(ErrorMessages.INFO_PAYMENT_PROCESSING);
          setIsProcessing(false);
          return;
        }

        // ✅ Pagamento confirmado!
        // console.log('Pagamento confirmado pelo webhook');

        // Limpar dados temporários
        localStorage.removeItem('orderId');
        localStorage.removeItem('paymentId');
        localStorage.removeItem('gateway');
        localStorage.removeItem('checkoutData');
        localStorage.removeItem('orderData');
        localStorage.removeItem('selectedPlanId');
        localStorage.removeItem('habify_order');
        localStorage.removeItem('abacatePayId');
        localStorage.removeItem('paymentVerified');

        // Salvar dados da transação para exibição
        if (result.order) {
          localStorage.setItem('transactionData', JSON.stringify(result.order));
        }

        toast.success(ErrorMessages.SUCCESS_PAYMENT_CONFIRMED);
        
        // Para novo usuário: ele precisará fazer login manualmente
        // Para usuário logado: redirecionar para projetos
        const isLoggedInPurchase = result.order?.payment_data?.isLoggedInPurchase;
        
        if (isLoggedInPurchase) {
          // Usuário já estava logado, pode acessar projetos
          setTimeout(() => {
            navigate('/admin/my-projects', { 
              state: { message: ErrorMessages.SUCCESS_CREDITS_ADDED }
            });
          }, 2000);
        } else {
          // Novo usuário: precisa fazer login
          toast.info('Sua conta foi criada! Faça login para acessar.', {
            duration: 5000
          });
          
          setTimeout(() => {
            navigate('/admin/auth', { 
              state: { 
                message: ErrorMessages.SUCCESS_ACCOUNT_CREATED,
                email: result.order?.payment_data?.customerData?.email
              }
            });
          }, 3000);
        }

      } catch (error) {
        console.error('Erro ao verificar pagamento:', error);
        toast.error(error instanceof Error ? error.message : ErrorMessages.PAYMENT_VERIFICATION_ERROR);
      } finally {
        setIsProcessing(false);
      }
    };

    handlePaymentVerification();
  }, [searchParams, verifyPayment, navigate]);

  return {
    isProcessing
  };
};
