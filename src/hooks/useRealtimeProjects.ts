import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProjects } from './useProjects';

export const useRealtimeProjects = () => {
  const { fetchProjects } = useProjects();

  useEffect(() => {
    // Subscribe to realtime changes
    const channel = supabase
      .channel('projects-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'projects'
        },
        (payload) => {
          // Projects table updated - refresh data
          // Refetch projects when any change occurs
          fetchProjects();
        }
      )
      .subscribe();

    // Also subscribe to notifications for real-time updates
    const notificationsChannel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          // New notification received
          // Handle notification updates if needed
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [fetchProjects]);
};