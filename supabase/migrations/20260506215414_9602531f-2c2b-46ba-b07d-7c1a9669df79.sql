-- 1. Tabela feature_flags_users
CREATE TABLE public.feature_flags_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  flag_name text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE (user_id, flag_name)
);

CREATE INDEX idx_feature_flags_users_user_flag ON public.feature_flags_users(user_id, flag_name);

ALTER TABLE public.feature_flags_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage feature flags"
  ON public.feature_flags_users
  FOR ALL
  USING (public.is_admin_or_dev_v2(auth.uid()))
  WITH CHECK (public.is_admin_or_dev_v2(auth.uid()));

CREATE POLICY "Users can view their own feature flags"
  ON public.feature_flags_users
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Função has_feature_flag (SECURITY DEFINER para uso em RLS/edge functions)
CREATE OR REPLACE FUNCTION public.has_feature_flag(_user_id uuid, _flag text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.feature_flags_users
    WHERE user_id = _user_id
      AND flag_name = _flag
      AND enabled = true
  )
$$;

-- 3. Tabela ai_generation_logs
CREATE TABLE public.ai_generation_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL,
  step text NOT NULL,
  status text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  error text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_generation_logs_project ON public.ai_generation_logs(project_id, created_at DESC);

ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all ai generation logs"
  ON public.ai_generation_logs
  FOR SELECT
  USING (public.is_admin_or_dev_v2(auth.uid()));

CREATE POLICY "Admins can insert ai generation logs"
  ON public.ai_generation_logs
  FOR INSERT
  WITH CHECK (public.is_admin_or_dev_v2(auth.uid()));

CREATE POLICY "Project owners can view their ai logs"
  ON public.ai_generation_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = ai_generation_logs.project_id
        AND p.user_id = auth.uid()
    )
  );

-- 4. Novos campos em projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS github_repo_url text,
  ADD COLUMN IF NOT EXISTS github_repo_name text,
  ADD COLUMN IF NOT EXISTS ai_generation_status text DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS ai_generation_error text,
  ADD COLUMN IF NOT EXISTS ai_site_structure jsonb;