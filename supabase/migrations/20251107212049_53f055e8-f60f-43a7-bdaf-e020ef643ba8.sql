-- Create social_metrics table
CREATE TABLE IF NOT EXISTS public.social_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'youtube', 'tiktok', 'linkedin')),
  followers INTEGER NOT NULL DEFAULT 0,
  engagement NUMERIC NOT NULL DEFAULT 0 CHECK (engagement >= 0 AND engagement <= 1),
  views INTEGER NOT NULL DEFAULT 0,
  growth_since_last NUMERIC DEFAULT 0,
  account_id TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_social_metrics_platform ON public.social_metrics(platform);
CREATE INDEX idx_social_metrics_user_id ON public.social_metrics(user_id);
CREATE INDEX idx_social_metrics_timestamp ON public.social_metrics(timestamp DESC);

-- Enable RLS
ALTER TABLE public.social_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all social metrics"
  ON public.social_metrics
  FOR SELECT
  USING (is_admin_or_dev_v2(auth.uid()));

CREATE POLICY "Admins can insert social metrics"
  ON public.social_metrics
  FOR INSERT
  WITH CHECK (is_admin_or_dev_v2(auth.uid()));

CREATE POLICY "System can insert social metrics"
  ON public.social_metrics
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update social metrics"
  ON public.social_metrics
  FOR UPDATE
  USING (is_admin_or_dev_v2(auth.uid()));

CREATE POLICY "Admins can delete social metrics"
  ON public.social_metrics
  FOR DELETE
  USING (is_admin_or_dev_v2(auth.uid()));