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

## Cloudflare deployment

Cloudflare deployment via the [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare)
adapter is configured (`wrangler.jsonc`, `open-next.config.ts`) and **the
build genuinely succeeds** — `npm run cf:build` produces a working Workers
bundle, all 16 routes compile, TypeScript passes. This was tested for real,
including a `--remote` preview on the actual Cloudflare network (not just
local simulation), not just assumed from reading docs.

**There is one confirmed, real blocker: the database does not connect from
Cloudflare Workers.** This was reproduced twice — once in local `wrangler
dev`, once with `opennextjs-cloudflare preview --remote` on the real
Cloudflare network with a live account — both times `/api/health` returned
`{"status":"error","database":"unreachable"}` after a ~30s hang.

**Root cause, confirmed by inspecting the actual build output:** the
`postgres` npm package ships a dedicated Cloudflare-Workers-compatible build
(using the real `cloudflare:sockets` API) behind a `"workerd"` export
condition in its `package.json`. But `next build` resolves and bundles
`postgres` using ordinary Node module resolution *before* OpenNext's
Cloudflare-specific bundling step ever runs — grepping the built output
(`.next/server` and `.open-next/`) for `cloudflare:sockets` returns zero
matches at every stage. The app silently gets the Node-oriented build, which
has no real socket implementation on Workers, so the connection attempt just
hangs until timeout instead of failing fast.

This is a build-tooling/driver-resolution issue, not a logic bug, and it has
two known real fixes — deliberately not applied blind, since both touch
either the build pipeline or the semantics of every `db.transaction()` call
site (payment verification, order creation, shipment updates — code where a
subtly wrong fix has real financial consequences):

1. **Force Next's bundler to resolve `postgres` via its `workerd` condition**
   instead of the default Node one. More surgical (no code changes, no
   transaction-semantics risk), but requires custom Turbopack/webpack
   resolve-condition configuration that isn't well-documented for this exact
   combination (Next 16 + Turbopack + OpenNext) — needs research/trial, not
   guessing.
2. **Switch the driver to `@neondatabase/serverless` + `drizzle-orm/neon-http`**
   — Neon's own officially documented HTTP-based driver for exactly this
   scenario (edge/Workers runtimes with no raw TCP). Well-trodden path, but
   its `db.transaction()` batches all statements into one HTTP call rather
   than true sequential round-trips — every existing transaction (in
   `lib/actions/orders.ts` especially) would need re-verification that this
   still does what it currently does before shipping it.

Either is a scoped, half-day-ish task with a clear success test (the same
`/api/health` check used to diagnose this). Recommend option 2 as the
industry-standard path for Neon+Workers, done as its own reviewed change
given the financial-code surface area it touches — not bundled into a
"deployment audit" pass.

The other two risks flagged in an earlier pass turned out to be non-issues
once actually tested:
- `crypto.scrypt`'s CPU cost was never reached — the request fails at the
  DB layer first. Once the DB issue above is fixed, this needs re-testing;
  `wrangler.jsonc` already raises `limits.cpu_ms` to 50000 as a preemptive
  mitigation (only takes effect on a Workers Paid plan).
- `lib/illustrations.ts`'s `fs.existsSync` call has been removed entirely
  (replaced with a plain in-code registry) — this was a real issue and is
  now fully fixed, not just documented.

### Local Cloudflare testing

```bash
cp .dev.vars.example .dev.vars   # wrangler reads this, NOT .env.local
npm run cf:build                # real production build via OpenNext
npm run cf:preview               # runs it locally under workerd
npx opennextjs-cloudflare preview --remote   # runs it on the real Cloudflare network
```

### Deploying for real (once the DB driver issue above is resolved)

```bash
npm run cf:deploy
```

Or connect the GitHub repo in the Cloudflare dashboard (Workers & Pages →
Create → connect to Git) for auto-deploy on push to `main`. Either way,
production secrets are set via `wrangler secret put DATABASE_URL` (and any
others in `.env.example`) — never via a committed file.

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
