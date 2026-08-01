import "server-only";
import { config } from "@/lib/config";
import { logger } from "@/lib/logger";
import { passwordResetEmail, invitationEmail } from "./templates";

async function send(to: string, subject: string, html: string) {
  if (!config.resendApiKey) {
    // No provider configured yet — log instead of sending so the whole
    // flow (token generation, expiry, single-use) is testable end to end
    // without blocking on a Resend account. Switches to real delivery the
    // moment RESEND_API_KEY is set, no code change needed.
    logger.info("email (not sent, no provider configured)", { to, subject, html });
    return;
  }

  // Imported dynamically so the "resend" package is only ever loaded on the
  // one code path that actually sends email — every other server action
  // (login, logout, etc.) that merely imports this module doesn't need to
  // evaluate it at all.
  const { Resend } = await import("resend");
  const resend = new Resend(config.resendApiKey);

  const result = await resend.emails.send({
    from: config.resendFromEmail,
    to,
    subject,
    html,
  });

  if (result.error) {
    logger.error("email send failed", { to, subject, error: result.error.message });
    throw new Error("Failed to send email");
  }
}

export async function sendPasswordResetEmail(to: string, link: string) {
  const { subject, html } = passwordResetEmail(link);
  await send(to, subject, html);
}

export async function sendInvitationEmail(
  to: string,
  link: string,
  inviterName: string,
) {
  const { subject, html } = invitationEmail(link, inviterName);
  await send(to, subject, html);
}
