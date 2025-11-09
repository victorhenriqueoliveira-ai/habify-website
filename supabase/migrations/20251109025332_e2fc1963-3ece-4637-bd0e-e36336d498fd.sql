-- Atualizar políticas RLS para garantir que admin e dev tenham os mesmos acessos

-- Tabela profiles: Permitir admin e dev gerenciarem perfis
DROP POLICY IF EXISTS "Admins can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Admins and devs can create profiles" ON public.profiles
FOR INSERT 
WITH CHECK (is_admin_or_dev_v2(auth.uid()));

CREATE POLICY "Admins and devs can delete profiles" ON public.profiles
FOR DELETE 
USING (is_admin_or_dev_v2(auth.uid()));

CREATE POLICY "Admins and devs can update any profile" ON public.profiles
FOR UPDATE 
USING (is_admin_or_dev_v2(auth.uid()));

-- Tabela user_roles: Permitir admin e dev gerenciarem roles
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;

CREATE POLICY "Admins and devs can manage user roles" ON public.user_roles
FOR ALL 
USING (is_admin_or_dev_v2(auth.uid()))
WITH CHECK (is_admin_or_dev_v2(auth.uid()));

-- Tabela projects: Permitir admin e dev deletarem projetos
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;

CREATE POLICY "Admins and devs can delete projects" ON public.projects
FOR DELETE 
USING (is_admin_or_dev_v2(auth.uid()));