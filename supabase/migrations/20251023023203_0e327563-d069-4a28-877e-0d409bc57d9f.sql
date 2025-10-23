-- Adicionar campo user_plan_id na tabela projects para vincular diretamente ao plano usado
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS user_plan_id uuid REFERENCES public.user_plans(id) ON DELETE SET NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_projects_user_plan_id ON public.projects(user_plan_id);

-- Remover a função antiga
DROP FUNCTION IF EXISTS public.use_user_plan(uuid, uuid, uuid);

-- Recriar a função use_user_plan para retornar o ID do plano usado
CREATE FUNCTION public.use_user_plan(_user_id uuid, _plan_id uuid, _project_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    RETURN NULL;
  END IF;
  
  -- Marcar plano como usado
  UPDATE public.user_plans
  SET status = 'used',
      used_at = now(),
      used_for_project_id = _project_id
  WHERE id = _available_plan_id;
  
  RETURN _available_plan_id;
END;
$$;

-- Comentários para documentação
COMMENT ON COLUMN public.projects.user_plan_id IS 'Referência ao plano (user_plan) utilizado para criar este projeto';
COMMENT ON FUNCTION public.use_user_plan IS 'Marca um plano como usado e retorna o ID do user_plan utilizado';