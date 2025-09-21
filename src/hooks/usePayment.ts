import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CustomerData {
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  password: string;
}

interface PaymentResponse {
  success: boolean;
  paymentUrl?: string;
  orderId?: string;
  abacatePayId?: string;
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

  const verifyPayment = async (abacatePayId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { abacatePayId },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Check if payment was confirmed and order exists
      if (data?.success && data?.order) {
        // Check order status from our database
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('abacatepay_id', abacatePayId)
          .single();

        if (orderError) {
          return { success: false, error: 'Erro ao buscar pedido' };
        }

        return {
          success: true,
          isPaid: orderData.status === 'paid',
          order: orderData
        };
      }

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