INSERT INTO plans (name, type, price, pix_price, description, features, is_active, credits_granted, card_gateway)
VALUES (
  'Registro de Domínio .com.br',
  'domain_registration',
  40.00,
  40.00,
  'Registro de domínio .com.br por 1 ano',
  '["Registro por 1 ano", "Configuração DNS inclusa", "Suporte técnico"]'::jsonb,
  true,
  0,
  'ABACATEPAY'
);