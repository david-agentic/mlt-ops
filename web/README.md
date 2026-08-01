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
│   ├── (auth)/forgot-password/   Request a password-reset email
│   ├── (auth)/reset-password/[token]/   Set a new password from that email
│   ├── invite/[token]/       Accept an admin-sent invitation, set a password
│   ├── account/change-password/  Any logged-in user changes their own password
│   ├── admin/                Admin portal (dashboard, orders, products,
│   │                         resellers, team, audit log)
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
│                             (EmptyState, ErrorState, loading skeletons),
│                             auth/set-new-password-form.tsx (shared by the
│                             reset-password and invite-accept pages)
├── db/
│   ├── schema/               Drizzle schema, split by domain (auth, catalog,
│   │                         orders, resellers, settings)
│   └── seed.ts                Demo data + demo accounts (`npm run db:seed`)
├── lib/
│   ├── actions/               Server Actions — the actual "API" layer
│   │                          (auth.ts, users.ts, audit.ts, ...)
│   ├── auth/                  Password hashing (password.ts), sessions
│   │                          (session.ts), role guards (guard.ts),
│   │                          login lockout (lockout.ts)
│   ├── email/                 Resend wrapper + HTML templates for password
│   │                          reset / invitation emails
│   ├── analytics/             Read-side queries for dashboards (Mission
│   │                          Control, Finance Desk risk profile, Product
│   │                          Intelligence)
│   ├── orders/                Order state-machine helpers (single source of
│   │                          truth for valid status transitions)
│   ├── validation/            Zod schemas, shared by Server Actions and
│   │                          React Hook Form on the client (includes the
│   │                          shared password-strength schema)
│   ├── config.ts              Env var validation (fails fast if misconfigured)
│   └── logger.ts               Minimal structured (JSON) logger
└── instrumentation.ts         Runs once at server boot — forces config
                                validation eagerly rather than on first request
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in `DATABASE_URL` at minimum.
See `.env.example` for the full list and what each one is for. `RESEND_API_KEY`,
`RESEND_FROM_EMAIL`, and `APP_URL` are new (password reset / invitation
emails) — all optional at the config level: without `RESEND_API_KEY`, emails
are logged instead of sent, so the whole flow is testable before a real
provider is wired up.

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
up that token on every request, and transparently renews the session
(extends `expiresAt`, refreshes the cookie) once less than half its 14-day
lifetime remains, so an active user is never surprised by a sudden logout.
`requireRole()` (`lib/auth/guard.ts`) is called at the top of every portal
layout and every Server Action; `requireUser()` is the same but for any
authenticated role, used by the account-level change-password page —
authorization is enforced server-side, never only hidden in the UI.

### Password hashing: why scrypt, not bcrypt/argon2

The original ask was Argon2 or bcrypt. This app deploys to Cloudflare
Workers, and that constrains the choice more than it might first appear:
bcrypt's real implementations are native Node addons and simply do not run
on Workers; Argon2 is the same story, or a pure-JS fallback slow enough to
be impractical at real request volume. `crypto.scrypt` is a NIST/OWASP
-acceptable memory-hard KDF built into Node's own `crypto` module, and it's
already proven working in this exact Cloudflare deployment. Cost parameters
were raised from Node's defaults (`N=16384` → `N=32768`, `r=8`, `p=1`) and
hashes are now self-describing (`scrypt:N:r:p:salt:key`), so a future cost
increase doesn't invalidate every existing password the way a bare
`salt:key` format would — `verifyPassword` reads back whichever parameters
a given hash was actually created with, and still accepts the older
bare-format hashes from before this change.

### Login hardening

- **Timing-safe user enumeration resistance**: the same scrypt comparison
  always runs, even for a nonexistent email, against a fixed dummy hash
  (`DUMMY_PASSWORD_HASH` in `lib/auth/password.ts`), so response timing
  can't reveal whether an account exists.
- **Account lockout, persisted in Postgres** (`lib/auth/lockout.ts`), not
  in-memory: 5 failed attempts locks the account for 15 minutes
  (`users.failedLoginAttempts` / `users.lockedUntil`). This replaces an
  earlier in-memory rate limiter that was flagged as unsound for a
  Cloudflare Workers deployment, where there's no guarantee of a single
  persistent process to hold that state — it's now correct regardless of
  how many isolates are running. A locked-out login attempt gets an
  explicit "try again in N minutes" message; this is a deliberate, standard
  trade-off (it reveals the account exists) accepted by essentially every
  system with a lockout feature.
- Every login attempt — success, failure, and lockout — is written to
  `audit_log` (`lib/actions/audit.ts`), including the requester's IP
  (`cf-connecting-ip`), not just to the structured logger.
- A reseller-role user's access is revoked if their reseller company account
  is deactivated, even if their individual login is still marked active.
  Soft-deleted users (`deletedAt` set) are likewise rejected at session
  lookup, not just hidden from the admin UI.

### Password reset, invitations, and change-password

- **Forgot password** (`/forgot-password` → `requestPasswordReset`): always
  returns the same generic message regardless of whether the email exists.
  A real request generates a 256-bit random token (`generateToken()`),
  stores only its SHA-256 hash (`password_reset_tokens.tokenHash`) with a
  20-minute expiry, and emails the raw token as a link. The raw token is
  never persisted anywhere — a database read alone can't produce a usable
  reset link.
- **Reset password** (`/reset-password/[token]` → `resetPasswordAction`):
  validates the token by hashing the incoming value and matching it,
  checking `usedAt IS NULL` and `expiresAt > now`. On success: sets the new
  password, marks the token used (single-use, enforced by that same check,
  verified with a real second-attempt test), and destroys **every** session
  for that user.
- **Email invitations** (admin "Send invite" in Team → `inviteStaffUser` →
  `/invite/[token]` → `acceptInvitationAction`): the same token-hash pattern
  as reset, but a separate `invitations` table and a 72-hour expiry, since
  an invitation *creates* a password rather than replacing one. The invited
  user's row starts with an unusable placeholder hash
  (`DUMMY_PASSWORD_HASH`) — the account cannot be logged into at all until
  the invitation is accepted.
- **Change password** (any authenticated user, `/account/change-password` →
  `changePasswordAction`): requires the real current password (a genuine
  check here, not timing-normalized — the user is already authenticated),
  enforces the same password-strength rule as reset/invite, and destroys
  every *other* session for that account while deliberately leaving the
  current one alone, so changing your password doesn't log you out of the
  action that just did it.
- **Forced password change**: `users.mustChangePassword` is set on
  admin-created accounts (temporary-password flow) and admin-triggered
  resets, and cleared on any successful self-service password set. Each
  portal layout checks it right after `requireRole()` and redirects to
  `/account/change-password` if set — there is no page a user with this
  flag can reach without changing their password first.
- **Password strength** (`lib/validation/password.ts`, shared by every
  password-setting path): minimum 12 characters, at least 3 of
  {lowercase, uppercase, digit, symbol}, and a small denylist of common
  passwords. No breached-password API — judged out of scope for this stage.

### CSRF

No separate CSRF token library is used, deliberately. Every mutation in
this app is a Next.js Server Action, and Server Actions already enforce a
same-origin check on the request (comparing the `Origin` header against
the deployment's own origin) before your action code ever runs — a second,
hand-rolled token layer on top would be redundant defense against the same
threat, not additional protection. This only holds because there are no
plain state-changing `app/api/*` route handlers in this app (the one route
handler, `/api/health`, is a read-only `GET`) — if one is ever added for a
mutation, it would need its own explicit CSRF/origin check, since that
Server Actions guarantee wouldn't cover it.

### User management (Admin only)

`lib/actions/users.ts`, backing `/admin/team`: create (temporary password
or email invite), edit (name/email/role), reset another user's password
(forces `mustChangePassword` and destroys their sessions), enable/disable,
and soft delete (`deletedAt` set, `active` cleared, sessions destroyed —
the row is kept for audit history, never hard-deleted). Every one of these
writes an `audit_log` row via `logAudit()` in addition to the existing
structured-log calls. `/admin/audit` is a read-only view of the most recent
200 events (login/logout, password changes, lockouts, every user-management
action), joined back to the actor and target user's name/email.

### Cookies

`httpOnly: true` always; `secure` in production only (so plain HTTP still
works for local dev); `sameSite: "lax"`. Session tokens are 256-bit random
values used as an opaque bearer token (the session row's own primary key),
never a signed/decodable JWT — there's nothing to forge, only a token to
guess, which isn't feasible at that entropy.

### Other hardening already in place

- Every mutating Server Action re-checks the role server-side; there is no
  action that trusts a role passed from the client.
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, HSTS) are set in `next.config.ts`.
  **No Content-Security-Policy is set** — deliberately deferred, since a
  wrong CSP silently breaks hydration/inline scripts and this hasn't been
  tested against one live; see "Known gaps" below.

### Security review — what this section is not

This is architecture documentation written alongside the implementation,
not an independent audit. It should not be read as a substitute for one
before handling real customer payment data at scale — in particular, get a
second pair of eyes on the CSRF reasoning above and the lockout's
enumeration trade-off before relying on either under real adversarial
traffic.

## Database

Neon Postgres via Drizzle ORM. Schema lives in `db/schema/`, split by
domain. Key tables: `users`, `sessions`, `password_reset_tokens`,
`invitations`, `audit_log`, `resellers`, `products`, `orders`,
`order_items`, `payment_proofs`, `payment_verifications`, `finance_notes`,
`shipments`, `app_settings`.

- `users` carries the auth bookkeeping fields directly rather than a
  separate table: `lastLoginAt`, `passwordChangedAt`, `mustChangePassword`,
  `failedLoginAttempts`, `lockedUntil`, `deletedAt` (soft delete).
- `password_reset_tokens` / `invitations` store only a SHA-256 hash of
  their token, never the raw value, plus `expiresAt` and a nullable
  `usedAt` that make each one single-use.
- `audit_log` is append-only: `actorUserId` (nullable — some events like a
  failed login have no authenticated actor), `targetUserId`, `action`,
  `metadata` (jsonb), `ipAddress`, `createdAt`.

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
adapter is configured (`wrangler.jsonc`, `open-next.config.ts`) and **fully
working, verified against the real Neon database on the real Cloudflare
network** — not just a successful build. `npm run cf:build` produces a
working Workers bundle, all 16 routes compile, TypeScript passes, and
`/api/health` returns `{"status":"ok","database":"connected"}` both from
local `wrangler dev` and from `opennextjs-cloudflare preview --remote` on
the live Cloudflare network (with a real request to `/login` served too).

**What the blocker actually was, and how it was fixed:** the `postgres` npm
package ships a dedicated Cloudflare-Workers-compatible build (using the real
`cloudflare:sockets` API) behind a `"workerd"` export condition in its
`package.json`. Turbopack (Next's bundler) has no option to select an export
condition, so `next build` was always resolving `postgres`'s default
Node-oriented build — which has no real socket implementation on Workers —
confirmed by grepping the built output for `cloudflare:sockets` and finding
zero matches at every stage. The connection attempt just hung until timeout
instead of failing fast.

The fix, in `next.config.ts`: Turbopack does support aliasing one import
specifier straight to another file (`turbopack.resolveAlias`), so `postgres`
is aliased directly to `postgres/cf/src/index.js` — the file behind that
`workerd` condition — but **only** when `MLT_CLOUDFLARE_BUILD=1` is set (set
by the `cf:build`/`cf:preview`/`cf:deploy` npm scripts via `cross-env`, not
detected from `npm_lifecycle_event`, since `opennextjs-cloudflare build`
internally re-invokes `npm run build` and that resets it back to `"build"`).
The plain Node/Vercel build path is completely unaffected — verified with a
clean `npm run build` after the change — since it still resolves `postgres`'s
normal Node build, which is what a real Node server needs.

One thing worth flagging honestly: an earlier pass in this document
recommended, as a fallback, switching the driver to
`@neondatabase/serverless` + `drizzle-orm/neon-http` if the Turbopack fix
didn't pan out. Before attempting that, the actual `drizzle-orm/neon-http`
session implementation was read directly (not assumed) — its `.transaction()`
doesn't "batch statements into one HTTP call" as originally guessed, it
**throws `"No transactions support in neon-http driver"` outright**. Every
`db.transaction()` call in `lib/actions/orders.ts` and `lib/actions/users.ts`
would have broken at runtime, not just changed semantics — a much bigger and
riskier change than documented here previously.

### A second, unresolved production issue: DB connectivity is unreliable, and gets worse with more sequential queries

The app was actually deployed live (`https://mlt-ops-web.business-portal.workers.dev`,
account `David-Agentic.Hub`) to test the fix above under real traffic, not
just a preview. Doing so surfaced a **second, distinct, still-unresolved
problem** with the database connection itself, independent of the driver
-resolution fix above (which is confirmed working on its own).

**First observation** (single-query requests): `/api/health` (one
`select 1`) failed roughly every other request with
`{"status":"error","database":"unreachable","error":"Failed query: select 1"}`
— a real, deterministic ~50% failure rate, not occasional flakiness. Ruled
out with real evidence at the time: not the driver fix (confirmed working
separately), not connection-pool sizing (tried two different `max`/
`idle_timeout` configs, identical failure rate both times), not Neon itself
(a local Node script against the same database succeeded 8/8 at the same
request cadence, outside Cloudflare entirely).

**Second observation, found while building the auth system in a later
session**: any Server Action that runs **more than one** sequential query —
which is every real mutation in this app, including the new `loginAction`
(select user, then update, then insert) — failed **100% of the time** on a
real `opennextjs-cloudflare preview --remote` session, not ~50%. This was
checked carefully before concluding it was the same issue and not a new bug
introduced by the auth work:
- `/api/health` (still one query) succeeded reliably on the same preview
  session, at the same time — ruling out a wholesale regression.
- The failure is silent at the framework level: Next.js's production error
  boundary returns a bare `{"digest":"..."}` with no message, and the
  action's own `try/catch` (added specifically to investigate this) never
  fires — meaning whatever fails, fails outside the action function's own
  execution, most likely in Next's Server Action request-handling machinery
  itself when the underlying query throws, not in application code.
- Ruled out **lazy-loading the `resend` email package** as the cause (it
  seemed like a plausible module-evaluation-time culprit, since it's a new
  dependency on every action in `lib/actions/auth.ts`) — made the import
  fully dynamic, rebuilt, redeployed, and the failure was identical. Not it.
- The same login attempt succeeds every single time on a plain `next dev`
  / `next start` (Node) server — this is Cloudflare Workers–specific.

**What that leaves**: the same underlying DB-connectivity instability as
the first observation, but its failure probability appears to compound
with the number of sequential queries a single request makes — consistent
with (though not proven to be) the same "socket state doesn't survive
across awaits within a Workers request" family of causes floated in the
first investigation. This was not root-caused further in this pass; it
would need the same kind of isolated, minimal reproduction (a bare Worker
issuing 2+ sequential `cloudflare:sockets` queries with no Next.js/OpenNext
layer involved) that would be needed to fully resolve the first observation.

**Practical implication, updated**: this repo's Cloudflare deployment is
**not production-ready**, and the gap is wider than previously documented —
it's not just intermittent reads, it's a near-certain failure on any real
write path (login, order creation, payment verification, anything). The
Node/Vercel deployment path remains fully working — every flow in this
auth system (login, lockout, reset, invite, change-password, admin CRUD,
audit log) was verified end-to-end there with a real Playwright browser
session — and is the only path to actually use until this is resolved.

The other risk flagged in an earlier pass turned out to be a non-issue
once actually tested: `lib/illustrations.ts`'s `fs.existsSync` call has
been removed entirely (replaced with a plain in-code registry).

### Local Cloudflare testing

```bash
cp .dev.vars.example .dev.vars   # wrangler reads this, NOT .env.local
npm run cf:build                # real production build via OpenNext
npm run cf:preview               # runs it locally under workerd
npx opennextjs-cloudflare preview --remote   # runs it on the real Cloudflare network
```

### Deploying for real

```bash
npm run cf:deploy
```

Or connect the GitHub repo in the Cloudflare dashboard (Workers & Pages →
Create → connect to Git) for auto-deploy on push to `main`. Either way,
production secrets are set via `wrangler secret put DATABASE_URL` (and any
others in `.env.example`) — never via a committed file. **Note:** if
connecting via the Cloudflare dashboard's Git integration, its build command
must run `npm run cf:build` (or set `MLT_CLOUDFLARE_BUILD=1` before its own
build step) — a plain `next build` invoked by the dashboard without that
env var would silently regress to the broken Node `postgres` build.

## Known gaps (honest, not hidden)

- No Content-Security-Policy header (see above).
- No committed E2E test suite — verification during development used
  throwaway Playwright scripts, not a maintained suite.
- No email verification step at signup/invite — an invited user's email is
  trusted as entered by the admin; there's no confirmation loop.
- No 2FA/TOTP — `qrcode.react` is a dependency (used elsewhere in the app,
  for shipment labels) but there's no second-factor login flow.
- Real email delivery (password reset / invitations) requires a Resend
  account and `RESEND_API_KEY` — without it, those emails are logged, not
  sent, which is fine for development/testing but not for real users.
- The audit log view (`/admin/audit`) shows only the most recent 200 events
  with no filtering/search UI yet, and no pagination beyond that cap.
- Cloudflare Workers deployment is not production-ready — see "Cloudflare
  deployment" above for the specific, verified reason.
