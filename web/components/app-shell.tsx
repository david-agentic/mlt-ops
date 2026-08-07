"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronLeft,
  KeyRound,
  LogOut,
  RefreshCcw,
  Search,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Building2,
  Users,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { logoutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth/session";

// Nav config is authored in each portal's (Server Component) layout.tsx and
// passed down as props to this Client Component — so icons must cross that
// boundary as plain, serializable strings, not component references (React
// can't serialize a function/component value in a Server->Client prop).
// This registry resolves the string back to the real icon on the client.
const ICONS = {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Building2,
  Users,
  ShieldCheck,
} satisfies Record<string, LucideIcon>;
export type IconName = keyof typeof ICONS;

export type NavItem = { label: string; href: string; icon: IconName; badge?: number };
export type NavGroup = { label?: string; items: NavItem[] };

const SIDEBAR_COLLAPSE_KEY = "mlt-ops:sidebar-collapsed";
const SIDEBAR_COLLAPSE_EVENT = "mlt-ops:sidebar-collapse-change";

// Sidebar-collapsed is external, persisted state (localStorage), not
// component state — useSyncExternalStore is the correct primitive for
// that (avoids the "setState synchronously in an effect" anti-pattern a
// mount-time localStorage read + setState would otherwise be).
function subscribeToCollapsed(callback: () => void) {
  window.addEventListener(SIDEBAR_COLLAPSE_EVENT, callback);
  return () => window.removeEventListener(SIDEBAR_COLLAPSE_EVENT, callback);
}
function getCollapsedSnapshot() {
  return window.localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "1";
}
function getCollapsedServerSnapshot() {
  return false;
}

export function AppShell({
  portalLabel,
  navGroups,
  user,
  notificationCount = 0,
  children,
}: {
  portalLabel: string;
  navGroups: NavGroup[];
  user: SessionUser;
  notificationCount?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(
    subscribeToCollapsed,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot,
  );
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function toggleCollapsed() {
    window.localStorage.setItem(SIDEBAR_COLLAPSE_KEY, collapsed ? "0" : "1");
    window.dispatchEvent(new Event(SIDEBAR_COLLAPSE_EVENT));
  }

  const allItems = navGroups.flatMap((g) => g.items);

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside
        className={cn(
          "flex shrink-0 flex-col border-r border-border bg-background transition-[width] duration-200",
          collapsed ? "w-[64px]" : "w-[228px]",
        )}
      >
        <div className={cn("flex h-14 items-center border-b border-border px-4", collapsed && "justify-center px-0")}>
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-xs text-primary-foreground">
              M
            </span>
            {!collapsed && <span>MLT Ops</span>}
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-2.5 py-4" aria-label={`${portalLabel} navigation`}>
          {navGroups.map((group, gi) => (
            <div key={group.label ?? gi} className="flex flex-col gap-0.5">
              {group.label && !collapsed && (
                <p className="mb-1 px-2.5 text-caption font-medium tracking-wide text-muted-foreground uppercase">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = ICONS[item.icon];
                const link = (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                      collapsed && "justify-center px-0",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                    {!collapsed && item.badge ? (
                      <Badge variant={active ? "secondary" : "outline"} className="h-4.5 px-1.5">
                        {item.badge}
                      </Badge>
                    ) : null}
                  </Link>
                );
                if (!collapsed) return link;
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger render={link} />
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-2.5">
          <Button
            variant="ghost"
            size="sm"
            className={cn("w-full justify-start gap-2.5", collapsed && "justify-center")}
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
            {!collapsed && <span>Collapse</span>}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{portalLabel}</span>
            <span className="text-caption text-muted-foreground">
              {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="hidden gap-2 text-muted-foreground sm:flex"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-3.5" />
              Search
              <kbd className="ml-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                Ctrl K
              </kbd>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Refresh"
              title="Refresh"
              onClick={() => window.location.reload()}
            >
              <RefreshCcw className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`${notificationCount} alerts`}
              title="Alerts"
              className="relative"
              nativeButton={false}
              render={<Link href="/admin" />}
            >
              <Bell className="size-4" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-semibold text-white">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </Button>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="sm" className="gap-2 pl-1.5">
                    <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {user.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="hidden text-sm md:inline">{user.name}</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={
                    <Link href="/account/change-password">
                      <KeyRound /> Change password
                    </Link>
                  }
                />
                <DropdownMenuSeparator />
                <form action={logoutAction}>
                  <DropdownMenuItem
                    variant="destructive"
                    render={
                      <button type="submit" className="w-full">
                        <LogOut /> Sign out
                      </button>
                    }
                  />
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Jump to</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1">
            {allItems.map((item) => {
              const Icon = ICONS[item.icon];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSearchOpen(false)}
                  className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm hover:bg-muted"
                >
                  <Icon className="size-4 text-muted-foreground" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <p className="text-caption text-muted-foreground">
            Full search is coming soon — for now this jumps straight to a section.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
