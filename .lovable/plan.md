
## HabiFy AI Site Builder — Geração Automática de Site + Repositório GitHub via IA

> **Modo de lançamento controlado**: toda a feature ficará atrás de um **feature flag por usuário**. Em produção, apenas você (e usuários explicitamente liberados via tabela `feature_flags_users`) poderão disparar a geração. O fluxo atual de criação de projeto continua **100% intocado** para os demais usuários.

---

### Visão geral do fluxo (apenas para usuários liberados)

```text
Corretor liberado finaliza wizard
        ↓
createProject() salva projeto (status: 'pending')
        ↓
[GATE] Verifica se usuário tem flag 'ai_site_builder' ativa
        ↓ (se SIM)
Edge Function `ai-site-builder` (background, fire-and-forget)
        ↓
[A] IA gera ESTRUTURA (JSON via tool calling)
[B] IA gera CONTEÚDO (textos + SEO de imóveis)
[C] Renderiza arquivos React/Vite a partir do template
[D] Cria repositório GitHub privado + commit inicial (Git Data API)
[E] Atualiza projects: github_repo_url, ai_generation_status='done'
        ↓
Notifica corretor (in-app + email)
```

Para usuários **sem** o flag, nada muda: o projeto é criado exatamente como hoje.

---

### 1. Feature flag — isolamento total

**Nova tabela `feature_flags_users`**:
- `id uuid pk`
- `user_id uuid` (referencia profiles)
- `flag_name text` (ex: `'ai_site_builder'`)
- `enabled boolean default true`
- `created_at`, `created_by`
- Unique (`user_id`, `flag_name`)
- RLS: só admin/dev podem inserir/atualizar/deletar; usuários podem ver as próprias flags

**Função SQL `has_feature_flag(_user_id uuid, _flag text) returns boolean`** — `SECURITY DEFINER`, usada tanto no frontend quanto na edge function.

**Hook `src/hooks/useFeatureFlag.ts`** — `useFeatureFlag('ai_site_builder')` retorna `{ enabled, loading }`.

**Seed inicial**: na própria migração, inserir flag `ai_site_builder` para o seu user_id (você confirma o ID na fase de implementação, ou eu busco pelo seu email).

**Bloqueio em camadas** (defesa em profundidade):
1. **Frontend**: hook `useFeatureFlag` esconde toda a UI nova
2. **Hook `useProjects.ts`**: só invoca `ai-site-builder` se flag ativa
3. **Edge function**: re-valida via `has_feature_flag()` no início — rejeita com 403 se usuário não tiver

---

### 2. SKILL.md (raiz do projeto)

Arquivo de contexto persistente para o Antigravity contendo:
- Stack: React 18 + Vite 5 + TS 5 + Tailwind v3 + Supabase
- Porta dev: `http://localhost:8080` (vite.config.ts)
- TS estrito: nunca `any`; tipos em `src/types/`; alias `@/`
- Tailwind: SEMPRE tokens semânticos do `index.css`/`tailwind.config.ts`; nunca `text-white`/`bg-orange-500` direto
- Roles: SEMPRE via `user_roles` + `has_role()`/`is_admin_or_dev_v2()`; NUNCA `profiles.role`
- Edge Functions: CORS obrigatório, IA via Lovable AI Gateway (`LOVABLE_API_KEY`), tratar 429/402
- **Feature flags: SEMPRE checar `has_feature_flag()` antes de expor features experimentais**
- Regra 4.1: gerar Implementation Plan antes de codar; validar no browser via localhost

---

### 3. Migração de banco

**Adicionar à tabela `projects`**:
- `github_repo_url text`
- `github_repo_name text`
- `ai_generation_status text default 'idle'` — `idle | queued | generating_structure | generating_content | rendering | pushing_github | done | failed`
- `ai_generation_error text`
- `ai_site_structure jsonb`

**Criar tabela `feature_flags_users`** (descrita acima)

**Criar tabela `ai_generation_logs`**:
- `project_id`, `step`, `status`, `payload jsonb`, `error text`, `created_at`
- RLS: admin/dev veem tudo; corretor vê os do próprio projeto

**Criar função SQL** `has_feature_flag(_user_id uuid, _flag text)` (`SECURITY DEFINER`)

---

### 4. Edge Function nova: `ai-site-builder`

`supabase/functions/ai-site-builder/index.ts` (`verify_jwt = false`).

**Validação inicial**:
1. Recebe `{ project_id, requesting_user_id }`
2. Service role busca o projeto + dono
3. Verifica `has_feature_flag(project.user_id, 'ai_site_builder')` → se false, 403

**Etapa A — Estrutura** (Lovable AI Gateway, `google/gemini-2.5-pro`, tool calling):
- Input: `wizard_data`, `portfolio_properties`, `layout_choice`, `color_palette`, `logo_url`
- Tool schema obriga JSON: `{ pages, sections, theme, seo, navigation }`
- Sections: `hero`, `propertyGrid`, `propertyDetail`, `about`, `contact`, `cta`, `footer`

**Etapa B — Conteúdo** (`google/gemini-3-flash-preview`):
- Por imóvel: `descriptionLong` (200-300 palavras SEO) + `highlights` + `metaDescription`
- Hero/about/CTA conforme perfil (corretor/imobiliária)

**Etapa C — Render** (templates string em `templates/`):
- `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/pages/*.tsx`, `src/components/sections/*.tsx`, `src/data/properties.json`, `src/styles/theme.css`, `README.md`, `.gitignore`, `vercel.json`

**Etapa D — GitHub** (Git Data API, eficiente):
- `POST /user/repos` → repo **privado** `habify-{slug}`
- 1 tree + 1 commit + update ref `main` (4 requests vs 30+)
- Convida o corretor como collaborator (opcional, configurável)

**Etapa E — Finalizar**:
- Atualiza `projects.github_repo_url`, `ai_generation_status='done'`, `status='completed'`
- Notification in-app + chama `send-project-confirmation`

**Helpers** (mesma pasta):
- `ai.ts` — wrapper Lovable AI Gateway com retry/backoff (429), erros claros (402)
- `github.ts` — wrapper Git Data API
- `templates/` — strings de cada arquivo do site gerado

---

### 5. Disparo (em `src/hooks/useProjects.ts`)

Após `createProject()` bem-sucedido:
```ts
const { enabled } = await checkFeatureFlag(user.id, 'ai_site_builder');
if (enabled) {
  supabase.functions.invoke('ai-site-builder', { 
    body: { project_id: data.id, requesting_user_id: user.id } 
  });
  // fire-and-forget — não bloqueia UI
}
```

Para usuários sem flag: comportamento atual preservado integralmente.

---

### 6. UI — escondida atrás do flag

- **Componente** `src/components/admin/AIGenerationStatus.tsx`: subscribe realtime em `projects.ai_generation_status`
  - Estados: "IA criando seu site..." → "Publicando no GitHub..." → "Pronto! Ver repositório"
- **Em `ProjectDetailPage.tsx`**: renderiza `<AIGenerationStatus />` só se `useFeatureFlag('ai_site_builder').enabled`
- **Em `MyProjectsPage.tsx`**: badge de status só aparece para usuários com flag
- **Botão "Regenerar com IA"**: visível só para admin/dev **com flag**
- **Página admin opcional** `/admin/feature-flags`: você gerencia quem tem acesso (criar na v1.1 ou via SQL Editor mesmo)

---

### 7. Secrets necessários

- `GITHUB_TOKEN` — PAT fine-grained, escopo `repo` (você fornece na implementação)
- `GITHUB_OWNER` — seu username GitHub
- `LOVABLE_API_KEY` — já existe ✓

---

### 8. Tratamento de erros / idempotência

- Cada etapa loga em `ai_generation_logs`
- Falha em D: `ai_site_structure` salvo → retry sem regerar IA
- Endpoint retry: `POST /functions/v1/ai-site-builder` com `{ project_id, retry: true }`
- 429 → backoff exponencial (3 tentativas); 402 → `failed` + mensagem clara
- Falha NUNCA quebra o fluxo de criação do projeto (ele já está salvo no banco)

---

### Arquivos a criar/editar

**Criar**:
1. `SKILL.md` (raiz)
2. `supabase/functions/ai-site-builder/index.ts`
3. `supabase/functions/ai-site-builder/ai.ts`
4. `supabase/functions/ai-site-builder/github.ts`
5. `supabase/functions/ai-site-builder/templates/` (vários `.ts`)
6. `src/components/admin/AIGenerationStatus.tsx`
7. `src/hooks/useFeatureFlag.ts`
8. Migração SQL: colunas em `projects`, tabelas `feature_flags_users` + `ai_generation_logs`, função `has_feature_flag()`, seed do flag para você

**Editar**:
1. `src/hooks/useProjects.ts` — invocação condicionada ao flag
2. `src/pages/admin/ProjectDetailPage.tsx` — embute `<AIGenerationStatus />` condicional
3. `src/pages/admin/MyProjectsPage.tsx` — badge condicional
4. `src/types/admin.ts` — novos campos no tipo `Project`
5. `supabase/config.toml` — `[functions.ai-site-builder] verify_jwt = false`

---

### Garantias de não-impacto no sistema atual

- ✅ Nenhum fluxo existente é alterado para usuários sem o flag
- ✅ A invocação da edge function é **fire-and-forget**: se ela falhar, o projeto continua criado normalmente
- ✅ Colunas novas em `projects` são todas nullable com defaults — não quebram queries existentes
- ✅ RLS endurecida na tabela de feature flags: só admin/dev gerencia
- ✅ Edge function rejeita chamadas de usuários sem o flag (defesa em profundidade)
- ✅ Você pode revogar o flag a qualquer momento via SQL Editor (1 UPDATE)

---

### Mapa de pastas/documentos para o Antigravity

```text
Projeto HabiFy (React + Vite + TS + Tailwind + Supabase). Feature em modo BETA RESTRITA.

LEIA PRIMEIRO: SKILL.md (raiz)

FEATURE FLAG (gate da feature):
- src/hooks/useFeatureFlag.ts
- Tabela feature_flags_users + função SQL has_feature_flag()

WIZARD (entrada do fluxo):
- src/pages/admin/ProjectWizardPage.tsx
- src/components/wizard/{LayoutColorStep,LogoStep,PortfolioPropertiesStep,ProjectDataForm,DomainStep}.tsx
- src/types/wizard.ts

CRIAÇÃO/PERSISTÊNCIA:
- src/hooks/useProjects.ts (gate do flag fica aqui)
- src/hooks/{useMultipleProjects,useUserPlans}.ts
- src/types/admin.ts
- src/integrations/supabase/{client.ts,types.ts}

EXIBIÇÃO PÓS-CRIAÇÃO (UI condicionada ao flag):
- src/pages/admin/{ProjectDetailPage,MyProjectsPage,ProjectsPage}.tsx
- src/components/admin/AIGenerationStatus.tsx (novo)

EDGE FUNCTIONS DE REFERÊNCIA:
- supabase/functions/check-domain-availability/index.ts
- supabase/functions/send-project-confirmation/index.ts
- supabase/functions/abacatepay-webhook/index.ts
- supabase/config.toml

A CRIAR:
- supabase/functions/ai-site-builder/{index.ts,ai.ts,github.ts,templates/}

REGRAS GLOBAIS:
- Roles via user_roles + has_role()/is_admin_or_dev_v2() (NUNCA profiles.role)
- Estilo via tokens semânticos (src/index.css + tailwind.config.ts)
- IA SEMPRE via Lovable AI Gateway em edge function
- Toda feature nova SEMPRE atrás de feature flag
- Secrets: GITHUB_TOKEN, GITHUB_OWNER (LOVABLE_API_KEY já existe)
```

---

### Pendências para a fase de implementação (após aprovação)

1. Você fornece `GITHUB_TOKEN` (PAT fine-grained, `repo`) e `GITHUB_OWNER` quando eu solicitar.
2. Confirmar seu email/user_id para o seed inicial da feature flag (posso buscar pelo email).
3. Repos privados por padrão — confirmar se OK.
4. Deploy Vercel automático fica para v2 (precisaria `VERCEL_TOKEN`).
