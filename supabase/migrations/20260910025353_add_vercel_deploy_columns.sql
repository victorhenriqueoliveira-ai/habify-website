-- Rastreia o Project da Vercel criado pelo ai-site-builder pra cada projeto,
-- pra podermos re-consultar/re-deployar sem depender só do nome do repo.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS vercel_project_id text,
  ADD COLUMN IF NOT EXISTS vercel_deployment_url text;
