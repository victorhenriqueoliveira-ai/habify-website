import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentLog {
  id: string;
  gateway: string;
  status_code: number | null;
  error_message: string | null;
  request_body: any;
  response_body: any;
  created_at: string;
  order_id: string | null;
}

interface PaymentLogFilters {
  gateway?: string;
  status?: 'all' | 'success' | 'error';
  search?: string;
}

export const usePaymentLogs = (filters?: PaymentLogFilters) => {
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('payment_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters?.gateway && filters.gateway !== 'all') {
        query = query.eq('gateway', filters.gateway);
      }

      if (filters?.status === 'error') {
        query = query.not('error_message', 'is', null);
      } else if (filters?.status === 'success') {
        query = query.is('error_message', null);
      }

      if (filters?.search) {
        query = query.or(`error_message.ilike.%${filters.search}%,order_id.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching payment logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  return {
    logs,
    loading,
    refetch: fetchLogs,
  };
};
