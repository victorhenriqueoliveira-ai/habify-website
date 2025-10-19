-- Criar view para facilitar consulta de planos disponíveis com informações detalhadas
CREATE OR REPLACE VIEW public.user_plans_detailed AS
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
  p.name as plan_name,
  p.type as plan_type,
  p.price,
  p.description,
  pr.name as user_name,
  pr.email as user_email
FROM public.user_plans up
JOIN public.plans p ON p.id = up.plan_id
JOIN public.profiles pr ON pr.id = up.user_id;

-- Criar função para validar que admin/dev não podem ter planos
CREATE OR REPLACE FUNCTION public.validate_user_plan_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_role user_role;
BEGIN
  SELECT role INTO _user_role 
  FROM public.profiles 
  WHERE id = NEW.user_id;
  
  IF _user_role IN ('admin', 'dev') THEN
    RAISE EXCEPTION 'Admin e dev não podem ter planos associados';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para validar role antes de inserir/atualizar user_plans
DROP TRIGGER IF EXISTS user_plans_role_validation ON public.user_plans;
CREATE TRIGGER user_plans_role_validation
  BEFORE INSERT OR UPDATE OF user_id ON public.user_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_user_plan_role();

-- Criar função para admin/dev atribuir planos manualmente
CREATE OR REPLACE FUNCTION public.admin_assign_plan_to_user(
  _user_id uuid,
  _plan_id uuid,
  _notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_plan_id uuid;
  _admin_role user_role;
  _user_role user_role;
  _plan_type text;
  _expires_at timestamp with time zone;
BEGIN
  -- Verificar se quem está executando é admin ou dev
  SELECT role INTO _admin_role 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  IF _admin_role NOT IN ('admin', 'dev') THEN
    RAISE EXCEPTION 'Apenas admin ou dev podem atribuir planos';
  END IF;
  
  -- Verificar se o usuário alvo não é admin ou dev
  SELECT role INTO _user_role 
  FROM public.profiles 
  WHERE id = _user_id;
  
  IF _user_role IN ('admin', 'dev') THEN
    RAISE EXCEPTION 'Não é possível atribuir planos para admin ou dev';
  END IF;
  
  -- Buscar tipo do plano e calcular expiração
  SELECT type INTO _plan_type FROM public.plans WHERE id = _plan_id;
  
  IF _plan_type = 'website_maintenance_1m' THEN
    _expires_at := now() + interval '1 month';
  ELSIF _plan_type = 'website_maintenance_6m' THEN
    _expires_at := now() + interval '6 months';
  ELSE
    _expires_at := NULL;
  END IF;
  
  -- Inserir plano
  INSERT INTO public.user_plans (user_id, plan_id, status, expires_at, notes)
  VALUES (_user_id, _plan_id, 'active', _expires_at, _notes)
  RETURNING id INTO _new_plan_id;
  
  RETURN _new_plan_id;
END;
$$;