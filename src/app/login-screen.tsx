"use client";

import { createUser, loginAsUser } from "@/app/actions/auth";
import { UserAvatar } from "@/components/UserAvatar";
import { useActionState, useState } from "react";

export type UserRow = {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
};

export function LoginScreen({ users }: { users: UserRow[] }) {
  const [open, setOpen] = useState(false);
  const [createState, createAction] = useActionState(createUser, null);

  return (
    <div className="flex min-h-dvh flex-col bg-background px-4 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            ScoreKeeper
          </h1>
          <p className="mt-2 text-sm text-muted">Choose who is playing</p>
          <p className="mx-auto mt-3 max-w-sm text-xs leading-relaxed text-muted">
            No password—tapping a name signs you in on this device. Fine for friends;
            don&apos;t use it for anything that needs strong proof of identity.
          </p>
        </header>

        <ul className="flex flex-1 flex-col gap-3">
          {users.length === 0 ? (
            <li className="rounded-xl border border-white/10 bg-card px-4 py-6 text-center text-sm text-muted">
              No users yet. Create one below.
            </li>
          ) : (
            users.map((u) => (
              <li key={u.id}>
                <form action={loginAsUser.bind(null, u.id)}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-4 rounded-xl border border-white/10 bg-card px-4 py-4 text-left transition hover:border-primary/50 hover:bg-white/5 active:scale-[0.99]"
                  >
                    <UserAvatar username={u.username} avatarUrl={u.avatar_url} />
                    <span className="text-base font-medium text-foreground">
                      {u.username}
                    </span>
                  </button>
                </form>
              </li>
            ))
          )}
        </ul>

        <div className="mt-8 pb-[env(safe-area-inset-bottom)]">
          {!open ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="w-full rounded-xl bg-primary px-4 py-3.5 text-center text-sm font-semibold text-[#121212] transition hover:bg-primary-hover"
            >
              Add new user
            </button>
          ) : (
            <div className="rounded-xl border border-white/10 bg-card p-4">
              <form action={createAction} className="flex flex-col gap-3">
                <div>
                  <label htmlFor="username" className="text-xs font-medium text-muted">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    required
                    autoComplete="username"
                    className="mt-1 w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-foreground outline-none ring-primary/40 focus:ring-2"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="avatar_url" className="text-xs font-medium text-muted">
                    Avatar URL (optional)
                  </label>
                  <input
                    id="avatar_url"
                    name="avatar_url"
                    type="url"
                    className="mt-1 w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-foreground outline-none ring-primary/40 focus:ring-2"
                    placeholder="https://…"
                  />
                </div>
                {createState?.error ? (
                  <p className="text-sm text-red-400">{createState.error}</p>
                ) : null}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-lg border border-white/15 py-2.5 text-sm font-medium text-foreground hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-[#121212] hover:bg-primary-hover"
                  >
                    Create & continue
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
