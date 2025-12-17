-- =============================================
-- GARANTIR QUE VIEW user_plans_detailed USA SECURITY INVOKER
-- =============================================
-- Isso garante que a view respeita as políticas RLS das tabelas subjacentes
-- (user_plans, plans, profiles) usando as permissões do usuário que faz a consulta

-- Recriar a view com SECURITY INVOKER explícito
DROP VIEW IF EXISTS public.user_plans_detailed;

CREATE VIEW public.user_plans_detailed
WITH (security_invoker = true)
AS
SELECT 
  up.id,
  up.user_id,
  up.plan_id,
  up.status,
  up.created_at,
  up.used_at,
  up.expires_at,
  up.used_for_project_id,
  up.notes,
  p.name AS plan_name,
  p.type AS plan_type,
  p.price,
  p.description,
  pr.name AS user_name,
  pr.email AS user_email
FROM public.user_plans up
JOIN public.plans p ON p.id = up.plan_id
JOIN public.profiles pr ON pr.id = up.user_id;

-- Adicionar comentário explicando a segurança
COMMENT ON VIEW public.user_plans_detailed IS 'View com SECURITY INVOKER - respeita RLS das tabelas user_plans, plans e profiles. Usuários veem apenas seus próprios planos, admins/devs veem todos.';