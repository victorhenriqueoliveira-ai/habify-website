import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, subDays, subMonths, subYears, format } from 'date-fns';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface AnalyticsFilters {
  dateRange: DateRange;
  gateway?: string;
  status?: string;
  planType?: string;
}

export interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  revenueByGateway: Array<{ gateway: string; revenue: number; count: number }>;
  revenueByDay: Array<{ date: string; revenue: number; orders: number }>;
  ordersByStatus: Array<{ status: string; count: number; percentage: number }>;
  topPlans: Array<{ name: string; revenue: number; sales: number }>;
}

export interface UserMetrics {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: Array<{ role: string; count: number; percentage: number }>;
  userGrowth: Array<{ date: string; total: number; new: number }>;
  retentionRate: number;
  averageProjectsPerUser: number;
}

export interface ProjectMetrics {
  totalProjects: number;
  completedProjects: number;
  inProgressProjects: number;
  pendingProjects: number;
  averageCompletionTime: number;
  projectsByType: Array<{ type: string; count: number; percentage: number }>;
  projectTimeline: Array<{ date: string; created: number; completed: number }>;
  successRate: number;
}

const getDateRangePreset = (preset: string): DateRange => {
  const today = new Date();
  switch (preset) {
    case 'today':
      return { from: startOfDay(today), to: endOfDay(today) };
    case 'yesterday':
      return { from: startOfDay(subDays(today, 1)), to: endOfDay(subDays(today, 1)) };
    case '7days':
      return { from: startOfDay(subDays(today, 7)), to: endOfDay(today) };
    case '30days':
      return { from: startOfDay(subDays(today, 30)), to: endOfDay(today) };
    case '90days':
      return { from: startOfDay(subDays(today, 90)), to: endOfDay(today) };
    case '12months':
      return { from: startOfDay(subMonths(today, 12)), to: endOfDay(today) };
    case 'year':
      return { from: startOfDay(subYears(today, 1)), to: endOfDay(today) };
    default:
      return { from: startOfDay(subDays(today, 30)), to: endOfDay(today) };
  }
};

export const useAnalyticsDashboard = (initialFilters?: Partial<AnalyticsFilters>) => {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: initialFilters?.dateRange || getDateRangePreset('30days'),
    gateway: initialFilters?.gateway,
    status: initialFilters?.status,
    planType: initialFilters?.planType,
  });

  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics | null>(null);
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
  const [projectMetrics, setProjectMetrics] = useState<ProjectMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const updateDateRange = (preset: string) => {
    setFilters(prev => ({ ...prev, dateRange: getDateRangePreset(preset) }));
  };

  const updateFilters = (newFilters: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const fetchSalesMetrics = async () => {
    try {
      let query = supabase
        .from('orders')
        .select('*, plan:plans(name, type, price)')
        .gte('created_at', filters.dateRange.from.toISOString())
        .lte('created_at', filters.dateRange.to.toISOString());

      if (filters.gateway && filters.gateway !== 'all') {
        query = query.eq('gateway', filters.gateway);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data: orders, error } = await query;

      if (error) throw error;

      // Calculate metrics
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.amount || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const paidOrders = orders?.filter(o => o.status === 'paid') || [];
      const averageOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

      // Revenue by gateway
      const revenueByGateway = Object.values(
        (orders || []).reduce((acc: any, order) => {
          const gateway = order.gateway || 'UNKNOWN';
          if (!acc[gateway]) {
            acc[gateway] = { gateway, revenue: 0, count: 0 };
          }
          if (order.status === 'paid') {
            acc[gateway].revenue += Number(order.amount || 0);
            acc[gateway].count += 1;
          }
          return acc;
        }, {})
      );

      // Revenue by day
      const revenueByDay = Object.values(
        (orders || []).reduce((acc: any, order) => {
          const date = format(new Date(order.created_at), 'dd/MM');
          if (!acc[date]) {
            acc[date] = { date, revenue: 0, orders: 0 };
          }
          if (order.status === 'paid') {
            acc[date].revenue += Number(order.amount || 0);
            acc[date].orders += 1;
          }
          return acc;
        }, {})
      );

      // Orders by status
      const ordersByStatus = Object.entries(
        (orders || []).reduce((acc: any, order) => {
          const status = order.status || 'unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {})
      ).map(([status, count]) => ({
        status,
        count: count as number,
        percentage: totalOrders > 0 ? ((count as number) / totalOrders) * 100 : 0,
      }));

      // Top plans
      const topPlans = Object.values(
        (paidOrders || []).reduce((acc: any, order) => {
          const planName = order.plan?.name || 'Sem plano';
          if (!acc[planName]) {
            acc[planName] = { name: planName, revenue: 0, sales: 0 };
          }
          acc[planName].revenue += Number(order.amount || 0);
          acc[planName].sales += 1;
          return acc;
        }, {})
      ).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5);

      const conversionRate = totalOrders > 0 ? (paidOrders.length / totalOrders) * 100 : 0;

      setSalesMetrics({
        totalRevenue,
        totalOrders,
        averageOrderValue,
        conversionRate,
        revenueByGateway: revenueByGateway as Array<{ gateway: string; revenue: number; count: number }>,
        revenueByDay: revenueByDay as Array<{ date: string; revenue: number; orders: number }>,
        ordersByStatus,
        topPlans: topPlans as Array<{ name: string; revenue: number; sales: number }>,
      });
    } catch (error) {
      console.error('Error fetching sales metrics');
    }
  };

  const fetchUserMetrics = async () => {
    try {
      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (usersError) throw usersError;

      const filteredUsers = allUsers?.filter(user => {
        const createdAt = new Date(user.created_at);
        return createdAt >= filters.dateRange.from && createdAt <= filters.dateRange.to;
      }) || [];

      const totalUsers = allUsers?.length || 0;
      const newUsers = filteredUsers.length;
      const activeUsers = allUsers?.filter(u => u.is_active).length || 0;
      const inactiveUsers = totalUsers - activeUsers;

      // Users by role
      const usersByRole = Object.entries(
        (allUsers || []).reduce((acc: any, user) => {
          const role = user.role || 'user';
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {})
      ).map(([role, count]) => ({
        role: role === 'admin' ? 'Administradores' : role === 'dev' ? 'Desenvolvedores' : 'Usuários',
        count: count as number,
        percentage: totalUsers > 0 ? ((count as number) / totalUsers) * 100 : 0,
      }));

      // User growth over time
      const userGrowth = Object.values(
        (allUsers || []).reduce((acc: any, user) => {
          const date = format(new Date(user.created_at), 'dd/MM');
          if (!acc[date]) {
            acc[date] = { date, total: 0, new: 0 };
          }
          acc[date].new += 1;
          return acc;
        }, {})
      );

      // Calculate cumulative totals
      let cumulative = 0;
      userGrowth.forEach((day: any) => {
        cumulative += day.new;
        day.total = cumulative;
      });

      // Get projects per user
      const { data: projects } = await supabase
        .from('projects')
        .select('user_id');

      const projectsPerUser = projects?.length && totalUsers > 0 ? projects.length / totalUsers : 0;

      setUserMetrics({
        totalUsers,
        newUsers,
        activeUsers,
        inactiveUsers,
        usersByRole,
        userGrowth: userGrowth as Array<{ date: string; total: number; new: number }>,
        retentionRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
        averageProjectsPerUser: projectsPerUser,
      });
    } catch (error) {
      console.error('Error fetching user metrics');
    }
  };

  const fetchProjectMetrics = async () => {
    try {
      let query = supabase
        .from('projects')
        .select('*')
        .gte('created_at', filters.dateRange.from.toISOString())
        .lte('created_at', filters.dateRange.to.toISOString());

      const { data: projects, error } = await query;

      if (error) throw error;

      const totalProjects = projects?.length || 0;
      const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;
      const inProgressProjects = projects?.filter(p => p.status === 'in_progress').length || 0;
      const pendingProjects = projects?.filter(p => p.status === 'pending').length || 0;

      // Average completion time (in days)
      const completedWithTime = projects?.filter(p => p.status === 'completed' && p.completed_at) || [];
      const averageCompletionTime = completedWithTime.length > 0
        ? completedWithTime.reduce((sum, p) => {
            const start = new Date(p.created_at);
            const end = new Date(p.completed_at);
            const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / completedWithTime.length
        : 0;

      // Projects by type
      const projectsByType = Object.entries(
        (projects || []).reduce((acc: any, project) => {
          const type = project.project_type || 'single_property';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {})
      ).map(([type, count]) => ({
        type: type === 'single_property' ? 'Imóvel Único' : 'Portfólio',
        count: count as number,
        percentage: totalProjects > 0 ? ((count as number) / totalProjects) * 100 : 0,
      }));

      // Project timeline
      const projectTimeline = Object.values(
        (projects || []).reduce((acc: any, project) => {
          const date = format(new Date(project.created_at), 'dd/MM');
          if (!acc[date]) {
            acc[date] = { date, created: 0, completed: 0 };
          }
          acc[date].created += 1;
          if (project.status === 'completed') {
            acc[date].completed += 1;
          }
          return acc;
        }, {})
      );

      const successRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

      setProjectMetrics({
        totalProjects,
        completedProjects,
        inProgressProjects,
        pendingProjects,
        averageCompletionTime,
        projectsByType,
        projectTimeline: projectTimeline as Array<{ date: string; created: number; completed: number }>,
        successRate,
      });
    } catch (error) {
      console.error('Error fetching project metrics');
    }
  };

  useEffect(() => {
    const fetchAllMetrics = async () => {
      setLoading(true);
      await Promise.all([
        fetchSalesMetrics(),
        fetchUserMetrics(),
        fetchProjectMetrics(),
      ]);
      setLoading(false);
    };

    fetchAllMetrics();
  }, [filters]);

  return {
    filters,
    updateFilters,
    updateDateRange,
    salesMetrics,
    userMetrics,
    projectMetrics,
    loading,
    refetch: () => {
      fetchSalesMetrics();
      fetchUserMetrics();
      fetchProjectMetrics();
    },
  };
};
