-- Update plan prices with new card values
-- Plano 1 - Só o Site
UPDATE public.plans 
SET 
  stripe_price = 972.06,
  updated_at = now()
WHERE type = 'website_only';

-- Plano 2 - Site + Manutenção 1 Mês  
UPDATE public.plans
SET 
  stripe_price = 1341.44,
  updated_at = now()
WHERE type = 'website_maintenance_1m';

-- Plano 3 - Site + Manutenção 6 Meses
UPDATE public.plans
SET 
  stripe_price = 1955.84,
  updated_at = now()
WHERE type = 'website_maintenance_6m';