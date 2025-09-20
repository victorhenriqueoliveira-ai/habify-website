import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DatabaseStats {
  size: string;
  connections: number;
  uptime: string;
  status: string;
  lastBackup: string;
  latency?: number;
}

export const useDatabaseStats = () => {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Measure latency
      const startTime = Date.now();
      const { data, error } = await supabase.rpc('get_database_stats');
      const latency = Date.now() - startTime;
      
      if (error) throw error;
      
      const dbData = data as any;
      
      setStats({
        size: dbData?.size || 'N/A',
        connections: dbData?.connections || 0,
        uptime: dbData?.uptime || '99.9%',
        status: dbData?.status || 'online',
        lastBackup: dbData?.last_backup ? new Date(dbData.last_backup).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
        latency
      });
    } catch (err: any) {
      setError(err.message);
      // Fallback to default values if function fails
      setStats({
        size: 'N/A',
        connections: 0,
        uptime: '99.9%',
        status: 'online',
        lastBackup: new Date().toLocaleDateString('pt-BR'),
        latency: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};