import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { DashboardStats } from '@/types/admin';

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    pendingProjects: 0,
    inProgressProjects: 0,
    completedProjects: 0,
    totalUsers: 0,
    activeUsers: 0,
    monthlyRevenue: 0,
    monthlyGrowth: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch project stats
      const { data: projectStats, error: projectError } = await supabase
        .from('projects')
        .select('status, price, created_at');

      if (projectError) throw projectError;

      // Fetch user stats
      const { data: userStats, error: userError } = await supabase
        .from('profiles')
        .select('is_active, created_at');

      if (userError) throw userError;

      // Calculate project statistics
      const totalProjects = projectStats?.length || 0;
      const pendingProjects = projectStats?.filter(p => p.status === 'pending').length || 0;
      const inProgressProjects = projectStats?.filter(p => p.status === 'in_progress').length || 0;
      const completedProjects = projectStats?.filter(p => p.status === 'completed').length || 0;

      // Calculate user statistics
      const totalUsers = userStats?.length || 0;
      const activeUsers = userStats?.filter(u => u.is_active).length || 0;

      // Fetch transaction data for accurate revenue calculation
      const { data: transactionStats, error: transactionError } = await supabase
        .from('transactions')
        .select('amount, status, paid_at');

      // Calculate total revenue from all completed transactions
      const totalRevenue = transactionStats
        ?.filter(t => t.status === 'paid')
        .reduce((total, t) => total + (Number(t.amount) || 0), 0) || 0;

      // Calculate monthly revenue from completed transactions this month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyRevenue = transactionStats
        ?.filter(t => {
          if (t.status !== 'paid' || !t.paid_at) return false;
          const paidDate = new Date(t.paid_at);
          return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
        })
        .reduce((total, t) => total + (Number(t.amount) || 0), 0) || 0;

      // Calculate growth (simple mock calculation)
      const monthlyGrowth = totalProjects > 0 ? ((completedProjects / totalProjects) * 100) : 0;

      const dashboardStats: DashboardStats = {
        totalProjects,
        pendingProjects,
        inProgressProjects,
        completedProjects,
        totalUsers,
        activeUsers,
        monthlyRevenue,
        monthlyGrowth: Number(monthlyGrowth.toFixed(1)),
      };

      setStats(dashboardStats);
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Subscribe to transaction changes for real-time updates
    const subscription = supabase
      .channel('dashboard-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    stats,
    loading,
    fetchStats,
  };
};