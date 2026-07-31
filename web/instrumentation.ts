export async function register() {
  // Only run in the Node.js server runtime, not the edge runtime or browser.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { config } = await import("@/lib/config");
  const { logger } = await import("@/lib/logger");

  // Accessing config eagerly forces the required-env-var checks to run at
  // server startup rather than lazily on the first request that touches
  // the database.
  logger.info("server starting", {
    isProduction: config.isProduction,
    sessionCookieName: config.sessionCookieName,
  });
}
