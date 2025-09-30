-- Add gateway field to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS gateway text DEFAULT 'ABACATEPAY' CHECK (gateway IN ('ABACATEPAY', 'MERCADOPAGO'));