import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  completedProjects: number;
  totalRevenue: number;
  conversionRate: number;
}

export const useSystemMetrics = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.rpc('get_system_metrics');
      
      if (error) throw error;
      
      const metricsData = data as any;
      
      setMetrics({
        totalUsers: metricsData?.total_users || 0,
        activeUsers: metricsData?.active_users || 0,
        totalProjects: metricsData?.total_projects || 0,
        completedProjects: metricsData?.completed_projects || 0,
        totalRevenue: parseFloat(metricsData?.total_revenue) || 0,
        conversionRate: metricsData?.conversion_rate || 0
      });
    } catch (err: any) {
      console.error('Error fetching system metrics:', err);
      setError(err.message);
      // Fallback to zeros if function fails
      setMetrics({
        totalUsers: 0,
        activeUsers: 0,
        totalProjects: 0,
        completedProjects: 0,
        totalRevenue: 0,
        conversionRate: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics
  };
};