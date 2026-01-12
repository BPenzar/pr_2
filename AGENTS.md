# AGENTS.md

## 1) Project identity

Feedback Collector is a QR-code powered feedback collection platform built as a Next.js 15 App Router app with Supabase for auth and data storage, and Tailwind for UI styling (README.md, package.json, src/app/layout.tsx, tailwind.config.ts). The core workflow lets account owners create projects and forms, generate short-link QR codes, collect responses from public users, and review analytics and exports (README.md, src/components/projects/project-list.tsx, src/components/forms/form-builder.tsx, src/components/qr/qr-code-list.tsx, src/components/public-form/public-form.tsx, src/components/analytics/analytics-dashboard.tsx, src/components/analytics/response-viewer.tsx, src/lib/csv-export.ts).

Who uses it and what problem it solves (from UI and feature code):
- A business/operator creates projects to organize feedback initiatives and forms for each project (src/components/projects/project-list.tsx, src/components/projects/create-project-modal.tsx, src/hooks/use-projects.ts).
- A project owner builds forms with multiple question types and custom ordering (src/components/forms/form-builder.tsx, src/components/forms/question-editor.tsx, src/hooks/use-questions.ts, supabase/migrations/001_initial_schema.sql, supabase/migrations/024_rewrite_reorder_questions_atomic.sql).
- A business distributes QR codes and short links so customers can scan and submit feedback without logging in (src/components/qr/qr-code-list.tsx, src/components/qr/qr-code-generator.tsx, src/app/f/[shortUrl]/page.tsx, src/components/public-form/public-form.tsx).
- An account owner reviews response analytics, QR performance, and exports responses to CSV (src/components/analytics/analytics-dashboard.tsx, src/components/analytics/response-analytics.tsx, src/components/analytics/response-viewer.tsx, src/hooks/use-csv-export.ts, src/lib/csv-export.ts).

What "done" means (success criteria anchored in current behavior):
- A project exists with at least one form, and the form has questions saved in order (src/hooks/use-projects.ts, src/hooks/use-forms.ts, src/hooks/use-questions.ts, supabase/migrations/025_make_questions_order_unique_deferrable.sql).
- A QR code is generated for the form and resolves to `/f/[shortUrl]` (src/components/qr/qr-code-generator.tsx, src/components/qr/qr-code-list.tsx, src/app/f/[shortUrl]/page.tsx, supabase/functions/generate-qr-code/index.ts).
- A public user can submit the form and the response + response_items are stored (src/components/public-form/public-form.tsx, src/app/api/submit-form/route.ts, supabase/migrations/001_initial_schema.sql).
- Analytics and responses render for the form owner (src/components/analytics/analytics-dashboard.tsx, src/components/analytics/response-analytics.tsx, src/components/analytics/response-viewer.tsx, src/hooks/use-responses.ts).

## 2) Quickstart (for an agent)

Local dev (Next.js app):
- Install dependencies: `npm ci` (package.json).
- Start dev server: `npm run dev` (package.json).
- App runs at `http://localhost:3000` by default (README.md).

Local Supabase (optional but recommended for full functionality):
- Copy env template: `cp .env.local.example .env.local` (README.md, .env.local.example).
- Start Supabase: `supabase start` (README.md, supabase/config.toml).
- Reset local DB: `supabase db reset` (README.md).
- Check ports and keys: `supabase status` (README.md, supabase/config.toml).

Tests, lint, typecheck:
- Unit tests: `npm run test` (package.json, tests/*.test.ts).
- Lint: `npm run lint` (package.json, eslint.config.mjs).
- Typecheck: `npm run type-check` (package.json, tsconfig.json).

Production-like build:
- Build: `npm run build` (package.json).
- Start: `npm start` (package.json).

Required environment variables

| VAR | Purpose | Where used | Example/format | Required? |
| --- | --- | --- | --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL for client/server auth and data access | src/lib/supabase-client.ts, src/lib/supabase.ts, src/lib/supabase-server.ts, src/middleware.ts, src/lib/supabase-admin.ts | `https://<project>.supabase.co` | Yes |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anon key for client/server auth and data access | src/lib/supabase-client.ts, src/lib/supabase.ts, src/lib/supabase-server.ts, src/middleware.ts | `eyJ...` | Yes |
| SUPABASE_SERVICE_ROLE_KEY | Service role key for server-side admin operations | src/lib/supabase-admin.ts, supabase/functions/generate-qr-code/index.ts | `eyJ...` | Yes (server routes + edge function) |
| SUPABASE_URL | Supabase URL for the edge function runtime | supabase/functions/generate-qr-code/index.ts | `https://<project>.supabase.co` | Yes for edge function |
| APP_URL | Base URL used by edge function to build QR short links | supabase/functions/generate-qr-code/index.ts | `https://your-domain` | Yes for edge function |
| IP_HASH_SALT | Salt for hashing IPs used in privacy-safe logging | src/lib/rate-limit.ts, src/app/api/client-info/route.ts | random string | Yes (privacy) |
| UPSTASH_REDIS_REST_URL | Upstash Redis REST URL for rate limiting | src/lib/rate-limit.ts, supabase/functions/generate-qr-code/index.ts | `https://...upstash.io` | Optional (falls back to in-memory) |
| UPSTASH_REDIS_REST_TOKEN | Upstash Redis REST token for rate limiting | src/lib/rate-limit.ts, supabase/functions/generate-qr-code/index.ts | `...` | Optional (falls back to in-memory) |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY | Cloudflare Turnstile site key for client CAPTCHA | src/components/public-form/public-form.tsx | `0x...` | Optional (CAPTCHA) |
| TURNSTILE_SECRET_KEY | Cloudflare Turnstile secret for server verification | src/app/api/submit-form/route.ts | `0x...` | Optional (CAPTCHA) |

Notes on env templates:
- `.env.example` and `.env.local.example` align with runtime usage; the `generate-qr-code` edge function requires `APP_URL` and `SUPABASE_URL`, which must be set in the Supabase Edge Function environment (supabase/functions/generate-qr-code/index.ts, .env.example, .env.local.example).

## 3) Repository map

Top-level (core vs auxiliary):
- Core app: `src/` (Next.js App Router UI + API routes), `supabase/` (DB schema, RLS, edge function), `tests/` (Vitest tests), `public/` (static assets) (src/app/*, src/components/*, supabase/migrations/*, tests/*.test.ts, public/*).
- Auxiliary/config: `README.md`, `docs/`, `todo.md`, `package.json`, `next.config.js`, `tailwind.config.ts`, `eslint.config.mjs`, `vitest.config.ts`, `tsconfig.json`.
- Tools: `scripts/reconcile-schema.py` (compares `supabase/remote-schema.sql` vs `supabase/migrations/`).

Tree of key paths and entry points:
```
.
|- src/
|  |- app/
|  |  |- layout.tsx                # Root layout + providers (src/app/layout.tsx)
|  |  |- page.tsx                  # Landing page (src/app/page.tsx)
|  |  |- middleware.ts             # Auth/terms gatekeeping (src/middleware.ts)
|  |  |- api/
|  |  |  |- submit-form/route.ts   # Public form submission API (src/app/api/submit-form/route.ts)
|  |  |  |- delete-account/route.ts # Account deletion API (src/app/api/delete-account/route.ts)
|  |  |  `- client-info/route.ts   # IP hash API (src/app/api/client-info/route.ts)
|  |  |- f/[shortUrl]/page.tsx     # Public form entry (src/app/f/[shortUrl]/page.tsx)
|  |  |- forms/[id]/page.tsx       # Form builder + analytics tabs (src/app/forms/[id]/page.tsx)
|  |  |- projects/[id]/page.tsx    # Project overview (src/app/projects/[id]/page.tsx)
|  |  |- auth/*                    # Auth screens and callback route (src/app/auth/*)
|  |  `- settings/page.tsx         # Account settings (src/app/settings/page.tsx)
|  |- components/
|  |  |- forms/                    # Form builder + editor (src/components/forms/*)
|  |  |- public-form/              # Public form UI (src/components/public-form/*)
|  |  |- analytics/                # Analytics dashboards (src/components/analytics/*)
|  |  |- qr/                       # QR generation + print (src/components/qr/*)
|  |  |- auth/                     # Auth forms (src/components/auth/*)
|  |  `- ui/                       # UI primitives (src/components/ui/*)
|  |- hooks/                       # React Query hooks for data (src/hooks/*)
|  |- lib/                         # Shared utilities (src/lib/*)
|  `- contexts/                    # Auth context (src/contexts/auth-context.tsx)
|- supabase/
|  |- migrations/                  # DB schema, RLS, functions (supabase/migrations/*.sql)
|  |- functions/generate-qr-code/  # Edge function for QR creation (supabase/functions/generate-qr-code/index.ts)
|  `- seed.sql                     # Local seed data (supabase/seed.sql)
|- tests/                          # Vitest tests (tests/*.test.ts)
`- public/                         # Static assets (public/*)
```

## 4) Architecture overview

Components and responsibilities:
- Next.js App Router UI with client-side data fetching via Supabase JS + React Query (src/app/*, src/components/*, src/hooks/*, src/lib/supabase-client.ts, src/providers/query-provider.tsx).
- Next.js API routes for server-side operations that need the service role key (src/app/api/submit-form/route.ts, src/app/api/delete-account/route.ts, src/lib/supabase-admin.ts).
- Supabase Postgres DB with RLS, RPCs, materialized views, and triggers (supabase/migrations/*.sql).
- Supabase Edge Function `generate-qr-code` for QR creation and short URL generation (supabase/functions/generate-qr-code/index.ts, src/hooks/use-qr-codes.ts).
- Upstash Redis for rate limiting (optional fallback to in-memory) (src/lib/rate-limit.ts, supabase/functions/generate-qr-code/index.ts).
- Cloudflare Turnstile for CAPTCHA on suspicious submissions (src/components/public-form/public-form.tsx, src/app/api/submit-form/route.ts).

High-level architecture diagram:
```
[Browser UI]
   |  (supabase-js + React Query)
   v
[Supabase Auth + Postgres DB] <--- RLS + RPC + triggers + views (supabase/migrations/*.sql)
   ^\
   | \-- [Next.js API routes] use service role (src/app/api/*, src/lib/supabase-admin.ts)
   | 
   \-- [Supabase Edge Function: generate-qr-code] (supabase/functions/generate-qr-code/index.ts)

[Upstash Redis] (rate limiting) <--- used by Next API + Edge Function (src/lib/rate-limit.ts, supabase/functions/generate-qr-code/index.ts)
[Cloudflare Turnstile] (CAPTCHA) <--- used by submit-form API + public form UI (src/app/api/submit-form/route.ts, src/components/public-form/public-form.tsx)
```

Request lifecycle (public form submission):
```
QR scan -> /f/[shortUrl] page
  -> usePublicForm() reads qr_codes + form + questions (src/hooks/use-public-form.ts)
  -> increment_qr_scan RPC (src/hooks/use-public-form.ts, supabase/migrations/003_functions_and_triggers.sql)
  -> user submits -> POST /api/submit-form (src/components/public-form/public-form.tsx)
     -> rate limit + spam checks + optional Turnstile (src/app/api/submit-form/route.ts, src/lib/rate-limit.ts, src/lib/anti-spam.ts)
     -> insert responses + response_items (src/app/api/submit-form/route.ts, supabase/migrations/001_initial_schema.sql)
     -> UI shows success
```

Background jobs (analytics refresh):
- `pg_cron` schedules `refresh_dashboard_views()` every 15 minutes to refresh materialized views (supabase/migrations/004_materialized_views.sql).

## 5) Key modules (deep dive)

### Auth + session + legal acceptance
- Purpose: Session management and enforcing terms acceptance before access to protected pages.
- Main files: `src/contexts/auth-context.tsx`, `src/middleware.ts`, `src/components/auth/*`, `src/app/auth/*`, `src/lib/legal.ts`.
- Key functions/classes:
  - `AuthProvider` manages Supabase sessions and account fetch, with OAuth metadata storage (`AuthProvider` in `src/contexts/auth-context.tsx`).
  - Middleware checks protected routes and legal acceptance with `LEGAL_VERSION` (`middleware` in `src/middleware.ts`, `LEGAL_VERSION` in `src/lib/legal.ts`).
  - OAuth callback handles exchange + redirect and enforces legal acceptance (`GET` in `src/app/auth/callback/route.ts`).
- Interfaces/contracts: Supabase Auth user metadata `legal_version`, `terms_accepted_at`, `privacy_accepted_at` (used in `src/middleware.ts`, `src/components/auth/accept-terms-form.tsx`).
- Invocation/dependencies: Supabase SSR client in middleware (`createServerClient` in `src/middleware.ts`), supabase-js browser client in context (`src/lib/supabase-client.ts`).
- Failure modes/gotchas:
  - Missing `LEGAL_VERSION` update may block users (src/middleware.ts, src/lib/legal.ts).
  - OAuth errors are routed back to `/auth/login` with query params (src/app/auth/callback/route.ts, src/components/auth/login-form.tsx).
  - Middleware only protects `/dashboard`, `/projects`, `/forms`, and `/settings`; onboarding redirect is client-side, so add `/onboarding` to `protectedPaths` if you want server-side gating (src/middleware.ts, src/app/onboarding/page.tsx).

### Projects, forms, questions
- Purpose: CRUD for projects, forms, and questions with plan limits and ordering.
- Main files: `src/hooks/use-projects.ts`, `src/hooks/use-forms.ts`, `src/hooks/use-questions.ts`, `src/components/forms/*`, `supabase/migrations/001_initial_schema.sql`, `supabase/migrations/024_rewrite_reorder_questions_atomic.sql`.
- Important functions:
  - Plan limit RPCs: `can_create_project`, `can_create_form` (supabase/migrations/003_functions_and_triggers.sql; used in `src/hooks/use-projects.ts`, `src/hooks/use-forms.ts`, `src/hooks/use-templates.ts`).
  - Question reordering RPC: `reorder_questions` (supabase/migrations/024_rewrite_reorder_questions_atomic.sql; used in `src/hooks/use-questions.ts`).
- Interfaces/contracts: `Question` type with `rating_scale` and `options` (src/types/database.ts) and choice option normalization (src/lib/question-utils.ts).
- Invocation/dependencies: Supabase client (`src/lib/supabase-client.ts`) with RLS enforcing account boundaries (supabase/migrations/002_rls_policies.sql).
- Failure modes/gotchas:
  - Unique `(form_id, order_index)` constraint is deferrable; reordering uses a two-step bump to avoid collisions (supabase/migrations/024_rewrite_reorder_questions_atomic.sql, supabase/migrations/025_make_questions_order_unique_deferrable.sql).

### Public form submission + anti-spam
- Purpose: Render public form and accept responses without login.
- Main files: `src/components/public-form/public-form.tsx`, `src/components/public-form/question-renderer.tsx`, `src/hooks/use-public-form.ts`, `src/app/api/submit-form/route.ts`, `src/lib/anti-spam.ts`, `src/lib/rate-limit.ts`.
- Key functions:
  - `usePublicForm` loads form by `short_url` and increments scan count (src/hooks/use-public-form.ts, supabase/migrations/003_functions_and_triggers.sql).
  - `POST /api/submit-form` validates payload, checks limits, inserts response + items (src/app/api/submit-form/route.ts).
  - `checkForSpam` and CAPTCHA gating (src/lib/anti-spam.ts, src/app/api/submit-form/route.ts).
- Interfaces/contracts: `responses` payload is `Record<questionId, string | string[]>` (src/app/api/submit-form/route.ts).
- Dependencies: service role Supabase client (src/lib/supabase-admin.ts), optional Upstash rate limit (src/lib/rate-limit.ts), Turnstile site/secret keys (src/components/public-form/public-form.tsx, src/app/api/submit-form/route.ts).
- Failure modes/gotchas:
  - If Turnstile keys are missing and spam score triggers CAPTCHA, API returns `CAPTCHA_NOT_CONFIGURED` (src/app/api/submit-form/route.ts).
  - Rate limiting falls back to in-memory Map if Upstash env is missing, which is per-instance only (src/lib/rate-limit.ts).

### Analytics + materialized views
- Purpose: Provide response counts, trends, QR performance, and distribution charts.
- Main files: `src/hooks/use-responses.ts`, `src/components/analytics/*`, `supabase/migrations/004_materialized_views.sql`, `supabase/migrations/018_secure_materialized_views_corrected.sql`.
- Key functions/views:
  - `dashboard_summary`, `form_analytics`, `response_trends` materialized views (supabase/migrations/004_materialized_views.sql).
  - Secure accessor functions `get_user_dashboard_summary`, `get_user_form_analytics`, `get_user_response_trends` (supabase/migrations/018_secure_materialized_views_corrected.sql).
- Invocation/dependencies: hooks query `dashboard_summary` and `response_trends` directly (src/hooks/use-responses.ts), requiring correct grants and RLS strategy in Supabase (supabase/migrations/004_materialized_views.sql, supabase/migrations/018_secure_materialized_views_corrected.sql).
- Failure modes/gotchas:
  - If materialized views are stale or the cron job is not running, analytics may lag (supabase/migrations/004_materialized_views.sql).

### QR code generation + printing
- Purpose: Generate QR codes, manage short links, and create printable sticker sheets.
- Main files: `src/components/qr/qr-code-list.tsx`, `src/components/qr/qr-code-generator.tsx`, `src/hooks/use-qr-codes.ts`, `src/lib/qr-codes.ts`, `supabase/functions/generate-qr-code/index.ts`.
- Key functions:
  - `generate-qr-code` edge function validates ownership and inserts `qr_codes` (supabase/functions/generate-qr-code/index.ts).
  - `ensureDefaultQRCode` ensures a default QR code exists for a form (src/lib/qr-codes.ts, src/components/qr/qr-code-list.tsx).
  - PDF sticker generation uses `pdf-lib` and client-side QR PNG conversion; layout is fixed to A4 12-up (70 x 68.1 mm) with a 13.7 mm top margin, 50 mm QR, top title offset 5 mm, subtitle gap 4.2 mm, bottom footer offset 6 mm, and equalized text-to-QR gaps using font metrics (src/components/qr/qr-code-list.tsx).
  - Top title is 10.3 pt (bold/regular), top subtitle is 7.6 pt (regular only), bottom title is 8 pt (bold/regular); subtitle is optional and the title shifts down when absent (src/components/qr/qr-code-list.tsx).
  - QR previews/exports embed a circular logo from `public/logo.png` via `src/lib/qr-logo.ts`, use error correction level H, and downloads are fixed at 2048 px for PNG/SVG (src/components/qr/qr-code-list.tsx, src/components/qr/qr-code-generator.tsx).
- Failure modes/gotchas:
  - Edge function requires `SUPABASE_URL`, service role key, and `APP_URL` to build short links (supabase/functions/generate-qr-code/index.ts).

### Onboarding + templates
- Purpose: Guided project/form creation and template-based forms.
- Main files: `src/app/onboarding/page.tsx`, `src/components/onboarding/*`, `src/hooks/use-templates.ts`, `src/lib/form-templates.ts`, `src/lib/onboarding.ts`.
- Key functions:
  - `useCompleteOnboarding` creates project + form + questions, using templates or quick setup (src/hooks/use-templates.ts).
  - `markOnboardingCompleted` updates `accounts.onboarding_completed` (src/lib/onboarding.ts, supabase/migrations/009_onboarding_completed_flag.sql).
- Dependencies: Supabase client, form templates data, plan limit RPCs (src/lib/supabase-client.ts, src/lib/form-templates.ts, supabase/migrations/003_functions_and_triggers.sql).

### Account deletion
- Purpose: Delete Supabase Auth user and cascade data.
- Main files: `src/app/api/delete-account/route.ts`, `src/app/settings/page.tsx`, `src/lib/supabase-admin.ts`.
- Flow: Client calls `DELETE /api/delete-account` with Bearer token; server verifies and deletes user via `supabase.auth.admin.deleteUser` (src/app/api/delete-account/route.ts).

## 6) Data model + storage

Database: Supabase Postgres with RLS, RPCs, triggers, and materialized views (supabase/migrations/*.sql).

Core entities and relationships (from schema):
- plans -> accounts -> projects -> forms -> questions -> responses -> response_items (supabase/migrations/001_initial_schema.sql).
- qr_codes belong to forms; responses can reference qr_codes (supabase/migrations/001_initial_schema.sql).
- usage_counters track per-account usage and are updated by triggers on insert (supabase/migrations/003_functions_and_triggers.sql).
- subscriptions exist for future Stripe integration (supabase/migrations/001_initial_schema.sql).

Simplified relationship diagram:
```
plans
  |
accounts (user_id -> auth.users)
  |
projects
  |
forms --< questions
  |
  |--< qr_codes
  |--< responses --< response_items
```

Key constraints/invariants:
- `questions` enforce unique `(form_id, order_index)` and it is DEFERRABLE to support reordering (supabase/migrations/001_initial_schema.sql, supabase/migrations/025_make_questions_order_unique_deferrable.sql).
- `forms.questions_per_step` must be >= 1 (supabase/migrations/026_add_form_layout_settings.sql).
- `response_items` are unique per `(response_id, question_id)` (supabase/migrations/001_initial_schema.sql).
- `response_items.value` stores multiselect answers as JSON strings; choice/text are plain strings and analytics/export parse JSON where needed (src/app/api/submit-form/route.ts, src/components/analytics/response-viewer.tsx, src/components/analytics/analytics-dashboard.tsx).

RLS/ACL summary:
- RLS is enabled for all tables (supabase/migrations/002_rls_policies.sql).
- Authenticated users can access data tied to their account via `get_user_account_id()` (supabase/migrations/002_rls_policies.sql).
- Anonymous users can view active forms/questions/qr_codes and submit responses/response_items for active forms (supabase/migrations/002_rls_policies.sql, supabase/migrations/027_allow_authenticated_public_access.sql).
- Materialized views are not RLS-protected; access is intended via security definer functions (supabase/migrations/018_secure_materialized_views_corrected.sql).

Migration tooling:
- Migrations live in `supabase/migrations/*.sql` and local seed in `supabase/seed.sql` (README.md, supabase/seed.sql).
- `supabase/remote-schema.sql` is a schema-only dump of the linked Supabase project's `public` schema; it excludes extensions and non-public schemas (e.g., `pg_cron`, `auth`) because the dump was run with `--schema public` (supabase/remote-schema.sql, supabase/migrations/004_materialized_views.sql, supabase/migrations/001_initial_schema.sql).
  - Use `scripts/reconcile-schema.py` to compare the dump against migrations after re-dumping (scripts/reconcile-schema.py).
  - This exclusion is expected and not a problem; objects like `auth.users` triggers and `pg_cron` live outside `public` and will not appear in the dump (supabase/remote-schema.sql, supabase/migrations/003_functions_and_triggers.sql, supabase/migrations/004_materialized_views.sql).

## 7) APIs (internal + external)

Internal endpoints and RPCs:
- `POST /api/submit-form` validates, rate-limits, anti-spam checks, and inserts response data (src/app/api/submit-form/route.ts).
- `DELETE /api/delete-account` deletes Supabase Auth user (src/app/api/delete-account/route.ts).
- `GET /api/client-info` returns `ipHash` (src/app/api/client-info/route.ts).
- Supabase Edge Function: `generate-qr-code` invoked via `supabase.functions.invoke` (supabase/functions/generate-qr-code/index.ts, src/hooks/use-qr-codes.ts).
- Supabase RPCs used by client: `can_create_project`, `can_create_form`, `can_accept_response`, `reorder_questions`, `increment_qr_scan`, `get_project_usage_summary`, `get_account_responses_count` (supabase/migrations/003_functions_and_triggers.sql, supabase/migrations/010_reorder_questions.sql, supabase/migrations/024_rewrite_reorder_questions_atomic.sql, supabase/migrations/015_create_get_account_responses_count.sql, src/hooks/*).

Auth mechanism:
- Supabase Auth with SSR cookies; middleware checks session and legal acceptance (src/middleware.ts, src/lib/supabase-client.ts, src/lib/supabase-server.ts).
- OAuth callback exchanges code for session and enforces legal acceptance (src/app/auth/callback/route.ts, src/lib/legal.ts).

External integrations:
- Supabase (DB + Auth + Edge functions): configured via env vars and migrations (src/lib/supabase-client.ts, src/lib/supabase-admin.ts, supabase/config.toml, supabase/migrations/*).
- Upstash Redis (rate limiting): optional; set `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` (src/lib/rate-limit.ts, supabase/functions/generate-qr-code/index.ts).
- Cloudflare Turnstile: optional; set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` (src/components/public-form/public-form.tsx, src/app/api/submit-form/route.ts).

Local testing notes:
- Without Upstash, rate limiting is in-memory per server instance (src/lib/rate-limit.ts).
- Without Turnstile keys, CAPTCHA-required submissions fail with `CAPTCHA_NOT_CONFIGURED` (src/app/api/submit-form/route.ts).

## 8) Frontend (if present)

Routing structure (App Router):
- `/` landing page (src/app/page.tsx).
- `/dashboard` account overview and project list (src/app/dashboard/page.tsx).
- `/projects/[id]` project details and forms (src/app/projects/[id]/page.tsx).
- `/forms/[id]` builder + analytics + QR tabs (src/app/forms/[id]/page.tsx).
- `/f/[shortUrl]` public form entry (src/app/f/[shortUrl]/page.tsx).
- `/auth/*` login/signup/accept-terms (src/app/auth/*).
- `/settings` account settings (src/app/settings/page.tsx).

State management:
- React Query for data fetching/caching in `src/hooks/*` with `QueryProvider` at root (src/providers/query-provider.tsx, src/app/layout.tsx).

UI component conventions:
- UI primitives in `src/components/ui/*` built with Radix UI + class-variance-authority (src/components/ui/*).
- Reusable layout components in `src/components/layout/*` (src/components/layout/Header.tsx, src/components/layout/Footer.tsx).

Backend communication:
- Direct Supabase JS client for most CRUD operations (src/lib/supabase-client.ts, src/hooks/*).
- Next.js API routes for privileged actions (src/app/api/submit-form/route.ts, src/app/api/delete-account/route.ts).
- Supabase Edge Function for QR creation (supabase/functions/generate-qr-code/index.ts, src/hooks/use-qr-codes.ts).

## 9) Operations

Deployment targets:
- README recommends Vercel and lists required env vars (README.md).
- TODO/UNKNOWN: No `vercel.json` found in repo root during this audit; verify deployment config outside this repo.

Environments:
- Local Supabase ports and auth URLs configured in `supabase/config.toml` (supabase/config.toml).

CI/CD:
- TODO/UNKNOWN: README claims GitHub Actions runs lint/type-check/build, but no workflow files under `.github/workflows/` are present in this repo during this audit (README.md).

Observability:
- No monitoring integrations in code; `todo.md` calls out Sentry as a TODO (todo.md).
- Errors are logged with `console.error`/`console.warn` in routes and hooks (src/app/api/submit-form/route.ts, src/contexts/auth-context.tsx).

## 10) Conventions for future agents

Coding style and patterns:
- Prefer data access via React Query hooks in `src/hooks/*` and Supabase JS client (src/hooks/*, src/lib/supabase-client.ts).
- After updating the live Supabase schema or `supabase/remote-schema.sql`, run `python3 scripts/reconcile-schema.py` to detect drift (scripts/reconcile-schema.py).
- Regenerate `src/types/supabase.ts` from the linked project after schema changes (`npx supabase@latest gen types typescript --linked --schema public`) (src/types/supabase.ts).
- Keep DB constraints and RPCs in Supabase migrations and reference them from hooks (supabase/migrations/*.sql, src/hooks/*).
- Use `@/*` path alias for imports (tsconfig.json).
- UI components are composed from primitives in `src/components/ui/*` (src/components/ui/*).

Do-not-break invariants:
- Keep `questions` order consistent with the `reorder_questions` RPC to avoid unique constraint collisions (supabase/migrations/024_rewrite_reorder_questions_atomic.sql, src/hooks/use-questions.ts).
- Public form access depends on `forms.is_active` and RLS policies; do not remove these checks (supabase/migrations/002_rls_policies.sql, src/hooks/use-public-form.ts).
- `submit-form` must validate question IDs and required fields before inserts to avoid orphaned data (src/app/api/submit-form/route.ts).
- Terms acceptance gating relies on `LEGAL_VERSION` and user metadata checks; update both if legal docs change (src/middleware.ts, src/lib/legal.ts, src/components/auth/accept-terms-form.tsx).
- CSP headers are set in `next.config.js`; adding new external scripts or domains requires updating `contentSecurityPolicy` (next.config.js).
- QR codes are expected to exist for each form (default QR logic in `src/lib/qr-codes.ts` and `src/components/qr/qr-code-list.tsx`).

## 11) Known issues / tech debt / roadmap hints

- TODOs: add Sentry monitoring and Playwright e2e tests (todo.md).
- Auth UX gaps: `/auth/forgot-password` and `/auth/reset-password` pages are referenced but not implemented (src/components/auth/login-form.tsx, src/contexts/auth-context.tsx).
- Plan schema mismatch: `use-plans` expects fields like `max_responses_per_month` and `max_qr_codes_per_form` which do not exist in migrations (src/hooks/use-plans.ts vs supabase/migrations/001_initial_schema.sql).
- Seed data mismatch: migrations mark Free plan unlimited and disable paid plans, but `supabase/seed.sql` and `supabase/seed/001_plans.sql` include multiple paid plans with different pricing (supabase/migrations/019_make_free_unlimited.sql, supabase/seed.sql, supabase/seed/001_plans.sql).
- Analytics freshness depends on the pg_cron job that refreshes materialized views; if pg_cron is not available in an environment, analytics can be stale (supabase/migrations/004_materialized_views.sql).
- Unused code: `src/lib/supabase.ts` and `src/lib/supabase-server.ts` exist but are not imported in `src/` during this audit (src/lib/supabase.ts, src/lib/supabase-server.ts).

## 12) Agent workflow: how to use and maintain AGENTS.md

AGENTS.md is a living document.
- After any meaningful change (feature, refactor, behavior change, config change):
  - Include an "AGENTS.md Update Patch" section in your response describing what needs to change.
  - Ask the user: "Add these updates to AGENTS.md?" (yes/no).
  - If yes, apply the patch and keep AGENTS.md consistent with the code.

Last updated: 2026-01-09
