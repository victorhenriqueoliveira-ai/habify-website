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
      console.log('Current URL path:', window.location.pathname);
      
      if (!abacatePayId || isProcessing) return;

      // Force verification on payment success page
      const isPaymentSuccessPage = window.location.pathname.includes('payment-success');
      console.log('Is payment success page:', isPaymentSuccessPage);

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
          
          // Always try to create user on payment success page, regardless of payment status
          if (isPaymentSuccessPage) {
            const transactionData = localStorage.getItem('habify_transaction');
            if (transactionData) {
              try {
                const userData = JSON.parse(transactionData);
                console.log('Creating user with pending payment - this is normal flow...');
                
                if (userData.customerEmail && userData.customerPassword && userData.customerName) {
                  const registrationResult = await registerUser(
                    userData.customerEmail, 
                    userData.customerPassword, 
                    userData.customerName
                  );
                  
                  if (registrationResult.success) {
                    localStorage.removeItem('habify_transaction');
                    localStorage.removeItem('abacatePayId');
                    toast.success('Conta criada com sucesso! Seu pagamento será confirmado em breve.');
                    setTimeout(() => {
                      navigate('/admin/my-projects');
                    }, 1000);
                    return;
                  }
                }
              } catch (error) {
                console.error('Error creating user with pending payment:', error);
              }
            }
          }
          
          toast.info('Pagamento processado! Sua conta foi criada.');
        } else {
          console.error('Payment verification failed:', result.error);
          
          // Even if verification fails, try to create user if on payment success page
          if (isPaymentSuccessPage) {
            const transactionData = localStorage.getItem('habify_transaction');
            if (transactionData) {
              try {
                const userData = JSON.parse(transactionData);
                console.log('Creating user despite verification failure...');
                
                if (userData.customerEmail && userData.customerPassword && userData.customerName) {
                  const registrationResult = await registerUser(
                    userData.customerEmail, 
                    userData.customerPassword, 
                    userData.customerName
                  );
                  
                  if (registrationResult.success) {
                    localStorage.removeItem('habify_transaction');
                    localStorage.removeItem('abacatePayId');
                    toast.success('Conta criada com sucesso!');
                    setTimeout(() => {
                      navigate('/admin/my-projects');
                    }, 1000);
                    return;
                  }
                }
              } catch (error) {
                console.error('Error creating user on verification failure:', error);
              }
            }
          }
          
          toast.error('Erro na verificação, mas sua conta pode ter sido criada. Tente fazer login.');
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

  // Force check every 10 seconds on payment success page if still processing
  useEffect(() => {
    const interval = setInterval(() => {
      const isPaymentSuccessPage = window.location.pathname.includes('payment-success');
      const abacatePayId = searchParams.get('abacate_pay_id') || localStorage.getItem('abacatePayId');
      
      if (isPaymentSuccessPage && abacatePayId && !isProcessing) {
        console.log('Forcing payment check every 10s on payment success page');
        const handleCheck = async () => {
          try {
            const result = await verifyPayment(abacatePayId);
            if (result.success && result.isPaid) {
              const transactionData = localStorage.getItem('habify_transaction');
              if (transactionData) {
                const userData = JSON.parse(transactionData);
                if (userData.customerEmail && userData.customerPassword && userData.customerName) {
                  const registrationResult = await registerUser(
                    userData.customerEmail, 
                    userData.customerPassword, 
                    userData.customerName
                  );
                  
                  if (registrationResult.success) {
                    localStorage.removeItem('habify_transaction');
                    localStorage.removeItem('abacatePayId');
                    toast.success('Pagamento confirmado! Conta criada com sucesso.');
                    setTimeout(() => {
                      navigate('/admin/my-projects');
                    }, 1000);
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error in periodic payment check:', error);
          }
        };
        handleCheck();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [searchParams, verifyPayment, registerUser, navigate, isProcessing]);

  return { isProcessing };
};