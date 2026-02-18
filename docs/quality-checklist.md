# Quality Checklist

Use this as a quick pre-release checklist for Feedback Collector. It is tailored to Next.js + Supabase + Vercel.

## Security and auth
- Confirm Supabase RLS is enabled for all tables and policies cover read/write for accounts, projects, forms, responses, and QR codes.
- Verify OAuth callback and redirect URLs are correct in Supabase and Google.
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is only used server-side and never exposed to the client.
- Review auth middleware rules for protected routes and terms acceptance flow.
- Review API routes for auth checks and rate limiting (client-info, submit-form, delete-account).

## Privacy and compliance
- Confirm legal acceptance metadata is stored on users (see `LEGAL_VERSION`).
- Verify IP hashing uses a strong `IP_HASH_SALT` in every environment.
- Confirm privacy/terms links are up-to-date in the OAuth consent screen.

## Reliability and performance
- Run a production build locally and check for Next.js warnings.
- Check Core Web Vitals/Lighthouse for `/`, `/auth/login`, `/dashboard`.
- Validate middleware size and edge runtime warnings are understood.

## Observability
- Ensure server errors are logged (console output or provider).
- Add a monitoring tool (Sentry or similar) for server and client errors.

## Testing (minimum)
- Unit tests for core helpers (anti-spam, question normalization, rate limit helpers).
- Smoke test that `/auth/login` and `/auth/signup` render without errors.
- Manual OAuth flow test on a fresh account to verify terms acceptance.

## Data and migrations
- Run database migrations in order for new environments.
- Confirm `create_user_account` trigger remains compatible with OAuth signups.

## Deployment
- Vercel env vars set: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `IP_HASH_SALT`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.
- Supabase Edge Function env vars set: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_URL`.
- Supabase URL configuration and redirect URLs match production and preview domains.

## Commands
- `npm run lint`
- `npm run type-check`
- `npm run test`
