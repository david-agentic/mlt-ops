// "server-only" throws when imported outside Next's own build (it can't
// tell whether it's been bundled into a Client Component). Under Vitest
// there's no such bundling step at all, so alias it to this no-op stub —
// see vitest.config.mts.
export {};
