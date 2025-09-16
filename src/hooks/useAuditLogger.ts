import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type AuditAction = 
  | 'CREATE_USER' | 'UPDATE_USER' | 'DELETE_USER'
  | 'CREATE_PROJECT' | 'UPDATE_PROJECT' | 'DELETE_PROJECT'
  | 'LOGIN' | 'LOGOUT'
  | 'CHANGE_SETTINGS' | 'VIEW_LOGS' | 'EXPORT_DATA'
  | 'CREATE_TRANSACTION' | 'UPDATE_TRANSACTION';

type AuditTargetType = 'user' | 'project' | 'transaction' | 'system' | 'auth';

interface AuditLogData {
  action: AuditAction;
  target_type: AuditTargetType;
  target_id?: string;
  details?: Record<string, any>;
}

export const useAuditLogger = () => {
  const { user } = useAuth();

  const logAction = useCallback(async (data: AuditLogData) => {
    if (!user?.id) return;

    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: data.action,
        target_type: data.target_type,
        target_id: data.target_id,
        details: data.details || {}
      });
    } catch (error) {
      console.error('Failed to log audit action:', error);
    }
  }, [user?.id]);

  // Specific logging functions
  const logUserAction = useCallback((action: 'CREATE_USER' | 'UPDATE_USER' | 'DELETE_USER', targetId: string, details?: Record<string, any>) => {
    return logAction({ action, target_type: 'user', target_id: targetId, details });
  }, [logAction]);

  const logProjectAction = useCallback((action: 'CREATE_PROJECT' | 'UPDATE_PROJECT' | 'DELETE_PROJECT', targetId: string, details?: Record<string, any>) => {
    return logAction({ action, target_type: 'project', target_id: targetId, details });
  }, [logAction]);

  const logSystemAction = useCallback((action: 'CHANGE_SETTINGS' | 'VIEW_LOGS' | 'EXPORT_DATA', details?: Record<string, any>) => {
    return logAction({ action, target_type: 'system', details });
  }, [logAction]);

  const logAuthAction = useCallback((action: 'LOGIN' | 'LOGOUT', details?: Record<string, any>) => {
    return logAction({ action, target_type: 'auth', details });
  }, [logAction]);

  const logTransactionAction = useCallback((action: 'CREATE_TRANSACTION' | 'UPDATE_TRANSACTION', targetId: string, details?: Record<string, any>) => {
    return logAction({ action, target_type: 'transaction', target_id: targetId, details });
  }, [logAction]);

  return {
    logAction,
    logUserAction,
    logProjectAction,
    logSystemAction,
    logAuthAction,
    logTransactionAction,
  };
};