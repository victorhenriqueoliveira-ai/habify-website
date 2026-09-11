-- Suporte a pagamento com cartão de crédito via Asaas, mantendo o PIX na
-- AbacatePay. asaas_id guarda o id da cobrança (payment) criada na Asaas —
-- mesmo papel que abacatepay_id já cumpre pra PIX.
alter table public.orders
  add column if not exists asaas_id text unique;

create index if not exists idx_orders_asaas_id
  on public.orders(asaas_id)
  where asaas_id is not null;
