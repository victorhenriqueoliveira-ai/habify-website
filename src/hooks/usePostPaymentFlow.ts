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
          console.log('Payment confirmed as paid! Order:', result.order);
          
          // Get stored user data from checkout
          const orderData = localStorage.getItem('habify_order');
          console.log('Retrieved order data from localStorage:', orderData);
          
          if (orderData) {
            try {
              const userData = JSON.parse(orderData);
              console.log('Parsed user data:', { 
                email: userData.customerEmail, 
                name: userData.customerName,
                hasPassword: !!userData.customerPassword 
              });
              
              if (userData.customerEmail && userData.customerPassword && userData.customerName) {
                console.log('User should now be activated - attempting login...');
                
                const registrationResult = await registerUser(
                  userData.customerEmail, 
                  userData.customerPassword, 
                  userData.customerName
                );
                
                console.log('User login result:', registrationResult);
                
                if (registrationResult.success) {
                  // Clear stored data
                  localStorage.removeItem('habify_order');
                  localStorage.removeItem('abacatePayId');
                  localStorage.removeItem('paymentVerified');
                  localStorage.removeItem('orderData');
                  
                  toast.success('Pagamento confirmado! Login realizado com sucesso.');
                  setTimeout(() => {
                    navigate('/admin/my-projects');
                  }, 1000);
                } else {
                  console.error('User login failed:', registrationResult.error);
                  toast.success('Pagamento confirmado! Sua conta está sendo ativada...');
                  setTimeout(() => {
                    navigate('/admin/my-projects');
                  }, 2000);
                }
              }
            } catch (error) {
              console.error('Error parsing order data:', error);
              toast.success('Pagamento confirmado! Entre em contato conosco.');
            }
          }
        } else if (result.success && !result.isPaid) {
          console.log('Payment verification successful but not paid yet. Status:', result.order?.status);
          
          if (isPaymentSuccessPage) {
            const orderData = localStorage.getItem('habify_order');
            if (orderData) {
              try {
                const userData = JSON.parse(orderData);
                console.log('Attempting to activate user with pending payment...');
                
                if (userData.customerEmail && userData.customerPassword && userData.customerName) {
                  const registrationResult = await registerUser(
                    userData.customerEmail, 
                    userData.customerPassword, 
                    userData.customerName
                  );
                  
                  if (registrationResult.success) {
                    localStorage.removeItem('habify_order');
                    localStorage.removeItem('abacatePayId');
                    toast.success('Conta ativada! Aguardando confirmação final do pagamento.');
                    setTimeout(() => {
                      navigate('/admin/my-projects');
                    }, 1000);
                    return;
                  }
                }
              } catch (error) {
                console.error('Error activating user with pending payment:', error);
              }
            }
          }
          
          toast.info('Pagamento processado! Aguardando confirmação.');
        } else {
          console.error('Payment verification failed:', result.error);
          
          if (isPaymentSuccessPage) {
            const orderData = localStorage.getItem('habify_order');
            if (orderData) {
              try {
                const userData = JSON.parse(orderData);
                console.log('Attempting to activate user despite verification failure...');
                
                if (userData.customerEmail && userData.customerPassword && userData.customerName) {
                  const registrationResult = await registerUser(
                    userData.customerEmail, 
                    userData.customerPassword, 
                    userData.customerName
                  );
                  
                  if (registrationResult.success) {
                    localStorage.removeItem('habify_order');
                    localStorage.removeItem('abacatePayId');
                    toast.success('Conta ativada com sucesso!');
                    setTimeout(() => {
                      navigate('/admin/my-projects');
                    }, 1000);
                    return;
                  }
                }
              } catch (error) {
                console.error('Error activating user on verification failure:', error);
              }
            }
          }
          
          toast.success('Processando... Redirecionando para o painel.');
          setTimeout(() => {
            navigate('/admin/my-projects');
          }, 3000);
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
              const orderData = localStorage.getItem('habify_order');
              if (orderData) {
                const userData = JSON.parse(orderData);
                if (userData.customerEmail && userData.customerPassword && userData.customerName) {
                  const registrationResult = await registerUser(
                    userData.customerEmail, 
                    userData.customerPassword, 
                    userData.customerName
                  );
                  
                  if (registrationResult.success) {
                    localStorage.removeItem('habify_order');
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