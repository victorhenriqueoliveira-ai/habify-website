-- Adicionar campo de créditos na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0;

-- Criar tabela de histórico de créditos
CREATE TABLE IF NOT EXISTS public.credits_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'admin_grant', 'refund')),
  description TEXT,
  order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.credits_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para credits_history
CREATE POLICY "Users can view their own credits history"
ON public.credits_history
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE id = credits_history.user_id
  )
  OR is_admin_or_dev()
);

CREATE POLICY "System can create credits history"
ON public.credits_history
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage credits history"
ON public.credits_history
FOR ALL
USING (is_admin_or_dev());

-- Criar função para adicionar créditos
CREATE OR REPLACE FUNCTION public.add_credits(
  _user_id UUID,
  _amount INTEGER,
  _type TEXT,
  _description TEXT DEFAULT NULL,
  _order_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar créditos do usuário
  UPDATE public.profiles
  SET credits = credits + _amount
  WHERE id = _user_id;
  
  -- Registrar no histórico
  INSERT INTO public.credits_history (user_id, amount, type, description, order_id, created_by)
  VALUES (_user_id, _amount, _type, _description, _order_id, auth.uid());
END;
$$;

-- Criar função para usar créditos
CREATE OR REPLACE FUNCTION public.use_credits(
  _user_id UUID,
  _amount INTEGER,
  _description TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Verificar se tem créditos suficientes
  SELECT credits INTO current_credits
  FROM public.profiles
  WHERE id = _user_id;
  
  IF current_credits < _amount THEN
    RETURN FALSE;
  END IF;
  
  -- Usar créditos
  UPDATE public.profiles
  SET credits = credits - _amount
  WHERE id = _user_id;
  
  -- Registrar no histórico
  INSERT INTO public.credits_history (user_id, amount, type, description, created_by)
  VALUES (_user_id, -_amount, 'usage', _description, auth.uid());
  
  RETURN TRUE;
END;
$$;

-- Adicionar campo credits_granted nos planos
ALTER TABLE public.plans
ADD COLUMN IF NOT EXISTS credits_granted INTEGER NOT NULL DEFAULT 1;