# MLT Ops

A business operations platform for B2B distribution companies — order
management, payment verification, warehouse fulfillment, and operational
intelligence in one system, replacing a fragile spreadsheet-based workflow.

Built for a real UK B2B distributor as the first customer. See
[`web/README.md`](web/README.md) for the technical README of the actual
running application.

## Repository layout

```
mlt-ops/
├── web/    ← the application (Next.js). Everything real lives here.
└── api/    ← an unused, early Cloudflare Workers + Hono scaffold.
              Not wired to anything — see api/README.md.
```

Only one service is running: `web/`. Business logic, the database layer,
authentication, and all four portals (Admin, Reseller, Finance, Shipping)
live there as a single Next.js application talking directly to Postgres —
there is no separate API server in production.

## What it does

Four portals sharing one login system and one database, each scoped to a role:

- **Admin** — Mission Control dashboard (business health, revenue, cash
  expected, today's shipping goal, live activity feed, alerts), order
  management, product intelligence (stock/margin/trend per product), reseller
  management, team/staff account management, order timeline detail view.
- **Reseller** — browse catalog, place orders, upload payment proof, track
  order status.
- **Finance** — a full "Finance Desk" per order: payment proof, claimed vs.
  expected amount, this customer's order/payment history, a derived risk
  profile (dispute count, average days-to-pay), notes, and
  approve/partial-approve/reject/hold/escalate actions.
- **Shipping** — a warehouse workspace: packing checklists, weight/dimension
  capture, printable QR-coded courier labels, pack → dispatch → deliver queues.

## Tech stack

- **Next.js 16** (App Router), React 19, TypeScript (strict)
- **Drizzle ORM** + **Neon Postgres**
- **shadcn/ui** (Base UI primitives) + **Tailwind CSS v4** + **Framer Motion**
- **React Hook Form + Zod** for forms/validation
- **TanStack Table** for data grids
- Custom cookie-session authentication (scrypt password hashing, no
  third-party auth provider)
- **Vitest** for unit tests

## Getting started

```bash
cd web
npm install
cp .env.example .env.local   # fill in DATABASE_URL
npm run db:push              # apply schema to your Postgres
npm run db:seed              # seed demo data + demo accounts
npm run dev
```

Then open http://localhost:3000 — you'll be redirected to `/login`.

**Demo accounts** (password `password123` for all, created by `db:seed`):

| Role | Email |
|---|---|
| Admin | `admin@mltops.demo` |
| Finance | `finance@mltops.demo` |
| Shipping | `shipping@mltops.demo` |
| Reseller | `reseller1@mltops.demo` |

## Testing

```bash
cd web
npm run test        # unit tests (Vitest) — validation schemas, order
                     # timeline logic, password hashing, formatters
npm run lint         # ESLint
npx tsc --noEmit     # type-check
```

There is no browser/E2E test suite committed to the repo yet — every feature
in this project has instead been verified end-to-end with a real Playwright
browser session during development (not just type-checked), but those
scripts were throwaway verification tools, not a maintained suite. Adding a
real Playwright suite covering the golden-path order lifecycle
(place → verify → pack → dispatch → deliver) across all four roles is the
natural next step here.

## Deployment status

Not yet deployed anywhere. The app is Node-runtime Next.js and deploys
cleanly to any standard Next.js host (Vercel, Node server, etc.) with no
adapter needed. Deploying to **Cloudflare Workers** instead requires the
`@opennextjs/cloudflare` adapter and has two specific, unverified
compatibility risks worth resolving first — see the "Cloudflare deployment"
section of `web/README.md` for exact details before attempting it.

## Documentation

- [`web/README.md`](web/README.md) — architecture, environment variables,
  scripts, folder structure, and the Cloudflare deployment gap analysis.
- [`api/README.md`](api/README.md) — why this folder exists and why it's unused.
