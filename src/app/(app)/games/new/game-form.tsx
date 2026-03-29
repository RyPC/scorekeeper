"use client";

import { addGame } from "@/app/actions/games";
import { UserAvatar } from "@/components/UserAvatar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type UserRow = {
  id: string;
  username: string;
  avatar_url: string | null;
};

type SportRow = { id: string; name: string };

export function GameForm({
  sports,
  opponents,
  initialSportId,
}: {
  sports: SportRow[];
  opponents: UserRow[];
  initialSportId: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const canSubmit = sports.length > 0 && opponents.length > 0;
  const blockReason =
    sports.length === 0
      ? "no-sports"
      : opponents.length === 0
        ? "no-opponents"
        : null;

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    try {
      const res = await addGame(formData);
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      if ("ok" in res && res.ok) {
        const sid = String(formData.get("sport_id") ?? "");
        router.push(sid ? `/dashboard?sport=${sid}` : "/dashboard");
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      action={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-white/10 bg-card p-4"
    >
      <p className="rounded-lg border border-white/10 bg-background/60 px-3 py-2.5 text-xs leading-relaxed text-muted">
        <span className="font-medium text-foreground">Opponent</span> is anyone with a
        profile here. <span className="font-medium text-foreground">Friends</span> only
        affect your dashboard highlights—you can still log games against people you
        haven&apos;t added.
      </p>

      <div>
        <label htmlFor="sport_id" className="text-xs font-medium text-muted">
          Sport
        </label>
        <select
          id="sport_id"
          name="sport_id"
          required
          defaultValue={initialSportId ?? ""}
          disabled={sports.length === 0}
          className="mt-1 w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-primary/40 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="" disabled>
            Select sport
          </option>
          {sports.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="opponent_id" className="text-xs font-medium text-muted">
          Opponent
        </label>
        <select
          id="opponent_id"
          name="opponent_id"
          required
          disabled={opponents.length === 0}
          className="mt-1 w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-primary/40 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="" disabled>
            Select opponent
          </option>
          {opponents.map((f) => (
            <option key={f.id} value={f.id}>
              {f.username}
            </option>
          ))}
        </select>
        {opponents.length === 0 ? (
          <p className="mt-2 text-xs text-muted">
            No other users yet. Ask someone else to open this app and tap{" "}
            <span className="text-foreground">Add new user</span> on the sign-in screen,
            or sign out and create another profile yourself.
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="my_score" className="text-xs font-medium text-muted">
            Your score
          </label>
          <input
            id="my_score"
            name="my_score"
            type="number"
            inputMode="numeric"
            autoComplete="off"
            min={0}
            step={1}
            required
            className="mt-1 w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm tabular-nums text-foreground outline-none ring-primary/40 focus:ring-2"
          />
        </div>
        <div>
          <label htmlFor="their_score" className="text-xs font-medium text-muted">
            Their score
          </label>
          <input
            id="their_score"
            name="their_score"
            type="number"
            inputMode="numeric"
            autoComplete="off"
            min={0}
            step={1}
            required
            className="mt-1 w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm tabular-nums text-foreground outline-none ring-primary/40 focus:ring-2"
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="text-xs font-medium text-muted">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="mt-1 w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-primary/40 focus:ring-2"
          placeholder="Court, conditions, etc."
        />
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {blockReason ? (
        <div
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground"
          role="status"
        >
          {blockReason === "no-sports" ? (
            <>
              <p className="font-semibold">Add a sport first</p>
              <p className="mt-1 text-muted">
                Create one on Home, then come back here to log a result.
              </p>
              <Link
                href="/dashboard"
                className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-[#121212] hover:bg-primary-hover"
              >
                Go to Home
              </Link>
            </>
          ) : (
            <>
              <p className="font-semibold">You need at least one other person</p>
              <p className="mt-1 text-muted">
                Someone else must create a profile on the sign-in screen before you can
                pick an opponent.
              </p>
              <p className="mt-2 text-xs text-muted">
                Optional: add them on{" "}
                <Link href="/friends" className="text-primary underline underline-offset-2">
                  Friends
                </Link>{" "}
                for dashboard shortcuts.
              </p>
            </>
          )}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending || !canSubmit}
        className="min-h-[48px] rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-[#121212] hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Logging…" : "Log game"}
      </button>

      {opponents.length > 0 ? (
        <div className="flex flex-wrap gap-3 border-t border-white/10 pt-4">
          <p className="w-full text-xs font-medium text-muted">Accounts you can play</p>
          <div className="flex flex-wrap gap-2">
            {opponents.slice(0, 12).map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-background/80 px-2 py-1.5"
              >
                <UserAvatar username={f.username} avatarUrl={f.avatar_url} size="sm" />
                <span className="text-xs text-foreground">{f.username}</span>
              </div>
            ))}
            {opponents.length > 12 ? (
              <span className="self-center text-xs text-muted">
                +{opponents.length - 12} more
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </form>
  );
}
