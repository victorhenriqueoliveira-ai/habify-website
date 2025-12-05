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

  // If some rows didn't come with the joined profile (profiles may be null),
      // fetch missing profile names in one query to avoid showing 'Usuário desconhecido'.
      // Collect sender_ids where we don't have a usable name from the join
      const missingSenderIds = Array.from(new Set((data || [])
        .filter((m: any) => {
          // include if profiles is missing or profiles.name is falsy/empty
          return (!m.profiles || !m.profiles?.name) && m.sender_id;
        })
        .map((m: any) => m.sender_id)));

      let missingProfilesMap: Record<string, string> = {};

      // Dev-only diagnostics to help debug why profiles may be missing (RLS, schema mismatch, etc.)
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev && missingSenderIds.length > 0) {
        // eslint-disable-next-line no-console
      }

      if (missingSenderIds.length > 0) {
        try {
          // Try to fetch profiles by user_id first
          const { data: profilesByUserId } = await supabase
            .from('profiles')
            .select('user_id, id, name')
            .in('user_id', missingSenderIds);

          (profilesByUserId || []).forEach((p: any) => {
            const key = p.user_id || p.id;
            if (key) missingProfilesMap[key] = p.name;
          });

          // Also try by profile id (in case sender_id stores profile.id instead of user_id)
          const stillMissing = missingSenderIds.filter(id => !missingProfilesMap[id]);
          if (stillMissing.length > 0) {
            const { data: profilesById } = await supabase
              .from('profiles')
              .select('user_id, id, name')
              .in('id', stillMissing);

            (profilesById || []).forEach((p: any) => {
              const key = p.user_id || p.id;
              if (key) missingProfilesMap[key] = p.name;
            });
          }

          if (isDev) {
            // eslint-disable-next-line no-console
            
          }
        } catch (err) {
          if (isDev) {
            // eslint-disable-next-line no-console
            console.debug('[useProjectMessages] error fetching missing profiles:', err);
          }
          // ignore, we'll fallback to default name
        }
      }

      const formattedMessages: ProjectMessage[] = (data || []).map((msg: any) => ({
        id: msg.id,
        projectId: msg.project_id,
        senderId: msg.sender_id,
        message: msg.message,
        attachmentUrl: msg.attachment_url,
        createdAt: msg.created_at,
        updatedAt: msg.updated_at,
        isRead: msg.is_read,
  senderName: msg.sender_name || msg.profiles?.name || missingProfilesMap[msg.sender_id] || 'Usuário desconhecido',
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      // Silent error handling 
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (message: string, attachmentUrl?: string) => {
    if (!projectId || !user?.userId) return { success: false, error: 'Missing data' };

    try {
      // Get sender profile
      let senderName: string | undefined = undefined;
      try {
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('name, user_id, id')
          .eq('user_id', user.userId)
          .limit(1)
          .single();
        if (senderProfile?.name) senderName = senderProfile.name;
      } catch (err) {
        // ignore
      }

      let insertPayload: any = {
        project_id: projectId,
        sender_id: user.userId,
        message: message.trim(),
        attachment_url: attachmentUrl,
      };

      if (senderName) insertPayload.sender_name = senderName;

      let insertResult: any;
      try {
        insertResult = await supabase.from('project_messages').insert(insertPayload).select().single();
      } catch (err) {
        if (insertPayload.sender_name) {
          const { sender_name, ...withoutName } = insertPayload;
          insertResult = await supabase.from('project_messages').insert(withoutName).select().single();
        } else {
          throw err;
        }
      }

      const { data, error } = insertResult || {};
      if (error) throw error;

      // Send notifications (email + system notification)
      try {
        const { data: project } = await supabase
          .from('projects')
          .select('user_id, title')
          .eq('id', projectId)
          .single();

        const { data: sender } = await supabase
          .from('profiles')
          .select('name, role, id')
          .eq('user_id', user.userId)
          .single();

        if (project && sender) {
          const isUserOwner = project.user_id === user.userId;
          
          if (isUserOwner) {
            // User sent message - notify admins via email
            await supabase.functions.invoke('send-message-notification', {
              body: {
                recipientName: 'Equipe Habify',
                recipientEmail: 'habifybr@gmail.com',
                senderName: sender.name,
                message: message.trim(),
                projectTitle: project.title,
                projectId: projectId,
                isForAdmin: true,
              },
            });
          } else {
            // Admin sent message - get owner profile and notify
            const { data: ownerProfile } = await supabase
              .from('profiles')
              .select('id, name, email, user_id')
              .eq('user_id', project.user_id)
              .single();

            if (ownerProfile) {
              // Send email notification
              await supabase.functions.invoke('send-message-notification', {
                body: {
                  recipientName: ownerProfile.name,
                  recipientEmail: ownerProfile.email,
                  senderName: sender.name,
                  message: message.trim(),
                  projectTitle: project.title,
                  projectId: projectId,
                  isForAdmin: false,
                },
              });

              // Create system notification for the user
              await supabase.from('notifications').insert({
                user_id: ownerProfile.user_id,
                title: `💬 Nova mensagem de ${sender.name}`,
                message: `Você recebeu uma nova mensagem no projeto "${project.title}". Projeto ID: ${projectId}`,
                type: 'info',
              });
            }
          }
        }
      } catch (notificationError) {
        console.error('Error sending notifications:', notificationError);
      }

      return { success: true, data };
    } catch (error) {
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
      // Silent error handling
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
          // New message received - trigger UI update
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