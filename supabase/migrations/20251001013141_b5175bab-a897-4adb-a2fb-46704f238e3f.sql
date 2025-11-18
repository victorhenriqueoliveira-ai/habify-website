-- Inserir/atualizar os 3 planos com preços corretos e stripe_price_id

-- Desativar planos antigos
UPDATE public.plans SET is_active = false WHERE type IN ('website_only', 'website_maintenance_1m', 'website_maintenance_6m');

-- Inserir os novos planos
INSERT INTO public.plans (name, type, price, description, features, is_active, stripe_price_id)
VALUES 
(
  'Só o Site',
  'website_only',
  597.00,
  'Landing page profissional personalizada',
  '["Design responsivo", "Otimização SEO básica", "Integração com Google Analytics"]'::jsonb,
  true,
  'price_1SDEreBkpbQLOAieahJ1Xlv2'
),
(
  'Site + Manutenção 1 Mês',
  'website_maintenance_1m',
  897.00,
  'Site + 1 mês de manutenção inclusa',
  '["Tudo do Plano 1", "1 mês de suporte técnico", "Atualizações de conteúdo", "Backup semanal"]'::jsonb,
  true,
  'price_1SDErxBkpbQLOAieUOn5OhKk'
),
(
  'Site + Manutenção 6 Meses',
  'website_maintenance_6m',
  1597.00,
  'Site + 6 meses de manutenção inclusa',
  '["Tudo do Plano 2", "6 meses de suporte técnico", "Atualizações ilimitadas", "Backup diário", "Relatórios mensais"]'::jsonb,
  true,
  'price_1SDEsDBkpbQLOAie7m9h9p92'
)
ON CONFLICT (type) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  stripe_price_id = EXCLUDED.stripe_price_id,
  updated_at = now();