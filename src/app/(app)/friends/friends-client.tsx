"use client";

import { addFriend, removeFriend } from "@/app/actions/friends";
import { UserAvatar } from "@/components/UserAvatar";
import { useRouter } from "next/navigation";
import { useState } from "react";

type UserRow = {
  id: string;
  username: string;
  avatar_url: string | null;
};

export function FriendsClient({
  friends,
  otherUsers,
}: {
  friends: UserRow[];
  otherUsers: UserRow[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const friendIds = new Set(friends.map((f) => f.id));
  const available = otherUsers.filter((u) => !friendIds.has(u.id));

  async function onAdd(friendId: string) {
    setError(null);
    setPending(friendId);
    try {
      const res = await addFriend(friendId);
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  async function onRemove(friendId: string) {
    setError(null);
    setPending(friendId);
    try {
      const res = await removeFriend(friendId);
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Your friends
        </h2>
        {friends.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No friends yet. Add someone below.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {friends.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-card px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar username={f.username} avatarUrl={f.avatar_url} size="sm" />
                  <span className="truncate font-medium">{f.username}</span>
                </div>
                <button
                  type="button"
                  disabled={pending === f.id}
                  onClick={() => onRemove(f.id)}
                  className="shrink-0 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-muted hover:border-red-400/50 hover:text-red-300 disabled:opacity-50"
                >
                  {pending === f.id ? "…" : "Remove"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Add friend
        </h2>
        {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
        {available.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Everyone is already your friend, or you are the only user.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {available.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-card px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar username={u.username} avatarUrl={u.avatar_url} size="sm" />
                  <span className="truncate font-medium">{u.username}</span>
                </div>
                <button
                  type="button"
                  disabled={pending === u.id}
                  onClick={() => onAdd(u.id)}
                  className="shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-[#121212] hover:bg-primary-hover disabled:opacity-50"
                >
                  {pending === u.id ? "…" : "Add"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
