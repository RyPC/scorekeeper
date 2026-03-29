"use client";

import { addGame } from "@/app/actions/games";
import { UserAvatar } from "@/components/UserAvatar";
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
      <div>
        <label htmlFor="sport_id" className="text-xs font-medium text-muted">
          Sport
        </label>
        <select
          id="sport_id"
          name="sport_id"
          required
          defaultValue={initialSportId ?? ""}
          className="mt-1 w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-primary/40 focus:ring-2"
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
          className="mt-1 w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-primary/40 focus:ring-2"
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
            No other users yet. Ask someone else to create an account on this app,
            or sign out and add another profile.
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

      <button
        type="submit"
        disabled={pending || opponents.length === 0 || sports.length === 0}
        className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-[#121212] hover:bg-primary-hover disabled:opacity-50"
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
