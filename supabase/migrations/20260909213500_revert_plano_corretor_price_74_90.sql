-- Reverte o preço do "Plano Corretor" para R$ 74,90 (decisão de negócio, a
-- pedido do Victor). O domínio (.com.br) continua fora deste plano — é
-- registrado e pago separadamente pelo cliente no registro.br (~R$ 40/ano),
-- via o plano "Registro de Domínio .com.br" já existente na tabela.
UPDATE public.plans
SET price = 74.90,
    pix_price = 74.90,
    updated_at = now()
WHERE id = '9fb31f78-ed65-44e7-a67d-271a0cad8eb9'
  AND name = 'Plano Corretor';
