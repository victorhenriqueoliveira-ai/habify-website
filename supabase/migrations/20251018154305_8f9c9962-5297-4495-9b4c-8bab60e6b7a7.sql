-- Criar tabela user_plans para rastrear planos individuais dos usuários
CREATE TABLE IF NOT EXISTS public.user_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  used_at timestamp with time zone,
  expires_at timestamp with time zone,
  used_for_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  notes text
);

-- Índices para melhor performance
CREATE INDEX idx_user_plans_user_id ON public.user_plans(user_id);
CREATE INDEX idx_user_plans_status ON public.user_plans(status);
CREATE INDEX idx_user_plans_plan_id ON public.user_plans(plan_id);

-- Habilitar RLS
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own plans"
ON public.user_plans FOR SELECT
USING (
  auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = user_plans.user_id)
  OR is_admin_or_dev()
);

CREATE POLICY "Admins can view all user plans"
ON public.user_plans FOR SELECT
USING (is_admin_or_dev());

CREATE POLICY "System can insert user plans"
ON public.user_plans FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update user plans"
ON public.user_plans FOR UPDATE
USING (true);

CREATE POLICY "Admins can delete user plans"
ON public.user_plans FOR DELETE
USING (is_admin_or_dev());

-- Função para adicionar plano ao usuário
CREATE OR REPLACE FUNCTION public.add_user_plan(
  _user_id uuid,
  _plan_id uuid,
  _order_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _plan_type text;
  _expires_at timestamp with time zone;
  _new_plan_id uuid;
BEGIN
  -- Buscar tipo do plano
  SELECT type INTO _plan_type FROM public.plans WHERE id = _plan_id;
  
  -- Calcular data de expiração baseado no tipo do plano
  IF _plan_type = 'website_maintenance_1m' THEN
    _expires_at := now() + interval '1 month';
  ELSIF _plan_type = 'website_maintenance_6m' THEN
    _expires_at := now() + interval '6 months';
  ELSE
    _expires_at := NULL; -- Planos de site único não expiram
  END IF;
  
  -- Inserir plano
  INSERT INTO public.user_plans (user_id, plan_id, order_id, status, expires_at)
  VALUES (_user_id, _plan_id, _order_id, 'active', _expires_at)
  RETURNING id INTO _new_plan_id;
  
  RETURN _new_plan_id;
END;
$$;

-- Função para usar um plano (marcar como usado ao criar site)
CREATE OR REPLACE FUNCTION public.use_user_plan(
  _user_id uuid,
  _plan_id uuid,
  _project_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _available_plan_id uuid;
BEGIN
  -- Buscar um plano ativo disponível do tipo solicitado
  SELECT id INTO _available_plan_id
  FROM public.user_plans
  WHERE user_id = _user_id
    AND plan_id = _plan_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF _available_plan_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Marcar plano como usado
  UPDATE public.user_plans
  SET status = 'used',
      used_at = now(),
      used_for_project_id = _project_id
  WHERE id = _available_plan_id;
  
  RETURN TRUE;
END;
$$;

-- Função para obter planos disponíveis do usuário
CREATE OR REPLACE FUNCTION public.get_available_user_plans(_user_id uuid)
RETURNS TABLE (
  plan_id uuid,
  plan_name text,
  plan_type text,
  count bigint,
  expires_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.plan_id,
    p.name,
    p.type::text,
    COUNT(*)::bigint,
    MAX(up.expires_at) as expires_at
  FROM public.user_plans up
  JOIN public.plans p ON p.id = up.plan_id
  WHERE up.user_id = _user_id
    AND up.status = 'active'
    AND (up.expires_at IS NULL OR up.expires_at > now())
  GROUP BY up.plan_id, p.name, p.type
  ORDER BY p.price ASC;
END;
$$;