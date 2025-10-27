import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProjects } from './useProjects';

/**
 * Optimized realtime hook for projects with debouncing
 * Fase 2 - Item 10: Otimizar realtime subscriptions
 */
export const useRealtimeProjects = () => {
  const { fetchProjects } = useProjects();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced fetch to prevent excessive refetches
  const debouncedFetch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchProjects();
    }, 500); // 500ms debounce
  }, [fetchProjects]);

  useEffect(() => {
    // Consolidate subscriptions into a single channel
    const channel = supabase
      .channel('projects-and-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'projects'
        },
        () => {
          // Debounced refetch on projects changes
          debouncedFetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          // Notifications don't need to refetch projects
          // This could trigger a separate notification handler if needed
        }
      )
      .subscribe();

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [debouncedFetch]);
};
