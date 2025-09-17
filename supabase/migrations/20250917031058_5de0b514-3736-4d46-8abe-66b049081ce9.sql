-- Corrigir problemas de segurança da view
DROP VIEW IF EXISTS public.public_plans;

-- Recriar view sem SECURITY DEFINER (mais seguro)
CREATE VIEW public.public_plans AS
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
  -- Features genéricas sem expor estratégia
  jsonb_build_array(
    'Website profissional',
    'Design responsivo', 
    'Otimização SEO'
  ) as features,
  created_at
FROM public.plans 
WHERE is_active = true;

-- Grant para acesso público à view (sem SECURITY DEFINER)
GRANT SELECT ON public.public_plans TO anon;
GRANT SELECT ON public.public_plans TO authenticated;