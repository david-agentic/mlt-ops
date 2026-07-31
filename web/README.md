# MLT Ops — web

The entire running application. A single Next.js 16 (App Router) app —
there is no separate backend service in production; Server Actions and
Route Handlers in this project are the API layer.

See the [root README](../README.md) for the product overview. This file is
the technical reference.

## Folder structure

```
web/
├── app/                      Routes (App Router)
│   ├── (auth)/login/         Public login page
│   ├── admin/                Admin portal (dashboard, orders, products,
│   │                         resellers, team)
│   ├── reseller/             Reseller portal (catalog, orders)
│   ├── finance/              Finance portal (queue, per-order Finance Desk)
│   ├── shipping/             Shipping portal (pack/dispatch/deliver queues)
│   ├── api/health/           Health check endpoint
│   ├── error.tsx             Route-level error boundary
│   ├── global-error.tsx      Root-layout error boundary
│   └── not-found.tsx         404 page
├── components/               Shared UI: shadcn/ui primitives (components/ui/),
│                             dashboard widgets, order/finance/shipping
│                             building blocks, design-system primitives
│                             (EmptyState, ErrorState, loading skeletons)
├── db/
│   ├── schema/               Drizzle schema, split by domain (auth, catalog,
│   │                         orders, resellers, settings)
│   └── seed.ts                Demo data + demo accounts (`npm run db:seed`)
├── lib/
│   ├── actions/               Server Actions — the actual "API" layer
│   ├── auth/                  Password hashing, sessions, role guards,
│   │                          login rate limiting
│   ├── analytics/             Read-side queries for dashboards (Mission
│   │                          Control, Finance Desk risk profile, Product
│   │                          Intelligence)
│   ├── orders/                Order state-machine helpers (single source of
│   │                          truth for valid status transitions)
│   ├── validation/            Zod schemas, shared by Server Actions and
│   │                          React Hook Form on the client
│   ├── config.ts              Env var validation (fails fast if misconfigured)
│   └── logger.ts               Minimal structured (JSON) logger
└── instrumentation.ts         Runs once at server boot — forces config
                                validation eagerly rather than on first request
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in `DATABASE_URL` at minimum.
See `.env.example` for the full list and what each one is for.

## Scripts

```bash
npm run dev          # start the dev server
npm run build        # production build
npm run start        # run a production build locally
npm run lint         # ESLint
npm run test         # unit tests (Vitest)
npm run test:watch   # unit tests, watch mode
npm run db:push      # push the Drizzle schema to your Postgres database
npm run db:seed      # seed demo data + demo accounts
npm run db:studio    # open Drizzle Studio (visual DB browser)
```

## Authentication model

Cookie-based sessions, not JWT. On login: password checked with
`crypto.scrypt` (per-user random salt, `timingSafeEqual` comparison), a
random 32-byte session token is stored in Postgres (`sessions` table) and
set as an `httpOnly` cookie. `getCurrentUser()` (`lib/auth/session.ts`) looks
up that token on every request. `requireRole()` (`lib/auth/guard.ts`) is
called at the top of every portal layout and every Server Action —
authorization is enforced server-side, never only hidden in the UI.

Notable hardening already in place:
- Login timing is normalized so response time can't reveal whether an
  account exists (`DUMMY_PASSWORD_HASH` in `lib/auth/password.ts`).
- Simple in-memory sliding-window rate limiting on login attempts
  (`lib/auth/rate-limit.ts`) — noted as in-memory/single-instance; move to
  Postgres/Redis if this ever runs multi-instance.
- A reseller-role user's access is revoked if their reseller company account
  is deactivated, even if their individual login is still marked active.
- Every mutating Server Action re-checks the role server-side; there is no
  action that trusts a role passed from the client.
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, HSTS) are set in `next.config.ts`.
  **No Content-Security-Policy is set** — deliberately deferred, since a
  wrong CSP silently breaks hydration/inline scripts and this hasn't been
  tested against one live; see "Known gaps" below.

## Database

Neon Postgres via Drizzle ORM. Schema lives in `db/schema/`, split by
domain. Key tables: `users`, `sessions`, `resellers`, `products`, `orders`,
`order_items`, `payment_proofs`, `payment_verifications`, `finance_notes`,
`shipments`, `app_settings`.

- `order_status` is a plain `text` column with an app-level const array
  (`ORDER_STATUSES`), not a Postgres enum — deliberately, so new statuses
  can be added later without an `ALTER TYPE` migration.
- CHECK constraints guard against negative prices/amounts and non-positive
  quantities at the database level, as defense-in-depth beyond the Zod
  validation in `lib/validation/`.
- Soft-delete only: no table has a hard-delete path exposed anywhere in the
  app. Products, resellers, and users all use an `active` boolean instead.

## Cloudflare deployment — read before attempting

This app currently targets standard Node.js hosting (e.g. Vercel), which
works with zero adapter configuration. **Deploying to Cloudflare Workers has
not been attempted or configured** — there is no `wrangler.jsonc` or
OpenNext config for this app (the only `wrangler.jsonc` in the repo belongs
to the unused `api/` scaffold, not this app). Two specific things would need
verifying before it's safe to try:

1. **`crypto.scrypt` CPU cost.** Password hashing in `lib/auth/password.ts`
   uses Node's `crypto.scrypt`, which is deliberately slow. Cloudflare
   Workers enforce a per-request CPU time budget; whether scrypt at this
   project's cost parameters fits that budget depends on the Workers plan
   and hasn't been measured against a real Workers runtime.
2. **`lib/illustrations.ts` uses `fs.existsSync`** to check whether an
   illustration file has been downloaded. Cloudflare Workers have no
   Node-style filesystem access to `public/`, even with the `nodejs_compat`
   flag — this check would need to be replaced with a build-time manifest
   (a static list of available filenames) instead of a runtime `fs` call.
   Low risk today only because no illustration files exist yet, so this
   code path always returns "not found" regardless of environment.

Both are fixable, but deliberately not touched blind — fixing them requires
either a live Cloudflare account to measure against, or accepting a rewrite
with no way to verify it actually works. If Cloudflare hosting is required,
treat that as its own scoped task: install `@opennextjs/cloudflare`,
generate the Workers config, and resolve the two items above before or
during that work — not by guessing at config now.

## Known gaps (honest, not hidden)

- No Content-Security-Policy header (see above).
- No committed E2E test suite — verification during development used
  throwaway Playwright scripts, not a maintained suite.
- No self-service "forgot password" flow for resellers/staff — an
  admin-triggered reset (Team page, or a future reseller-user reset) covers
  the operational need without requiring email infrastructure, which
  doesn't exist yet.
- Reseller-portal user password reset (as opposed to staff) is not yet
  exposed in the UI, only the underlying `resetUserPassword` action, which
  works for any user regardless of role.
