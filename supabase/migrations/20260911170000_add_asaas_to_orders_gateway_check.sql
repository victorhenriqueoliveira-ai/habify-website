-- orders_gateway_check ainda não incluía ASAAS (só foi pensado pra
-- ABACATEPAY/MERCADOPAGO/STRIPE/KIWIFY/HUBLA) — bloqueava qualquer insert
-- de pedido de cartão via Asaas com "violates check constraint".
alter table public.orders drop constraint if exists orders_gateway_check;
alter table public.orders add constraint orders_gateway_check
  check (gateway in ('ABACATEPAY', 'ASAAS', 'MERCADOPAGO', 'STRIPE', 'KIWIFY', 'HUBLA'));
