-- =====================================================
-- FASE 1: CORREÇÕES EMERGENCIAIS - SISTEMA DE PAGAMENTO
-- =====================================================

-- ========================================
-- AÇÃO 1.1: Migrar profiles existentes
-- ========================================
-- Vincula profiles aos auth.users via email
-- Popula auth_user_id e user_id para perfis existentes

UPDATE public.profiles p
SET 
  auth_user_id = u.id,
  user_id = u.id
FROM auth.users u
WHERE p.email = u.email 
  AND p.auth_user_id IS NULL;

-- ========================================
-- AÇÃO 1.2: Corrigir trigger handle_new_user
-- ========================================
-- Remove trigger antigo quebrado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Cria função correta que popula todos os campos necessários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    auth_user_id,
    name,
    email,
    role,
    credits,
    is_active
  )
  VALUES (
    NEW.id,                                          -- user_id = auth.users.id
    NEW.id,                                          -- auth_user_id = auth.users.id
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), -- name
    NEW.email,                                       -- email
    'user'::user_role,                              -- role padrão
    0,                                               -- credits iniciais = 0
    true                                             -- is_active = true
  );
  RETURN NEW;
END;
$function$;

-- Recria trigger para novos usuários
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ FASE 1 COMPLETA: Profiles migrados e trigger corrigido';
END $$;