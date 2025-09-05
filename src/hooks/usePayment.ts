import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CustomerData {
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
}

interface PaymentResponse {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
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
        console.error('Payment creation error:', error);
        toast.error('Erro ao processar pagamento');
        return { success: false, error: error.message };
      }

      if (!data.success) {
        toast.error(data.error || 'Erro ao criar pagamento');
        return { success: false, error: data.error };
      }

      toast.success('Redirecionando para pagamento...');
      return data;

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Erro interno do servidor');
      return { success: false, error: 'Erro interno do servidor' };
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
        console.error('Payment verification error:', error);
        return { success: false, error: error.message };
      }

      return data;
    } catch (error) {
      console.error('Payment verification error:', error);
      return { success: false, error: 'Erro ao verificar pagamento' };
    }
  };

  return {
    createPayment,
    verifyPayment,
    loading,
  };
};