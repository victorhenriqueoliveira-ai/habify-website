# SKILL.md — Contexto do Projeto HabiFy

> Arquivo de contexto persistente para agentes de IA (Antigravity, Lovable, etc.).
> **Leia este arquivo antes de qualquer alteração.**

---

## 1. Identidade do Projeto

- **Stack**: React 18 + Vite 5 + TypeScript 5 + Tailwind CSS v3
- **Backend**: Supabase (Postgres + Auth + Edge Functions Deno + Storage)
- **Porta dev**: `http://localhost:8080` (definida em `vite.config.ts`)
- **Comando dev**: `npm run dev`
- **Deploy**: Lovable (preview) + Vercel (produção)
- **Domínio**: `habify.com.br`

## 2. TypeScript

- `strict: true` sempre. **Nunca `any`** — use `unknown` + narrowing, ou crie tipos.
- Tipos compartilhados ficam em `src/types/`.
- Alias `@/` aponta para `src/` (use sempre, evite `../../..`).
- **NÃO editar** `src/integrations/supabase/types.ts` — é gerado automaticamente.

## 3. Tailwind & Design System

- **NUNCA** use cores diretas (`text-white`, `bg-orange-500`, `text-[#FE5C02]`).
- **SEMPRE** use tokens semânticos definidos em `src/index.css` + `tailwind.config.ts`.
- Cores em **HSL** no `index.css` (ex: `--primary: 18 99% 50%`).
- Marca: laranja `#FE5C02` / `#F97316`. Fontes: Brockmann (display), Inter (body), Playfair Display (serifa de destaque).
- UI Premium dark: contraste alto, microinterações com framer-motion.

## 4. Permissões / Roles

- **NUNCA** ler role de `profiles.role`.
- **SEMPRE** via tabela `user_roles` + funções `has_role(uid, role)` ou `is_admin_or_dev_v2(uid)`.
- Roles existentes: `dev`, `admin`, `corretor`, `user`.

## 5. Supabase

- Cliente: `import { supabase } from "@/integrations/supabase/client"`.
- RLS obrigatório em toda tabela com dados de usuário.
- Edge Functions: deploy automático. Sempre incluir CORS headers.
- IA **sempre** via Lovable AI Gateway (`LOVABLE_API_KEY`) dentro de edge function — nunca no frontend.
- Tratar `429` (rate limit, backoff) e `402` (créditos esgotados) com mensagem clara.
- Resend fixado em `^3.5.0`. E-mails sempre de `contato@habify.com.br`.

## 6. Feature Flags (BETA RESTRITA)

- Toda feature experimental fica atrás de `feature_flags_users` + função `has_feature_flag(uid, flag)`.
- Frontend: hook `useFeatureFlag('flag_name')`.
- Edge Function: re-validar via `has_feature_flag()` antes de executar.
- Defesa em profundidade: UI escondida + hook bloqueia + edge rejeita.

## 7. Pagamentos

- **AbacatePay** é o único gateway ativo. Hubla está deprecated (não usar).
- Cron `process-pending-paid-orders` é failsafe — não remover.

## 8. SEO & Performance

- Meta: 100% Lighthouse. Imagens em WebP/AVIF, lazy loading fora do above-the-fold.
- Title `<60` chars, description `<160` chars, 1 H1 por página, JSON-LD quando aplicável.

## 9. Regra 4.1 — Autonomia do Agente

1. Antes de criar/alterar múltiplos arquivos, gere um **Implementation Plan** listando exatamente o que será criado/modificado.
2. Aguarde aprovação antes de executar.
3. Após codar feature visual, abra `http://localhost:8080`, valide renderização e cheque o console do navegador (zero erros).

## 10. Mapa rápido de pastas

```
src/
  components/        # UI components (admin/, wizard/, ui/, etc.)
  hooks/             # Hooks customizados
  pages/             # Rotas (admin/ para área logada)
  integrations/supabase/  # Cliente + types (NÃO editar types.ts)
  types/             # Tipos TS compartilhados
  index.css          # Design tokens HSL
supabase/
  functions/         # Edge Functions (Deno)
  config.toml        # Config das edge functions (verify_jwt, etc.)
```

## 11. Feature ativa em desenvolvimento

**HabiFy AI Site Builder** (flag: `ai_site_builder`)
- Após criação do projeto, edge function `ai-site-builder` (a ser implementada) gera site React/Vite via IA + cria repo GitHub privado.
- Plano completo em `.lovable/plan.md`.
- Status: base (DB + flag + hooks + UI gate) implementada no Lovable; edge function `ai-site-builder` será implementada via Antigravity.
