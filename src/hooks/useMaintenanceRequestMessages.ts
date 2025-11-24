import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MaintenanceRequestMessage {
  id: string;
  maintenance_request_id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  attachment_url?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export const useMaintenanceRequestMessages = (requestId?: string) => {
  const [messages, setMessages] = useState<MaintenanceRequestMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    if (!requestId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('maintenance_request_messages')
        .select('*')
        .eq('maintenance_request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data as MaintenanceRequestMessage[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (message: string, attachmentUrl?: string) => {
    if (!requestId) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user.id)
        .single();

      const { data, error } = await supabase
        .from('maintenance_request_messages')
        .insert({
          maintenance_request_id: requestId,
          sender_id: user.id,
          sender_name: profile?.name || 'Usuário',
          message,
          attachment_url: attachmentUrl,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
      return null;
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('maintenance_request_messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  useEffect(() => {
    fetchMessages();

    if (!requestId) return;

    // Setup realtime subscription
    const channel = supabase
      .channel(`maintenance_request_messages:${requestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance_request_messages',
          filter: `maintenance_request_id=eq.${requestId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages((prev) => [...prev, payload.new as MaintenanceRequestMessage]);
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.new.id ? (payload.new as MaintenanceRequestMessage) : msg
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  return {
    messages,
    loading,
    sendMessage,
    markAsRead,
    refetch: fetchMessages,
  };
};
