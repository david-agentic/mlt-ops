function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". Check web/.env.local.`,
    );
  }
  return value;
}

export const config = {
  databaseUrl: requireEnv("DATABASE_URL"),
  sessionCookieName: process.env.SESSION_COOKIE_NAME || "mlt_session",
  isProduction: process.env.NODE_ENV === "production",
};
