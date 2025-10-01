-- Add stripe_price_id column to plans table
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_plans_stripe_price_id ON public.plans(stripe_price_id);