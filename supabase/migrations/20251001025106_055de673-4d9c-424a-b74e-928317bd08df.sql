-- Update the stripe_price_id for the "Só o Site" plan
UPDATE plans 
SET stripe_price_id = 'price_1SDG7oBkpbQLOAieTHjU14Fi',
    updated_at = now()
WHERE name = 'Só o Site';