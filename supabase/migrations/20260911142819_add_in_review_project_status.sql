-- Novo status intermediário: quando o ai-site-builder termina a geração
-- automática (repositório no GitHub + deploy na Vercel confirmados), o
-- projeto não pula direto para "completed" — vai para "in_review" pra um
-- humano conferir o resultado antes de considerar realmente concluído.
alter type public.project_status add value if not exists 'in_review' after 'in_progress';
