-- Criar view pública para exibir planos sem informações sensíveis
CREATE OR REPLACE VIEW public.public_plans AS
SELECT 
  id,
  name,
  CASE 
    WHEN type = 'website_only' THEN 'Plano Básico'
    WHEN type = 'website_maintenance_1m' THEN 'Plano Intermediário' 
    WHEN type = 'website_maintenance_6m' THEN 'Plano Avançado'
    ELSE 'Plano Personalizado'
  END as display_name,
  price,
  is_active,
  -- Remover features detalhadas para não expor estratégia completa
  jsonb_build_array(
    'Website profissional',
    'Design responsivo',
    'Otimização SEO',
    CASE 
      WHEN type LIKE '%maintenance%' THEN 'Suporte técnico'
      ELSE null
    END
  ) - null as features,
  created_at
FROM public.plans 
WHERE is_active = true;

-- Remover política atual que expõe dados sensíveis
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.plans;

-- Criar nova política mais restritiva para tabela principal
CREATE POLICY "Authenticated users can view plans" 
ON public.plans 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Política para admins gerenciarem planos
CREATE POLICY "Admins can manage all plans" 
ON public.plans 
FOR ALL 
USING (is_admin_or_dev())
WITH CHECK (is_admin_or_dev());

-- Política para inserção via sistema (edge functions)
CREATE POLICY "System can insert plans" 
ON public.plans 
FOR INSERT 
WITH CHECK (true);

-- Habilitar RLS na view (por segurança)
ALTER VIEW public.public_plans SET (security_barrier = true);

-- Grant para acesso público à view
GRANT SELECT ON public.public_plans TO anon;
GRANT SELECT ON public.public_plans TO authenticated;