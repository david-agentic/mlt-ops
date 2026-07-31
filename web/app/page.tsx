import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { PORTAL_HOME } from "@/lib/auth/guard";

export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? PORTAL_HOME[user.role] : "/login");
}
