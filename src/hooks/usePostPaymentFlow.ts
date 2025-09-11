import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePayment } from './usePayment';
import { useUserRegistration } from './useUserRegistration';
import { toast } from 'sonner';

export const usePostPaymentFlow = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyPayment } = usePayment();
  const { registerUser } = useUserRegistration();
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
          
          // Get stored user data from checkout
          const transactionData = localStorage.getItem('habify_transaction');
          if (transactionData) {
            try {
              const userData = JSON.parse(transactionData);
              if (userData.customerEmail && userData.customerPassword && userData.customerName) {
                // Auto-register user with checkout data
                await registerUser(userData.customerEmail, userData.customerPassword, userData.customerName);
                
                // Clear stored data
                localStorage.removeItem('habify_transaction');
                
                // Navigate to dashboard after successful registration
                setTimeout(() => {
                  navigate('/admin/dashboard');
                }, 2000);
              }
            } catch (error) {
              console.error('Error parsing transaction data:', error);
            }
          }
          
          // Show success message and guide user to create account
          toast.success('Pagamento confirmado! Sua conta foi criada automaticamente.');
          
          // Clear the abacatePayId from localStorage
          localStorage.removeItem('abacatePayId');
          
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