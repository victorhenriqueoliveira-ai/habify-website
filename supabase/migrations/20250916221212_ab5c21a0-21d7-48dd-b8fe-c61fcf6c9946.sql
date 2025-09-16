-- Verificar e ajustar as políticas RLS para projetos
-- Dropar as políticas existentes de UPDATE para recriar

DROP POLICY IF EXISTS "Admins can update any project" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;

-- Recriar políticas mais robustas para UPDATE
CREATE POLICY "Admins can update any project" 
ON public.projects 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'dev')
  )
);

CREATE POLICY "Users can update their own projects" 
ON public.projects 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Garantir que devs também podem ver todos os projetos
DROP POLICY IF EXISTS "Admins and devs can view all projects" ON public.projects;

CREATE POLICY "Admins and devs can view all projects" 
ON public.projects 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'dev')
  )
);

-- Política para usuários verem seus próprios projetos (manter)
-- Já existe: "Users can view their own projects"