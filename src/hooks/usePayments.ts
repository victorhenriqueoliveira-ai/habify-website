import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  id: string;
  userId: string;
  planId?: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  paymentId?: string;
  gateway?: string;
  paymentData?: any;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerEmail: string;
}

export const usePayments = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async (dateFilter?: { start: string; end: string }, statusFilter?: string) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('orders')
        .select(`
          *,
          profiles(name, email)
        `)
        .order('created_at', { ascending: false });

      // Apply date filter
      if (dateFilter) {
        query = query
          .gte('created_at', dateFilter.start)
          .lte('created_at', dateFilter.end);
      }

      // Apply status filter
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedOrders: Order[] = data?.map((order: any) => ({
        id: order.id,
        userId: order.user_id,
        planId: order.plan_id,
        amount: parseFloat(order.amount) || 0,
        status: order.status,
        paymentMethod: order.payment_method,
        paymentId: order.abacatepay_id,
        gateway: order.gateway,
        paymentData: order.payment_data,
        paidAt: order.paid_at,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        customerName: order.profiles?.name || order.payment_data?.customerData?.name || 'N/A',
        customerEmail: order.profiles?.email || order.payment_data?.customerData?.email || 'N/A',
      })) || [];

      setOrders(formattedOrders);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getOrderById = (id: string) => {
    return orders.find(t => t.id === id);
  };

  const getOrdersByUser = (userId: string) => {
    return orders.filter(t => t.userId === userId);
  };

  const getOrdersByStatus = (status: Order['status']) => {
    return orders.filter(t => t.status === status);
  };

  const getTotalRevenue = () => {
    return orders
      .filter(t => t.status === 'paid')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getRevenueByPeriod = (days: number) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return orders
      .filter(t => 
        t.status === 'paid' && 
        new Date(t.createdAt) >= startDate
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  useEffect(() => {
    fetchOrders();
    
    // Subscribe to order changes for real-time updates with debouncing
    let debounceTimer: NodeJS.Timeout | null = null;
    
    const subscription = supabase
      .channel('payments-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        // Debounce orders refetch to prevent excessive calls
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          fetchOrders();
        }, 1000); // 1 second debounce
      })
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      subscription.unsubscribe();
    };
  }, []);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    getOrderById,
    getOrdersByUser,
    getOrdersByStatus,
    getTotalRevenue,
    getRevenueByPeriod,
  };
};