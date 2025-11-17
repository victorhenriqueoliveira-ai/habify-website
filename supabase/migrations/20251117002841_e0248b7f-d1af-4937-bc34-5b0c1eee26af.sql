-- ⚠️ LIMPEZA DE GATEWAYS NÃO UTILIZADOS
-- Remove colunas relacionadas ao Stripe da tabela plans

-- 1. Remover colunas stripe da tabela plans
ALTER TABLE public.plans 
  DROP COLUMN IF EXISTS stripe_price,
  DROP COLUMN IF EXISTS stripe_price_id;

-- 2. Atualizar orders existentes com gateway inválido para 'UNKNOWN'
UPDATE public.orders 
SET gateway = 'UNKNOWN'
WHERE gateway IN ('STRIPE', 'MERCADOPAGO', 'KIWIFY');

-- 3. Comentário: Não removemos payment_logs antigos para manter histórico de auditoria