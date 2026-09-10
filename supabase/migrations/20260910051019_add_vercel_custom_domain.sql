-- Coluna separada pro domínio conectado via Vercel (DomainConnect /
-- manage-project-domain). NÃO reaproveita `desired_domain`: essa coluna já
-- tem uma convenção própria e antiga (guarda só o slug, sem ".com.br" — a
-- UI de compra de domínio via registro.br sempre concatena ".com.br" na
-- hora de exibir). Guardar o domínio completo ali quebrava essa tela
-- (ex: "meusite.com.br" virava "meusite.com.br.com.br" exibido).
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS vercel_custom_domain text;
