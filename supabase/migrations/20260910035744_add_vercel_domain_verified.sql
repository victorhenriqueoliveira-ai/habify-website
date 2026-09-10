-- Rastreia se o domínio do cliente já está apontado corretamente pra Vercel
-- (DNS verificado), independente do fluxo de compra de domínio via registro.br
-- (esse já existe em domain_status/desired_domain e significa outra coisa:
-- se o domínio foi pago e registrado pela HabiFy, não se o DNS aponta certo).
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS vercel_domain_verified boolean NOT NULL DEFAULT false;
