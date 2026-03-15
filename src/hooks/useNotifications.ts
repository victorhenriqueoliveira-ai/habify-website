import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Notification } from '@/types/admin';

// Helper to check if user is admin/dev via user_roles table (secure)
const checkIsAdminOrDev = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'dev'])
      .maybeSingle();

    return !error && !!data;
  } catch {
    return false;
  }
};

export const useNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      setCurrentUserId(currentUser.id);

      // Check admin/dev status using user_roles table (secure)
      const isAdminOrDev = await checkIsAdminOrDev(currentUser.id);

      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter notifications based on role
      if (userId) {
        // Explicit userId passed - use it
        query = query.eq('user_id', userId);
      } else if (!isAdminOrDev) {
        // Regular user - only their notifications
        query = query.eq('user_id', currentUser.id);
      }
      // Admin/Dev without explicit userId see all notifications

      const { data, error } = await query;

      if (error) throw error;

      const formattedNotifications: Notification[] = data?.map((notification) => ({
        id: notification.id,
        userId: notification.user_id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        createdAt: notification.created_at,
      })) || [];

      setNotifications(formattedNotifications);
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
      
      await fetchNotifications();
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const markAllAsRead = async () => {
    try {
      // SECURITY FIX: Filter by current user's ID to prevent marking other users' notifications
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Not authenticated' };
        
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('read', false)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('read', false)
          .eq('user_id', currentUserId);

        if (error) throw error;
      }
      
      await fetchNotifications();
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchNotifications();
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const createNotification = async (notificationData: {
    userId: string;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
  }) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notificationData.userId,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type || 'info',
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchNotifications();
      return { success: true, data };
    } catch (error) {
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
  };
};
