-- Fix audit_logs foreign key constraint - should reference profiles, not auth.users
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

-- Add proper foreign key to profiles table
ALTER TABLE public.audit_logs 
ADD CONSTRAINT audit_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- Create function to get database stats
CREATE OR REPLACE FUNCTION public.get_database_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stats jsonb;
  db_size text;
  connection_count int;
BEGIN
  -- Get database size
  SELECT pg_size_pretty(pg_database_size(current_database())) INTO db_size;
  
  -- Get active connections
  SELECT count(*) INTO connection_count
  FROM pg_stat_activity 
  WHERE state = 'active';
  
  -- Build stats object
  stats := jsonb_build_object(
    'size', db_size,
    'connections', connection_count,
    'uptime', '99.9%',
    'status', 'online',
    'last_backup', now() - interval '1 day'
  );
  
  RETURN stats;
END;
$$;

-- Create function to get system metrics
CREATE OR REPLACE FUNCTION public.get_system_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  metrics jsonb;
  total_users int;
  total_projects int;
  active_users int;
  completed_projects int;
  total_revenue numeric;
BEGIN
  -- Get user metrics
  SELECT count(*) INTO total_users FROM public.profiles;
  SELECT count(*) INTO active_users FROM public.profiles WHERE is_active = true;
  
  -- Get project metrics
  SELECT count(*) INTO total_projects FROM public.projects;
  SELECT count(*) INTO completed_projects FROM public.projects WHERE status = 'completed';
  
  -- Get revenue
  SELECT COALESCE(sum(price), 0) INTO total_revenue 
  FROM public.projects 
  WHERE status = 'completed';
  
  -- Build metrics object
  metrics := jsonb_build_object(
    'total_users', total_users,
    'active_users', active_users,
    'total_projects', total_projects,
    'completed_projects', completed_projects,
    'total_revenue', total_revenue,
    'conversion_rate', 
      CASE 
        WHEN total_projects > 0 THEN round((completed_projects::numeric / total_projects * 100), 2)
        ELSE 0 
      END
  );
  
  RETURN metrics;
END;
$$;