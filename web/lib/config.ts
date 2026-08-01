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
  // Email sending is optional at the config level: without RESEND_API_KEY,
  // lib/email falls back to logging the email instead of sending it, so the
  // reset/invite flows are fully testable before a provider is wired up.
  resendApiKey: process.env.RESEND_API_KEY || null,
  resendFromEmail: process.env.RESEND_FROM_EMAIL || "MLT Ops <onboarding@resend.dev>",
  appUrl: process.env.APP_URL || "http://localhost:3000",
};
