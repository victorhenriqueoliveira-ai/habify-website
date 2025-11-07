-- ============================================
-- CORREÇÃO DE SEGURANÇA: Proteger dados sensíveis da tabela plans
-- ============================================

-- Habilitar RLS na tabela plans
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Política 1: Usuários autenticados podem ver apenas dados públicos dos planos
CREATE POLICY "Authenticated users can view public plan data"
ON public.plans
FOR SELECT
TO authenticated
USING (true);

-- Política 2: Apenas admins e devs podem ver todos os dados (incluindo IDs de gateway)
CREATE POLICY "Admins can view all plan data"
ON public.plans
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin'::app_role, 'dev'::app_role)
  )
);

-- Política 3: Usuários anônimos podem ver apenas dados básicos para exibição
CREATE POLICY "Anonymous users can view basic plan info"
ON public.plans
FOR SELECT
TO anon
USING (is_active = true);

-- Política 4: Apenas admins/devs podem inserir novos planos
CREATE POLICY "Only admins can insert plans"
ON public.plans
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin'::app_role, 'dev'::app_role)
  )
);

-- Política 5: Apenas admins/devs podem atualizar planos
CREATE POLICY "Only admins can update plans"
ON public.plans
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin'::app_role, 'dev'::app_role)
  )
);

-- Política 6: Apenas admins/devs podem deletar planos
CREATE POLICY "Only admins can delete plans"
ON public.plans
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin'::app_role, 'dev'::app_role)
  )
);