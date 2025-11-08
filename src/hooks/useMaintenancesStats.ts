import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  count: number;
}

export interface MaintenancesStats {
  totalRevenue: number;
  activeMaintenances: number;
  expiredMaintenances: number;
  pendingMaintenances: number;
  renewalRate: number;
  monthlyRevenue: MonthlyRevenue[];
}

export const useMaintenancesStats = () => {
  return useQuery({
    queryKey: ['maintenances-stats'],
    queryFn: async () => {
      // Buscar todas as manutenções
      const { data: allMaintenances, error: allError } = await supabase
        .from('maintenances')
        .select('*')
        .order('created_at', { ascending: false });

      if (allError) throw allError;

      const now = new Date();
      const sixMonthsAgo = subMonths(now, 6);

      // Calcular estatísticas
      const activeMaintenances = allMaintenances?.filter(
        m => m.status === 'pending' || m.status === 'in_progress'
      ).length || 0;

      const expiredMaintenances = allMaintenances?.filter(
        m => new Date(m.expires_at) < now && (m.status === 'pending' || m.status === 'in_progress')
      ).length || 0;

      const pendingMaintenances = allMaintenances?.filter(
        m => m.status === 'pending'
      ).length || 0;

      const completedMaintenances = allMaintenances?.filter(
        m => m.status === 'completed'
      ).length || 0;

      // Taxa de renovação (manutenções completadas vs total)
      const totalMaintenances = allMaintenances?.length || 0;
      const renewalRate = totalMaintenances > 0 
        ? (completedMaintenances / totalMaintenances) * 100 
        : 0;

      // Receita total
      const totalRevenue = allMaintenances?.reduce(
        (sum, m) => sum + Number(m.amount), 0
      ) || 0;

      // Receita mensal dos últimos 6 meses
      const monthlyRevenue: MonthlyRevenue[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const monthMaintenances = allMaintenances?.filter(m => {
          const createdAt = new Date(m.created_at);
          return createdAt >= monthStart && createdAt <= monthEnd;
        }) || [];

        monthlyRevenue.push({
          month: format(monthDate, 'MMM/yy'),
          revenue: monthMaintenances.reduce((sum, m) => sum + Number(m.amount), 0),
          count: monthMaintenances.length
        });
      }

      const stats: MaintenancesStats = {
        totalRevenue,
        activeMaintenances,
        expiredMaintenances,
        pendingMaintenances,
        renewalRate,
        monthlyRevenue
      };

      return stats;
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });
};
