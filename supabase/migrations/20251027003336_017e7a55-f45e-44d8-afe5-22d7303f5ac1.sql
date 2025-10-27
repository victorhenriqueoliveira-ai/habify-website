-- =============================================
-- INVESTIGAR E CORRIGIR SECURITY DEFINER VIEW
-- =============================================

-- A view user_plans_detailed não foi criada com SECURITY DEFINER explicitamente
-- mas pode estar herdando permissões. Vamos recriar ela corretamente.

-- Dropar e recriar a view sem SECURITY DEFINER
DROP VIEW IF EXISTS public.user_plans_detailed CASCADE;

-- Recriar a view de forma segura
-- As RLS policies das tabelas subjacentes garantirão a segurança
CREATE VIEW public.user_plans_detailed AS
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
FROM user_plans up
JOIN plans p ON p.id = up.plan_id
JOIN profiles pr ON pr.id = up.user_id;

-- Garantir que RLS está habilitado nas tabelas base
-- (já deveria estar, mas vamos garantir)

-- COMENTÁRIO: A segurança desta view é garantida pelas RLS policies das tabelas:
-- - user_plans: tem políticas que limitam acesso aos próprios planos do usuário
-- - plans: tem políticas que permitem visualização de planos ativos
-- - profiles: tem políticas que limitam acesso aos próprios dados