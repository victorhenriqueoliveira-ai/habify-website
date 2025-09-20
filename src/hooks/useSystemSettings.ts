import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SystemSetting {
  id: string;
  key: string;
  value: any;
  category: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const { hasRole } = useAuth();

  const fetchSettings = async () => {
    if (!hasRole(['dev'])) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;

      if (data) {
        const settingsMap: Record<string, any> = {};
        data.forEach(setting => {
          settingsMap[setting.key] = setting.value;
        });
        setSettings(settingsMap);
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    if (!hasRole(['dev'])) {
      throw new Error('Unauthorized');
    }

    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ 
          value: value,
          updated_at: new Date().toISOString()
        })
        .eq('key', key);

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        [key]: value
      }));

      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const getSetting = (key: string, defaultValue: any = null) => {
    return settings[key] || defaultValue;
  };

  const getEmailSettings = () => ({
    notifications: getSetting('email_notifications', { enabled: true }),
    provider: getSetting('email_provider', { type: 'smtp', host: 'smtp.gmail.com', port: 587 })
  });

  const getSystemSettings = () => ({
    maintenanceMode: getSetting('maintenance_mode', { enabled: false }),
    allowRegistrations: getSetting('allow_registrations', { enabled: true }),
    autoApproveProjects: getSetting('auto_approve_projects', { enabled: false }),
    maxUploadSize: getSetting('max_upload_size', { size_mb: 10 })
  });

  const getSecuritySettings = () => ({
    enforceSSL: getSetting('enforce_ssl', { enabled: true }),
    passwordPolicy: getSetting('password_policy', { enabled: true, min_length: 8 }),
    sessionTimeout: getSetting('session_timeout', { hours: 24 })
  });

  useEffect(() => {
    fetchSettings();
  }, [hasRole]);

  return {
    settings,
    loading,
    fetchSettings,
    updateSetting,
    getSetting,
    getEmailSettings,
    getSystemSettings,
    getSecuritySettings,
  };
};