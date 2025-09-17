-- Remover completamente a view para resolver o erro de segurança
DROP VIEW IF EXISTS public.public_plans CASCADE;

-- Como alternativa mais segura, vamos mascarar dados sensíveis no nível da aplicação
-- Verificar se há outras views problemáticas
SELECT viewname FROM pg_views WHERE schemaname = 'public';