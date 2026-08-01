function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:32px;">
            <tr><td>
              <h1 style="font-size:18px;margin:0 0 16px;color:#18181b;">${title}</h1>
              ${bodyHtml}
              <p style="font-size:12px;color:#a1a1aa;margin-top:32px;">MLT Ops</p>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td style="background:#18181b;border-radius:6px;">
      <a href="${href}" style="display:inline-block;padding:12px 20px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">${label}</a>
    </td></tr>
  </table>`;
}

export function passwordResetEmail(link: string) {
  return {
    subject: "Reset your MLT Ops password",
    html: layout(
      "Reset your password",
      `<p style="font-size:14px;color:#3f3f46;line-height:1.6;">
        We received a request to reset your MLT Ops password. This link expires in 20 minutes and can only be used once.
      </p>
      ${button(link, "Reset password")}
      <p style="font-size:13px;color:#71717a;line-height:1.6;">
        If you didn't request this, you can safely ignore this email — your password will not change.
      </p>`,
    ),
  };
}

export function invitationEmail(link: string, inviterName: string) {
  return {
    subject: "You've been invited to MLT Ops",
    html: layout(
      "You've been invited to MLT Ops",
      `<p style="font-size:14px;color:#3f3f46;line-height:1.6;">
        ${inviterName} has created an MLT Ops account for you. Set your password to get started — this link expires in 72 hours.
      </p>
      ${button(link, "Set your password")}`,
    ),
  };
}
