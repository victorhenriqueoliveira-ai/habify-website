-- Drop the existing check constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_gateway_check;

-- Add the new check constraint with MERCADOPAGO included
ALTER TABLE public.orders 
ADD CONSTRAINT orders_gateway_check 
CHECK (gateway = ANY (ARRAY['ABACATEPAY'::text, 'STRIPE'::text, 'MERCADOPAGO'::text]));