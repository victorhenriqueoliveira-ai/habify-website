-- Update plans with Stripe price IDs
UPDATE public.plans SET stripe_price_id = 'price_1SDE7oBkpbQLOAiewin4wSxa' WHERE name = 'Só o Site';
UPDATE public.plans SET stripe_price_id = 'price_1SDE82BkpbQLOAieck0hrqYW' WHERE name = 'Site + Manutenção 1 Mês';
UPDATE public.plans SET stripe_price_id = 'price_1SDE8HBkpbQLOAiejBGvS477' WHERE name = 'Site + Manutenção 6 Meses';