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
