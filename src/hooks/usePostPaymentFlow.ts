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

      // Force verification on payment success page
      const isPaymentSuccessPage = window.location.pathname.includes('payment-success');

      setIsProcessing(true);

      try {
        const result = await verifyPayment(abacatePayId);
        
        if (result.success && result.isPaid) {
          
          // Get stored user data from checkout
          const orderData = localStorage.getItem('habify_order');
          
          if (orderData) {
            try {
              const userData = JSON.parse(orderData);
              
              if (userData.customerEmail && userData.customerPassword && userData.customerName) {
                
                const registrationResult = await registerUser(
                  userData.customerEmail, 
                  userData.customerPassword, 
                  userData.customerName
                );
                
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
                  toast.success('Pagamento confirmado! Sua conta está sendo ativada...');
                  setTimeout(() => {
                    navigate('/admin/my-projects');
                  }, 2000);
                }
              }
            } catch (error) {
              toast.success('Pagamento confirmado! Entre em contato conosco.');
            }
          }
        } else if (result.success && !result.isPaid) {
          
          if (isPaymentSuccessPage) {
            const orderData = localStorage.getItem('habify_order');
            if (orderData) {
              try {
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
                    toast.success('Conta ativada! Aguardando confirmação final do pagamento.');
                    setTimeout(() => {
                      navigate('/admin/my-projects');
                    }, 1000);
                    return;
                  }
                }
              } catch (error) {
                // Silent error handling
              }
            }
          }
          
          toast.info('Pagamento processado! Aguardando confirmação.');
        } else {
          
          if (isPaymentSuccessPage) {
            const orderData = localStorage.getItem('habify_order');
            if (orderData) {
              try {
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
                    toast.success('Conta ativada com sucesso!');
                    setTimeout(() => {
                      navigate('/admin/my-projects');
                    }, 1000);
                    return;
                  }
                }
              } catch (error) {
                // Silent error handling
              }
            }
          }
          
          toast.success('Processando... Redirecionando para o painel.');
          setTimeout(() => {
            navigate('/admin/my-projects');
          }, 3000);
        }
      } catch (error) {
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
            // Silent error handling
          }
        };
        handleCheck();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [searchParams, verifyPayment, registerUser, navigate, isProcessing]);

  return { isProcessing };
};