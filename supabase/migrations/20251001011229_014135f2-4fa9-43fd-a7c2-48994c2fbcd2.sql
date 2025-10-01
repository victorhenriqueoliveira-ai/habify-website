-- Fix orders table to accept STRIPE as a valid gateway
-- The check constraint is currently rejecting 'STRIPE' value

-- First, drop the existing constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_gateway_check;

-- Create a new constraint that accepts both ABACATEPAY and STRIPE
ALTER TABLE public.orders ADD CONSTRAINT orders_gateway_check 
  CHECK (gateway IN ('ABACATEPAY', 'STRIPE'));