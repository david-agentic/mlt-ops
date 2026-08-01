import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, type SessionUser } from "./session";

export const PORTAL_HOME: Record<SessionUser["role"], string> = {
  admin: "/admin",
  finance: "/finance",
  shipping: "/shipping",
  reseller: "/reseller",
};

export async function requireRole(
  role: SessionUser["role"],
): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== role) redirect(PORTAL_HOME[user.role]);
  return user;
}

/** Any authenticated user, regardless of role — for account-level pages
 * (change password) that every portal's users need access to. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Called from each portal layout after requireRole() — forces a user
 * flagged mustChangePassword (new admin-created accounts, admin-triggered
 * resets, self-service resets) to set their own password before reaching
 * any portal page. */
export function redirectIfMustChangePassword(user: SessionUser) {
  if (user.mustChangePassword) redirect("/account/change-password");
}
