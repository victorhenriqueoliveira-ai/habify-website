-- =====================================================
-- FASE 3: SEGURANÇA & PRODUÇÃO
-- Ação 3.1: Migrar Roles para Tabela Separada
-- =====================================================

-- ========================================
-- 1. Criar enum para roles
-- ========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'dev', 'user', 'corretor');

-- ========================================
-- 2. Criar tabela user_roles
-- ========================================
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 3. Criar função has_role com SECURITY DEFINER
-- ========================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função auxiliar para verificar se é admin OU dev
CREATE OR REPLACE FUNCTION public.is_admin_or_dev_v2(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin'::app_role, 'dev'::app_role)
  )
$$;

-- ========================================
-- 4. Migrar dados existentes
-- ========================================
-- Inserir roles dos profiles existentes na nova tabela
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT 
  user_id,
  role::text::app_role,
  created_at
FROM public.profiles
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- ========================================
-- 5. Atualizar RLS Policies para usar nova função
-- ========================================

-- AUDIT_LOGS
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT
  USING (public.is_admin_or_dev_v2(auth.uid()));

-- CREDIT_LOGS
DROP POLICY IF EXISTS "Admins can view all credit logs" ON public.credit_logs;
CREATE POLICY "Admins can view all credit logs" ON public.credit_logs
  FOR SELECT
  USING (public.is_admin_or_dev_v2(auth.uid()));

-- CREDITS_HISTORY
DROP POLICY IF EXISTS "Admins can manage credits history" ON public.credits_history;
DROP POLICY IF EXISTS "Users can view their own credits history" ON public.credits_history;

CREATE POLICY "Admins can manage credits history" ON public.credits_history
  FOR ALL
  USING (public.is_admin_or_dev_v2(auth.uid()));

CREATE POLICY "Users can view their own credits history" ON public.credits_history
  FOR SELECT
  USING (
    (auth.uid() IN (
      SELECT profiles.user_id
      FROM profiles
      WHERE profiles.id = credits_history.user_id
    )) 
    OR public.is_admin_or_dev_v2(auth.uid())
  );

-- ORDERS
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT
  USING (public.is_admin_or_dev_v2(auth.uid()));

-- PAYMENT_LOGS
DROP POLICY IF EXISTS "Admins can view all payment logs" ON public.payment_logs;
CREATE POLICY "Admins can view all payment logs" ON public.payment_logs
  FOR SELECT
  USING (public.is_admin_or_dev_v2(auth.uid()));

-- PLANS
DROP POLICY IF EXISTS "Admins can manage all plans" ON public.plans;
DROP POLICY IF EXISTS "Admins can manage plans" ON public.plans;

CREATE POLICY "Admins can manage plans" ON public.plans
  FOR ALL
  USING (public.is_admin_or_dev_v2(auth.uid()))
  WITH CHECK (public.is_admin_or_dev_v2(auth.uid()));

-- PORTFOLIO_PROPERTIES
DROP POLICY IF EXISTS "Users can create properties for their projects" ON public.portfolio_properties;
DROP POLICY IF EXISTS "Users can delete properties from their projects" ON public.portfolio_properties;
DROP POLICY IF EXISTS "Users can update properties from their projects" ON public.portfolio_properties;
DROP POLICY IF EXISTS "Users can view properties from their projects" ON public.portfolio_properties;

CREATE POLICY "Users can view properties from their projects" ON public.portfolio_properties
  FOR SELECT
  USING (
    (EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = portfolio_properties.project_id
        AND projects.user_id = auth.uid()
    ))
    OR public.is_admin_or_dev_v2(auth.uid())
  );

CREATE POLICY "Users can create properties for their projects" ON public.portfolio_properties
  FOR INSERT
  WITH CHECK (
    (EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = portfolio_properties.project_id
        AND projects.user_id = auth.uid()
    ))
    OR public.is_admin_or_dev_v2(auth.uid())
  );

CREATE POLICY "Users can update properties from their projects" ON public.portfolio_properties
  FOR UPDATE
  USING (
    (EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = portfolio_properties.project_id
        AND projects.user_id = auth.uid()
    ))
    OR public.is_admin_or_dev_v2(auth.uid())
  );

CREATE POLICY "Users can delete properties from their projects" ON public.portfolio_properties
  FOR DELETE
  USING (
    (EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = portfolio_properties.project_id
        AND projects.user_id = auth.uid()
    ))
    OR public.is_admin_or_dev_v2(auth.uid())
  );

-- PROFILES
DROP POLICY IF EXISTS "Admins and devs can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Admins and devs can view all profiles" ON public.profiles
  FOR SELECT
  USING (public.is_admin_or_dev_v2(auth.uid()));

CREATE POLICY "Admins can create profiles" ON public.profiles
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- PROJECT_MESSAGES
DROP POLICY IF EXISTS "Users can send messages to their projects" ON public.project_messages;
DROP POLICY IF EXISTS "Users can view messages from their projects" ON public.project_messages;
DROP POLICY IF EXISTS "Users can mark their messages as read" ON public.project_messages;

CREATE POLICY "Users can view messages from their projects" ON public.project_messages
  FOR SELECT
  USING (
    (EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_messages.project_id
        AND projects.user_id = auth.uid()
    ))
    OR public.is_admin_or_dev_v2(auth.uid())
  );

CREATE POLICY "Users can send messages to their projects" ON public.project_messages
  FOR INSERT
  WITH CHECK (
    (EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_messages.project_id
        AND projects.user_id = auth.uid()
    ))
    OR public.is_admin_or_dev_v2(auth.uid())
  );

CREATE POLICY "Users can mark their messages as read" ON public.project_messages
  FOR UPDATE
  USING (
    (EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_messages.project_id
        AND projects.user_id = auth.uid()
    ))
    OR public.is_admin_or_dev_v2(auth.uid())
  );

-- PROJECTS
DROP POLICY IF EXISTS "Admins and devs can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can update any project" ON public.projects;

CREATE POLICY "Admins and devs can view all projects" ON public.projects
  FOR SELECT
  USING (public.is_admin_or_dev_v2(auth.uid()));

CREATE POLICY "Admins can delete projects" ON public.projects
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any project" ON public.projects
  FOR UPDATE
  USING (public.is_admin_or_dev_v2(auth.uid()));

-- SYSTEM_SETTINGS
DROP POLICY IF EXISTS "Devs can create settings" ON public.system_settings;
DROP POLICY IF EXISTS "Devs can update settings" ON public.system_settings;
DROP POLICY IF EXISTS "Devs can view all settings" ON public.system_settings;

CREATE POLICY "Devs can view all settings" ON public.system_settings
  FOR SELECT
  USING (public.has_role(auth.uid(), 'dev'::app_role));

CREATE POLICY "Devs can create settings" ON public.system_settings
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'dev'::app_role));

CREATE POLICY "Devs can update settings" ON public.system_settings
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'dev'::app_role));

-- TRANSACTIONS
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT
  USING (public.is_admin_or_dev_v2(auth.uid()));

-- USER_PLANS
DROP POLICY IF EXISTS "Admins can view all user plans" ON public.user_plans;
DROP POLICY IF EXISTS "Admins can delete user plans" ON public.user_plans;
DROP POLICY IF EXISTS "Users can view their own plans" ON public.user_plans;

CREATE POLICY "Admins can view all user plans" ON public.user_plans
  FOR SELECT
  USING (public.is_admin_or_dev_v2(auth.uid()));

CREATE POLICY "Admins can delete user plans" ON public.user_plans
  FOR DELETE
  USING (public.is_admin_or_dev_v2(auth.uid()));

CREATE POLICY "Users can view their own plans" ON public.user_plans
  FOR SELECT
  USING (
    (auth.uid() IN (
      SELECT profiles.user_id
      FROM profiles
      WHERE profiles.id = user_plans.user_id
    ))
    OR public.is_admin_or_dev_v2(auth.uid())
  );

-- RLS para user_roles
CREATE POLICY "Admins can manage user roles" ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- ========================================
-- 6. Atualizar funções existentes para compatibilidade
-- ========================================

-- Atualizar get_current_user_role para usar user_roles
DROP FUNCTION IF EXISTS public.get_current_user_role();
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = auth.uid()
  ORDER BY 
    CASE role
      WHEN 'dev'::app_role THEN 1
      WHEN 'admin'::app_role THEN 2
      WHEN 'corretor'::app_role THEN 3
      WHEN 'user'::app_role THEN 4
    END
  LIMIT 1
$$;

-- Atualizar is_admin_or_dev para usar user_roles
DROP FUNCTION IF EXISTS public.is_admin_or_dev();
CREATE OR REPLACE FUNCTION public.is_admin_or_dev()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin_or_dev_v2(auth.uid())
$$;

-- ========================================
-- 7. Atualizar trigger para adicionar role na user_roles
-- ========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Criar profile
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
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    'user'::user_role,
    0,
    true
  );
  
  -- Adicionar role na tabela user_roles
  INSERT INTO public.user_roles (user_id, role, created_by)
  VALUES (NEW.id, 'user'::app_role, NEW.id);
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ AÇÃO 3.1 COMPLETA: Roles migrados para tabela separada com segurança';
END $$;