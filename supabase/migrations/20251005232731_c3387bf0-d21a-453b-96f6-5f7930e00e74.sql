-- Criar tabela credit_logs para auditoria
CREATE TABLE IF NOT EXISTS public.credit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans(id),
  gateway TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  credits_granted INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.credit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins podem ver todos os logs
CREATE POLICY "Admins can view all credit logs"
ON public.credit_logs
FOR SELECT
TO authenticated
USING (is_admin_or_dev());

-- Policy: Sistema pode inserir logs
CREATE POLICY "System can insert credit logs"
ON public.credit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Índices para performance
CREATE INDEX idx_credit_logs_user_id ON public.credit_logs(user_id);
CREATE INDEX idx_credit_logs_created_at ON public.credit_logs(created_at DESC);