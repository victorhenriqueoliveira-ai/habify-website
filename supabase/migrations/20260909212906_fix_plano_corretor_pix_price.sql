-- Corrige pix_price do "Plano Corretor", que ficou desatualizado (R$ 74,90, de uma
-- promoção de março) depois que o preço oficial foi atualizado para R$ 300,00 em
-- 30/05/2026 (migration 20260529204026). Desde então, clientes pagando via PIX
-- (opção pré-selecionada no checkout) pagaram 75% a menos do que deveriam.
UPDATE public.plans
SET pix_price = 300.00,
    updated_at = now()
WHERE id = '9fb31f78-ed65-44e7-a67d-271a0cad8eb9'
  AND name = 'Plano Corretor';
