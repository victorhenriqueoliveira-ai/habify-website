-- Update the Stripe price ID for "Só o Site" plan with the correct one
UPDATE plans 
SET stripe_price_id = 'price_1SDGPJBfrGI4DZktOoBosEQn',
    updated_at = now()
WHERE type = 'website_only';