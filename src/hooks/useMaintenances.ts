import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Maintenance {
  id: string;
  user_id: string;
  project_id: string;
  user_plan_id?: string;
  amount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  payment_gateway?: string;
  payment_id?: string;
  payment_data?: any;
  contracted_at: string;
  expires_at: string;
  started_at?: string;
  completed_at?: string;
  description?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  project?: {
    title: string;
    status: string;
  };
  profile?: {
    name: string;
    email: string;
  };
}

export const useMaintenances = (userId?: string, projectId?: string) => {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMaintenances = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar se o usuário atual é admin/dev
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      let isAdminOrDev = false;

      if (currentUser) {
        const { data: currentProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', currentUser.id)
          .single();
        
        isAdminOrDev = currentProfile?.role === 'admin' || currentProfile?.role === 'dev';
      }

      let query = supabase
        .from('maintenances')
        .select(`
          *,
          project:projects(title, status)
        `)
        .order('contracted_at', { ascending: false });

      // Se userId foi passado explicitamente, filtrar por ele
      // Se não foi passado e não é admin/dev, filtrar pelo usuário atual
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (profile) {
          query = query.eq('user_id', profile.id);
        }
      } else if (!isAdminOrDev && currentUser) {
        // Usuário regular vê apenas suas manutenções
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', currentUser.id)
          .single();

        if (profile) {
          query = query.eq('user_id', profile.id);
        }
      }
      // Admin/Dev sem userId específico veem todas as manutenções

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch profile data separately for each maintenance
      const maintenancesWithProfiles = await Promise.all(
        (data || []).map(async (maintenance) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', maintenance.user_id)
            .single();

          return {
            ...maintenance,
            profile: profile || { name: '', email: '' }
          };
        })
      );

      setMaintenances(maintenancesWithProfiles as Maintenance[]);
    } catch (error) {
      console.error('Error fetching maintenances:', error);
      setError('Erro ao carregar manutenções');
      toast.error('Erro ao carregar manutenções');
    } finally {
      setLoading(false);
    }
  };

  const createMaintenance = async (projectId: string, description?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile não encontrado');

      const { data, error } = await supabase
        .from('maintenances')
        .insert({
          user_id: profile.id,
          project_id: projectId,
          description,
          amount: 54.90,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Manutenção criada com sucesso!');
      await fetchMaintenances();
      return data;
    } catch (error) {
      console.error('Error creating maintenance:', error);
      toast.error('Erro ao criar manutenção');
      return null;
    }
  };

  const updateMaintenanceStatus = async (
    maintenanceId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled',
    adminNotes?: string
  ) => {
    try {
      const updateData: any = { status };
      
      if (status === 'in_progress' && !maintenances.find(m => m.id === maintenanceId)?.started_at) {
        updateData.started_at = new Date().toISOString();
      }
      
      if (status === 'completed' && !maintenances.find(m => m.id === maintenanceId)?.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }

      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }

      const { error } = await supabase
        .from('maintenances')
        .update(updateData)
        .eq('id', maintenanceId);

      if (error) throw error;

      toast.success('Status atualizado com sucesso!');
      await fetchMaintenances();
      return true;
    } catch (error) {
      console.error('Error updating maintenance status:', error);
      toast.error('Erro ao atualizar status');
      return false;
    }
  };

  const deleteMaintenance = async (maintenanceId: string) => {
    try {
      const { error } = await supabase
        .from('maintenances')
        .delete()
        .eq('id', maintenanceId);

      if (error) throw error;

      toast.success('Manutenção removida com sucesso!');
      await fetchMaintenances();
      return true;
    } catch (error) {
      console.error('Error deleting maintenance:', error);
      toast.error('Erro ao remover manutenção');
      return false;
    }
  };

  const getMaintenancesByStatus = (status: Maintenance['status']) => {
    return maintenances.filter(m => m.status === status);
  };

  const getActiveMaintenances = () => {
    const now = new Date();
    return maintenances.filter(m => 
      m.status !== 'cancelled' && 
      new Date(m.expires_at) > now
    );
  };

  useEffect(() => {
    fetchMaintenances();

    // Subscribe to changes
    const channel = supabase
      .channel('maintenances_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenances'
        },
        () => {
          fetchMaintenances();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, projectId]);

  return {
    maintenances,
    loading,
    error,
    fetchMaintenances,
    createMaintenance,
    updateMaintenanceStatus,
    deleteMaintenance,
    getMaintenancesByStatus,
    getActiveMaintenances,
  };
};
