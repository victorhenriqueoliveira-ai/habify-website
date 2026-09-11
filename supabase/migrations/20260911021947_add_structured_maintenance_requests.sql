-- Manutenções passam a poder ser estruturadas (campo + valor novo) em vez
-- de só texto livre, pra dar pra aplicar via API (commit automático no
-- site.config.json do repositório do cliente) sem um dev editar na mão.

alter table public.maintenance_requests
  add column if not exists change_type text not null default 'other',
  add column if not exists changes jsonb,
  add column if not exists applied_automatically boolean not null default false;

alter table public.maintenance_requests
  add constraint maintenance_requests_change_type_check
  check (change_type in ('property_field', 'property_photos', 'contact_info', 'other'));

comment on column public.maintenance_requests.change_type is
  'Tipo de alteração pedida: property_field/property_photos/contact_info são aplicáveis automaticamente via API; other cai na fila manual.';
comment on column public.maintenance_requests.changes is
  'Payload estruturado da alteração (formato depende de change_type) — usado pela edge function apply-maintenance-request pra montar o novo site.config.json.';
comment on column public.maintenance_requests.applied_automatically is
  'true quando a alteração foi commitada no repositório do cliente via API, sem intervenção manual.';
