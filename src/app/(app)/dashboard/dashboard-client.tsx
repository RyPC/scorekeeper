"use client";

import { createSport } from "@/app/actions/sports";
import { UserAvatar } from "@/components/UserAvatar";
import { scoresForUser, type GameRow } from "@/lib/game-stats";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type UserRow = {
  id: string;
  username: string;
  avatar_url: string | null;
};

type Props = {
  currentUser: UserRow;
  sports: { id: string; name: string; created_at: string }[];
  sportId: string | null;
  games: GameRow[];
  opponentMap: Record<string, UserRow>;
  headToHead: {
    friend: UserRow;
    wins: number;
    losses: number;
    played: number;
  }[];
};

export function DashboardClient({
  currentUser,
  sports,
  sportId,
  games,
  opponentMap,
  headToHead,
}: Props) {
  const router = useRouter();
  const [sportError, setSportError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const currentSportName = useMemo(
    () => sports.find((s) => s.id === sportId)?.name ?? null,
    [sports, sportId]
  );

  const record = useMemo(() => {
    let w = 0;
    let l = 0;
    let t = 0;
    for (const g of games) {
      const s = scoresForUser(g, currentUser.id);
      if (s.won) w++;
      else if (s.lost) l++;
      else t++;
    }
    return { w, l, t, total: games.length };
  }, [games, currentUser.id]);

  async function handleCreateSport(formData: FormData) {
    setSportError(null);
    setCreating(true);
    try {
      const res = await createSport(formData);
      if ("ok" in res && res.ok && res.sportId) {
        router.replace(`/dashboard?sport=${res.sportId}`);
        router.refresh();
      } else if ("error" in res && res.error) {
        setSportError(res.error);
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/[0.07] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <UserAvatar
              username={currentUser.username}
              avatarUrl={currentUser.avatar_url}
              size="lg"
            />
            <div className="min-w-0">
              <p className="text-sm text-muted">Welcome back</p>
              <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">
                {currentUser.username}
              </h1>
              <p className="mt-1 text-sm text-muted">
                {currentSportName
                  ? `You’re tracking ${currentSportName}.`
                  : sports.length === 0
                    ? "Add a sport below to get started."
                    : "Pick a sport to see your games."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5">
          <div>
            <label
              htmlFor="home_sport"
              className="text-xs font-medium uppercase tracking-wide text-muted"
            >
              Current sport
            </label>
            {sports.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No sports yet — create one below.</p>
            ) : (
              <select
                id="home_sport"
                value={sportId ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) router.push(`/dashboard?sport=${v}`);
                }}
                className="mt-2 w-full max-w-xs rounded-xl border border-white/10 bg-background/80 px-3 py-2.5 text-sm text-foreground outline-none ring-primary/40 focus:ring-2"
                aria-label="Switch sport"
              >
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {sportId && sports.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:max-w-md">
              <div className="rounded-xl border border-white/10 bg-background/60 px-3 py-3 text-center">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                  Games
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                  {record.total}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-background/60 px-3 py-3 text-center">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                  Wins
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-400">
                  {record.w}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-background/60 px-3 py-3 text-center">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                  Losses
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-rose-300">
                  {record.l}
                </p>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href={sportId ? `/games/new?sport=${sportId}` : "/games/new"}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-primary px-6 py-3.5 text-center text-base font-semibold text-[#121212] shadow-lg shadow-primary/20 transition hover:bg-primary-hover active:scale-[0.99] sm:max-w-xs"
            >
              Log game
            </Link>
            <div className="flex flex-wrap gap-2 sm:justify-start">
              <Link
                href={sportId ? `/stats?sport=${sportId}` : "/stats"}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-white/15 bg-background/50 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-white/5 sm:flex-initial"
              >
                Stats & history
              </Link>
              <Link
                href="/friends"
                className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-white/15 bg-background/50 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-white/5 sm:flex-initial"
              >
                Friends
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-card/50 p-4">
        <h2 className="text-sm font-semibold text-foreground">Add another sport</h2>
        <form
          action={handleCreateSport}
          className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label htmlFor="sport_name" className="sr-only">
              Sport name
            </label>
            <input
              id="sport_name"
              name="name"
              required
              placeholder="e.g. Tennis, Basketball"
              className="w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-primary/40 focus:ring-2"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg border border-primary/50 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 disabled:opacity-50"
          >
            {creating ? "Saving…" : "Create sport"}
          </button>
        </form>
        {sportError ? (
          <p className="mt-2 text-sm text-red-400">{sportError}</p>
        ) : null}
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight">Recent games</h2>
        <p className="mt-1 text-sm text-muted">
          Last results for {currentSportName ?? "this sport"}.
        </p>
        {games.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-white/15 bg-card/30 px-4 py-8 text-center text-sm text-muted">
            Nothing logged yet. Hit <span className="text-foreground">Log game</span> when
            you play next.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {games.map((g) => {
              const oppId =
                g.player1_id === currentUser.id ? g.player2_id : g.player1_id;
              const opp = opponentMap[oppId];
              const s = scoresForUser(g, currentUser.id);
              return (
                <li
                  key={g.id}
                  className="rounded-xl border border-white/10 bg-card px-4 py-3 transition hover:border-white/20"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        vs {opp?.username ?? "Unknown"}
                      </p>
                      <p className="text-xs text-muted">
                        {format(new Date(g.created_at), "MMM d, yyyy · h:mm a")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold tabular-nums text-foreground">
                        {s.mine} – {s.theirs}
                      </p>
                      <p className="text-xs text-muted">
                        {s.tied ? "Tie" : s.won ? "Win" : "Loss"}
                      </p>
                    </div>
                  </div>
                  {g.notes ? (
                    <p className="mt-2 text-xs text-muted line-clamp-2">{g.notes}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight">Head-to-head</h2>
        <p className="mt-1 text-sm text-muted">Friends for this sport.</p>
        {headToHead.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Add friends on the Friends tab to see quick records here.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {headToHead.map(({ friend, wins, losses, played }) => (
              <li
                key={friend.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-card px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar
                    username={friend.username}
                    avatarUrl={friend.avatar_url}
                    size="sm"
                  />
                  <span className="truncate font-medium">{friend.username}</span>
                </div>
                <div className="text-right text-sm tabular-nums text-muted">
                  {played === 0 ? (
                    <span>No games</span>
                  ) : (
                    <span>
                      <span className="text-foreground">{wins}W</span> ·{" "}
                      <span className="text-foreground">{losses}L</span>
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
