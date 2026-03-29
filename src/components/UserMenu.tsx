"use client";

import { logout } from "@/app/actions/auth";
import { UserAvatar } from "@/components/UserAvatar";
import { useEffect, useRef, useState } from "react";

export type UserMenuUser = {
  id: string;
  username: string;
  avatar_url: string | null;
};

export function UserMenu({ user }: { user: UserMenuUser }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[44px] max-w-[min(100vw-2rem,14rem)] items-center gap-2 rounded-xl border border-white/10 bg-card py-1 pl-1 pr-2 text-left transition hover:border-primary/40 hover:bg-white/[0.04] active:scale-[0.99]"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account menu for ${user.username}`}
      >
        <UserAvatar
          username={user.username}
          avatarUrl={user.avatar_url}
          size="sm"
        />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {user.username}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open ? (
        <div
          className="absolute left-0 top-[calc(100%+6px)] z-50 w-[min(calc(100vw-2rem),16rem)] rounded-xl border border-white/10 bg-card py-1 shadow-lg shadow-black/40 ring-1 ring-white/5"
          role="menu"
        >
          <div className="border-b border-white/10 px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
              Signed in as
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
              {user.username}
            </p>
          </div>
          <form action={logout} className="p-1">
            <button
              type="submit"
              role="menuitem"
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground transition hover:bg-white/10"
            >
              Log out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
