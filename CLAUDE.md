# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server on http://localhost:8080
npm run build       # production build
npm run build:dev   # development-mode build
npm run lint         # eslint over the whole repo
npm run preview      # preview a production build
```

There is no test suite configured in this repo.

Package manager: the repo carries `bun.lock`/`bun.lockb`, `package-lock.json`, and `yarn.lock` simultaneously — check with the user which one is authoritative before adding/upgrading a dependency rather than assuming.

## Architecture

React 18 + Vite 5 + TypeScript (strict) + Tailwind CSS v3, backed by Supabase (Postgres + Auth + Edge Functions in Deno + Storage). Deploy: Lovable for preview, Vercel for production (`habify.com.br`). This project is also edited via Lovable, so `src/` may receive external changes outside of git commits made here.

### Routing and app shell

`src/App.tsx` is the composition root: `QueryClientProvider` → `AuthProvider` (`src/contexts/AuthContext.tsx`) → `BrowserRouter`. Every page is lazy-loaded. Two route-guard wrappers matter:
- `ProtectedRoute` — redirects to `/login` when `useAuth().isAuthenticated` is false.
- `RoleBasedRoute` — redirects to `/admin/my-projects` when `useAuth().hasRole(allowedRoles)` is false.

Public marketing routes live at top level (`/`, `/termos-de-uso`, `/politica-privacidade`, `/checkout/:planId`, payment result pages). Everything under `/admin/*` is gated behind `AdminLayout` and role checks. `src/pages/admin/` holds all admin/dashboard screens (projects, payments, maintenances, users, reports, logs, settings); public-facing pages are directly under `src/pages/`.

### Roles and permissions

Roles are **never** read from `profiles.role`. Always go through the `user_roles` table and the Postgres functions `has_role(uid, role)` / `is_admin_or_dev_v2(uid)`. Existing roles: `dev`, `admin`, `corretor`, `user`. On the frontend this is exposed through `useAuth().hasRole(...)` (`src/hooks/useAuth.ts`, `src/contexts/AuthContext.tsx`).

### Supabase

- Client: `import { supabase } from "@/integrations/supabase/client"`.
- `src/integrations/supabase/types.ts` is generated — never hand-edit it.
- RLS is required on every table holding user data.
- Edge Functions live in `supabase/functions/*/index.ts` (Deno), deployed automatically; each must set CORS headers. `supabase/config.toml` controls `verify_jwt` per function — most are `false` (webhooks, public checks) with a few explicit `true` (e.g. `createUserWithCredit`); check this file before assuming a function is authenticated.
- Migrations are timestamped SQL files under `supabase/migrations/`.
- Any AI/LLM call goes through the Lovable AI Gateway (`LOVABLE_API_KEY`) **inside an edge function** — never call it from the frontend. Handle `429` (rate limit → backoff) and `402` (out of credits) with a clear user-facing message.

### Feature flags

Experimental features are gated by the `feature_flags_users` table + `has_feature_flag(uid, flag)`. Apply defense in depth: hide the UI, block in the `useFeatureFlag('flag_name')` hook (`src/hooks/useFeatureFlag.ts`), and re-validate with `has_feature_flag()` inside any edge function the feature calls.

### Payments

AbacatePay is the only active payment gateway (`create-payment`, `abacatepay-webhook`, `verify-payment*` edge functions). Hubla is deprecated — do not build against `hubla-webhook`. The `process-pending-paid-orders` cron edge function is a failsafe reconciliation job; do not remove it.

### Design system

Never use direct color utilities (`text-white`, `bg-orange-500`, `text-[#FE5C02]`, etc.). Always use the semantic tokens defined in `src/index.css` (HSL custom properties, e.g. `--primary: 18 99% 50%`) and wired through `tailwind.config.ts`. Brand orange is `#FE5C02`/`#F97316`. Fonts: Brockmann (display), Inter (body), Playfair Display (accent serif). UI targets a premium dark aesthetic with framer-motion microinteractions.

### TypeScript conventions

- `strict: true`; never use `any` — use `unknown` with narrowing or a proper type.
- Shared types live in `src/types/`.
- Always import via the `@/` alias (maps to `src/`), never deep relative paths.

### SEO / performance

Target 100% Lighthouse: images in WebP/AVIF, lazy-load anything below the fold, `<title>` under 60 chars, meta description under 160 chars, exactly one `<h1>` per page, JSON-LD where applicable. `vite.config.ts` drops `console.log`/`debugger` in production builds and manually chunks vendor bundles (react, ui/radix, forms, supabase, query, animation).

## Agent workflow notes

- Before creating/modifying multiple files, produce an implementation plan and wait for approval before executing.
- After implementing a visual feature, run `npm run dev`, load `http://localhost:8080`, verify rendering, and check the browser console for zero errors.
- `.agents/skills/` contains a larger set of process skills (PRD, tech-spec, task planning/execution, review rounds, etc.) used by other agent tooling in this repo — consult them if working through that workflow rather than ad hoc.
