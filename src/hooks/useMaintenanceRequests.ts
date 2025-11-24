import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MaintenanceRequest {
  id: string;
  user_id: string;
  project_id: string;
  maintenance_credit_id?: string;
  title: string;
  description: string;
  attachments_urls?: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  admin_notes?: string;
  before_urls?: string[];
  after_urls?: string[];
  completed_at?: string;
  created_at: string;
  updated_at: string;
  project?: {
    title: string;
    landing_page_url?: string;
  };
  profile?: {
    name: string;
    email: string;
  };
}

export const useMaintenanceRequests = (userId?: string, projectId?: string) => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      let isAdminOrDev = false;

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        isAdminOrDev = profile?.role === 'admin' || profile?.role === 'dev';
      }

      let query = supabase
        .from('maintenance_requests')
        .select(`
          *,
          project:projects(title, landing_page_url)
        `)
        .order('created_at', { ascending: false });

      if (userId && !isAdminOrDev) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (profile) {
          query = query.eq('user_id', profile.id);
        }
      }

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Buscar perfis dos usuários
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (request) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', request.user_id)
            .single();

          return {
            ...request,
            profile: profile || { name: '', email: '' }
          };
        })
      );

      setRequests(requestsWithProfiles as MaintenanceRequest[]);
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
      toast.error('Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async (
    projectId: string,
    title: string,
    description: string,
    attachments?: string[]
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Perfil não encontrado');

      // Usar crédito
      const { data: creditId, error: creditError } = await supabase
        .rpc('use_maintenance_credit', {
          _user_id: profile.id,
          _project_id: projectId
        });

      if (creditError) {
        toast.error('Você não tem créditos de manutenção disponíveis');
        return null;
      }

      // Criar solicitação
      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert({
          user_id: profile.id,
          project_id: projectId,
          maintenance_credit_id: creditId,
          title,
          description,
          attachments_urls: attachments || [],
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Enviar notificação por email
      try {
        await supabase.functions.invoke('send-maintenance-request-notification', {
          body: { requestId: data.id, action: 'created' }
        });
      } catch (emailError) {
        console.error('Error sending notification email:', emailError);
      }

      toast.success('Solicitação criada com sucesso!');
      await fetchRequests();
      return data;
    } catch (error: any) {
      console.error('Error creating maintenance request:', error);
      toast.error(error.message || 'Erro ao criar solicitação');
      return null;
    }
  };

  const updateRequestStatus = async (
    requestId: string,
    status: 'in_progress' | 'completed' | 'rejected',
    adminNotes?: string,
    beforeUrls?: string[],
    afterUrls?: string[]
  ) => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (adminNotes) updateData.admin_notes = adminNotes;
      if (beforeUrls) updateData.before_urls = beforeUrls;
      if (afterUrls) updateData.after_urls = afterUrls;
      if (status === 'completed') updateData.completed_at = new Date().toISOString();

      const { error } = await supabase
        .from('maintenance_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      // Enviar notificação por email
      try {
        const action = status === 'completed' ? 'completed' : 'updated';
        await supabase.functions.invoke('send-maintenance-request-notification', {
          body: { requestId, action }
        });
      } catch (emailError) {
        console.error('Error sending notification email:', emailError);
      }

      toast.success('Status atualizado com sucesso!');
      await fetchRequests();
      return true;
    } catch (error) {
      console.error('Error updating request status:', error);
      toast.error('Erro ao atualizar status');
      return false;
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [userId, projectId]);

  return {
    requests,
    loading,
    createRequest,
    updateRequestStatus,
    refetch: fetchRequests,
  };
};
