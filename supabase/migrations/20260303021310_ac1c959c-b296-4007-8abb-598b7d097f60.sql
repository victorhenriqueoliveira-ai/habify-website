
-- Remover constraint de unicidade no tipo do plano (permite múltiplos planos do mesmo tipo)
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_type_key;

-- Atualizar o plano website_only existente para os novos valores
UPDATE plans 
SET name = 'Site Profissional',
    price = 74.90,
    pix_price = 74.90,
    description = 'Seu site imobiliário profissional',
    features = '["Site personalizado", "Design responsivo", "Otimização SEO", "Google Analytics", "Domínio próprio"]',
    credits_granted = 1,
    card_gateway = 'ABACATEPAY',
    is_active = true,
    updated_at = now()
WHERE id = '9fb31f78-ed65-44e7-a67d-271a0cad8eb9';

-- Desativar os outros planos
UPDATE plans SET is_active = false, updated_at = now() WHERE id IN (
  'fd32cbd6-84d1-4f0e-9ece-5fccb911eeb8',
  '377030c9-efe1-461d-9bca-9fc6717d99ed'
);

-- Atualizar default da tabela maintenances para novo valor
ALTER TABLE maintenances ALTER COLUMN amount SET DEFAULT 54.90;
