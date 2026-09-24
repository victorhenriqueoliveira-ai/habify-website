-- Campos de marketing usados pelo site gerado (habify-site-template) pra
-- aproximar o resultado de uma landing page de lançamento: selo do imóvel,
-- diferenciais em destaque (com ícone) e pontos de interesse próximos.
alter table public.portfolio_properties
  add column if not exists badge text,
  add column if not exists differentials jsonb not null default '[]'::jsonb,
  add column if not exists nearby_places jsonb not null default '[]'::jsonb;

comment on column public.portfolio_properties.badge is
  'Selo curto sobre o imóvel (ex: "Lançamento", "Últimas unidades"), exibido em destaque no site gerado.';
comment on column public.portfolio_properties.differentials is
  'Array de {title, description} — diferenciais em destaque do imóvel (specs vendáveis), exibidos com ícone inferido no site.';
comment on column public.portfolio_properties.nearby_places is
  'Array de {name, time} — pontos de interesse próximos com tempo estimado até lá.';
