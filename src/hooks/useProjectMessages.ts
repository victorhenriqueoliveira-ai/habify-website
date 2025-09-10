import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProjectMessage {
  id: string;
  projectId: string;
  senderId: string;
  message: string;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  senderName?: string;
}

export const useProjectMessages = (projectId?: string) => {
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMessages = async () => {
    if (!projectId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_messages')
        .select(`
          *,
          profiles!project_messages_sender_id_fkey (
            name
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: ProjectMessage[] = data?.map((msg: any) => ({
        id: msg.id,
        projectId: msg.project_id,
        senderId: msg.sender_id,
        message: msg.message,
        attachmentUrl: msg.attachment_url,
        createdAt: msg.created_at,
        updatedAt: msg.updated_at,
        isRead: msg.is_read,
        senderName: msg.profiles?.name || 'Usuário desconhecido',
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (message: string, attachmentUrl?: string) => {
    if (!projectId || !user?.userId) return { success: false, error: 'Missing data' };

    try {
      const { data, error } = await supabase
        .from('project_messages')
        .insert({
          project_id: projectId,
          sender_id: user.userId,
          message: message.trim(),
          attachment_url: attachmentUrl,
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error };
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('project_messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Realtime subscription
  useEffect(() => {
    if (!projectId) return;

    fetchMessages();

    const channel = supabase
      .channel('project-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_messages',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('New message received:', payload);
          fetchMessages(); // Refetch to get sender name
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return {
    messages,
    loading,
    sendMessage,
    markAsRead,
    fetchMessages,
  };
};