"use client";

import type { UserMenuUser } from "@/components/UserMenu";
import { UserMenu } from "@/components/UserMenu";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "Home" },
  { href: "/stats", label: "Stats" },
  { href: "/friends", label: "Friends" },
];

function isActive(pathname: string, href: string) {
  return href === "/dashboard"
    ? pathname.startsWith("/dashboard")
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  user,
  children,
}: {
  user: UserMenuUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [home, stats, friends] = nav;
  const fabActive = pathname.startsWith("/games");

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-6">
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-10 border-t border-white/10 bg-background/95 backdrop-blur"
        aria-label="Main navigation"
      >
        <div className="relative mx-auto grid max-w-lg grid-cols-5 items-center gap-1 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
          <div className="flex items-center justify-center">
            <UserMenu user={user} compact />
          </div>
          <NavCell
            href={home.href}
            label={home.label}
            active={isActive(pathname, home.href)}
          />
          <div className="relative flex min-h-[3.5rem] justify-center">
            <Link
              href="/games/new"
              className={`absolute bottom-9 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/30 transition hover:brightness-110 active:scale-[0.98] ${
                fabActive
                  ? "ring-2 ring-white/35 ring-offset-2 ring-offset-background"
                  : "ring-4 ring-background"
              }`}
              aria-label="Log new game"
            >
              <PlusIcon />
            </Link>
          </div>
          <NavCell
            href={stats.href}
            label={stats.label}
            active={isActive(pathname, stats.href)}
          />
          <NavCell
            href={friends.href}
            label={friends.label}
            active={isActive(pathname, friends.href)}
          />
        </div>
      </nav>
    </div>
  );
}

function NavCell({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <div className="flex">
      <Link
        href={href}
        className={`inline-flex w-full min-h-[44px] flex-col items-center justify-center rounded-lg px-1.5 text-center text-xs font-medium leading-tight transition active:scale-[0.92] sm:text-sm ${
          active
            ? "bg-primary/20 text-primary"
            : "text-muted hover:bg-white/5 hover:text-foreground"
        }`}
      >
        {label}
      </Link>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
