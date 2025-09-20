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
      
      console.log('Post payment flow - checking abacatePayId:', abacatePayId);
      console.log('isProcessing:', isProcessing);
      
      if (!abacatePayId || isProcessing) return;

      setIsProcessing(true);
      console.log('Starting payment verification process...');

      try {
        const result = await verifyPayment(abacatePayId);
        console.log('Payment verification result:', result);
        
        if (result.success && result.isPaid) {
          console.log('Payment confirmed as paid! Transaction:', result.transaction);
          
          // Store successful payment info for later user creation flow
          localStorage.setItem('paymentVerified', 'true');
          localStorage.setItem('transactionData', JSON.stringify(result));
          
          // Get stored user data from checkout
          const transactionData = localStorage.getItem('habify_transaction');
          console.log('Retrieved transaction data from localStorage:', transactionData);
          
          if (transactionData) {
            try {
              const userData = JSON.parse(transactionData);
              console.log('Parsed user data:', { 
                email: userData.customerEmail, 
                name: userData.customerName,
                hasPassword: !!userData.customerPassword 
              });
              
              if (userData.customerEmail && userData.customerPassword && userData.customerName) {
                console.log('Attempting to register user with payment confirmed...');
                // Auto-register user with checkout data
                const registrationResult = await registerUser(
                  userData.customerEmail, 
                  userData.customerPassword, 
                  userData.customerName
                );
                
                console.log('User registration result:', registrationResult);
                
                if (registrationResult.success) {
                  // Clear stored data
                  localStorage.removeItem('habify_transaction');
                  localStorage.removeItem('abacatePayId');
                  localStorage.removeItem('paymentVerified');
                  localStorage.removeItem('transactionData');
                  
                  // Show success message
                  toast.success('Pagamento confirmado! Sua conta foi criada automaticamente.');
                  
                  // Navigate to my projects after successful registration
                  console.log('Navigating to my projects in 2 seconds...');
                  setTimeout(() => {
                    navigate('/admin/my-projects');
                  }, 2000);
                } else {
                  console.error('User registration failed:', registrationResult.error);
                  toast.error('Pagamento confirmado, mas erro ao criar conta. Entre em contato conosco.');
                }
              } else {
                console.error('Missing user data:', {
                  hasEmail: !!userData.customerEmail,
                  hasPassword: !!userData.customerPassword,
                  hasName: !!userData.customerName
                });
                toast.error('Dados incompletos para criar conta. Entre em contato conosco.');
              }
            } catch (error) {
              console.error('Error parsing transaction data:', error);
              toast.error('Erro ao processar dados do usuário. Entre em contato conosco.');
            }
          } else {
            console.error('No transaction data found in localStorage');
            toast.success('Pagamento confirmado! Faça login para acessar seu painel.');
          }
        } else if (result.success && !result.isPaid) {
          console.log('Payment verification successful but not paid yet. Status:', result.transaction?.status);
          toast.info('Pagamento ainda pendente. Aguarde a confirmação.');
        } else {
          console.error('Payment verification failed:', result.error);
          toast.error('Erro na verificação do pagamento');
        }
      } catch (error) {
        console.error('Error in payment verification:', error);
        toast.error('Erro ao verificar pagamento');
      } finally {
        setIsProcessing(false);
      }
    };

    handlePaymentVerification();
  }, [searchParams, verifyPayment, registerUser, navigate]);

  return { isProcessing };
};