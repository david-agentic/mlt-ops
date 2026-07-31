import "server-only";
import { existsSync } from "fs";
import path from "path";

/**
 * Resolves an illustration filename to a public URL if it has been
 * downloaded, or null otherwise. Server Components only -- never import
 * this from a "use client" file, since `fs` cannot be bundled for the
 * browser. Client components that need an illustration must receive the
 * resolved URL as a prop from their parent Server Component.
 */
export function illustrationPath(name: string): string | null {
  const filePath = path.join(process.cwd(), "public", "illustrations", name);
  return existsSync(filePath) ? `/illustrations/${name}` : null;
}
