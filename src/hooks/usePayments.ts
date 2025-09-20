import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Transaction {
  id: string;
  userId: string;
  planId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod?: string;
  abacatePayId?: string;
  paymentData?: any;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const usePayments = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTransactions: Transaction[] = data?.map((transaction: any) => ({
        id: transaction.id,
        userId: transaction.user_id,
        planId: transaction.plan_id,
        amount: parseFloat(transaction.amount) || 0,
        status: transaction.status,
        paymentMethod: transaction.payment_method,
        abacatePayId: transaction.abacatepay_id,
        paymentData: transaction.payment_data,
        paidAt: transaction.paid_at,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
      })) || [];

      setTransactions(formattedTransactions);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionById = (id: string) => {
    return transactions.find(t => t.id === id);
  };

  const getTransactionsByUser = (userId: string) => {
    return transactions.filter(t => t.userId === userId);
  };

  const getTransactionsByStatus = (status: Transaction['status']) => {
    return transactions.filter(t => t.status === status);
  };

  const getTotalRevenue = () => {
    return transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getRevenueByPeriod = (days: number) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return transactions
      .filter(t => 
        t.status === 'completed' && 
        new Date(t.createdAt) >= startDate
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    getTransactionById,
    getTransactionsByUser,
    getTransactionsByStatus,
    getTotalRevenue,
    getRevenueByPeriod,
  };
};