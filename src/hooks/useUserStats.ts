import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserStats {
  totalProjects: number;
  completedProjects: number;
  successRate: number;
}

export const useUserStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    totalProjects: 0,
    completedProjects: 0,
    successRate: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchUserStats = async () => {
    if (!user?.id && !user?.userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const userId = user.userId || user.id;
      
      // Fetch user's projects or all projects based on role
      let query = supabase.from('projects').select('status');
      
      if (user.role === 'user') {
        // Regular user - only their projects
        query = query.eq('user_id', userId);
      }
      // For admin/dev - get all projects (no filter)
      
      const { data: projects, error } = await query;

      if (error) throw error;

      const totalProjects = projects?.length || 0;
      const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;
      const successRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

      setStats({
        totalProjects,
        completedProjects,
        successRate: Math.round(successRate),
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserStats();
  }, [user?.id, user?.userId, user?.role]);

  return {
    stats,
    loading,
    fetchUserStats,
  };
};