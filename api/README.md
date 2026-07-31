# ⚠️ Not in use

This directory is the original Cloudflare Workers + Hono scaffold generated
when the project started. Early in the build, the architecture was
deliberately changed to a **single Next.js app** (see `../web/`) — all
business logic, the database layer (Drizzle + this same Neon Postgres),
authentication, and every portal live there instead. Nothing in `web/`
imports from or depends on this folder.

It's kept in version control rather than deleted because removing it wasn't
explicitly requested and it costs nothing to leave in place, but **it is not
part of the running application** and should not be assumed to be wired up
to anything. If you're looking for the API layer, it's the Server Actions
under `web/lib/actions/`.

If a real standalone API (e.g. for a future public/partner integration) is
ever needed, this scaffold could be revived — but that hasn't happened yet.

---

Original scaffold instructions (for reference only):

```txt
npm install
npm run dev
```

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiating `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
