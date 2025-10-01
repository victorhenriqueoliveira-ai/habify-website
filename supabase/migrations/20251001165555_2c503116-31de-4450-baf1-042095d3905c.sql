-- Atualizar tabela plans com valores corretos e adicionar suporte para Hubla

-- Atualizar os valores dos planos existentes
UPDATE plans
SET 
  pix_price = 597.00,
  stripe_price = 972.06
WHERE type = 'website_only';

UPDATE plans
SET 
  pix_price = 897.00,
  stripe_price = 1341.44
WHERE type = 'website_maintenance_1m';

UPDATE plans
SET 
  pix_price = 1597.00,
  stripe_price = 1955.84
WHERE type = 'website_maintenance_6m';

-- Adicionar coluna para armazenar o link de checkout da Hubla
ALTER TABLE plans
ADD COLUMN IF NOT EXISTS hubla_checkout_url text;

-- Adicionar coluna para indicar o gateway preferencial para cartão
ALTER TABLE plans
ADD COLUMN IF NOT EXISTS card_gateway text DEFAULT 'HUBLA' CHECK (card_gateway IN ('HUBLA', 'STRIPE', 'MERCADOPAGO'));

-- Atualizar orders para suportar múltiplos gateways
ALTER TABLE orders
ALTER COLUMN gateway TYPE text;

UPDATE orders
SET gateway = 'ABACATEPAY'
WHERE gateway IS NULL OR gateway = '';

-- Adicionar coluna para armazenar ID da transação da Hubla
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS hubla_transaction_id text;

-- Criar índice para buscar transações da Hubla
CREATE INDEX IF NOT EXISTS idx_orders_hubla_transaction_id ON orders(hubla_transaction_id);

-- Comentários para documentação
COMMENT ON COLUMN plans.hubla_checkout_url IS 'URL do checkout da oferta criada na plataforma Hubla para pagamento com cartão';
COMMENT ON COLUMN plans.card_gateway IS 'Gateway de pagamento preferencial para cartão de crédito (HUBLA, STRIPE, MERCADOPAGO)';
COMMENT ON COLUMN orders.hubla_transaction_id IS 'ID da transação no sistema Hubla';