import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { logoutAction } from "@/lib/actions/auth";
import type { SessionUser } from "@/lib/auth/session";

export function PortalShell({
  user,
  title,
  nav,
  children,
}: {
  user: SessionUser;
  title: string;
  nav: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="flex items-center justify-between border-b border-border bg-background px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold tracking-tight">
            MLT Ops
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {title}
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user.name}</span>
          <ThemeToggle />
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="icon-sm">
              <LogOut />
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
