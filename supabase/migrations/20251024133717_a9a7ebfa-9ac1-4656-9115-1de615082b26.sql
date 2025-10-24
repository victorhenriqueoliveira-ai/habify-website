-- Corrigir função use_user_plan para validar planos ativos corretamente
CREATE OR REPLACE FUNCTION public.use_user_plan(
  _user_id uuid,
  _plan_id uuid,
  _project_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_plan_id uuid;
BEGIN
  -- Buscar um plano ativo do usuário
  SELECT id INTO v_user_plan_id
  FROM user_plans
  WHERE user_id = _user_id
    AND plan_id = _plan_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF v_user_plan_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum plano ativo disponível';
  END IF;
  
  -- Atualizar o plano para usado
  UPDATE user_plans
  SET status = 'used',
      used_at = NOW(),
      used_for_project_id = _project_id
  WHERE id = v_user_plan_id;
  
  RETURN v_user_plan_id;
END;
$$;

-- Corrigir função get_available_user_plans para retornar informações completas
DROP FUNCTION IF EXISTS public.get_available_user_plans(uuid);

CREATE OR REPLACE FUNCTION public.get_available_user_plans(_user_id uuid)
RETURNS TABLE (
  plan_id uuid,
  plan_name text,
  plan_type plan_type,
  plan_description text,
  plan_features jsonb,
  count bigint,
  expires_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.plan_id,
    p.name as plan_name,
    p.type as plan_type,
    p.description as plan_description,
    p.features as plan_features,
    COUNT(*)::bigint as count,
    MAX(up.expires_at) as expires_at
  FROM user_plans up
  INNER JOIN plans p ON p.id = up.plan_id
  WHERE up.user_id = _user_id
    AND up.status = 'active'
    AND (up.expires_at IS NULL OR up.expires_at > NOW())
  GROUP BY up.plan_id, p.name, p.type, p.description, p.features;
END;
$$;

-- Adicionar política de DELETE para notificações
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Adicionar política de DELETE para mensagens de projeto
CREATE POLICY "Users can delete their own messages"
ON public.project_messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- Adicionar política de DELETE para profiles (Admin)
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (get_current_user_role() = 'admin'::user_role);