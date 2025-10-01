-- Add separate price columns for PIX and Stripe
ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS pix_price numeric,
ADD COLUMN IF NOT EXISTS stripe_price numeric;

-- Update existing plans with correct prices
-- Plano 1: Só o Site
UPDATE plans 
SET 
  pix_price = 597,
  stripe_price = 886.80,
  stripe_price_id = 'price_1SDG7oBkpbQLOAieTHjU14Fi',
  updated_at = now()
WHERE type = 'website_only';

-- Plano 2: Site + Manutenção 1 Mês  
UPDATE plans
SET
  pix_price = 897,
  stripe_price = 1006.80,
  stripe_price_id = 'price_1SDGJnBfrGI4DZktPKa9N4eK',
  updated_at = now()
WHERE type = 'website_maintenance_1m';

-- Plano 3: Site + Manutenção 6 Meses
UPDATE plans
SET
  pix_price = 1597,
  stripe_price = 1800,
  stripe_price_id = 'price_1SDGK4BfrGI4DZktnJ3yd33p',
  updated_at = now()
WHERE type = 'website_maintenance_6m';

-- Update the generic price column to use pix_price as default
UPDATE plans SET price = pix_price WHERE pix_price IS NOT NULL;