"use client";

import type { UserMenuUser } from "@/components/UserMenu";
import { UserMenu } from "@/components/UserMenu";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "Home" },
  { href: "/games/new", label: "Log game" },
  { href: "/stats", label: "Stats" },
  { href: "/friends", label: "Friends" },
];

export function AppShell({
  user,
  children,
}: {
  user: UserMenuUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
          <UserMenu user={user} />
          <nav className="flex min-w-0 flex-1 flex-wrap justify-end gap-1 text-xs sm:text-sm">
            {nav.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname.startsWith("/dashboard")
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-2 py-1.5 font-medium transition sm:px-3 ${
                    active
                      ? "bg-primary/20 text-primary"
                      : "text-muted hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {children}
      </main>
    </div>
  );
}
