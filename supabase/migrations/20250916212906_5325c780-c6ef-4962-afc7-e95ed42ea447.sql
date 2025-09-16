-- Create a settings table to store system configuration
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies - only devs can manage settings
CREATE POLICY "Devs can view all settings" 
ON public.system_settings 
FOR SELECT 
USING (get_current_user_role() = 'dev'::user_role);

CREATE POLICY "Devs can create settings" 
ON public.system_settings 
FOR INSERT 
WITH CHECK (get_current_user_role() = 'dev'::user_role);

CREATE POLICY "Devs can update settings" 
ON public.system_settings 
FOR UPDATE 
USING (get_current_user_role() = 'dev'::user_role);

-- Create trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.system_settings (key, value, category, description) VALUES
('email_notifications', '{"enabled": true}', 'email', 'Enable/disable email notifications'),
('email_provider', '{"type": "smtp", "host": "smtp.gmail.com", "port": 587}', 'email', 'Email provider configuration'),
('maintenance_mode', '{"enabled": false}', 'system', 'System maintenance mode'),
('allow_registrations', '{"enabled": true}', 'system', 'Allow new user registrations'),
('auto_approve_projects', '{"enabled": false}', 'system', 'Auto-approve new projects'),
('max_upload_size', '{"size_mb": 10}', 'system', 'Maximum file upload size in MB'),
('enforce_ssl', '{"enabled": true}', 'security', 'Force SSL connections'),
('password_policy', '{"enabled": true, "min_length": 8}', 'security', 'Password complexity requirements'),
('session_timeout', '{"hours": 24}', 'security', 'Session timeout in hours');

-- Create edge functions for fetching analytics logs
-- Note: Edge functions will be automatically deployed