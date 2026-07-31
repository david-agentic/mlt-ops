/**
 * Registry of illustration files that have actually been downloaded into
 * public/illustrations/. Add a filename here once the real file exists.
 *
 * Deliberately NOT implemented with a runtime fs.existsSync check: that
 * approach doesn't work on Cloudflare Workers (no Node-style filesystem
 * access to public/, even with the nodejs_compat flag), so this stays a
 * plain constant that works identically on any runtime (Node, Workers,
 * edge). No "server-only" restriction needed either, for the same reason —
 * safe to import from both Server and Client Components.
 */
const KNOWN_ILLUSTRATIONS = new Set<string>([
  // "empty-orders.svg",
  // "empty-finance.svg",
]);

export function illustrationPath(name: string): string | null {
  return KNOWN_ILLUSTRATIONS.has(name) ? `/illustrations/${name}` : null;
}
