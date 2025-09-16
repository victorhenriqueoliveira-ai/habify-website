import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  category: string;
  message: string;
  user?: string;
  ip?: string;
  details?: string;
}

export const useSystemLogs = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // Fetch audit logs
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch Supabase analytics logs
      const [authLogsResult, dbLogsResult] = await Promise.all([
        supabase.functions.invoke('get-auth-logs'),
        supabase.functions.invoke('get-db-logs')
      ]);

      const systemLogs: SystemLog[] = [];

      // Process audit logs
      if (auditLogs) {
        auditLogs.forEach(log => {
          systemLogs.push({
            id: log.id,
            timestamp: log.created_at,
            level: getLogLevel(log.action),
            category: 'System',
            message: `${log.action} - ${log.target_type}`,
            user: log.user_id || undefined,
            details: JSON.stringify(log.details)
          });
        });
      }

      // Process auth logs from analytics (if available)
      if (authLogsResult.data) {
        authLogsResult.data.slice(0, 20).forEach((log: any) => {
          systemLogs.push({
            id: log.id,
            timestamp: new Date(log.timestamp / 1000).toISOString(),
            level: log.level === 'error' ? 'error' : 'info',
            category: 'Authentication',
            message: log.msg || 'Auth event',
            user: log.event_message ? extractUserFromAuthLog(log.event_message) : undefined,
            details: log.event_message
          });
        });
      }

      // Process database logs (if available)
      if (dbLogsResult.data) {
        dbLogsResult.data.slice(0, 20).forEach((log: any) => {
          systemLogs.push({
            id: log.id,
            timestamp: new Date(log.timestamp / 1000).toISOString(),
            level: log.error_severity === 'ERROR' ? 'error' : 'info',
            category: 'Database',
            message: log.event_message || 'DB operation',
            details: log.event_message
          });
        });
      }

      // Sort by timestamp descending
      systemLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setLogs(systemLogs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      // Fallback to audit logs only
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (auditLogs) {
        const systemLogs: SystemLog[] = auditLogs.map(log => ({
          id: log.id,
          timestamp: log.created_at,
          level: getLogLevel(log.action),
          category: 'System',
          message: `${log.action} - ${log.target_type}`,
          user: log.user_id || undefined,
          details: JSON.stringify(log.details)
        }));
        setLogs(systemLogs);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return {
    logs,
    loading,
    fetchLogs,
  };
};

// Helper functions
const getLogLevel = (action: string): SystemLog['level'] => {
  const errorActions = ['DELETE', 'REJECT', 'ERROR'];
  const warningActions = ['UPDATE', 'MODIFY', 'SUSPEND'];
  const successActions = ['CREATE', 'APPROVE', 'COMPLETE'];

  if (errorActions.some(a => action.includes(a))) return 'error';
  if (warningActions.some(a => action.includes(a))) return 'warning';
  if (successActions.some(a => action.includes(a))) return 'success';
  return 'info';
};

const extractUserFromAuthLog = (eventMessage: string): string | undefined => {
  try {
    const parsed = JSON.parse(eventMessage);
    return parsed.actor_username || parsed.user_id;
  } catch {
    return undefined;
  }
};