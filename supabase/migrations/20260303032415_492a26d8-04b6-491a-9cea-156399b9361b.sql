
-- Adicionar domain_registration ao enum plan_type
ALTER TYPE public.plan_type ADD VALUE IF NOT EXISTS 'domain_registration';

-- Adicionar colunas de domínio na tabela projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS desired_domain text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS domain_status text;
