-- Remover constraint que limita card_gateway a 'HUBLA'
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_card_gateway_check;

-- Atualizar planos para usar ABACATEPAY como gateway de cartão
UPDATE plans SET card_gateway = 'ABACATEPAY', hubla_checkout_url = NULL WHERE is_active = true;

-- Limpar order de teste
DELETE FROM orders WHERE id = 'a90f94e5-99c8-4875-961e-45e53428b118';
