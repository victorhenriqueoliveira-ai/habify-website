import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CustomerData {
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  password: string;
  paymentMethod?: 'PIX' | 'CARD' | 'BOLETO';
  installments?: number;
  isLoggedInPurchase?: boolean;
  userId?: string;
}

interface PaymentResponse {
  success: boolean;
  paymentUrl?: string;
  orderId?: string;
  paymentId?: string;
  gateway?: 'ABACATEPAY' | 'STRIPE';
  error?: string;
}

export const usePayment = () => {
  const [loading, setLoading] = useState(false);

  const createPayment = async (planId: string, customerData: CustomerData): Promise<PaymentResponse> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          planId,
          customerData,
        },
      });

      if (error) {
        toast.error(`Erro ao processar pagamento: ${error.message}`);
        return { success: false, error: error.message };
      }

      if (!data) {
        toast.error('Nenhuma resposta recebida do servidor');
        return { success: false, error: 'Nenhuma resposta do servidor' };
      }

      if (!data.success) {
        toast.error(data.error || 'Erro ao criar pagamento');
        return { success: false, error: data.error };
      }

      if (!data.paymentUrl) {
        toast.error('URL de pagamento não foi gerada');
        return { success: false, error: 'URL de pagamento não foi gerada' };
      }

      // toast.success('Redirecionando para pagamento...');
      return data;

    } catch (error: any) {
      const errorMessage = error?.message || 'Erro interno do servidor';
      toast.error(`Erro: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (idToVerify: string) => {
    try {
      // Determinar se é orderId (UUID) ou paymentId (gateway ID)
      const isOrderId = idToVerify.includes('-') && idToVerify.length === 36;
      
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { 
          orderId: isOrderId ? idToVerify : undefined,
          paymentId: !isOrderId ? idToVerify : undefined
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Return the data directly from verify-payment function
      return data;
    } catch (error) {
      return { success: false, error: 'Erro ao verificar pagamento' };
    }
  };

  return {
    createPayment,
    verifyPayment,
    loading,
  };
};