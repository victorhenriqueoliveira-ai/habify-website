-- Plantas do imóvel/empreendimento, separadas das fotos gerais — cada
-- planta guarda o próprio nome (ex: "Planta 2 quartos") junto da URL.
alter table public.portfolio_properties
  add column if not exists floor_plans jsonb not null default '[]'::jsonb;

comment on column public.portfolio_properties.floor_plans is
  'Array de {name, imageUrl} — plantas do imóvel, exibidas em seção separada das fotos no site gerado.';
