-- Update plan prices with differentiated values for PIX and Card
-- Plano 1 - Só o Site
UPDATE public.plans 
SET 
  price = 597,
  pix_price = 597,
  stripe_price = 796.05,
  updated_at = now()
WHERE type = 'website_only';

-- Plano 2 - Site + Manutenção 1 Mês  
UPDATE public.plans
SET 
  price = 897,
  pix_price = 897,
  stripe_price = 1098.55,
  updated_at = now()
WHERE type = 'website_maintenance_1m';

-- Plano 3 - Site + Manutenção 6 Meses
UPDATE public.plans
SET 
  price = 1597,
  pix_price = 1597,
  stripe_price = 1955.84,
  updated_at = now()
WHERE type = 'website_maintenance_6m';