// Some modules under test (e.g. lib/auth/lockout.ts) import "@/db" at the
// top level, which requires DATABASE_URL to be set (lib/config.ts fails
// fast otherwise). Vitest doesn't load .env files itself the way Next's own
// tooling does, so load it the same way db/seed.ts already does.
import "dotenv/config";
