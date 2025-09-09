import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePayment } from './usePayment';
import { toast } from 'sonner';

export const usePostPaymentFlow = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyPayment } = usePayment();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handlePaymentVerification = async () => {
      const abacatePayId = searchParams.get('abacate_pay_id') || localStorage.getItem('abacatePayId');
      
      if (!abacatePayId || isProcessing) return;

      setIsProcessing(true);

      try {
        const result = await verifyPayment(abacatePayId);
        
        if (result.success) {
          // Store successful payment info for later user creation flow
          localStorage.setItem('paymentVerified', 'true');
          localStorage.setItem('transactionData', JSON.stringify(result));
          
          // Show success message and guide user to create account
          toast.success('Pagamento confirmado! Agora crie sua conta para acessar o painel.');
          
          // Clear the abacatePayId from localStorage
          localStorage.removeItem('abacatePayId');
          
          // Don't navigate automatically - let user see the success message
        } else {
          toast.error('Erro na verificação do pagamento');
          console.error('Payment verification failed:', result.error);
        }
      } catch (error) {
        console.error('Error in payment verification:', error);
        toast.error('Erro ao verificar pagamento');
      } finally {
        setIsProcessing(false);
      }
    };

    handlePaymentVerification();
  }, [searchParams, verifyPayment, isProcessing, navigate]);

  return { isProcessing };
};