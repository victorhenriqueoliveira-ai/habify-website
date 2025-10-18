-- Remover constraint antiga que não inclui HUBLA
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_gateway_check;

-- Adicionar constraint nova incluindo HUBLA
ALTER TABLE public.orders ADD CONSTRAINT orders_gateway_check 
CHECK (gateway IN ('ABACATEPAY', 'MERCADOPAGO', 'STRIPE', 'KIWIFY', 'HUBLA'));

-- Garantir que card_gateway na tabela plans também aceita HUBLA
ALTER TABLE public.plans DROP CONSTRAINT IF EXISTS plans_card_gateway_check;
ALTER TABLE public.plans ADD CONSTRAINT plans_card_gateway_check 
CHECK (card_gateway IN ('STRIPE', 'MERCADOPAGO', 'HUBLA'));